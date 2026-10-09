import type { Tour, TravelDraft } from './travel'

export type DemoRole = 'customer' | 'staff'
export type DemoPaymentMethod = 'card' | 'kakao' | 'toss'

export interface DemoPerson {
  name: string
  address: string
  contact: string
}

export interface DemoProfile extends DemoPerson {
  account: string
}

export interface DemoSession {
  role: DemoRole
  profile: DemoProfile
}

export interface DemoBooking {
  id: string
  tourId: string
  title: string
  location: string
  duration: string
  image: string
  draft: TravelDraft
  amount: number
  applicant: DemoPerson
  companions: DemoPerson[]
  paymentMethod: DemoPaymentMethod
  paidAt: string
  status: 'paid' | 'cancelled'
  cancelledAt?: string
}

export interface DemoBookingInput {
  tour: Tour
  draft: TravelDraft
  applicant: DemoPerson
  companions: DemoPerson[]
  paymentMethod: DemoPaymentMethod
}
