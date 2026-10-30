import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as requestLogin, logout as requestLogout, signup as requestSignup } from '../api/auth'
import {
  authChangeEvent,
  clearStoredAuth,
  getRefreshToken,
  getStoredAuthSession,
  storeAuth,
} from '../api/tokenStorage'
import type { AuthSession, LoginRequest, SignupRequest, SignupResponse } from '../types/auth'

interface AuthContextValue {
  session: AuthSession | null
  login: (request: LoginRequest) => Promise<AuthSession>
  signup: (request: SignupRequest) => Promise<SignupResponse>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession())

  useEffect(() => {
    const syncSession = () => setSession(getStoredAuthSession())
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
    storeAuth(nextSession, data.accessToken, data.refreshToken)
    setSession(nextSession)
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
    } finally {
      clearStoredAuth()
      setSession(null)
    }
  }

  return <AuthContext.Provider value={{ session, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider가 필요합니다.')
  return context
}
