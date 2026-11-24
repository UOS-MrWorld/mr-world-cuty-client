import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { createBooking } from '../api/booking'
import { getTour, getTours } from '../api/tour'
import {
  anyTime, bestLevel, detectBudget, detectDate, detectKeyword, detectOptions, hotelLabels, mealLabels, transportLabels, detectDrinks, mergeDrinks, detectLevel, detectTheme, drinkText, formatKoreanDate, isNo, isYes,
  levelDefaults, levelLabels, matchTour, recommendTours, themeLabels, wantsRecommendation,
} from '../data/voiceBookingDialog'
import type { DrinkPick, OptionChange } from '../data/voiceBookingDialog'
import type { ApiTheme, ApiTourLevel } from '../types/api'
import type { TourDetailResponse, TourSummaryResponse } from '../types/tourApi'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'
import { VoiceSearchPanel } from './VoiceSearchPanel'

// 3D 안내 캐릭터는 three.js를 쓰므로 음성 예약을 시작할 때만 불러온다
const VoiceGuideCharacter = lazy(() => import('./VoiceGuideCharacter'))

// 음성 예약 대화: 마이크 버튼을 누르면 시스템이 질문하고(화면 상단 안내 문구 + TTS) 고객이 음성으로 답하면서 예약까지 진행한다.
// TTS는 브라우저 내장 Web Speech API(speechSynthesis, ko-KR)를 사용한다.

type Step = 'start' | 'theme' | 'date' | 'chooseTour' | 'level' | 'guests' | 'extras' | 'confirmExtras' | 'more' | 'booking' | 'done'

const themePath: Record<ApiTheme, string> = { HONEYMOON: 'romance', HEALING: 'healing', GOLF: 'golf', TREKKING: 'outdoor' }

// 자연스러운 한국어 목소리를 우선 사용한다.
// Edge: Microsoft SunHi(Natural, 여성) → 다른 Natural/Online 목소리 → Chrome: Google 한국의 → 그 밖의 한국어 목소리
// 보컬로이드 느낌 목소리: 높은 음(pitch 최대치 근처) + 조금 빠른 속도 + 마디마다 음 높이를 바꿔 노래하듯 읽는다.
// pitch가 잘 적용되는 Chrome의 Google 한국어 목소리를 먼저 쓰고, 없으면 다른 한국어 목소리를 쓴다.
const VOCALOID_STYLE = true
const voicePriority = VOCALOID_STYLE
  ? [/Google/i, /Yuna/i, /SunHi/i, /Natural|Online/i, /Heami/i]
  : [/SunHi/i, /Natural|Online/i, /Google/i, /Yuna|Heami/i]
// 마디별 음 높이(0~2)와 속도. 높낮이를 번갈아 줘서 기계음 멜로디처럼 들리게 한다.
// 얇고 높게: 낮은 음은 쓰지 않고 최고음(2) 근처에서만 살짝 오르내린다. 속도를 올리면 더 가늘게 들린다.
const melody = [2, 1.9, 2, 1.85, 2, 1.95]
const vocaloidRate = 1.3

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const korean = voices.filter(voice => voice.lang.toLowerCase().startsWith('ko'))
  for (const pattern of voicePriority) {
    const found = korean.find(voice => pattern.test(voice.name))
    if (found) return found
  }
  return korean[0]
}

// Chrome은 목소리 목록을 늦게 불러오므로 미리 한 번 요청해 둔다
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
}

// 문장을 쉼표·마침표·물음표 단위 마디로 나눈다
function splitPhrases(text: string) {
  const parts = text.split(/(?<=[,.?!])\s+/).map(part => part.trim()).filter(Boolean)
  return parts.length ? parts : [text]
}

