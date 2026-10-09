import type {
  HotelGrade,
  ThemeId,
  Tour,
  TravelDraft,
  TravelGrade,
  TravelMeal,
  TravelTransport,
} from '../types/travel'

// UI 초안 전용 계산. 실제 판매가·허용 옵션·신청 정책은 서버 명세 확정 후 교체합니다.
export const gradeLabels: Record<TravelGrade, string> = {
  classic: '클래식',
  grand: '그랜드',
  premium: '프리미엄',
}
export const hotelLabels: Record<HotelGrade, string> = {
  '3': '3등급 호텔',
  '4': '4등급 호텔',
  '5': '5등급 호텔',
}
export const transportLabels: Record<TravelTransport, string> = {
  private: '2인 전용 고급차량',
  van: '10인승 고급차량',
}
export const mealLabels: Record<TravelMeal, string> = {
  lunch: '도시락',
  local: '현지식 레스토랑',
  steak: '고급 레스토랑 스테이크',
}

export function getTransportDescription(tour: Tour, draft: TravelDraft) {
  return tour.theme === 'romance' && draft.transport === 'private'
    ? `커플별 2인 전용 고급차량 · ${draft.travelers / 2}대`
    : transportLabels[draft.transport]
}
export const themeBenefits: Record<Exclude<ThemeId, 'all'>, string[]> = {
  romance: ['커플 단위 여행 · 2명씩 신청', '로맨틱 룸 장식', '커플 기념티', '커플별 2인 전용 고급차량'],
  healing: ['안마·지압 서비스', '인삼 기념품', '10인승 고급차량'],
  golf: ['골프 리조트 테마', '골프 액세서리·골프공', '10인승 고급차량'],
  outdoor: ['트레킹·산악 테마', '기념품 스카프', '10인승 고급차량'],
}

export const gradeDefaults: Record<TravelGrade, { hotel: HotelGrade; meal: TravelMeal }> = {
  classic: { hotel: '3', meal: 'lunch' },
  grand: { hotel: '4', meal: 'local' },
  premium: { hotel: '5', meal: 'steak' },
}
const gradePrices: Record<TravelGrade, number> = { classic: 0, grand: 200000, premium: 600000 }
const hotelPrices: Record<HotelGrade, number> = { '3': 0, '4': 150000, '5': 350000 }
const mealPrices: Record<TravelMeal, number> = { lunch: 0, local: 50000, steak: 150000 }
const transportPrices: Record<TravelTransport, number> = { private: 100000, van: 0 }

export function minimumGrade(tour: Tour): TravelGrade {
  return tour.theme === 'romance' || tour.theme === 'healing' ? 'grand' : 'classic'
}

export function getGradeDefaults(tour: Tour, grade: TravelGrade) {
  return {
    ...gradeDefaults[grade],
    transport: (tour.theme === 'romance' ? 'private' : 'van') as TravelTransport,
    champagne: false,
    coffee: false,
  }
}

export function createDraft(tour: Tour): TravelDraft {
  const grade = minimumGrade(tour)
  return {
    tourId: tour.id,
    grade,
    ...getGradeDefaults(tour, grade),
    date: '',
    travelers: tour.theme === 'romance' ? 2 : 1,
  }
}

function knownValue<T extends string>(value: unknown, keys: readonly T[], fallback: T): T {
  return typeof value === 'string' && keys.includes(value as T) ? value as T : fallback
}

export function normalizeDraft(tour: Tour, value?: unknown): TravelDraft {
  const initial = createDraft(tour)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return initial
  const raw = value as Record<string, unknown>
  const legacyGrades: Record<string, TravelGrade> = { '스탠다드': minimumGrade(tour), '프리미엄': 'premium' }
  let grade = knownValue(raw.grade, ['classic', 'grand', 'premium'], initial.grade)
  if (typeof raw.grade === 'string' && Object.hasOwn(legacyGrades, raw.grade)) grade = legacyGrades[raw.grade]
  if (grade === 'classic' && minimumGrade(tour) === 'grand') grade = 'grand'
  const defaults = getGradeDefaults(tour, grade)
  const rawTravelers = typeof raw.travelers === 'number' && Number.isFinite(raw.travelers)
    ? Math.min(10, Math.max(1, Math.floor(raw.travelers))) : initial.travelers
  const travelers = tour.theme === 'romance'
    ? Math.max(2, Math.floor(rawTravelers / 2) * 2) : rawTravelers
  const hotelValue = raw.hotel === '편안한 4성급' ? '4' : raw.hotel === '특별한 5성급' ? '5' : raw.hotel
  const mealValue = raw.meal === '전 일정 식사 포함' ? 'local' : raw.meal
  const transportValue = raw.transport === '우리만의 전용 차량'
    ? 'private'
    : raw.transport === '함께 이동' ? 'van' : raw.transport
  const transport = knownValue(transportValue, ['private', 'van'], defaults.transport)
  return {
    tourId: tour.id,
    grade,
    hotel: knownValue(hotelValue, ['3', '4', '5'], defaults.hotel),
    meal: knownValue(mealValue, ['lunch', 'local', 'steak'], defaults.meal),
    transport: tour.theme === 'romance' ? 'private' : travelers > 2 ? 'van' : transport,
    date: typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : '',
    travelers,
    champagne: grade !== 'premium' && raw.champagne === true,
    coffee: raw.coffee === true,
  }
}

export function getEstimate(tour: Tour, draft: TravelDraft) {
  const selection = normalizeDraft(tour, draft)
  const defaults = getGradeDefaults(tour, selection.grade)
  const basePerPerson = tour.price + gradePrices[selection.grade] - gradePrices[minimumGrade(tour)]
  const optionsPerPerson = hotelPrices[selection.hotel] - hotelPrices[defaults.hotel]
    + mealPrices[selection.meal] - mealPrices[defaults.meal]
    + transportPrices[selection.transport] - transportPrices[defaults.transport]
    + (selection.champagne ? 50000 : 0)
    + (selection.coffee ? 10000 : 0)
  const perPerson = basePerPerson + optionsPerPerson
  return {
    base: basePerPerson * selection.travelers,
    options: optionsPerPerson * selection.travelers,
    total: perPerson * selection.travelers,
    perPerson,
  }
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getToday() {
  return localDate(new Date())
}

export function getTomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return localDate(date)
}

export function getEarliestDepartureDate() {
  const date = new Date()
  date.setDate(date.getDate() + 8)
  return localDate(date)
}

export function isOpenTravelDate(date: string) {
  return isValidTravelDate(date) && date >= getEarliestDepartureDate()
}

export function isValidTravelDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(parsed.getTime())
    && localDate(parsed) === date
    && date > getToday()
}
