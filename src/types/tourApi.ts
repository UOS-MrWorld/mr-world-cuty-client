import type {
  ApiHotelGrade,
  ApiMealType,
  ApiTheme,
  ApiTourLevel,
  ApiTourStatus,
  ApiTransport,
  LocalDateString,
  LocalDateTimeString,
  PagingParams,
} from './api'

export interface TourSummaryResponse {
  tourId: number
  theme: ApiTheme
  tourName: string
  startDate: LocalDateString
  endDate: LocalDateString
  basePrice: number
  tourStatus: ApiTourStatus
}

export interface DrinkOptionResponse {
  optionId: number
  drinkName: string
  drinkPrice: number
}

export interface TourGiftResponse {
  itemId: number
  itemName: string
  quantityPerGuest: number
}

export interface TourDetailResponse extends TourSummaryResponse {
  description: string
  defaultTransport: ApiTransport
  availableTourLevels: ApiTourLevel[]
  drinkOptions: DrinkOptionResponse[]
  gifts: TourGiftResponse[]
}

export interface TourSearchParams extends PagingParams {
  keyword?: string
  theme?: ApiTheme
  maxPrice?: number
  departureDate?: LocalDateString
}

export interface VoiceSearchRequest {
  queryText: string
  maxPrice?: number
  departureDate?: LocalDateString
}

export interface VoiceSearchResponse {
  recognizedText: string
  tours: TourSummaryResponse[]
}

export interface DrinkOptionItem {
  optionId: number
  quantity: number
}

export interface QuoteRequest {
  tourLevel: ApiTourLevel
  guestCount: number
  hotelGrade: ApiHotelGrade
  mealType: ApiMealType
  transport: ApiTransport
  drinkOptions?: DrinkOptionItem[]
}

export interface QuoteResponse {
  basePrice: number
  optionPrice: number
  discountRate: number
  totalPrice: number
  expectedPaymentAmount: number
}

export interface TourGiftRequest {
  itemId: number
  quantityPerGuest: number
}

export interface TourCreateRequest {
  theme: ApiTheme
  tourName: string
  description?: string
  startDate: LocalDateString
  endDate: LocalDateString
  basePrice: number
  defaultTransport: ApiTransport
  gifts?: TourGiftRequest[]
}

export interface TourUpdateRequest {
  tourName?: string
  description?: string
  startDate?: LocalDateString
  endDate?: LocalDateString
  basePrice?: number
  defaultTransport?: ApiTransport
  gifts?: TourGiftRequest[]
}

export interface TourMutationResponse {
  tourId: number
  tourName: string
  basePrice: number
  tourStatus: ApiTourStatus
  createdAt: LocalDateTimeString
}

export interface StaffTourListParams extends PagingParams {
  status?: ApiTourStatus
  startDateFrom?: LocalDateString
  startDateTo?: LocalDateString
}

export interface StaffTourSummaryResponse {
  tourId: number
  tourName: string
  theme: ApiTheme
  startDate: LocalDateString
  tourStatus: ApiTourStatus
  paidGuestCount: number
}

export interface StaffTourDetailResponse {
  tour: {
    tourId: number
    theme: ApiTheme
    tourName: string
    description: string
    startDate: LocalDateString
    endDate: LocalDateString
    basePrice: number
    defaultTransport: ApiTransport
    tourStatus: ApiTourStatus
  }
  paidGuestCount: number
  bookings: Array<{
    bookingId: number
    customerId: number
    name: string
    guestCount: number
    bookingStatus: import('./api').ApiBookingStatus
  }>
  gifts: Array<{
    itemId: number
    itemName: string
    quantityPerGuest: number
    currentStock: number
  }>
}
