import { apiClient } from './client'

export const addWish = (tourId: string) => apiClient.post(`/wishes/${tourId}`)

export const removeWish = (tourId: string) => apiClient.delete(`/wishes/${tourId}`)

export const getWishes = () => apiClient.get('/wishes')
