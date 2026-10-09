import type { ThemeId, Tour } from '../types/travel'
import { tours } from './travel'

export const themeLabels: Record<ThemeId, string> = {
  all: '전체 여행', romance: '허니문', healing: '효도여행', golf: '골프여행', outdoor: '트레킹',
}
export const regions = [
  { id: 'all', label: '전체 지역' },
  { id: 'asia', label: '일본·동남아' },
  { id: 'europe', label: '유럽' },
  { id: 'domestic', label: '국내·제주' },
] as const

export function getRegion(tour: Tour) {
  return tour.id === 'swiss' ? 'europe' : tour.id === 'golf' ? 'domestic' : 'asia'
}
export function getTourDays(tour: Tour) {
  return Number(tour.duration.match(/(\d+)일/)?.[1] ?? 0)
}
export function getProductCode(tour: Tour) {
  return `CT-${tour.id.toUpperCase()}`
}

// 검색 필터와 정렬이 동일한 상품 목록을 반환합니다.
export function getVisibleTours(params: URLSearchParams, cartIds: string[] = []) {
  const theme = params.get('theme') ?? 'all'
  const region = params.get('region') ?? 'all'
  const budget = Number(params.get('budget'))
  const duration = params.get('duration')
  const query = params.get('q')?.trim().toLowerCase() ?? ''
  const sort = params.get('sort')
  return tours.filter(tour =>
    (theme === 'all' || !Object.hasOwn(themeLabels, theme) || tour.theme === theme) &&
    (region === 'all' || !regions.some(item => item.id === region) || getRegion(tour) === region) &&
    (!Number.isFinite(budget) || budget <= 0 || tour.price <= budget) &&
    (!duration || !['short', 'medium', 'long'].includes(duration) || (duration === 'short' ? getTourDays(tour) <= 4 : duration === 'medium' ? getTourDays(tour) >= 5 && getTourDays(tour) <= 7 : getTourDays(tour) >= 8)) &&
    `${tour.title} ${tour.location} ${tour.description} ${themeLabels[tour.theme]}`.toLowerCase().includes(query) &&
    (!['saved', 'cart'].includes(params.get('view') ?? '') || cartIds.includes(tour.id)),
  ).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'duration' ? getTourDays(a) - getTourDays(b) : 0)
}
