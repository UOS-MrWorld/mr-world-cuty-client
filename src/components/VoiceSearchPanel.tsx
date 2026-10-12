import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { encodeWav16k } from '../api/voice'

const BAR_COUNT = 31
type VoiceDisplay = 'waveform' | 'floating'

/**
 * 마이크 세기를 파형으로 보여주면서 음성을 녹음한다.
 * 마이크 버튼을 다시 누르면 녹음을 끝내고 onRecorded로 넘긴다 (음성 AI 서버로 전송).
 * 녹음은 브라우저 메모리에만 있고 저장하지 않는다.
 */
export function VoiceSearchPanel({ onClose, onRecorded, display = 'waveform' }: {
  onClose: () => void
  onRecorded?: (audio: Blob) => Promise<void>
  display?: VoiceDisplay
}) {
  const controlRef = useRef<HTMLButtonElement>(null)
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const stopListeningRef = useRef<() => void>(() => undefined)
  const closeTimerRef = useRef<number | undefined>(undefined)
  const chunksRef = useRef<Float32Array[]>([])
  const sampleRateRef = useRef(48000)
  const [status, setStatus] = useState<'starting' | 'listening' | 'processing' | 'unavailable'>('starting')
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let stream: MediaStream | undefined
    let context: AudioContext | undefined
    let frame = 0
    let cancelled = false
    let stopped = false
    let smoothedLevel = 0

    controlRef.current?.focus()

    const stopListening = () => {
      if (stopped) return
      stopped = true
      cancelled = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach(track => track.stop())
      if (context && context.state !== 'closed') void context.close()
    }
    stopListeningRef.current = stopListening

    async function listen() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone unavailable')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        context = new AudioContext({ latencyHint: 'interactive' })
        if (context.state === 'suspended') await context.resume()
        if (cancelled) return
        const analyser = context.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.72
        const source = context.createMediaStreamSource(stream)
        source.connect(analyser)
        // 녹음: 소리 데이터를 모아뒀다가 끝날 때 WAV로 만든다. 스피커로는 내보내지 않는다(볼륨 0).
        sampleRateRef.current = context.sampleRate
        chunksRef.current = []
        const recorder = context.createScriptProcessor(4096, 1, 1)
        recorder.onaudioprocess = event => {
          if (!cancelled) chunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)))
        }
        const mute = context.createGain()
        mute.gain.value = 0
        source.connect(recorder)
        recorder.connect(mute).connect(context.destination)
        const samples = new Uint8Array(analyser.fftSize)
        setStatus('listening')

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
              const sample = (samples[index * stride] ?? 128) - 128
              const localLevel = Math.abs(sample) / 128
              const envelope = Math.abs(samples[(index * stride + 7) % samples.length] - 128) / 128
              const idle = 0.08 + Math.abs(Math.sin(performance.now() / 260 + index * 0.7)) * 0.1
              const scale = Math.min(1.15, Math.max(0.1, idle + localLevel * 1.35 + envelope * 0.75))
              bar.style.transform = `scaleY(${scale})`
            })
          }
          frame = requestAnimationFrame(animate)
        }
        animate()
      } catch {
        stream?.getTracks().forEach(track => track.stop())
        stream = undefined
        if (!cancelled) setStatus('unavailable')
      }
    }

    void listen()
    return () => {
      stopListening()
      stopListeningRef.current = () => undefined
    }
  }, [display])

  useEffect(() => () => {
    if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current)
  }, [])

  function close() {
    if (status === 'processing') return
    stopListeningRef.current()
    const chunks = chunksRef.current
    chunksRef.current = []
    if (onRecorded && status === 'listening' && chunks.length > 0) {
      setStatus('processing')
      void onRecorded(encodeWav16k(chunks, sampleRateRef.current)).finally(onClose)
      return
    }
    if (display === 'floating' && status === 'listening' && !closing) {
      setClosing(true)
      closeTimerRef.current = window.setTimeout(onClose, 220)
      return
    }
    onClose()
  }

  if (display === 'floating') {
    return <>
      <button
        ref={controlRef}
        className={`voice-input-mic${status === 'listening' && !closing ? ' is-listening' : ''}${closing ? ' is-closing' : ''}${status === 'unavailable' ? ' is-unavailable' : ''}`}
        type="button"
        onClick={close}
        aria-label="음성 입력 종료"
        title="음성 입력 종료"
      >
        <span className="voice-input-mic-icon" aria-hidden="true"><Icon name="mic-filled" size={25} /></span>
        <span className="sr-only">{status === 'starting' ? '마이크 연결 중' : status === 'listening' ? '음성 입력 중. 다 말했으면 다시 누르세요' : status === 'processing' ? '음성 인식 중' : '마이크를 사용할 수 없음'}</span>
      </button>
      {status === 'processing' && <span className="voice-input-status is-processing" role="status">음성을 인식하고 있어요…</span>}
      {status === 'unavailable' && <span className="sr-only" role="alert">마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.</span>}
    </>
  }

  return <>
    <button
      ref={controlRef}
      className={`voice-input-wave is-${status}`}
      type="button"
      onClick={close}
      aria-label="음성 입력 종료"
      title="음성 입력 종료"
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => <span key={index} ref={node => { barsRef.current[index] = node }} />)}
    </button>
    {status !== 'listening' && (
      <span className={`voice-input-status is-${status}`} role={status === 'unavailable' ? 'alert' : 'status'}>
        {status === 'starting' ? '마이크 연결 중…' : status === 'processing' ? '음성을 인식하고 있어요…' : '마이크 권한을 확인해 주세요'}
      </span>
    )}
  </>
}
