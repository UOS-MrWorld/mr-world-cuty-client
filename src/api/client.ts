import axios, { type InternalAxiosRequestConfig } from 'axios'
import { normalizeApiError } from '../types/api'
import type { TokenResponse } from '../types/auth'
import { clearStoredAuth, getAccessToken, getRefreshToken, setAccessToken } from './tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
export const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})
const refreshClient = axios.create({ baseURL, headers: { Accept: 'application/json' } })
type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }
let refreshPromise: Promise<string> | null = null

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (!axios.isAxiosError(error)) return Promise.reject(normalizeApiError(error))
    const request = error.config as RetryableRequest | undefined
    const path = request?.url ?? ''
    const refreshToken = getRefreshToken()
    const canRefresh = error.response?.status === 401
      && request
      && !request._retry
      && Boolean(refreshToken)
      && !path.includes('/auth/login')
      && !path.includes('/auth/signup')
      && !path.includes('/auth/refresh')

    if (!canRefresh || !request || !refreshToken) {
      return Promise.reject(normalizeApiError(error))
    }

    request._retry = true
    try {
      refreshPromise ??= refreshClient
        .post<TokenResponse>('/auth/refresh', { refreshToken })
        .then(response => {
          setAccessToken(response.data.accessToken)
          return response.data.accessToken
        })
        .finally(() => { refreshPromise = null })
      const accessToken = await refreshPromise
      request.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(request)
    } catch (refreshError) {
      clearStoredAuth()
      return Promise.reject(normalizeApiError(refreshError))
    }
  },
)
