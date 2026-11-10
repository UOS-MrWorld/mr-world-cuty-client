import { apiClient } from './client'
import type { ApiLoyaltyGrade, PageResponse } from '../types/api'
import type {
  CustomerListParams,
  CustomerDetailResponse,
  CustomerSummaryResponse,
  DiscountResponse,
  LoyaltyGradeBatchUpdateRequest,
  LoyaltyGradeBatchUpdateResponse,
  LoyaltyPolicyResponse,
} from '../types/staffApi'

export const getCustomers = (params?: CustomerListParams) =>
  apiClient.get<PageResponse<CustomerSummaryResponse>>('/staff/customers', { params })

export const getCustomerDetail = (customerId: number) =>
  apiClient.get<CustomerDetailResponse>(`/staff/customers/${customerId}`)

export const getLoyaltyPolicy = () =>
  apiClient.get<LoyaltyPolicyResponse>('/staff/loyalty-policy')

export const activateLoyaltyDiscountByGrade = (loyaltyGrade: ApiLoyaltyGrade) =>
  apiClient.patch<DiscountResponse>('/staff/customers/loyalty-discount/by-grade', { loyaltyGrade })

export const updateCustomerLoyaltyGrades = (payload: LoyaltyGradeBatchUpdateRequest) =>
  apiClient.patch<LoyaltyGradeBatchUpdateResponse>('/staff/customers/loyalty-grades', payload)