function speak(text: string) {
  return new Promise<void>(resolve => {
    const synth = window.speechSynthesis
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      resolve()
      return
    }
    synth.cancel()
    const voice = pickVoice(synth.getVoices())
    const phrases = VOCALOID_STYLE ? splitPhrases(text) : [text]
    let finished = false
    // 일부 브라우저는 onend가 오지 않으므로 글자 수 기준으로 끝을 보장한다.
    const fallback = window.setTimeout(() => done(), 1000 + text.length * 150 + phrases.length * 200)
    function done() {
      if (finished) return
      finished = true
      window.clearTimeout(fallback)
      resolve()
    }
    phrases.forEach((phrase, index) => {
      const utterance = new SpeechSynthesisUtterance(phrase)
      utterance.lang = 'ko-KR'
      if (voice) utterance.voice = voice
      utterance.rate = VOCALOID_STYLE ? vocaloidRate : 1.15
      utterance.pitch = VOCALOID_STYLE ? melody[index % melody.length] : 1.05
      // 마지막 마디가 끝나거나, 중간에 취소(cancel)되면 끝난 것으로 본다
      if (index === phrases.length - 1) utterance.onend = done
      utterance.onerror = done
      synth.speak(utterance)
    })
  })
}

function detectGuests(text: string): number | null {
  const match = text.replace(/\s+/g, '').match(/(\d+|한|두|세|네|다섯|여섯)명/)
  if (!match) return null
  const map: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6 }
  const value = /^\d+$/.test(match[1]) ? Number(match[1]) : map[match[1]]
  return value && value >= 1 && value <= 10 ? value : null
}

