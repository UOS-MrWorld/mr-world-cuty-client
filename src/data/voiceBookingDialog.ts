import type { ApiHotelGrade, ApiMealType, ApiTheme, ApiTourLevel } from '../types/api'
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
export function recommendTours(tours: TourSummaryResponse[], preferred: ApiTheme | null, targetDate: string | null) {
  const target = targetDate ?? isoDate(new Date())
  const recruiting = tours.filter(tour => tour.tourStatus === 'RECRUITING')
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
export function detectDrinks(text: string, options: DrinkOptionResponse[]): DrinkPick[] {
  const picks: DrinkPick[] = []
  for (const alias of drinkAliases) {
    const option = options.find(item => item.drinkName.toUpperCase() === alias.code || alias.pattern.test(item.drinkName))
    if (!option) continue
    const match = text.match(new RegExp(`(${alias.pattern.source})\\s*(\\d+|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉|열)?`))
    if (!match) continue
    const quantity = match[2] ? toNumber(match[2]) ?? 1 : 1
    picks.push({ optionId: option.optionId, name: option.drinkName, quantity: Math.min(quantity, 100) })
  }
  return picks
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
