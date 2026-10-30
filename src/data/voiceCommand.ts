import { getGradeDefaults, gradeLabels, hotelLabels, mealLabels, normalizeDraft, transportLabels } from './configuration'
import type { ApiTheme, ApiTourLevel } from '../types/api'
import type { Tour, TravelDraft, TravelGrade } from '../types/travel'

const localThemeByApiTheme: Record<ApiTheme, string> = {
  HONEYMOON: 'romance',
  HEALING: 'healing',
  GOLF: 'golf',
  TREKKING: 'outdoor',
}

const localGradeByApiGrade = { CLASSIC: 'classic', GRAND: 'grand', PREMIUM: 'premium' } as const
const localHotelByApiHotel = { THREE_STAR: '3', FOUR_STAR: '4', FIVE_STAR: '5' } as const
const localMealByApiMeal = { LUNCH_BOX: 'lunch', LOCAL_RESTAURANT: 'local', FINE_DINING: 'steak' } as const
const localTransportByApiTransport = { PREMIUM_CAR_2: 'private', PREMIUM_VAN_10: 'van' } as const

function knownString<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

function isRecordKey<T extends object>(value: unknown, record: T): value is keyof T {
  return typeof value === 'string' && Object.hasOwn(record, value)
}

export function voiceSearchPath(params: Record<string, unknown>) {
  const search = new URLSearchParams()
  if (knownString(params.theme, Object.keys(localThemeByApiTheme) as ApiTheme[])) search.set('theme', localThemeByApiTheme[params.theme])
  if (typeof params.keyword === 'string' && params.keyword.trim()) search.set('q', params.keyword.trim())
  if (typeof params.maxPrice === 'number' && params.maxPrice > 0) search.set('budget', String(params.maxPrice))
  if (typeof params.startDateFrom === 'string') search.set('from', params.startDateFrom)
  if (typeof params.startDateTo === 'string') search.set('to', params.startDateTo)
  return search.size ? `/tours?${search.toString()}` : '/tours'
}

export function applyVoiceConfiguration(tour: Tour, draft: TravelDraft, params: Record<string, unknown>) {
  const patch: Partial<TravelDraft> = {}
  if (isRecordKey(params.tourLevel, localGradeByApiGrade)) {
    const grade = localGradeByApiGrade[params.tourLevel]
    const available = tour.apiConfiguration?.availableGrades
    if (!available || available.includes(grade)) Object.assign(patch, { grade, ...getGradeDefaults(tour, grade) })
  }
  if (isRecordKey(params.hotelGrade, localHotelByApiHotel)) patch.hotel = localHotelByApiHotel[params.hotelGrade]
  if (isRecordKey(params.mealType, localMealByApiMeal)) patch.meal = localMealByApiMeal[params.mealType]
  if (isRecordKey(params.transport, localTransportByApiTransport)) patch.transport = localTransportByApiTransport[params.transport]
  if (typeof params.guestCount === 'number' && Number.isInteger(params.guestCount) && params.guestCount > 0) patch.travelers = params.guestCount
  if (typeof params.departureDate === 'string') patch.date = params.departureDate

  if (Array.isArray(params.drinkOptions) && tour.apiConfiguration) {
    for (const selection of params.drinkOptions) {
      if (!selection || typeof selection !== 'object' || Array.isArray(selection)) continue
      const optionId = (selection as Record<string, unknown>).optionId
      const quantity = (selection as Record<string, unknown>).quantity
      const option = tour.apiConfiguration.drinkOptions.find(item => item.id === optionId)
      if (!option || typeof quantity !== 'number') continue
      if (option.name.toUpperCase().includes('CHAMPAGNE') || option.name.includes('샴페인')) patch.champagne = quantity > 0
      if (option.name.toUpperCase().includes('COFFEE') || option.name.includes('커피')) patch.coffee = quantity > 0
    }
  }
  return normalizeDraft(tour, { ...draft, ...patch })
}

export function voiceSummary(draft: TravelDraft) {
  return `${draft.travelers}명, ${gradeLabels[draft.grade]}, ${hotelLabels[draft.hotel]}, ${transportLabels[draft.transport]}, ${mealLabels[draft.meal]}${draft.champagne ? ', 샴페인' : ''}${draft.coffee ? ', 커피' : ''}`
}

export function apiTourLevels(tour?: Tour): ApiTourLevel[] {
  if (!tour?.apiConfiguration) return []
  const apiGradeByLocalGrade: Record<TravelGrade, ApiTourLevel> = { classic: 'CLASSIC', grand: 'GRAND', premium: 'PREMIUM' }
  return tour.apiConfiguration.availableGrades.map(grade => apiGradeByLocalGrade[grade])
}
