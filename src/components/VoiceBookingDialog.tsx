import { useEffect, useRef, useState } from 'react'
import { createBooking } from '../api/booking'
import { getTour, getTours } from '../api/tour'
import {
  anyTime, bestLevel, detectBudget, detectDate, detectKeyword, detectOptions, hotelLabels, mealLabels, transportLabels, detectDrinks, detectLevel, detectTheme, drinkText, formatKoreanDate, isNo, isYes,
  levelDefaults, levelLabels, matchTour, recommendTours, themeLabels, wantsRecommendation,
} from '../data/voiceBookingDialog'
import type { DrinkPick, OptionChange } from '../data/voiceBookingDialog'
import type { ApiTheme, ApiTourLevel } from '../types/api'
import type { TourDetailResponse, TourSummaryResponse } from '../types/tourApi'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'
import { VoiceSearchPanel } from './VoiceSearchPanel'

// 음성 예약 대화: 마이크 버튼을 누르면 시스템이 질문하고(화면 상단 안내 문구 + TTS) 고객이 음성으로 답하면서 예약까지 진행한다.
// TTS는 브라우저 내장 Web Speech API(speechSynthesis, ko-KR)를 사용한다.

type Step = 'start' | 'theme' | 'date' | 'chooseTour' | 'level' | 'guests' | 'extras' | 'confirmExtras' | 'more' | 'booking' | 'done'

const themePath: Record<ApiTheme, string> = { HONEYMOON: 'romance', HEALING: 'healing', GOLF: 'golf', TREKKING: 'outdoor' }

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

