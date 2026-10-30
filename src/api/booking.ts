import { apiClient } from './client'
import type { PageResponse, PagingParams } from '../types/api'
import type {
  BookingCancelResponse,
  BookingDetailResponse,
  BookingListParams,
  BookingRequest,
  BookingResponse,
  BookingSummaryResponse,
  BookingUpdateRequest,
  BookingUpdateResponse,
  TravelHistoryResponse,
} from '../types/bookingApi'

export const createBooking = (payload: BookingRequest) =>
  apiClient.post<BookingResponse>('/customer/bookings', payload)

export const getBookings = (params?: BookingListParams) =>
  apiClient.get<PageResponse<BookingSummaryResponse>>('/customer/bookings', { params })

export const getBooking = (bookingId: number) =>
  apiClient.get<BookingDetailResponse>(`/customer/bookings/${bookingId}`)

export const updateBooking = (bookingId: number, payload: BookingUpdateRequest) =>
  apiClient.patch<BookingUpdateResponse>(`/customer/bookings/${bookingId}`, payload)

export const cancelBooking = (bookingId: number) =>
  apiClient.patch<BookingCancelResponse>(`/customer/bookings/${bookingId}/cancel`)

export const getTravelHistory = (params?: PagingParams) =>
  apiClient.get<PageResponse<TravelHistoryResponse>>('/customer/travel-history', { params })
