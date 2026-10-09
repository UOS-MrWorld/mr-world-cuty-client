import { getToday } from './configuration'
import type { DemoBooking } from '../types/demo'
import type { Tour } from '../types/travel'

export const paymentMethodLabels = { card: '카드', kakao: '카카오페이', toss: '토스페이' }
export const demoContactPattern = '[0-9]{2,3}(-| )?[0-9]{3,4}(-| )?[0-9]{4}'

export function getRecruitmentDeadline(departureDate: string) {
  const date = new Date(`${departureDate}T12:00:00`)
  if (!Number.isFinite(date.getTime())) return ''
  date.setDate(date.getDate() - 7)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 화면 시연을 위한 상태 계산. 실제 출발 확정은 서버가 결정해야 합니다. */
export function getDepartureState(tour: Tour, departureDate: string, bookings: DemoBooking[], today = getToday()) {
  const participants = bookings
    .filter(booking => booking.tourId === tour.id && booking.draft.date === departureDate && booking.status === 'paid')
    .reduce((sum, booking) => sum + booking.draft.travelers, 0)
  const minimum = tour.theme === 'romance' ? 4 : 3
  const deadline = getRecruitmentDeadline(departureDate)
  const closed = Boolean(deadline) && today >= deadline
  const enough = participants >= minimum
  return {
    participants,
    minimum,
    deadline,
    closed,
    enough,
    label: closed ? (enough ? '출발 확정' : '여행 취소') : (enough ? '조건 충족 · 모집 중' : '출발 대기 · 모집 중'),
    explanation: closed
      ? enough ? '모집 마감일에 결제 인원 기준을 충족했습니다.' : '모집 마감일에 최소 결제 인원이 충족되지 않았습니다.'
      : enough ? '최소 인원을 충족했으며 출발 7일 전 모집 마감일에 최종 확정됩니다.' : '같은 상품·같은 출발일의 결제 완료 인원을 합산합니다. 옵션이 달라도 함께 집계합니다.',
  }
}
