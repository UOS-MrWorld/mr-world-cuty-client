import type { AuthSession } from '../types/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_SESSION_KEY = 'cuty:auth-session:v1'
export const authChangeEvent = 'cuty:auth-change'

let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null
let memorySession: AuthSession | null = null

function notifyAuthChange() {
  window.dispatchEvent(new Event(authChangeEvent))
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? memoryAccessToken
  } catch {
    return memoryAccessToken
  }
}

export function setAccessToken(accessToken: string) {
  memoryAccessToken = accessToken
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  } catch {
    // 저장소를 사용할 수 없어도 현재 탭의 인증 요청은 계속할 수 있습니다.
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? memoryRefreshToken
  } catch {
    return memoryRefreshToken
  }
}

export function getStoredAuthSession() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return memorySession
    const value = parsed as Record<string, unknown>
    if (typeof value.memberId !== 'number' || typeof value.memberName !== 'string' || !['CUSTOMER', 'STAFF'].includes(String(value.role))) return memorySession
    return value as unknown as AuthSession
  } catch {
    return memorySession
  }
}

export function storeAuth(session: AuthSession, accessToken: string, refreshToken: string) {
  memorySession = session
  memoryAccessToken = accessToken
  memoryRefreshToken = refreshToken
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } catch {
    // 저장소를 사용할 수 없으면 현재 탭의 메모리 세션만 유지합니다.
  }
  notifyAuthChange()
}

export function clearStoredAuth() {
  memorySession = null
  memoryAccessToken = null
  memoryRefreshToken = null
  try {
    localStorage.removeItem(AUTH_SESSION_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // 메모리 세션은 이미 지웠습니다.
  }
  notifyAuthChange()
}
