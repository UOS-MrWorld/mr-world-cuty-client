import { apiClient } from './client'

export const createPayment = (payload: unknown) => apiClient.post('/customer/payments', payload)
