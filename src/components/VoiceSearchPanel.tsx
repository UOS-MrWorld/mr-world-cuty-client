import { useEffect, useRef, useState } from 'react'
import { sendVoiceCommand } from '../api/voice'
import { encodeVoiceWav } from '../data/voiceAudio'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'
import { Icon } from './Icon'

const BAR_COUNT = 31
const MAX_RECORDING_MS = 15_000
type VoiceDisplay = 'waveform' | 'floating'
type VoiceStatus = 'starting' | 'listening' | 'processing' | 'error' | 'unavailable'

interface RecordingSession {
  stream: MediaStream
  context: AudioContext
  source: MediaStreamAudioSourceNode
  analyser: AnalyserNode
  processor: ScriptProcessorNode
  silentOutput: GainNode
  chunks: Float32Array[]
  frame: number
  timer: number
}

export function VoiceSearchPanel({ context, onResponse, onClose, display = 'waveform' }: {
  context: VoiceScreenContext
  onResponse: (response: VoiceResponse) => void
  onClose: () => void
  display?: VoiceDisplay
}) {
  const controlRef = useRef<HTMLButtonElement>(null)
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const sessionRef = useRef<RecordingSession | null>(null)
  const mountedRef = useRef(true)
  const submittingRef = useRef(false)
  const [status, setStatus] = useState<VoiceStatus>('starting')
  const [errorMessage, setErrorMessage] = useState('')

  function stopSession() {
    const session = sessionRef.current
    if (!session) return null
    sessionRef.current = null
    window.clearTimeout(session.timer)
    cancelAnimationFrame(session.frame)
    session.processor.onaudioprocess = null
    session.stream.getTracks().forEach(track => track.stop())
    session.source.disconnect()
    session.processor.disconnect()
    session.silentOutput.disconnect()
    session.analyser.disconnect()
    if (session.context.state !== 'closed') void session.context.close()
    return session
  }

  async function submit() {
    if (submittingRef.current) return
    const session = stopSession()
    if (!session) return
    submittingRef.current = true
    setStatus('processing')
    setErrorMessage('')
    try {
      const audio = encodeVoiceWav(session.chunks, session.context.sampleRate)
      const response = await sendVoiceCommand(audio, context)
      if (!mountedRef.current) return
      onResponse(response.data)
      onClose()
    } catch (error) {
      if (!mountedRef.current) return
      setErrorMessage(error instanceof Error ? error.message : '음성을 처리하지 못했습니다. 다시 시도해 주세요.')
      setStatus('error')
    } finally {
      submittingRef.current = false
    }
  }

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    let smoothedLevel = 0

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone unavailable')
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        })
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        const audioContext = new AudioContext({ latencyHint: 'interactive' })
        if (audioContext.state === 'suspended') await audioContext.resume()
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          void audioContext.close()
          return
        }
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        const silentOutput = audioContext.createGain()
        const chunks: Float32Array[] = []
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.72
        silentOutput.gain.value = 0
        source.connect(analyser)
        source.connect(processor)
        processor.connect(silentOutput)
        silentOutput.connect(audioContext.destination)
        processor.onaudioprocess = event => chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
        const samples = new Uint8Array(analyser.fftSize)
        const session: RecordingSession = {
          stream,
          context: audioContext,
          source,
          analyser,
          processor,
          silentOutput,
          chunks,
          frame: 0,
          timer: window.setTimeout(() => void submit(), MAX_RECORDING_MS),
        }
        sessionRef.current = session
        setStatus('listening')
        controlRef.current?.focus()

        const animate = () => {
          analyser.getByteTimeDomainData(samples)
          const stride = Math.max(1, Math.floor(samples.length / BAR_COUNT))
          let energy = 0
          samples.forEach(sample => { energy += ((sample - 128) / 128) ** 2 })
          const level = Math.min(1, Math.sqrt(energy / samples.length) * 6)
          smoothedLevel += (level - smoothedLevel) * 0.26
          controlRef.current?.style.setProperty('--voice-glow', `${7 + smoothedLevel * 30}px`)
          controlRef.current?.style.setProperty('--voice-glow-soft', `${12 + smoothedLevel * 28}px`)
          controlRef.current?.style.setProperty('--voice-opacity', `${0.34 + smoothedLevel * 0.66}`)
          controlRef.current?.style.setProperty('--voice-neon-scale', `${0.82 + smoothedLevel * 0.72}`)
          controlRef.current?.style.setProperty('--voice-neon-opacity', `${0.38 + smoothedLevel * 0.58}`)
          controlRef.current?.style.setProperty('--voice-neon-core-opacity', `${0.48 + smoothedLevel * 0.5}`)
          controlRef.current?.style.setProperty('--voice-neon-blur', `${8.5 + smoothedLevel * 7}px`)
          if (display === 'waveform') {
            barsRef.current.forEach((bar, index) => {
              if (!bar) return
              const localLevel = Math.abs((samples[index * stride] ?? 128) - 128) / 128
              const envelope = Math.abs(samples[(index * stride + 7) % samples.length] - 128) / 128
              const idle = 0.08 + Math.abs(Math.sin(performance.now() / 260 + index * 0.7)) * 0.1
              bar.style.transform = `scaleY(${Math.min(1.15, Math.max(0.1, idle + localLevel * 1.35 + envelope * 0.75))})`
            })
          }
          session.frame = requestAnimationFrame(animate)
        }
        animate()
      } catch {
        if (!cancelled) setStatus('unavailable')
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      stopSession()
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    void start()
    return () => {
      cancelled = true
      mountedRef.current = false
      stopSession()
      window.removeEventListener('keydown', onKeyDown)
    }
  // Recording starts once when the control opens. Updated context is used on the next opening.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display])

  const finishOrClose = () => status === 'listening' ? void submit() : onClose()
  const label = status === 'listening' ? '음성 입력 완료하고 분석하기' : '음성 입력 닫기'
  const message = status === 'starting' ? '마이크 연결 중…'
    : status === 'listening' ? '말씀하신 뒤 눌러 주세요'
      : status === 'processing' ? '말씀하신 내용을 확인하고 있어요…'
        : status === 'error' ? errorMessage
          : '마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.'

  if (display === 'floating') {
    return <>
      <button ref={controlRef} className={`voice-input-mic is-${status}`} type="button" onClick={finishOrClose}
        disabled={status === 'starting' || status === 'processing'} aria-label={label} title={label}>
        <span className="voice-input-mic-icon" aria-hidden="true"><Icon name="mic-filled" size={25} /></span>
      </button>
      <span className={`voice-input-status is-floating is-${status}`} role={status === 'error' || status === 'unavailable' ? 'alert' : 'status'}>{message}</span>
    </>
  }

  return <>
    <button ref={controlRef} className={`voice-input-wave is-${status}`} type="button" onClick={finishOrClose}
      disabled={status === 'starting' || status === 'processing'} aria-label={label} title={label}>
      {Array.from({ length: BAR_COUNT }, (_, index) => <span key={index} ref={node => { barsRef.current[index] = node }} />)}
    </button>
    <span className={`voice-input-status is-${status}`} role={status === 'error' || status === 'unavailable' ? 'alert' : 'status'}>{message}</span>
  </>
}
