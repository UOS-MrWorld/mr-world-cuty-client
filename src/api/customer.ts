import { apiClient } from './client'
import type { ApiLoyaltyGrade, PageResponse } from '../types/api'
import type {
  CustomerListParams,
  CustomerSummaryResponse,
  DiscountResponse,
  LoyaltyGradeBatchUpdateRequest,
  LoyaltyGradeBatchUpdateResponse,
  LoyaltyPolicyResponse,
} from '../types/staffApi'

export const getCustomers = (params?: CustomerListParams) =>
  apiClient.get<PageResponse<CustomerSummaryResponse>>('/staff/customers', { params })

export const getLoyaltyPolicy = () =>
  apiClient.get<LoyaltyPolicyResponse>('/staff/loyalty-policy')

export const activateLoyaltyDiscountByGrade = (loyaltyGrade: ApiLoyaltyGrade) =>
  apiClient.patch<DiscountResponse>('/staff/customers/loyalty-discount/by-grade', { loyaltyGrade })

export const updateCustomerLoyaltyGrades = (payload: LoyaltyGradeBatchUpdateRequest) =>
  apiClient.patch<LoyaltyGradeBatchUpdateResponse>('/staff/customers/loyalty-grades', payload)
