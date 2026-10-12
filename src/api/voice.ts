import axios from 'axios'

// 음성 AI 서버(mr-world-cuty-voice)는 BE와 별도 서버라 주소를 따로 둔다.
const voiceClient = axios.create({
  baseURL: import.meta.env.VITE_VOICE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: 20000,
})

/** 지금 화면 정보. AI가 화면에 실제로 있는 상품 중에서만 고르도록 같이 보낸다. */
export interface VoiceScreenContext {
  screen: 'list' | 'detail' | 'configure' | 'checkout' | 'other'
  /** 화면에 보이는 순서대로. "두 번째 거" = tours[1] */
  tours: { tourId: string; tourName: string; location: string; theme: string; price: number }[]
  availableTourLevels: string[]
  drinkOptions: { optionId: number; name: string }[]
  pendingAction: string | null
}

export interface VoiceCommand {
  action: 'search' | 'select' | 'configure' | 'checkout' | 'back' | 'summary' | 'cancel' | 'unknown'
  params: Record<string, unknown>
}

export interface VoiceResponse {
  recognizedText: string
  commands: VoiceCommand[]
  pending: { action?: string; message?: string }
}

export async function sendVoiceCommand(audio: Blob, context: VoiceScreenContext) {
  const form = new FormData()
  form.append('audio', audio, 'speech.wav')
  form.append('context', JSON.stringify(context))
  const { data } = await voiceClient.post<VoiceResponse>('/voice/command', form)
  return data
}

/** 마이크 입력(Float32, 브라우저 기본 샘플레이트) → 서버가 받는 16kHz 모노 16bit WAV */
export function encodeWav16k(chunks: Float32Array[], inputRate: number) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }

  const ratio = inputRate / 16000
  const length = Math.floor(merged.length / ratio)
  const pcm = new Int16Array(length)
  for (let i = 0; i < length; i++) {
    // 구간 평균으로 줄여서 잡음이 섞이지 않게 한다
    const start = Math.floor(i * ratio)
    const end = Math.min(merged.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j++) sum += merged[j]
    const sample = end > start ? sum / (end - start) : 0
    pcm[i] = Math.max(-1, Math.min(1, sample)) * 32767
  }

  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)
  const write = (at: number, text: string) => [...text].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, pcm.length * 2, true)
  new Int16Array(buffer, 44).set(pcm)
  return new Blob([buffer], { type: 'audio/wav' })
}
