import { themeBenefits } from './configuration'
import { tours } from './travel'
import type { Tour } from '../types/travel'
import type { StaffCustomer, StaffInventoryItem, StaffOptionId, StaffProduct } from '../types/staff'

export const staffOptionLabels: Record<StaffOptionId, string> = {
  hotel: '호텔 변경',
  transport: '교통 변경',
  meal: '식사 변경',
  champagne: '샴페인 추가',
  coffee: '커피 추가',
}

export const staffStateLabels = { draft: '초안', preview: '판매 화면 예시', paused: '운영 중지 예시' }

export function createStaffProduct(tour: Tour): StaffProduct {
  const restricted = tour.theme === 'romance' || tour.theme === 'healing'
  const startingAdjustment = restricted ? 200000 : 0
  return {
    ...tour,
    state: 'draft',
    departureDates: '',
    maximumPeople: 10,
    minimumDeparturePeople: tour.theme === 'romance' ? '4' : '3',
    minimumGrade: restricted ? 'grand' : 'classic',
    grades: [
      { id: 'classic', price: tour.price - startingAdjustment, hotel: '3', meal: 'lunch', transport: tour.theme === 'romance' ? 'private' : 'van', champagneIncluded: false },
      { id: 'grand', price: tour.price + 200000 - startingAdjustment, hotel: '4', meal: 'local', transport: tour.theme === 'romance' ? 'private' : 'van', champagneIncluded: false },
      { id: 'premium', price: tour.price + 600000 - startingAdjustment, hotel: '5', meal: 'steak', transport: tour.theme === 'romance' ? 'private' : 'van', champagneIncluded: true },
    ],
    options: {
      hotel: { enabled: true, adjustment: 0, unit: 'person', reason: '선택 등급의 호텔을 기준으로 차액 계산' },
      transport: { enabled: tour.theme !== 'romance', adjustment: 0, unit: 'person', reason: tour.theme === 'romance' ? '허니문은 커플별 2인 전용 차량 고정' : '차량 좌석 수에 맞는 구성만 허용' },
      meal: { enabled: true, adjustment: 0, unit: 'person', reason: '선택 등급의 기본 식사를 기준으로 차액 계산' },
      champagne: { enabled: true, adjustment: 50000, unit: 'person', reason: '등급에 기본 포함된 경우 추가 과금 없음' },
      coffee: { enabled: true, adjustment: 10000, unit: 'person', reason: '' },
    },
    supplies: themeBenefits[tour.theme].join('\n'),
    limitations: tour.theme === 'romance' ? '2명씩 커플 단위로 2~10명 신청합니다. 커플마다 2인 전용 차량을 제공합니다. 그랜드 이상을 선택하며 최소 2커플(4명)의 결제 완료 인원이 모여야 출발합니다.' : tour.theme === 'healing' ? '그랜드 이상 선택합니다.' : '',
  }
}

export const staffProducts: StaffProduct[] = tours.map(createStaffProduct)
export const staffInventory: StaffInventoryItem[] = [
  { id: 1, name: '커플 기념티', kind: '의류', theme: 'romance', quantity: 24 },
  { id: 2, name: '인삼 기념품', kind: '기념품', theme: 'healing', quantity: 32 },
  { id: 3, name: '골프공', kind: '운동 용품', theme: 'golf', quantity: 120 },
  { id: 4, name: '기념품 스카프', kind: '의류', theme: 'outdoor', quantity: 40 },
]
export const staffCustomers: StaffCustomer[] = [
  {
    id: 1, name: '화면 예시 고객 01', address: '', contact: '',
    history: [{ product: '교토 효도여행 3박 4일', date: '2026-04-15', grade: '그랜드', price: 1290000, state: '여행 완료 예시' }],
  },
  { id: 2, name: '화면 예시 고객 02', address: '', contact: '', history: [] },
]
