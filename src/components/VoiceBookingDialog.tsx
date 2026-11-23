import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createBooking } from '../api/booking'
import { getTour, getTours } from '../api/tour'
import {
  bestLevel, detectDate, detectDrinks, detectLevel, detectTheme, drinkText, formatKoreanDate, isNo, isYes,
  levelDefaults, levelLabels, matchTour, recommendTours, themeLabels, wantsRecommendation,
} from '../data/voiceBookingDialog'
import type { DrinkPick } from '../data/voiceBookingDialog'
import type { ApiTheme, ApiTourLevel } from '../types/api'
import type { TourDetailResponse, TourSummaryResponse } from '../types/tourApi'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'
import { VoiceSearchPanel } from './VoiceSearchPanel'

// 음성 예약 대화: 시스템이 질문하고(화면 문구 + TTS) 고객이 음성으로 답하면서 예약까지 진행한다.
// TTS는 브라우저 내장 Web Speech API(speechSynthesis, ko-KR)를 사용한다.

type Step = 'start' | 'occasion' | 'chooseTour' | 'level' | 'extras' | 'confirmExtras' | 'more' | 'booking' | 'done'

interface Line {
  speaker: 'system' | 'customer'
  text: string
}

function speak(text: string) {
  return new Promise<void>(resolve => {
    const synth = window.speechSynthesis
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      resolve()
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 1.05
    const voice = synth.getVoices().find(item => item.lang.startsWith('ko'))
    if (voice) utterance.voice = voice
    // 일부 브라우저는 onend가 오지 않으므로 글자 수 기준으로 끝을 보장한다.
    const fallback = window.setTimeout(resolve, 1500 + text.length * 200)
    const done = () => {
      window.clearTimeout(fallback)
      resolve()
    }
    utterance.onend = done
    utterance.onerror = done
    synth.speak(utterance)
  })
}

function detectGuests(text: string): number | null {
  const match = text.replace(/\s+/g, '').match(/(\d+|한|두|세|네|다섯|여섯)명/)
  if (!match) return null
  const map: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6 }
  const value = /^\d+$/.test(match[1]) ? Number(match[1]) : map[match[1]]
  return value && value >= 1 && value <= 10 ? value : null
}

