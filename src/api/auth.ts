import { apiClient } from './client'

export const signup = (payload: unknown) => apiClient.post('/auth/signup', payload)

export const login = (payload: unknown) => apiClient.post('/auth/login', payload)

export const refresh = (payload: unknown) => apiClient.post('/auth/refresh', payload)

export const logout = () => apiClient.post('/auth/logout')
