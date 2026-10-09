import type { HotelGrade, Tour, TravelGrade, TravelMeal, TravelTransport } from './travel'

// 직원 화면 검토용 모델입니다. 서버 DTO·가격·운영 정책으로 사용하지 않습니다.
export interface StaffGradeConfiguration {
  id: TravelGrade
  price: number
  hotel: HotelGrade
  transport: TravelTransport
  meal: TravelMeal
  champagneIncluded: boolean
}

export interface StaffOptionRule {
  enabled: boolean
  adjustment: number
  unit: 'person' | 'booking'
  reason: string
}

export type StaffOptionId = 'hotel' | 'transport' | 'meal' | 'champagne' | 'coffee'
export type StaffProductState = 'draft' | 'preview' | 'paused'

export interface StaffProduct extends Tour {
  state: StaffProductState
  departureDates: string
  maximumPeople: number
  minimumDeparturePeople: string
  minimumGrade: TravelGrade
  grades: StaffGradeConfiguration[]
  options: Record<StaffOptionId, StaffOptionRule>
  supplies: string
  limitations: string
}

export interface StaffInventoryItem {
  id: number
  name: string
  kind: string
  theme: Tour['theme']
  quantity: number
}

export interface StaffCustomerHistory {
  product: string
  date: string
  grade: string
  price: number
  state: string
}

export interface StaffCustomer {
  id: number
  name: string
  address: string
  contact: string
  history: StaffCustomerHistory[]
}

export interface StaffFeedback {
  kind: 'success' | 'error'
  message: string
}
