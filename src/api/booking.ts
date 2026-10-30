import { apiClient } from './client'

export const createBooking = (payload: unknown) => apiClient.post('/customer/bookings', payload)

export const getBookings = (params?: unknown) => apiClient.get('/customer/bookings', { params })

export const getBooking = (bookingId: string) => apiClient.get(`/customer/bookings/${bookingId}`)

export const cancelBooking = (bookingId: string) => apiClient.patch(`/customer/bookings/${bookingId}/cancel`)
