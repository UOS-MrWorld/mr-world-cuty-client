const ACCESS_TOKEN_KEY = 'accessToken'
let memoryAccessToken: string | null = null

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

export function clearAccessToken() {
  memoryAccessToken = null
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // 이미 메모리 토큰을 지웠으므로 별도 처리가 필요하지 않습니다.
  }
}
