import type { BookingDetailResponse, BookingRequest } from '../types/bookingApi'
import type { QuoteRequest } from '../types/tourApi'
import type { Tour, TravelDraft } from '../types/travel'

const apiGrade = { classic: 'CLASSIC', grand: 'GRAND', premium: 'PREMIUM' } as const
const apiHotel = { '3': 'THREE_STAR', '4': 'FOUR_STAR', '5': 'FIVE_STAR' } as const
const apiMeal = { lunch: 'LUNCH_BOX', local: 'LOCAL_RESTAURANT', steak: 'FINE_DINING' } as const
const apiTransport = { private: 'PREMIUM_CAR_2', van: 'PREMIUM_VAN_10' } as const
const localGrade = { CLASSIC: 'classic', GRAND: 'grand', PREMIUM: 'premium' } as const
const localHotel = { THREE_STAR: '3', FOUR_STAR: '4', FIVE_STAR: '5' } as const
const localMeal = { LUNCH_BOX: 'lunch', LOCAL_RESTAURANT: 'local', FINE_DINING: 'steak' } as const
const localTransport = { PREMIUM_CAR_2: 'private', PREMIUM_VAN_10: 'van' } as const

export function findDrinkOption(tour: Tour, name: 'COFFEE' | 'CHAMPAGNE') {
  return tour.apiConfiguration?.drinkOptions.find(option => option.name.toUpperCase() === name)
}

export function toQuoteRequest(tour: Tour, draft: TravelDraft): QuoteRequest {
  const drinkOptions = [
    draft.coffee ? findDrinkOption(tour, 'COFFEE') : undefined,
    draft.champagne ? findDrinkOption(tour, 'CHAMPAGNE') : undefined,
  ].filter((option): option is NonNullable<typeof option> => Boolean(option))
    .map(option => ({ optionId: option.id, quantity: 1 }))

  return {
    tourLevel: apiGrade[draft.grade],
    guestCount: draft.travelers,
    hotelGrade: apiHotel[draft.hotel],
    mealType: apiMeal[draft.meal],
    transport: apiTransport[draft.transport],
    drinkOptions,
  }
}

export function toBookingRequest(tour: Tour, draft: TravelDraft): BookingRequest {
  const tourId = Number(tour.id)
  if (!Number.isSafeInteger(tourId)) throw new Error('서버 상품 ID가 올바르지 않습니다.')
  return { tourId, ...toQuoteRequest(tour, draft) }
}

export function fromBookingDetail(tour: Tour, booking: BookingDetailResponse): TravelDraft {
  const champagne = findDrinkOption(tour, 'CHAMPAGNE')
  const coffee = findDrinkOption(tour, 'COFFEE')
  const selectedIds = new Set(booking.drinkOptions.map(option => option.optionId))
  return {
    tourId: tour.id,
    grade: localGrade[booking.tourLevel],
    hotel: localHotel[booking.hotelGrade],
    meal: localMeal[booking.mealType],
    transport: localTransport[booking.transport],
    date: booking.tour.startDate,
    travelers: booking.guestCount,
    champagne: Boolean(champagne && selectedIds.has(champagne.id)),
    coffee: Boolean(coffee && selectedIds.has(coffee.id)),
  }
}

export function quoteRequestFromBooking(booking: BookingDetailResponse): QuoteRequest {
  return {
    tourLevel: booking.tourLevel,
    guestCount: booking.guestCount,
    hotelGrade: booking.hotelGrade,
    mealType: booking.mealType,
    transport: booking.transport,
    drinkOptions: booking.drinkOptions.map(option => ({ optionId: option.optionId, quantity: option.quantity })),
  }
}
