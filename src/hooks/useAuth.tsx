import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as requestLogin, logout as requestLogout, refresh as requestRefresh, signup as requestSignup } from '../api/auth'
import {
  authChangeEvent,
  clearStoredAuth,
  getRefreshToken,
  getAccessTokenExpiresAt,
  getStoredAuthSession,
  setAccessToken,
  storeAuth,
} from '../api/tokenStorage'
import type { AuthSession, LoginRequest, SignupRequest, SignupResponse } from '../types/auth'

interface AuthContextValue {
  session: AuthSession | null
  login: (request: LoginRequest) => Promise<AuthSession>
  signup: (request: SignupRequest) => Promise<SignupResponse>
  logout: () => Promise<void>
  accessTokenExpiresAt: string | null
  extendSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession())
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<string | null>(() => getAccessTokenExpiresAt())

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredAuthSession())
      setAccessTokenExpiresAt(getAccessTokenExpiresAt())
    }
    window.addEventListener(authChangeEvent, syncSession)
    window.addEventListener('storage', syncSession)
    return () => {
      window.removeEventListener(authChangeEvent, syncSession)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  async function login(request: LoginRequest) {
    const { data } = await requestLogin(request)
    const nextSession: AuthSession = {
      memberId: data.memberId,
      memberName: data.memberName,
      role: data.role,
    }
    storeAuth(nextSession, data.accessToken, data.refreshToken, data.accessTokenExpiresAt)
    setSession(nextSession)
    setAccessTokenExpiresAt(data.accessTokenExpiresAt)
    return nextSession
  }

  async function signup(request: SignupRequest) {
    const { data } = await requestSignup(request)
    return data
  }

  async function logout() {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await requestLogout({ refreshToken })
    } catch {
      // 서버가 응답하지 않아도 이 기기의 토큰과 세션은 반드시 종료한다.
    } finally {
      clearStoredAuth()
      setSession(null)
      setAccessTokenExpiresAt(null)
    }
  }

  async function extendSession() {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('세션을 연장할 수 없습니다. 다시 로그인해 주세요.')
    const { data } = await requestRefresh({ refreshToken })
    setAccessToken(data.accessToken, data.accessTokenExpiresAt)
    setAccessTokenExpiresAt(data.accessTokenExpiresAt)
  }

  return <AuthContext.Provider value={{ session, login, signup, logout, accessTokenExpiresAt, extendSession }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider가 필요합니다.')
  return context
}
