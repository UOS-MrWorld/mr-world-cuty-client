import type { LocalDateTimeString } from './api'
import type { MemberRole } from './auth'

export interface MemberInfoResponse {
  memberId: number
  loginId: string
  name: string
  phoneNum: string
  address: string
  role: MemberRole
  createdAt: LocalDateTimeString
}

export interface MemberUpdateRequest {
  phoneNum?: string
  address?: string
}

export interface MemberUpdateResponse {
  memberId: number
  phoneNum: string
  address: string
}
