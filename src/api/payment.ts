import { apiClient } from './client'
import type { PaymentRequest, PaymentResponse } from '../types/paymentApi'

export const createPayment = (payload: PaymentRequest) =>
  apiClient.post<PaymentResponse>('/customer/payments', payload)
