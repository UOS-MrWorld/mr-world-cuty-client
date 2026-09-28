import { apiClient } from './client'

// 고객용
export const getTours = (params?: unknown) => apiClient.get('/tours', { params })

export const getTour = (tourId: string) => apiClient.get(`/tours/${tourId}`)

export const searchToursByVoice = (payload: unknown) => apiClient.post('/tours/voice-search', payload)

// 직원용
export const getStaffTours = (params?: unknown) => apiClient.get('/staff/tours', { params })

export const getStaffTour = (tourId: string) => apiClient.get(`/staff/tours/${tourId}`)

export const createTour = (payload: unknown) => apiClient.post('/staff/tours', payload)

export const updateTour = (tourId: string, payload: unknown) =>
  apiClient.patch(`/staff/tours/${tourId}`, payload)

export const deleteTour = (tourId: string) => apiClient.delete(`/staff/tours/${tourId}`)
