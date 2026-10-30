import { tours } from './travel'
import type { ApiTheme } from '../types/api'
import type { TourDetailResponse, TourSummaryResponse } from '../types/tourApi'
import type { ThemeId, Tour } from '../types/travel'

const localThemeByApiTheme: Record<ApiTheme, Exclude<ThemeId, 'all'>> = {
  HONEYMOON: 'romance',
  HEALING: 'healing',
  GOLF: 'golf',
  TREKKING: 'outdoor',
}

export const apiThemeByLocalTheme: Record<Exclude<ThemeId, 'all'>, ApiTheme> = {
  romance: 'HONEYMOON',
  healing: 'HEALING',
  golf: 'GOLF',
  outdoor: 'TREKKING',
}

const fallbackByTheme = Object.fromEntries(
  tours.map(tour => [tour.theme, { image: tour.image, imageAlt: `${tour.theme} 테마 기본 이미지` }]),
) as Record<Exclude<ThemeId, 'all'>, Pick<Tour, 'image' | 'imageAlt'>>

function tripDuration(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime()
  const end = new Date(`${endDate}T00:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return `${startDate} ~ ${endDate}`
  const days = Math.floor((end - start) / 86_400_000) + 1
  return days === 1 ? '당일 여행' : `${days - 1}박 ${days}일`
}

export function toDisplayTour(response: TourSummaryResponse | TourDetailResponse): Tour {
  const theme = localThemeByApiTheme[response.theme]
  const fallback = fallbackByTheme[theme]
  return {
    id: String(response.tourId),
    source: 'api',
    theme,
    title: response.tourName,
    location: '여행지 정보 미제공',
    description: '여행지와 상세 포함 사항은 상품 상세에서 확인해 주세요.',
    duration: tripDuration(response.startDate, response.endDate),
    price: response.basePrice,
    image: fallback.image,
    imageAlt: fallback.imageAlt,
    tag: response.theme,
    startDate: response.startDate,
    endDate: response.endDate,
    ...('description' in response && response.description ? { description: response.description } : {}),
  }
}
