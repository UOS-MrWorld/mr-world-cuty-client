import { apiClient } from './client'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
} from '../types/auth'

export const signup = (payload: SignupRequest) => apiClient.post<SignupResponse>('/auth/signup', payload)

export const login = (payload: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', payload)

export const refresh = (payload: RefreshTokenRequest) => apiClient.post<TokenResponse>('/auth/refresh', payload)

export const logout = (payload: RefreshTokenRequest) => apiClient.post<void>('/auth/logout', payload)
