import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { getEstimate, getToday, isOpenTravelDate, normalizeDraft } from '../data/configuration'
import { demoContactPattern, getRecruitmentDeadline } from '../data/demoBookings'
import type { DemoBooking, DemoBookingInput, DemoProfile, DemoRole, DemoSession } from '../types/demo'

interface DemoSessionContextValue {
  session: DemoSession | null
  bookings: DemoBooking[]
  historyOpen: boolean
  enterDemo: (role: DemoRole) => void
  exitDemo: () => void
  updateProfile: (profile: DemoProfile) => void
  createDemoBooking: (input: DemoBookingInput) => DemoBooking
  cancelDemoBooking: (id: string) => boolean
  closeHistory: () => void
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const sequence = useRef(0)

  function enterDemo(role: DemoRole) {
    if (session && session.role !== role) setBookings([])
    setSession(current => current?.role === role ? current : {
      role,
      profile: { account: role === 'customer' ? 'cuty-demo' : 'cuty-staff-demo', name: role === 'customer' ? '시연 고객' : '시연 직원', address: '', contact: '010-0000-0000' },
    })
    setHistoryOpen(role === 'customer')
  }

  function exitDemo() {
    setSession(null)
    setHistoryOpen(false)
    // 개인정보를 다음 시연 사용자에게 넘기지 않습니다.
    setBookings([])
  }

  function createDemoBooking(input: DemoBookingInput) {
    if (session?.role !== 'customer') throw new Error('고객 시연 모드에서만 결제 시연을 진행할 수 있습니다.')
    const draft = normalizeDraft(input.tour, input.draft)
    if (!isOpenTravelDate(draft.date)) throw new Error('모집 마감 전인 유효한 출발일을 선택해 주세요.')
    const validContact = new RegExp(`^${demoContactPattern}$`)
    if (input.companions.length !== draft.travelers - 1 || [input.applicant, ...input.companions].some(person => !person.name.trim() || !person.address.trim() || !validContact.test(person.contact))) {
      throw new Error('신청자와 모든 동행자의 성명·주소·연락처를 확인해 주세요.')
    }
    const booking: DemoBooking = {
      id: `DEMO-${Date.now().toString(36).toUpperCase()}-${++sequence.current}`,
      tourId: input.tour.id,
      title: input.tour.title,
      location: input.tour.location,
      duration: input.tour.duration,
      image: input.tour.image,
      draft: { ...draft },
      amount: getEstimate(input.tour, draft).total,
      applicant: { ...input.applicant },
      companions: input.companions.map(person => ({ ...person })),
      paymentMethod: input.paymentMethod,
      paidAt: new Date().toISOString(),
      status: 'paid',
    }
    setBookings(previous => [booking, ...previous])
    return booking
  }

  function cancelDemoBooking(id: string) {
    if (session?.role !== 'customer') return false
    const booking = bookings.find(item => item.id === id)
    if (!booking || booking.status !== 'paid' || getToday() >= getRecruitmentDeadline(booking.draft.date)) return false
    setBookings(previous => previous.map(item => item.id === id ? { ...item, status: 'cancelled', cancelledAt: new Date().toISOString() } : item))
    return true
  }

  return <DemoSessionContext.Provider value={{
    session,
    bookings,
    historyOpen,
    enterDemo,
    exitDemo,
    updateProfile: profile => setSession(current => current ? { ...current, profile: { ...profile } } : null),
    createDemoBooking,
    cancelDemoBooking,
    closeHistory: () => setHistoryOpen(false),
  }}>{children}</DemoSessionContext.Provider>
}

export function useDemoSession() {
  const value = useContext(DemoSessionContext)
  if (!value) throw new Error('DemoSessionProvider가 필요합니다.')
  return value
}
