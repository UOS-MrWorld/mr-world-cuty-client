import { useEffect, useRef, useState } from 'react'
import { MicVAD } from '@ricky0123/vad-web'
import { sendVoiceCommand } from '../api/voice'
import { encodeVoiceWav } from '../data/voiceAudio'
import type { VoiceResponse, VoiceScreenContext } from '../types/voiceApi'
import { Icon } from './Icon'

const BAR_COUNT = 31
const MAX_RECORDING_MS = 15_000
const NO_SPEECH_MS = 8_000
const LOUD_LEVEL = 0.18
type VoiceDisplay = 'waveform' | 'floating'
type VoiceStatus = 'starting' | 'listening' | 'processing' | 'error' | 'unavailable'
type AutoStopState = 'loading' | 'on' | 'off'

interface VoiceIssue {
  message: string
  help: string
}

function describeMicError(error: unknown): VoiceIssue {
  const name = error instanceof DOMException ? error.name : ''
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return { message: '이 주소에서는 마이크를 쓸 수 없어요', help: 'https:// 로 시작하는 주소로 접속해 주세요.' }
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return { message: '마이크 권한이 차단됐어요', help: "주소창 왼쪽 자물쇠 아이콘 → 마이크 '허용'으로 바꾼 뒤 새로고침해 주세요." }
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return { message: '연결된 마이크를 찾지 못했어요', help: '마이크나 이어폰을 연결한 뒤 다시 눌러 주세요.' }
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return { message: '마이크를 다른 곳에서 사용 중이에요', help: '줌, 디스코드 같은 앱이나 다른 탭을 닫고 다시 눌러 주세요.' }
  }
  return { message: '마이크를 켜지 못했어요', help: '새로고침 후 다시 시도해 주세요. 계속되면 다른 환경에서 접속해 주세요.' }
}

