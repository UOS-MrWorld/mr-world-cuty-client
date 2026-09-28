import { apiClient } from './client'

export const createBooking = (payload: unknown) => apiClient.post('/bookings', payload)

export const getBookings = (params?: unknown) => apiClient.get('/bookings', { params })

export const getBooking = (bookingId: string) => apiClient.get(`/bookings/${bookingId}`)

export const cancelBooking = (bookingId: string) => apiClient.patch(`/bookings/${bookingId}/cancel`)

export const pay = (payload: unknown) => apiClient.post('/payments', payload)
