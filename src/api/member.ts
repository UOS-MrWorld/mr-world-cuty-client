import { apiClient } from './client'
import type { MemberInfoResponse, MemberUpdateRequest, MemberUpdateResponse } from '../types/memberApi'

export const getMyInfo = () => apiClient.get<MemberInfoResponse>('/members/me')

export const updateMyInfo = (payload: MemberUpdateRequest) =>
  apiClient.patch<MemberUpdateResponse>('/members/me', payload)
