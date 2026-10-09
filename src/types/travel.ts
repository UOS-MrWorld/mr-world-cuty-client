export type ThemeId = 'all' | 'romance' | 'healing' | 'golf' | 'outdoor'

export interface Tour {
  id: string
  theme: Exclude<ThemeId, 'all'>
  title: string
  location: string
  description: string
  duration: string
  price: number
  image: string
  imageAlt: string
  tag: string
}

export interface TravelDraft {
  tourId: string
  grade: TravelGrade
  hotel: HotelGrade
  transport: TravelTransport
  meal: TravelMeal
  date: string
  travelers: number
  champagne: boolean
  coffee: boolean
}

export type TravelGrade = 'classic' | 'grand' | 'premium'
export type HotelGrade = '3' | '4' | '5'
export type TravelTransport = 'private' | 'van'
export type TravelMeal = 'lunch' | 'local' | 'steak'
