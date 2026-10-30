import axios from 'axios'
import { ApiRequestError, normalizeApiError } from '../types/api'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'

// 음성 AI 서버(mr-world-cuty-voice)는 Spring 서버와 별도 주소를 사용한다.
const voiceClient = axios.create({
  baseURL: import.meta.env.VITE_VOICE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

voiceClient.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error)) {
      const data: unknown = error.response?.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const message = (data as Record<string, unknown>).message
        if (typeof message === 'string') {
          const status = error.response?.status ?? 0
          return Promise.reject(new ApiRequestError(message, status, status, error))
        }
      }
    }
    return Promise.reject(normalizeApiError(error))
  },
)

export async function sendVoiceCommand(audio: Blob, context: VoiceScreenContext) {
  const form = new FormData()
  form.append('audio', audio, 'cuty-voice.wav')
  form.append('context', JSON.stringify(context))
  return voiceClient.post<VoiceResponse>('/voice/command', form)
}
