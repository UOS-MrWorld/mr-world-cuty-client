import { apiClient } from './client'

export const getInventories = (params?: unknown) => apiClient.get('/staff/inventory', { params })

export const createInventory = (payload: unknown) => apiClient.post('/staff/inventory', payload)

export const updateInventory = (inventoryId: string, payload: unknown) =>
  apiClient.patch(`/staff/inventory/${inventoryId}`, payload)

export const deleteInventory = (inventoryId: string) =>
  apiClient.delete(`/staff/inventory/${inventoryId}`)
