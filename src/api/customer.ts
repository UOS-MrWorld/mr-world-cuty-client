import { apiClient } from './client'

export const getCustomers = (params?: unknown) => apiClient.get('/staff/customers', { params })

export const getCustomer = (customerId: string) => apiClient.get(`/staff/customers/${customerId}`)

export const updateCustomerLoyalty = (customerId: string, payload: unknown) =>
  apiClient.patch(`/staff/customers/${customerId}/loyalty`, payload)

export const getLoyaltyPolicy = () => apiClient.get('/staff/loyalty-policy')

export const updateLoyaltyPolicy = (payload: unknown) => apiClient.patch('/staff/loyalty-policy', payload)
