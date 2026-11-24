import type { ApiHotelGrade, ApiMealType, ApiTheme, ApiTourLevel, ApiTransport } from '../types/api'
import type { DrinkOptionResponse, TourDetailResponse, TourSummaryResponse } from '../types/tourApi'

// 음성 예약 대화 흐름(시스템이 질문하고 고객이 답하는 방식)에서 쓰는 순수 함수 모음.

export const themeLabels: Record<ApiTheme, string> = {
  HONEYMOON: '허니문',
  HEALING: '힐링',
  GOLF: '골프',
  TREKKING: '트레킹',
}

export const levelLabels: Record<ApiTourLevel, string> = { CLASSIC: '클래식', GRAND: '그랜드', PREMIUM: '프리미엄' }

// 투어 등급별 기본 구성 (서버 데모 데이터와 같은 기준)
export const levelDefaults: Record<ApiTourLevel, { hotelGrade: ApiHotelGrade; mealType: ApiMealType }> = {
  CLASSIC: { hotelGrade: 'THREE_STAR', mealType: 'LUNCH_BOX' },
  GRAND: { hotelGrade: 'FOUR_STAR', mealType: 'LOCAL_RESTAURANT' },
  PREMIUM: { hotelGrade: 'FIVE_STAR', mealType: 'FINE_DINING' },
}

const themeKeywords: [ApiTheme, RegExp][] = [
  ['HONEYMOON', /결혼|신혼|허니문|웨딩|연인|애인|여자\s*친구|남자\s*친구|기념일|프러포즈|낭만|로맨/],
  ['HEALING', /부모님|효도|환갑|칠순|팔순|회갑|어머니|아버지|엄마|아빠|힐링|휴식|쉬고|편안|온천/],
  ['GOLF', /골프|라운딩|필드/],
  ['TREKKING', /트레킹|등산|산행|아웃도어|하이킹|걷기|올레/],
]

export function detectTheme(text: string): ApiTheme | null {
  for (const [theme, pattern] of themeKeywords) if (pattern.test(text)) return theme
  return null
}

const koreanNumbers: Record<string, number> = {
  한: 1, 하나: 1, 일: 1, 두: 2, 둘: 2, 이: 2, 세: 3, 셋: 3, 삼: 3, 네: 4, 넷: 4, 사: 4, 다섯: 5, 오: 5,
  여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
}

function toNumber(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word)
  return koreanNumbers[word] ?? null
}

function isoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "다음 달 오늘", "12월 24일", "다음 주" 같은 표현을 날짜로 바꾼다. 못 찾으면 null
export function detectDate(text: string, today = new Date()): string | null {
  const t = text.replace(/\s+/g, '')
  const md = t.match(/(\d{1,2})월(\d{1,2})일/)
  if (md) {
    const month = Number(md[1]) - 1
    const day = Number(md[2])
    let date = new Date(today.getFullYear(), month, day)
    if (date < today) date = new Date(today.getFullYear() + 1, month, day)
    return isoDate(date)
  }
  if (/다음달|담달/.test(t)) return isoDate(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()))
  if (/다다음달/.test(t)) return isoDate(new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()))
  if (/다음주/.test(t)) return isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7))
  const monthOnly = t.match(/(\d{1,2})월/)
  if (monthOnly) {
    const month = Number(monthOnly[1]) - 1
    let date = new Date(today.getFullYear(), month, 1)
    if (month < today.getMonth()) date = new Date(today.getFullYear() + 1, month, 1)
    return isoDate(date)
  }
  return null
}

export const isYes = (text: string) => /^(네|예|응|어|그래|좋아|좋습니다|좋네|맞아|맞습니다|맞아요|오케이|ok|okay)|좋아요|좋겠|맞아|그렇게|그걸로|괜찮/i.test(text.trim())
export const isNo = (text: string) => /없어|없습니다|없어요|아니|됐어|괜찮아요\s*$|그만|충분/.test(text)
export const wantsRecommendation = (text: string) => /추천|골라|아무거나|모르겠|좋은\s*거|멋진|괜찮은/.test(text)

// 추천 후보: 모집 중이고 목표 날짜 이후 출발하는 투어 중 날짜가 가까운 순.
// 테마를 정했으면 그 테마 상품 2개, 테마가 없으면 서로 다른 테마 2개
export function recommendTours(tours: TourSummaryResponse[], preferred: ApiTheme | null, targetDate: string | null, maxPrice: number | null = null, keyword: string | null = null) {
  const target = targetDate ?? isoDate(new Date())
  let recruiting = tours.filter(tour => tour.tourStatus === 'RECRUITING')
  if (maxPrice) recruiting = recruiting.filter(tour => tour.basePrice <= maxPrice)
  if (keyword && recruiting.some(tour => tour.tourName.includes(keyword))) recruiting = recruiting.filter(tour => tour.tourName.includes(keyword))
  const open = recruiting.filter(tour => tour.startDate >= target).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const pool = open.length ? open : recruiting
  if (preferred) {
    const same = pool.filter(tour => tour.theme === preferred).slice(0, 2)
    if (same.length) return same
  }
  const first = pool[0]
  if (!first) return []
  const second = pool.find(tour => tour.tourId !== first.tourId && tour.theme !== first.theme)
  return second ? [first, second] : [first]
}