export function VoiceBookingDialog({ customerName, onClose, onDone }: {
  customerName: string
  onClose: () => void
  onDone: (path: string) => void
}) {
  const [lines, setLines] = useState<Line[]>([])
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [turn, setTurn] = useState(0)
  const [typed, setTyped] = useState('')
  const stepRef = useRef<Step>('start')
  const toursRef = useRef<TourSummaryResponse[]>([])
  const candidatesRef = useRef<TourSummaryResponse[]>([])
  const themeRef = useRef<ApiTheme | null>(null)
  const guestsRef = useRef<number | null>(null)
  const detailRef = useRef<TourDetailResponse | null>(null)
  const levelRef = useRef<ApiTourLevel | null>(null)
  const suggestedLevelRef = useRef<ApiTourLevel | null>(null)
  const drinksRef = useRef<DrinkPick[]>([])
  const pendingDrinksRef = useRef<DrinkPick[]>([])
  const mountedRef = useRef(true)
  const logRef = useRef<HTMLDivElement>(null)
  const name = `${customerName} 고객님`

  async function say(text: string, next: Step, listenAfter = true) {
    stepRef.current = next
    setLines(prev => [...prev, { speaker: 'system', text }])
    await speak(text)
    if (!mountedRef.current) return
    if (listenAfter) {
      setTurn(value => value + 1)
      setListening(true)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    getTours({ page: 0, size: 100 })
      .then(response => { toursRef.current = response.data.content })
      .catch(() => undefined)
    void say(`안녕하세요, ${name}. 어떤 여행 상품을 예약하시겠습니까?`, 'start')
    return () => {
      mountedRef.current = false
      window.speechSynthesis?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines])

  async function loadTours() {
    if (toursRef.current.length) return toursRef.current
    const response = await getTours({ page: 0, size: 100 })
    toursRef.current = response.data.content
    return toursRef.current
  }

  function bookingSummary() {
    const detail = detailRef.current
    const level = levelRef.current
    if (!detail || !level) return ''
    const drinks = drinksRef.current.length ? `, ${drinkText(drinksRef.current)}` : ''
    return `여행은 ${detail.tourName}, 스타일은 ${levelLabels[level]} 스타일${drinks}`
  }

  async function recommend(text: string) {
    const theme = detectTheme(text) ?? themeRef.current
    themeRef.current = theme
    const target = detectDate(text)
    const tours = await loadTours()
    const candidates = recommendTours(tours, theme, target)
    candidatesRef.current = candidates
    if (!candidates.length) {
      await say('죄송해요, 지금 예약할 수 있는 여행 상품이 없어요.', 'done', false)
      return
    }
    const congrats = theme === 'HONEYMOON' && /결혼|신혼|웨딩/.test(text) ? '정말 축하드려요! '
      : theme === 'HEALING' && /부모님|효도|환갑|칠순|팔순/.test(text) ? '정말 뜻깊은 여행이 되겠네요! '
        : theme ? '좋아요! ' : ''
    const names = candidates.map(tour => tour.tourName)
    const question = names.length > 1 ? `${names[0]} 또는 ${names[1]}는 어떠세요?` : `${names[0]}는 어떠세요?`
    await say(`${congrats}${question}`, 'chooseTour')
  }

  async function chooseTour(tour: TourSummaryResponse) {
    const response = await getTour(tour.tourId)
    const detail = response.data
    detailRef.current = detail
    const level = bestLevel(detail)
    suggestedLevelRef.current = level
    await say(`${detail.tourName} 알겠습니다. 그리고 스타일은 ${levelLabels[level]} 스타일 어떨까요?`, 'level')
  }

  async function book() {
    const detail = detailRef.current
    const level = levelRef.current
    if (!detail || !level) return
    stepRef.current = 'booking'
    setBusy(true)
    try {
      await createBooking({
        tourId: detail.tourId,
        tourLevel: level,
        guestCount: guestsRef.current ?? (detail.theme === 'HONEYMOON' ? 2 : 1),
        ...levelDefaults[level],
        transport: detail.defaultTransport,
        drinkOptions: drinksRef.current.map(drink => ({ optionId: drink.optionId, quantity: drink.quantity })),
      })
      await say(`${formatKoreanDate(detail.startDate)}에 선택하신 대로 예약되었습니다. 감사합니다.`, 'done', false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약하지 못했어요.'
      await say(`죄송해요, 예약하지 못했어요. ${message}`, 'done', false)
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  async function handle(text: string) {
    const said = text.trim()
    if (!said) {
      await say('잘 못 들었어요. 다시 말씀해 주세요.', stepRef.current)
      return
    }
    setLines(prev => [...prev, { speaker: 'customer', text: said }])
    guestsRef.current = detectGuests(said) ?? guestsRef.current
    setBusy(true)
    try {
      switch (stepRef.current) {
        case 'start': {
          const tours = await loadTours()
          const direct = matchTour(said, tours.filter(tour => tour.tourStatus === 'RECRUITING'))
          const theme = detectTheme(said)
          if (!wantsRecommendation(said) && direct && !theme) {
            await chooseTour(direct)
          } else if (theme || detectDate(said)) {
            await recommend(said)
          } else {
            await say('무슨 기념일인가요?', 'occasion')
          }
          break
        }
        case 'occasion':
          await recommend(said)
          break
        case 'chooseTour': {
          const tour = matchTour(said, candidatesRef.current)
          if (tour) await chooseTour(tour)
          else if (isNo(said)) await say('그럼 어떤 여행을 원하세요? 기념일이나 함께 가는 분을 말씀해 주세요.', 'occasion')
          else await say(`${candidatesRef.current.map(item => item.tourName).join(' 또는 ')} 중에서 골라 주세요.`, 'chooseTour')
          break
        }
        case 'level': {
          const detail = detailRef.current!
          const asked = detectLevel(said)
          const level = asked ?? (isYes(said) ? suggestedLevelRef.current : null)
          if (!level) {
            await say(`${detail.availableTourLevels.map(item => levelLabels[item]).join(', ')} 중에서 골라 주세요.`, 'level')
          } else if (!detail.availableTourLevels.includes(level)) {
            await say(`이 상품은 ${levelLabels[level]} 스타일을 고를 수 없어요. ${detail.availableTourLevels.map(item => levelLabels[item]).join(', ')} 중에서 골라 주세요.`, 'level')
          } else {
            levelRef.current = level
            await say(`네, ${name}. ${bookingSummary()}로 예약하셨습니다.`, 'extras')
          }
          break
        }
        case 'extras':
        case 'more': {
          const drinks = detectDrinks(said, detailRef.current?.drinkOptions ?? [])
          if (drinks.length) {
            pendingDrinksRef.current = drinks
            const merged = [...drinksRef.current.filter(item => !drinks.some(d => d.optionId === item.optionId)), ...drinks]
            const before = drinksRef.current
            drinksRef.current = merged
            const summary = bookingSummary()
            drinksRef.current = before
            pendingDrinksRef.current = merged
            await say(`네, ${name}. ${summary} 추가하셨습니다.`, 'confirmExtras')
          } else if (stepRef.current === 'more' && isNo(said)) {
            await book()
          } else if (stepRef.current === 'extras' && (isYes(said) || isNo(said))) {
            await say('추가로 필요하신 것 있으세요?', 'more')
          } else {
            await say('식사 때 곁들일 음료는 커피와 샴페인을 추가할 수 있어요. 필요 없으시면 없다고 말씀해 주세요.', 'more')
          }
          break
        }
        case 'confirmExtras':
          if (isNo(said) && !isYes(said)) {
            await say('다시 말씀해 주세요. 어떤 음료를 몇 개 추가할까요?', 'more')
          } else {
            drinksRef.current = pendingDrinksRef.current
            await say('추가로 필요하신 것 있으세요?', 'more')
          }
          break
        default:
          break
      }
    } catch {
      await say('잠시 문제가 생겼어요. 다시 말씀해 주세요.', stepRef.current)
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  function onVoice(response: VoiceResponse) {
    setListening(false)
    void handle(response.recognizedText)
  }

  function onTyped(event: FormEvent) {
    event.preventDefault()
    if (!typed.trim() || busy) return
    setListening(false)
    const text = typed
    setTyped('')
    void handle(text)
  }

  const context: VoiceScreenContext = {
    screen: 'voice-booking',
    tours: candidatesRef.current.map(tour => ({ tourId: tour.tourId, tourName: tour.tourName, theme: tour.theme, price: tour.basePrice })),
    availableTourLevels: detailRef.current?.availableTourLevels ?? [],
    drinkOptions: (detailRef.current?.drinkOptions ?? []).map(option => ({ optionId: option.optionId, name: option.drinkName })),
    pendingAction: null,
  }
  const finished = stepRef.current === 'done'

  return <div className="voice-booking-backdrop" role="dialog" aria-modal="true" aria-label="음성 예약">
    <section className="voice-booking">
      <header className="voice-booking-head">
        <strong>음성 예약</strong>
        <span>{detailRef.current ? `${themeLabels[detailRef.current.theme]} · ${detailRef.current.tourName}` : '말로 여행을 예약해 보세요'}</span>
        <button type="button" className="voice-booking-close" aria-label="음성 예약 닫기" onClick={() => { window.speechSynthesis?.cancel(); onClose() }}>×</button>
      </header>
      <div className="voice-booking-log" ref={logRef} aria-live="polite">
        {lines.map((line, index) => <p key={index} className={`voice-booking-line is-${line.speaker}`}>
          <small>{line.speaker === 'system' ? 'CUTY' : '고객'}</small>
          <span>{line.text}</span>
        </p>)}
        {busy && <p className="voice-booking-line is-system is-typing"><small>CUTY</small><span>…</span></p>}
      </div>
      <footer className="voice-booking-foot">
        {finished ? <div className="voice-booking-actions">
          <button type="button" className="button" onClick={onClose}>닫기</button>
          <button type="button" className="button primary" onClick={() => onDone('/my-trips')}>내 여행에서 확인</button>
        </div> : <>
          <div className="voice-booking-mic">
            {listening && !busy
              ? <VoiceSearchPanel key={turn} context={context} onResponse={onVoice} display="floating" onClose={() => setListening(false)} />
              : <button type="button" className="button" disabled={busy} onClick={() => { setTurn(value => value + 1); setListening(true) }}>🎙 말하기</button>}
          </div>
          <form className="voice-booking-type" onSubmit={onTyped}>
            <input value={typed} onChange={event => setTyped(event.target.value)} placeholder="또는 직접 입력하기" aria-label="직접 입력" disabled={busy} />
            <button type="submit" className="button" disabled={busy || !typed.trim()}>보내기</button>
          </form>
        </>}
      </footer>
    </section>
  </div>
}
