import type { StaffProduct } from '../types/staff'

export type StaffFormErrors = Record<string, string>

export function validateStaffProduct(value: StaffProduct): StaffFormErrors {
  const errors: StaffFormErrors = {}
  if (!value.title.trim()) errors.title = '고객에게 표시할 상품명을 입력해 주세요.'
  if (!value.location.trim()) errors.location = '여행지를 입력해 주세요.'
  if (!value.duration.trim()) errors.duration = '여행 기간을 입력해 주세요. 예: 3박 4일'
  if (!Number.isSafeInteger(value.price) || value.price < 1) errors.price = '기본 가격은 1원 이상의 정수로 입력해 주세요.'
  if (!Number.isSafeInteger(value.maximumPeople) || value.maximumPeople < 1) errors.maximumPeople = '상품 정원은 1명 이상의 정수로 입력해 주세요.'
  if (value.theme === 'romance' && (value.maximumPeople < 2 || value.maximumPeople > 10 || value.maximumPeople % 2 !== 0)) errors.maximumPeople = '허니문 신청 가능 인원은 커플 단위로 2~10명 중 짝수로 입력해 주세요.'
  if ((value.theme === 'romance' || value.theme === 'healing') && value.minimumGrade === 'classic') errors.minimumGrade = '허니문·효도 테마는 그랜드 이상만 선택할 수 있습니다.'
  if (value.minimumDeparturePeople !== '' && (!Number.isSafeInteger(Number(value.minimumDeparturePeople)) || Number(value.minimumDeparturePeople) < 1)) errors.minimumDeparturePeople = '출발 기준 인원은 1명 이상의 정수로 입력해 주세요. 고객 시연의 최소 출발 기준은 허니문 4명, 다른 테마 3명입니다.'
  const dates = value.departureDates.split(/\n|,/).map(date => date.trim()).filter(Boolean)
  if (dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) errors.departureDates = '날짜는 YYYY-MM-DD 형식으로 한 줄에 하나씩 입력해 주세요.'
  value.grades.forEach(grade => {
    if (!Number.isSafeInteger(grade.price) || grade.price < 1) errors[`grade-${grade.id}`] = '등급 가격은 1원 이상의 정수로 입력해 주세요.'
    if (grade.id === 'premium' && !grade.champagneIncluded) errors[`grade-${grade.id}`] = '프리미엄 등급은 샴페인이 기본 포함됩니다.'
    if (value.theme === 'romance' && grade.transport !== 'private') errors[`grade-${grade.id}`] = '허니문은 커플별 2인 전용 고급차량을 기본 제공합니다.'
  })
  Object.entries(value.options).forEach(([id, rule]) => {
    if (!Number.isSafeInteger(rule.adjustment)) errors[`option-${id}`] = '차액은 원 단위 정수로 입력해 주세요. 차감은 음수로 입력합니다.'
    if (!rule.enabled && !rule.reason.trim()) errors[`reason-${id}`] = '선택할 수 없는 이유를 입력해 주세요.'
  })
  return errors
}

export function validateInventoryQuantity(raw: string, current: number, mode: 'incoming' | 'replace') {
  const amount = Number(raw)
  if (raw.trim() === '' || !Number.isSafeInteger(amount) || amount < 0) return null
  const result = (mode === 'incoming' ? current : 0) + amount
  return Number.isSafeInteger(result) && result >= 0 ? result : null
}

export function validateStaffContact(raw: string) {
  const value = raw.trim()
  if (!value) return true
  const digits = value.replace(/\D/g, '').length
  return /^[+\d\s()-]+$/.test(value) && digits >= 8 && digits <= 15
}