export const anyTime = (text: string) => /상관\s*없|아무\s*때|언제든|빨리|가까운|제일\s*빠른|최대한/.test(text)

// 고객 답변에서 후보 중 어떤 투어를 골랐는지 찾는다
export function matchTour(text: string, candidates: TourSummaryResponse[]): TourSummaryResponse | null {
  const t = text.replace(/\s+/g, '')
  if (/첫\s*번째|첫번째|앞에|처음/.test(text) && candidates[0]) return candidates[0]
  if (/두\s*번째|두번째|뒤에|나중/.test(text) && candidates[1]) return candidates[1]
  for (const tour of candidates) {
    const words = tour.tourName.split(/\s+/).filter(word => word.length >= 2 && !/\d/.test(word))
    if (words.some(word => t.includes(word))) return tour
  }
  const theme = detectTheme(text)
  if (theme) return candidates.find(tour => tour.theme === theme) ?? null
  if (candidates.length === 1 && isYes(text)) return candidates[0]
  return null
}

export function detectLevel(text: string): ApiTourLevel | null {
  if (/프리미엄|프리미어|최고급|고급/.test(text)) return 'PREMIUM'
  if (/그랜드|중간/.test(text)) return 'GRAND'
  if (/클래식|기본|저렴/.test(text)) return 'CLASSIC'
  return null
}

export interface DrinkPick {
  optionId: number
  name: string
  quantity: number
  // set: 그 수량으로, add: 기존 수량에 더하기("하나 더"), remove: 빼기
  mode?: 'set' | 'add' | 'remove'
}

const drinkAliases: { pattern: RegExp; code: string; label: string; unit: string }[] = [
  { pattern: /커피/, code: 'COFFEE', label: '커피', unit: '포트' },
  { pattern: /샴페인|샴팡/, code: 'CHAMPAGNE', label: '샴페인', unit: '병' },
  { pattern: /와인/, code: 'WINE', label: '와인', unit: '병' },
]

export function drinkLabel(name: string) {
  const alias = drinkAliases.find(item => item.code === name.toUpperCase() || item.pattern.test(name))
  return alias ? { label: alias.label, unit: alias.unit } : { label: name, unit: '개' }
}

// "커피 1포트, 샴페인 한 병" → [{COFFEE,1},{CHAMPAGNE,1}]
const removeWords = /빼|제거|취소|없애|빼고|안\s*넣|안\s*할|필요\s*없|됐어|말고|그만/
const numberWords = '(\\d+|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉|열)'

// "커피 1포트, 샴페인 한 병" → 수량 지정, "커피 하나 더" → 추가, "커피는 빼 주세요" → 제거
// 음료 이름이 나온 곳부터 다음 음료 이름 전까지를 그 음료에 대한 말로 본다
export function detectDrinks(text: string, options: DrinkOptionResponse[]): DrinkPick[] {
  const mentions: { index: number; alias: typeof drinkAliases[number]; option: DrinkOptionResponse }[] = []
  for (const alias of drinkAliases) {
    const option = options.find(item => item.drinkName.toUpperCase() === alias.code || alias.pattern.test(item.drinkName))
    if (!option) continue
    const found = text.search(alias.pattern)
    if (found >= 0) mentions.push({ index: found, alias, option })
  }
  mentions.sort((a, b) => a.index - b.index)
  return mentions.map((mention, i) => {
    const end = mentions[i + 1]?.index ?? text.length
    const segment = text.slice(mention.index, end)
    const number = segment.match(new RegExp(`${numberWords}\\s*(포트|병|잔|개|팟|주전자)?`))
    const quantity = number ? Math.min(toNumber(number[1]) ?? 1, 100) : 1
    if (removeWords.test(segment) || /^0$/.test(number?.[1] ?? '')) {
      return { optionId: mention.option.optionId, name: mention.option.drinkName, quantity: 0, mode: 'remove' as const }
    }
    const mode = /더|추가로\s*하나|하나\s*더|늘려/.test(segment) && !/로\s*(바꿔|해|변경)/.test(segment) ? 'add' as const : 'set' as const
    return { optionId: mention.option.optionId, name: mention.option.drinkName, quantity, mode }
  })
}

// 기존 음료 목록에 새로 말한 음료를 반영한다(수량 0이면 목록에서 뺀다)
export function mergeDrinks(current: DrinkPick[], picks: DrinkPick[]): DrinkPick[] {
  const next = current.map(drink => ({ ...drink }))
  for (const pick of picks) {
    const existing = next.find(drink => drink.optionId === pick.optionId)
    const quantity = pick.mode === 'remove' ? 0 : pick.mode === 'add' ? (existing?.quantity ?? 0) + pick.quantity : pick.quantity
    if (existing) existing.quantity = Math.min(quantity, 100)
    else if (quantity > 0) next.push({ optionId: pick.optionId, name: pick.name, quantity: Math.min(quantity, 100) })
  }
  return next.filter(drink => drink.quantity > 0)
}