export function VoiceBookingDialog({ customerName, listenSignal, onSay, onNavigate, onConfigure, onListeningChange, onClose }: {
  customerName: string
  listenSignal: number
  onSay: (text: string) => void
  onNavigate: (path: string) => void
  onConfigure: (tourId: number, params: Record<string, unknown>) => boolean
  onListeningChange: (listening: boolean) => void
  onClose: () => void
}) {
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [speaking, setSpeaking] = useState(false)
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
  const mountedRef = useRef(true)
  const interruptedRef = useRef(false)
  const configureRef = useRef(onConfigure)
  configureRef.current = onConfigure
  const name = `${customerName} 고객님`

  async function say(text: string, next: Step, listenAfter = true) {
    stepRef.current = next
    onSay(text)
    setSpeaking(true)
    await speak(text)
    if (mountedRef.current) setSpeaking(false)
    if (!mountedRef.current) return
    // 안내 도중 고객이 마이크를 눌러 이미 듣고 있으면 마이크를 다시 켜지 않는다(녹음이 끊기지 않게)
    if (interruptedRef.current) {
      interruptedRef.current = false
      return
    }
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
    if (listenSignal > 0 && stepRef.current !== 'done' && stepRef.current !== 'booking') {
      interruptedRef.current = true
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

  // 등급·인원·옵션이 정해질 때마다 여행 구성 화면으로 넘어가 같은 내용을 보여준다
  function syncScreen() {
    const detail = detailRef.current
    const level = levelRef.current
    if (!detail || !level) return
    onNavigate(`/tours/${detail.tourId}/configure`)
    const params = {
      tourLevel: level,
      ...currentOptions(),
      ...(guestsRef.current ? { guestCount: guestsRef.current } : {}),
      drinkOptions: (detail.drinkOptions ?? []).map(option => ({
        optionId: option.optionId,
        quantity: drinksRef.current.find(drink => drink.optionId === option.optionId)?.quantity ?? 0,
      })),
    }
    let tries = 0
    const apply = () => {
      if (!mountedRef.current) return
      if (configureRef.current(detail.tourId, params) || ++tries > 20) return
      window.setTimeout(apply, 250)
    }
    window.setTimeout(apply, 100)
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
    syncScreen()
    await say(`네, ${name}. ${bookingSummary()}, 이렇게 선택하셨습니다. 옵션 변경이나 추가를 원하시면 말씀해 주세요.`, 'extras')
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
    setListening(false)
    setBusy(true)
    try {
      const response = await createBooking({
        tourId: detail.tourId,
        tourLevel: level,
        guestCount: guestsRef.current ?? (detail.theme === 'HONEYMOON' ? 2 : 1),
        ...currentOptions(),
        drinkOptions: drinksRef.current.map(drink => ({ optionId: drink.optionId, quantity: drink.quantity })),
      })
      // 예약은 결제 전(PENDING)으로 장바구니에 저장되고, 결제는 고객이 결제 화면에서 직접 한다
      onNavigate(`/tours/${detail.tourId}/checkout?booking=${response.data.bookingId}`)
      await say(`${formatKoreanDate(detail.startDate)} 출발, 선택하신 내용으로 장바구니에 담았습니다. 결제 화면에서 카드 번호를 입력해 직접 결제해 주세요. 감사합니다.`, 'done', false)
      window.setTimeout(() => { if (mountedRef.current) onClose() }, 6000)
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약하지 못했어요.'
      await say(`죄송해요, 장바구니에 담지 못했어요. ${message}`, 'done', false)
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  async function handle(text: string, commands: VoiceResponse['commands'] = []) {
    const said = text.trim()
    if (!said) {
      await say('잘 못 들었어요. 다시 말씀해 주세요.', stepRef.current)
      return
    }
    onSay(`“${said}”`)
    // 등급을 고른 뒤에는 어느 단계에서든 말한 옵션·음료·인원·등급을 바로 모은다(순서 상관없음)
    const detail = detailRef.current
    let changed = false
    if (detail && levelRef.current) {
      // 정규식으로 못 찾은 옵션은 음성 서버(LLM)가 해석한 configure 명령에서 가져온다
      const options = detectOptions(said)
      for (const command of commands) {
        if (command.action !== 'configure') continue
        const p = command.params
        if (!options.hotelGrade && typeof p.hotelGrade === 'string') options.hotelGrade = p.hotelGrade as OptionChange['hotelGrade']
        if (!options.mealType && typeof p.mealType === 'string') options.mealType = p.mealType as OptionChange['mealType']
        if (!options.transport && typeof p.transport === 'string') options.transport = p.transport as OptionChange['transport']
      }
      if (Object.keys(options).length) { optionsRef.current = { ...optionsRef.current, ...options }; changed = true }
      const drinks = detectDrinks(said, detail.drinkOptions ?? [])
      if (drinks.length) {
        drinksRef.current = mergeDrinks(drinksRef.current, drinks)
        changed = true
      }
      const level = detectLevel(said)
      if (level && level !== levelRef.current && detail.availableTourLevels.includes(level)) { levelRef.current = level; changed = true }
    }
    const guests = detectGuests(said)
    if (guests && detail?.theme !== 'HONEYMOON' && guests !== guestsRef.current) {
      guestsRef.current = guests
      if (levelRef.current && stepRef.current !== 'guests') changed = true
    }
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
            optionsRef.current = { ...optionsRef.current, ...detectOptions(said) }
            const drinks = detectDrinks(said, detail.drinkOptions ?? [])
            if (drinks.length) drinksRef.current = mergeDrinks(drinksRef.current, drinks)
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
        case 'more':
        case 'confirmExtras':
          if (changed) {
            syncScreen()
            await say(`네, ${name}. ${bookingSummary()}, 이렇게 바꿨습니다. 추가로 필요하신 것 있으세요?`, 'more')
          } else if (isNo(said) || /예약해|이대로|그대로|진행해|끝/.test(said)) {
            await book()
          } else if (isYes(said)) {
            await say('추가로 필요하신 것 있으세요? 없으시면 없다고 말씀해 주세요.', 'more')
          } else {
            await say('스타일, 인원, 호텔 등급, 식사, 교통을 바꾸거나 커피와 샴페인을 추가하거나 뺄 수 있어요. 필요 없으시면 없다고 말씀해 주세요.', 'more')
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
    void handle(response.recognizedText, response.commands)
  }

  const context: VoiceScreenContext = {
    screen: 'voice-booking',
    tours: candidatesRef.current.map(tour => ({ tourId: tour.tourId, tourName: tour.tourName, theme: tour.theme, price: tour.basePrice })),
    availableTourLevels: detailRef.current?.availableTourLevels ?? [],
    drinkOptions: (detailRef.current?.drinkOptions ?? []).map(option => ({ optionId: option.optionId, name: option.drinkName })),
    pendingAction: null,
  }
  const micVisible = listening && !busy && stepRef.current !== 'booking' && stepRef.current !== 'done'
  // 질문은 화면 상단 안내 문구로 이미 보여주므로 마이크 상태 문구는 숨긴다
  return <>
    <Suspense fallback={null}>
      <VoiceGuideCharacter speaking={speaking} listening={micVisible} />
    </Suspense>
    {micVisible && <div className="voice-booking-listening">
      <VoiceSearchPanel key={turn} context={context} onResponse={onVoice} display="floating" onClose={() => setListening(false)} />
    </div>}
  </>
}
