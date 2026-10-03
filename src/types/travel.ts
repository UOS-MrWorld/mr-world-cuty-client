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
  grade: string
  hotel: string
  transport: string
  meal: string
}
