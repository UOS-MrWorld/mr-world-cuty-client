import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type {
  CustomerListParams,
  CustomerSummaryResponse,
  LoyaltyGradeBatchUpdateRequest,
  LoyaltyGradeBatchUpdateResponse,
  LoyaltyPolicyResponse,
} from '../types/staffApi'

export const getCustomers = (params?: CustomerListParams) =>
  apiClient.get<PageResponse<CustomerSummaryResponse>>('/staff/customers', { params })

export const getLoyaltyPolicy = () =>
  apiClient.get<LoyaltyPolicyResponse>('/staff/loyalty-policy')

export const updateCustomerLoyaltyGrades = (payload: LoyaltyGradeBatchUpdateRequest) =>
  apiClient.patch<LoyaltyGradeBatchUpdateResponse>('/staff/customers/loyalty-grades', payload)
