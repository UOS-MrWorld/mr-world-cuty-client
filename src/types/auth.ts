export type MemberRole = 'CUSTOMER' | 'STAFF'

export interface LoginRequest {
  account: string
  password: string
}

export interface SignupRequest extends LoginRequest {
  name: string
  address: string
  contact: string
}

// 성공 응답 필드명은 백엔드 계약 확인 후 추가합니다.
