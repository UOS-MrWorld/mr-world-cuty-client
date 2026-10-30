import { apiClient } from './client'
import type { ApiLoyaltyGrade, PageResponse } from '../types/api'
import type {
  CustomerDetailResponse,
  CustomerListParams,
  CustomerSummaryResponse,
  DiscountResponse,
  LoyaltyPolicyResponse,
} from '../types/staffApi'

export const getCustomers = (params?: CustomerListParams) =>
  apiClient.get<PageResponse<CustomerSummaryResponse>>('/staff/customers', { params })

export const getCustomer = (customerId: number) =>
  apiClient.get<CustomerDetailResponse>(`/staff/customers/${customerId}`)

export const getLoyaltyPolicy = () =>
  apiClient.get<LoyaltyPolicyResponse>('/staff/loyalty-policy')

export const activateLoyaltyDiscountByGrade = (loyaltyGrade: ApiLoyaltyGrade) =>
  apiClient.patch<DiscountResponse>('/staff/customers/loyalty-discount/by-grade', { loyaltyGrade })
