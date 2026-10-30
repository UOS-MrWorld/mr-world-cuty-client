import type {
  ApiBookingStatus,
  ApiHotelGrade,
  ApiMealType,
  ApiPaymentStatus,
  ApiTheme,
  ApiTourLevel,
  ApiTourStatus,
  ApiTransport,
  LocalDateString,
  PagingParams,
} from './api'
import type { DrinkOptionItem, QuoteRequest } from './tourApi'

export interface BookingRequest extends QuoteRequest {
  tourId: number
}

export interface BookingResponse {
  bookingId: number
  bookingStatus: ApiBookingStatus
  totalPrice: number
  discountRate: number
  expectedPaymentAmount: number
}

export interface BookingListParams extends PagingParams {
  status?: ApiBookingStatus
}

export interface BookingSummaryResponse {
  bookingId: number
  tourId: number
  tourName: string
  startDate: LocalDateString
  bookingStatus: ApiBookingStatus
  totalPrice: number
  discountRate: number
}

export interface BookingTourInfo {
  tourId: number
  tourName: string
  theme: ApiTheme
  startDate: LocalDateString
  endDate: LocalDateString
  tourStatus: ApiTourStatus
}

export interface BookingDrinkOptionInfo extends DrinkOptionItem {
  drinkName: string
  price: number
}

export interface BookingDetailResponse {
  bookingId: number
  tour: BookingTourInfo
  tourLevel: ApiTourLevel
  guestCount: number
  hotelGrade: ApiHotelGrade
  mealType: ApiMealType
  transport: ApiTransport
  drinkOptions: BookingDrinkOptionInfo[]
  bookingStatus: ApiBookingStatus
  totalPrice: number
  discountRate: number
  paymentStatus: ApiPaymentStatus | null
}

export interface BookingUpdateRequest {
  tourLevel?: ApiTourLevel
  guestCount?: number
  hotelGrade?: ApiHotelGrade
  mealType?: ApiMealType
  transport?: ApiTransport
  drinkOptions?: DrinkOptionItem[]
}

export interface BookingUpdateResponse extends BookingResponse {
  tourLevel: ApiTourLevel
  guestCount: number
  hotelGrade: ApiHotelGrade
  mealType: ApiMealType
  transport: ApiTransport
}

export interface BookingCancelResponse {
  bookingId: number
  bookingStatus: ApiBookingStatus
  paymentStatus: ApiPaymentStatus | null
}

export interface TravelHistoryResponse {
  bookingId: number
  tourName: string
  startDate: LocalDateString
  endDate: LocalDateString
  tourLevel: ApiTourLevel
  paidAmount: number
  tourStatus: ApiTourStatus
}
