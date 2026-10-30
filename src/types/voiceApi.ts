import type { ApiTourLevel } from './api'

export type VoiceAction =
  | 'search'
  | 'select'
  | 'configure'
  | 'next'
  | 'checkout'
  | 'back'
  | 'summary'
  | 'cancel'
  | 'unknown'

export interface VoiceTourContext {
  tourId: string | number
  tourName: string
  theme: string
  price: number
}

export interface VoiceDrinkContext {
  optionId: number
  name: string
}

export interface VoiceScreenContext {
  screen: string
  tours: VoiceTourContext[]
  availableTourLevels: ApiTourLevel[]
  drinkOptions: VoiceDrinkContext[]
  pendingAction: string | null
}

export interface VoiceCommand {
  action: VoiceAction
  params: Record<string, unknown>
}

export interface VoiceResponse {
  recognizedText: string
  commands: VoiceCommand[]
  pending: {
    action?: string
    message?: string
  }
}