function describeAutoStopError(error: unknown): string {
  if (typeof WebAssembly === 'undefined') return '현재 환경에서는 자동 전송을 지원하지 않아요.'
  const detail = error instanceof Error ? error.message : String(error)
  if (/fetch|404|load|network/i.test(detail)) return '자동 전송 파일을 불러오지 못했어요.'
  return '자동 전송을 시작하지 못했어요.'
}

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
  vad: MicVAD | null
  silenceTimer: number
  heardLoud: boolean
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
  const [autoStop, setAutoStop] = useState<AutoStopState>('loading')
  const [hearing, setHearing] = useState(false)
  const [issue, setIssue] = useState<VoiceIssue | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  function stopSession() {
    const session = sessionRef.current
    if (!session) return null
    sessionRef.current = null
    window.clearTimeout(session.timer)
    window.clearTimeout(session.silenceTimer)
    void session.vad?.destroy().catch(() => undefined)
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
    setIssue(null)
    setHelpOpen(false)
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
          vad: null,
          silenceTimer: 0,
          heardLoud: false,
        }
        sessionRef.current = session
        setStatus('listening')
        controlRef.current?.focus()
        void startAutoStop(session)

        const animate = () => {
          analyser.getByteTimeDomainData(samples)
          const stride = Math.max(1, Math.floor(samples.length / BAR_COUNT))
          let energy = 0
          samples.forEach(sample => { energy += ((sample - 128) / 128) ** 2 })
          const level = Math.min(1, Math.sqrt(energy / samples.length) * 6)
          smoothedLevel += (level - smoothedLevel) * 0.26
          if (level > LOUD_LEVEL) session.heardLoud = true
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
      } catch (error) {
        if (cancelled) return
        console.warn('[voice] 마이크 시작 실패:', error)
        setIssue(describeMicError(error))
        setStatus('unavailable')
      }
    }

    function waitForSpeech(session: RecordingSession) {
      session.silenceTimer = window.setTimeout(() => {
        if (sessionRef.current !== session) return
        if (session.heardLoud) {
          void submit()
          return
        }
        stopSession()
        setErrorMessage('말소리가 들리지 않았어요. 다시 눌러 말씀해 주세요.')
        setStatus('error')
      }, NO_SPEECH_MS)
    }

    async function startAutoStop(session: RecordingSession) {
      try {
        if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly unavailable')
        const vad = await MicVAD.new({
          model: 'v5',
          baseAssetPath: '/vad/',
          onnxWASMBasePath: '/vad/',
          processorType: 'ScriptProcessor',
          audioContext: session.context,
          getStream: async () => session.stream,
          pauseStream: async () => undefined,
          resumeStream: async current => current,
          ortConfig: ort => {
            ort.env.logLevel = 'error'
            ort.env.wasm.numThreads = 1
          },
          positiveSpeechThreshold: 0.5,
          negativeSpeechThreshold: 0.35,
          redemptionMs: 800,
          preSpeechPadMs: 300,
          minSpeechMs: 250,
          onSpeechStart: () => {
            window.clearTimeout(session.silenceTimer)
            if (sessionRef.current === session) setHearing(true)
          },
          onVADMisfire: () => {
            if (sessionRef.current === session) setHearing(false)
          },
          onSpeechEnd: () => {
            if (sessionRef.current === session) void submit()
          },
        })
        if (cancelled || sessionRef.current !== session) {
          void vad.destroy().catch(() => undefined)
          return
        }
        session.vad = vad
        setAutoStop('on')
        waitForSpeech(session)
      } catch (error) {
        console.warn('[voice] 자동 전송 비활성화:', error)
        if (cancelled || sessionRef.current !== session) return
        setAutoStop('off')
        setIssue({
          message: '자동 전송이 꺼졌어요. 말씀하신 뒤 눌러 주세요',
          help: `${describeAutoStopError(error)} 버튼을 눌러 보내면 똑같이 동작해요.`,
        })
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
  const listeningMessage = hearing ? '듣고 있어요…'
    : autoStop === 'on' ? '말씀해 주세요. (자동 전송)'
      : autoStop === 'off' ? issue?.message ?? '말씀하신 뒤 눌러 주세요'
        : '말씀해 주세요'
  const message = status === 'starting' ? '마이크 연결 중…'
    : status === 'listening' ? listeningMessage
      : status === 'processing' ? '말씀하신 내용을 확인하고 있어요…'
        : status === 'error' ? errorMessage
          : issue?.message ?? '마이크를 사용할 수 없습니다. 마이크 권한을 확인해 주세요.'
  const showHelp = Boolean(issue) && (status === 'unavailable' || (status === 'listening' && autoStop === 'off' && !hearing))
  const statusClass = `voice-input-status${display === 'floating' ? ' is-floating' : ''} is-${status}${showHelp ? ' has-issue' : ''}`
  const statusRole = status === 'error' || status === 'unavailable' ? 'alert' : 'status'
  const statusContent = showHelp && issue ? <>
    <span className="voice-input-status-line">
      <span className="voice-input-status-text">{message}</span>
      <button className={`voice-input-help-toggle${helpOpen ? ' is-open' : ''}`} type="button" onClick={() => setHelpOpen(open => !open)}
        aria-expanded={helpOpen} aria-label="원인과 해결 방법 보기" title="원인과 해결 방법 보기">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path className="voice-help-rays" d="M8 .2v.9M1.6 6.4h.9M13.5 6.4h.9M3.1 2.1l.6.6M12.9 2.1l-.6.6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          <path className="voice-help-glass" d="M8 2.6a4 4 0 0 0-2.4 7.2c.5.4.7.8.7 1.3v.6h3.4v-.6c0-.5.2-.9.7-1.3A4 4 0 0 0 8 2.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.6 14.3h2.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
    </span>
    {helpOpen && <span className="voice-input-help">{issue.help}</span>}
  </> : message

  if (display === 'floating') {
    return <>
      <button ref={controlRef} className={`voice-input-mic is-${status}`} type="button" onClick={finishOrClose}
        disabled={status === 'starting' || status === 'processing'} aria-label={label} title={label}>
        <span className="voice-input-mic-icon" aria-hidden="true"><Icon name="mic-filled" size={25} /></span>
      </button>
      <span className={statusClass} role={statusRole}>{statusContent}</span>
    </>
  }

  return <>
    <button ref={controlRef} className={`voice-input-wave is-${status}`} type="button" onClick={finishOrClose}
      disabled={status === 'starting' || status === 'processing'} aria-label={label} title={label}>
      {Array.from({ length: BAR_COUNT }, (_, index) => <span key={index} ref={node => { barsRef.current[index] = node }} />)}
    </button>
    <span className={statusClass} role={statusRole}>{statusContent}</span>
  </>
}
