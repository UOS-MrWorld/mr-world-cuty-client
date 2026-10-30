export type MemberRole = 'CUSTOMER' | 'STAFF'

export interface LoginRequest {
  loginId: string
  password: string
}

export interface SignupRequest extends LoginRequest {
  name: string
  confirmPassword: string
  phoneNum: string
  address: string
  role: MemberRole
}

export interface LoginResponse {
  memberId: number
  memberName: string
  role: MemberRole
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
}

export interface SignupResponse {
  memberId: number
  name: string
  loginId: string
  phoneNum: string
  address: string
  role: MemberRole
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface TokenResponse {
  accessToken: string
}

export interface AuthSession {
  memberId: number
  memberName: string
  role: MemberRole
}
