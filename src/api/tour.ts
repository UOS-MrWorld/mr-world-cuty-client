import { apiClient } from './client'
import type { PageResponse, PagingParams } from '../types/api'
import type {
  QuoteRequest,
  QuoteResponse,
  StaffTourDetailResponse,
  StaffTourListParams,
  StaffTourSummaryResponse,
  TourCreateRequest,
  TourDetailResponse,
  TourMutationResponse,
  TourSearchParams,
  TourSummaryResponse,
  TourUpdateRequest,
  VoiceSearchRequest,
  VoiceSearchResponse,
} from '../types/tourApi'

// 고객용
export const getTours = (params?: PagingParams) =>
  apiClient.get<PageResponse<TourSummaryResponse>>('/customer/tours', { params })

export const searchTours = (params: TourSearchParams) =>
  apiClient.get<PageResponse<TourSummaryResponse>>('/customer/tours/search', { params })

export const getTour = (tourId: number) =>
  apiClient.get<TourDetailResponse>(`/customer/tours/${tourId}`)

export const searchToursByVoice = (payload: VoiceSearchRequest) =>
  apiClient.post<VoiceSearchResponse>('/customer/tours/voice-search', payload)

export const getTourQuote = (tourId: number, payload: QuoteRequest) =>
  apiClient.post<QuoteResponse>(`/customer/tours/${tourId}/quote`, payload)

// 직원용
export const getStaffTours = (params?: StaffTourListParams) =>
  apiClient.get<PageResponse<StaffTourSummaryResponse>>('/staff/tours', { params })

export const getStaffTour = (tourId: number) =>
  apiClient.get<StaffTourDetailResponse>(`/staff/tours/${tourId}`)

export const createTour = (payload: TourCreateRequest) =>
  apiClient.post<TourMutationResponse>('/staff/tours', payload)

export const updateTour = (tourId: number, payload: TourUpdateRequest) =>
  apiClient.patch<TourMutationResponse>(`/staff/tours/${tourId}`, payload)