export function drinkText(drinks: DrinkPick[]) {
  return drinks.map(drink => {
    const { label, unit } = drinkLabel(drink.name)
    return `${label} ${drink.quantity}${unit}`
  }).join(', ')
}

export function formatKoreanDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}월 ${d}일`
}

export function bestLevel(detail: TourDetailResponse): ApiTourLevel {
  const order: ApiTourLevel[] = ['PREMIUM', 'GRAND', 'CLASSIC']
  return order.find(level => detail.availableTourLevels.includes(level)) ?? 'CLASSIC'
}

export const hotelLabels: Record<ApiHotelGrade, string> = { THREE_STAR: '3성급 호텔', FOUR_STAR: '4성급 호텔', FIVE_STAR: '5성급 호텔' }
export const mealLabels: Record<ApiMealType, string> = { LUNCH_BOX: '도시락', LOCAL_RESTAURANT: '현지식 레스토랑', FINE_DINING: '고급 레스토랑' }
export const transportLabels: Record<ApiTransport, string> = { PREMIUM_CAR_2: '2인 고급차량', PREMIUM_VAN_10: '10인 승합차' }

export interface OptionChange {
  hotelGrade?: ApiHotelGrade
  mealType?: ApiMealType
  transport?: ApiTransport
}

// "호텔은 4성급으로", "식사는 현지식으로", "승합차로 바꿔줘" → 옵션 변경
export function detectOptions(text: string): OptionChange {
  const t = text.replace(/\s+/g, '')
  const change: OptionChange = {}
  const hotel = detectHotel(t)
  if (hotel) change.hotelGrade = hotel
  if (/도시락/.test(t)) change.mealType = 'LUNCH_BOX'
  else if (/현지식|현지음식|현지식당|로컬/.test(t)) change.mealType = 'LOCAL_RESTAURANT'
  else if (/고급레스토랑|파인다이닝|스테이크|코스요리/.test(t)) change.mealType = 'FINE_DINING'
  if (/승합차|밴|10인|열명|큰차/.test(t)) change.transport = 'PREMIUM_VAN_10'
  else if (/2인차|2인고급|고급차|전용차|세단|승용차/.test(t)) change.transport = 'PREMIUM_CAR_2'
  return change
}

// "100만원 이하", "200만 원 안으로" → 1000000
export function detectBudget(text: string): number | null {
  const t = text.replace(/\s+/g, '').replace(/,/g, '')
  const m = t.match(/(\d+)(만|천만)?원/)
  if (!m || !/이하|이내|안으로|아래|까지|넘지|예산/.test(t)) return null
  const n = Number(m[1])
  return m[2] === '천만' ? n * 10_000_000 : m[2] === '만' ? n * 10_000 : n
}

// 상품명에 들어 있는 지역·키워드("제주", "발리")를 찾는다
export function detectKeyword(text: string, tours: TourSummaryResponse[]): string | null {
  const t = text.replace(/\s+/g, '')
  const skip = /허니문|효도|힐링|골프|트레킹|투어|여행|패키지|\d/
  for (const tour of tours) {
    for (const word of tour.tourName.split(/\s+/)) {
      if (word.length >= 2 && !skip.test(word) && t.includes(word)) return word
    }
  }
  return null
}

const hotelNumbers: [RegExp, ApiHotelGrade][] = [
  [/^(5|오|다섯|파이브)$/, 'FIVE_STAR'],
  [/^(4|사|네|포)$/, 'FOUR_STAR'],
  [/^(3|삼|세|쓰리)$/, 'THREE_STAR'],
]

// "3등급 호텔", "삼 등급", "4급", "호텔 등급은 3으로", "5스타", "제일 좋은 호텔" 등
function detectHotel(t: string): ApiHotelGrade | undefined {
  const num = '(5|4|3|오|사|삼|다섯|네|세|파이브|포|쓰리)'
  const m = t.match(new RegExp(`${num}(성급|성|등급|급|스타)`))
    ?? (/(호텔|숙소)/.test(t) ? t.match(new RegExp(`(?:호텔|숙소)(?:등급)?(?:은|는|을|를|도|이|가)?${num}`)) : null)
  if (m) {
    const word = m[1]
    for (const [pattern, grade] of hotelNumbers) if (pattern.test(word)) return grade
  }
  if (/(최고급|제일좋은|가장좋은|좋은)(호텔|숙소)/.test(t)) return 'FIVE_STAR'
  if (/(제일싼|가장싼|저렴한|싼)(호텔|숙소)/.test(t)) return 'THREE_STAR'
  return undefined
}
