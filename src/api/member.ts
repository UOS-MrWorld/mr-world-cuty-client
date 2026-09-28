import { apiClient } from './client'

export const getMyInfo = () => apiClient.get('/members/me')

export const updateMyInfo = (payload: unknown) => apiClient.patch('/members/me', payload)

export const getMyTravelHistory = () => apiClient.get('/customers/me/travel-history')
