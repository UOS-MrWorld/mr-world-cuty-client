export type GlobeMood = 'honeymoon' | 'family' | 'golf' | 'trekking'

export interface LandingMood {
  id: GlobeMood
  label: string
  title: string
  description: string
  theme: string
  scene: string
  details: string[]
}