export function VoiceBookingDialog({ customerName, listenSignal, onSay, onNavigate, onListeningChange, onClose }: {
  customerName: string
  listenSignal: number
  onSay: (text: string) => void
  onNavigate: (path: string) => void
  onListeningChange: (listening: boolean) => void
  onClose: () => void
}) {
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [turn, setTurn] = useState(0)
  const stepRef = useRef<Step>('start')
  const toursRef = useRef<TourSummaryResponse[]>([])
  const candidatesRef = useRef<TourSummaryResponse[]>([])
  const themeRef = useRef<ApiTheme | null>(null)
  const dateRef = useRef<string | null>(null)
  const budgetRef = useRef<number | null>(null)
  const keywordRef = useRef<string | null>(null)
  const guestsRef = useRef<number | null>(null)
  const detailRef = useRef<TourDetailResponse | null>(null)
  const levelRef = useRef<ApiTourLevel | null>(null)
  const suggestedLevelRef = useRef<ApiTourLevel | null>(null)
  const drinksRef = useRef<DrinkPick[]>([])
  const optionsRef = useRef<OptionChange>({})
  const pendingDrinksRef = useRef<DrinkPick[]>([])
  const mountedRef = useRef(true)
  const name = `${customerName} 고객님`

  async function say(text: string, next: Step, listenAfter = true) {
    stepRef.current = next
    onSay(text)
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
    onNavigate('/tours')
    void say(`안녕하세요, ${name}. 어떤 여행 상품을 예약하시겠습니까?`, 'start')
    return () => {
      mountedRef.current = false
      window.speechSynthesis?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 고객이 마이크 버튼을 다시 누르면 다시 듣는다
  useEffect(() => {
    if (listenSignal > 0 && stepRef.current !== 'done') {
      window.speechSynthesis?.cancel()
      setTurn(value => value + 1)
      setListening(true)
    }
  }, [listenSignal])

  useEffect(() => {
    onListeningChange(listening && !busy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, busy])

  async function loadTours() {
    if (toursRef.current.length) return toursRef.current
    const response = await getTours({ page: 0, size: 100 })
    toursRef.current = response.data.content
    return toursRef.current
  }

  function currentOptions() {
    const detail = detailRef.current!
    const level = levelRef.current!
    return {
      hotelGrade: optionsRef.current.hotelGrade ?? levelDefaults[level].hotelGrade,
      mealType: optionsRef.current.mealType ?? levelDefaults[level].mealType,
      transport: optionsRef.current.transport ?? detail.defaultTransport,
    }
  }

  function bookingSummary() {
    const detail = detailRef.current
    const level = levelRef.current
    if (!detail || !level) return ''
    const drinks = drinksRef.current.length ? `, ${drinkText(drinksRef.current)}` : ''
    const guests = guestsRef.current ? `, 인원은 ${guestsRef.current}명` : ''
    const o = currentOptions()
    const options = `, 숙소는 ${hotelLabels[o.hotelGrade]}, 식사는 ${mealLabels[o.mealType]}, 교통은 ${transportLabels[o.transport]}`
    return `여행은 ${detail.tourName}, 스타일은 ${levelLabels[level]} 스타일${guests}${options}${drinks}`
  }

  const THEME_QUESTION = '어떤 테마의 여행을 원하세요? 허니문, 효도 힐링, 골프, 아웃도어 트레킹이 있어요. 기념일이나 함께 가는 분을 말씀해 주셔도 맞춰서 추천해 드릴게요.'

  // 고객 말에서 테마·날짜를 모은 뒤, 빠진 것을 묻거나 추천한다
  async function collect(text: string) {
    themeRef.current = detectTheme(text) ?? themeRef.current
    dateRef.current = detectDate(text) ?? dateRef.current
    budgetRef.current = detectBudget(text) ?? budgetRef.current
    keywordRef.current = detectKeyword(text, await loadTours()) ?? keywordRef.current
    if (!themeRef.current) {
      await say(THEME_QUESTION, 'theme')
      return
    }
    if (!dateRef.current && stepRef.current !== 'date' && !anyTime(text)) {
      await say(`${occasionLine(text)}${themeLabels[themeRef.current]} 여행이군요. 언제쯤 떠나고 싶으세요?`, 'date')
      return
    }
    await recommend(text)
  }

  function occasionLine(text: string) {
    if (/결혼|신혼|웨딩/.test(text)) return '정말 축하드려요! '
    if (/환갑|칠순|팔순|회갑/.test(text)) return '정말 뜻깊은 여행이 되겠네요! '
    if (/부모님|효도/.test(text)) return '부모님께서 정말 좋아하시겠어요! '
    if (/기념일|생일|프러포즈/.test(text)) return '축하드려요! '
    return ''
  }

  async function recommend(text: string) {
    const theme = themeRef.current
    const tours = await loadTours()
    budgetRef.current = detectBudget(text) ?? budgetRef.current
    const candidates = recommendTours(tours, theme, dateRef.current, budgetRef.current, keywordRef.current)
    candidatesRef.current = candidates
    if (candidates[0]) onNavigate(theme ? `/tours?theme=${themePath[theme]}` : '/tours')
    if (!candidates.length) {
      await say('죄송해요, 지금 예약할 수 있는 여행 상품이 없어요.', 'done', false)
      return
    }
    const when = (tour: TourSummaryResponse) => `${formatKoreanDate(tour.startDate)}에 출발하는 ${tour.tourName}`
    const question = candidates.length > 1
      ? `추천해 드릴 여행은 ${when(candidates[0])}, 그리고 ${when(candidates[1])}입니다. 어떤 여행이 좋으세요?`
      : `추천해 드릴 여행은 ${when(candidates[0])}입니다. 이 여행 어떠세요?`
    await say(`${occasionLine(text)}${question}`, 'chooseTour')
  }

  // 투어 등급 다음: 인원(허니문은 2인 고정) → 요약
  async function afterLevel() {
    const detail = detailRef.current!
    if (detail.theme === 'HONEYMOON') guestsRef.current = 2
    if (!guestsRef.current) {
      await say('몇 분이 함께 가시나요?', 'guests')
      return
    }
    await say(`네, ${name}. ${bookingSummary()}, 이렇게 예약하셨습니다. 옵션 변경이나 추가를 원하시면 말씀해 주세요.`, 'extras')
  }

  async function chooseTour(tour: TourSummaryResponse) {
    const response = await getTour(tour.tourId)
    const detail = response.data
    detailRef.current = detail
    onNavigate(`/tours/${detail.tourId}`)
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
        ...currentOptions(),
        drinkOptions: drinksRef.current.map(drink => ({ optionId: drink.optionId, quantity: drink.quantity })),
      })
      onNavigate('/my-trips')
      await say(`${formatKoreanDate(detail.startDate)}에 선택하신 대로 예약되었습니다. 감사합니다.`, 'done', false)
      window.setTimeout(() => { if (mountedRef.current) onClose() }, 6000)
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
    onSay(`“${said}”`)
    if (detailRef.current?.theme !== 'HONEYMOON') guestsRef.current = detectGuests(said) ?? guestsRef.current
    setBusy(true)
    try {
      switch (stepRef.current) {
        case 'start': {
          const tours = await loadTours()
          const direct = matchTour(said, tours.filter(tour => tour.tourStatus === 'RECRUITING'))
          if (!wantsRecommendation(said) && direct && !detectTheme(said)) await chooseTour(direct)
          else await collect(said)
          break
        }
        case 'theme':
          if (!detectTheme(said)) await say('허니문, 효도 힐링, 골프, 아웃도어 트레킹 중에서 골라 주세요.', 'theme')
          else await collect(said)
          break
        case 'date':
          dateRef.current = detectDate(said) ?? dateRef.current
          await recommend(said)
          break
        case 'chooseTour': {
          const tour = matchTour(said, candidatesRef.current)
          if (tour) await chooseTour(tour)
          else if (isNo(said)) { themeRef.current = null; dateRef.current = null; await say(THEME_QUESTION, 'theme') }
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
            await afterLevel()
          }
          break
        }
        case 'guests': {
          const guests = detectGuests(said)
          if (!guests) await say('몇 분인지 다시 말씀해 주세요. 예: 세 명이요', 'guests')
          else {
            guestsRef.current = guests
            await afterLevel()
          }
          break
        }
        case 'extras':
        case 'more': {
          const drinks = detectDrinks(said, detailRef.current?.drinkOptions ?? [])
          const options = detectOptions(said)
          const newLevel = detectLevel(said)
          const newGuests = detectGuests(said)
          let changed = false
          if (newLevel && newLevel !== levelRef.current && detailRef.current?.availableTourLevels.includes(newLevel)) {
            levelRef.current = newLevel; changed = true
          }
          if (newGuests && detailRef.current?.theme !== 'HONEYMOON') { guestsRef.current = newGuests; changed = true }
          if (Object.keys(options).length || changed) {
            optionsRef.current = { ...optionsRef.current, ...options }
            if (drinks.length) drinksRef.current = [...drinksRef.current.filter(item => !drinks.some(d => d.optionId === item.optionId)), ...drinks]
            pendingDrinksRef.current = drinksRef.current
            await say(`네, ${name}. ${bookingSummary()}, 이렇게 바꿨습니다. 맞으세요?`, 'confirmExtras')
          } else if (drinks.length) {
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
            await say('스타일과 인원도 바꿀 수 있고, 호텔은 3성·4성·5성급, 식사는 도시락·현지식·고급 레스토랑, 교통은 2인 고급차량·10인 승합차로 바꿀 수 있고, 커피와 샴페인을 추가할 수 있어요. 필요 없으시면 없다고 말씀해 주세요.', 'more')
          }
          break
        }
        case 'confirmExtras':
          if (isNo(said) && !isYes(said)) {
            await say('다시 말씀해 주세요. 무엇을 바꾸거나 추가할까요?', 'more')
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

  const context: VoiceScreenContext = {
    screen: 'voice-booking',
    tours: candidatesRef.current.map(tour => ({ tourId: tour.tourId, tourName: tour.tourName, theme: tour.theme, price: tour.basePrice })),
    availableTourLevels: detailRef.current?.availableTourLevels ?? [],
    drinkOptions: (detailRef.current?.drinkOptions ?? []).map(option => ({ optionId: option.optionId, name: option.drinkName })),
    pendingAction: null,
  }
  if (!listening || busy) return null
  return <VoiceSearchPanel key={turn} context={context} onResponse={onVoice} display="floating" onClose={() => setListening(false)} />
}
