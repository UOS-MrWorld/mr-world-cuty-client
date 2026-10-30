import type { ApiBookingStatus, ApiPaymentStatus, LocalDateTimeString } from './api'

export interface PaymentRequest {
  bookingId: number
  cardNumber: string
}

export interface PaymentResponse {
  paymentId: number
  bookingId: number
  paymentStatus: ApiPaymentStatus
  amount: number
  paidAt: LocalDateTimeString
  bookingStatus: ApiBookingStatus
}
