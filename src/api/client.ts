import axios from 'axios'
import { normalizeApiError } from '../types/api'
import { getAccessToken } from './tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(normalizeApiError(error)),
)

// TODO: Auth 성공 응답과 refresh token 저장 방식 확정 후 401 재발급 큐를 추가합니다.
