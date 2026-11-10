import type { ApiLoyaltyGrade, LocalDateTimeString, PagingParams } from './api'

export interface CustomerListParams extends PagingParams {
  keyword?: string
  loyaltyGrade?: ApiLoyaltyGrade
  discountApplied?: boolean
}

export interface CustomerSummaryResponse {
  customerId: number
  name: string
  phoneNum: string
  completedTourCount: number
  loyaltyGrade: ApiLoyaltyGrade
  loyaltyDiscountApplied: boolean
}

export interface LoyaltyPolicyResponse {
  policies: Array<{
    grade: ApiLoyaltyGrade
    requiredTourCount: number
    discountRate: number
  }>
}

export interface DiscountResponse {
  targetCount: number
  appliedCount: number
  skippedCount: number
}

export interface LoyaltyGradeBatchUpdateRequest {
  changes: Array<{ customerId: number; loyaltyGrade: ApiLoyaltyGrade }>
}

export interface LoyaltyGradeBatchUpdateResponse {
  updatedCount: number
  customers: CustomerSummaryResponse[]
}

export interface InventoryListParams extends PagingParams {
  keyword?: string
}

export interface InventoryResponse {
  itemId: number
  itemName: string
  quantity: number
  requiredQuantity: number
  createdAt: LocalDateTimeString
  updatedAt: LocalDateTimeString
}

export interface InventoryRegisterRequest {
  itemName: string
  quantity: number
}

export interface InventoryUpdateRequest {
  itemName?: string
  quantity?: number
}
