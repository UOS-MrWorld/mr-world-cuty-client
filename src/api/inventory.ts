import { apiClient } from './client'
import type { PageResponse } from '../types/api'
import type {
  InventoryListParams,
  InventoryRegisterRequest,
  InventoryResponse,
  InventoryUpdateRequest,
} from '../types/staffApi'

export const getInventories = (params?: InventoryListParams) =>
  apiClient.get<PageResponse<InventoryResponse>>('/staff/inventory', { params })

export const createInventory = (payload: InventoryRegisterRequest) =>
  apiClient.post<InventoryResponse>('/staff/inventory', payload)

export const updateInventory = (itemId: number, payload: InventoryUpdateRequest) =>
  apiClient.patch<InventoryResponse>(`/staff/inventory/${itemId}`, payload)
