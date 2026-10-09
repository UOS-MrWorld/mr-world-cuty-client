import { useEffect, useRef, useState } from 'react'
const BAR_COUNT = 31

/** Captures microphone amplitude only; speech is never recognized, transcribed, or stored. */
export function VoiceSearchPanel({ onClose }: { onClose: () => void }) {
  const waveformRef = useRef<HTMLButtonElement>(null)
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const [status, setStatus] = useState<'starting' | 'listening' | 'unavailable'>('starting')

  useEffect(() => {
    let stream: MediaStream | undefined
    let context: AudioContext | undefined
    let frame = 0
    let cancelled = false

    async function listen() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone unavailable')
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        context = new AudioContext()
        const analyser = context.createAnalyser()
        analyser.fftSize = 128
        context.createMediaStreamSource(stream).connect(analyser)
        const samples = new Uint8Array(analyser.fftSize)
        setStatus('listening')

        const animate = () => {
          analyser.getByteTimeDomainData(samples)
          const stride = Math.max(1, Math.floor(samples.length / BAR_COUNT))
          let energy = 0
          samples.forEach(sample => { energy += ((sample - 128) / 128) ** 2 })
          const level = Math.min(1, Math.sqrt(energy / samples.length) * 4.2)
          waveformRef.current?.style.setProperty('--voice-glow', `${7 + level * 30}px`)
          waveformRef.current?.style.setProperty('--voice-glow-soft', `${12 + level * 28}px`)
          waveformRef.current?.style.setProperty('--voice-opacity', `${0.34 + level * 0.66}`)
          barsRef.current.forEach((bar, index) => {
            if (!bar) return
            const sample = (samples[index * stride] ?? 128) - 128
            const localLevel = Math.abs(sample) / 128
            const envelope = Math.abs(samples[(index * stride + 7) % samples.length] - 128) / 128
            const idle = 0.08 + Math.abs(Math.sin(performance.now() / 260 + index * 0.7)) * 0.1
            const scale = Math.min(1.15, Math.max(0.1, idle + localLevel * 1.35 + envelope * 0.75))
            bar.style.transform = `scaleY(${scale})`
          })
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
      cancelled = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach(track => track.stop())
      if (context && context.state !== 'closed') void context.close()
    }
  }, [])

  return <>
    <button
      ref={waveformRef}
      className={`voice-input-wave${status === 'listening' ? ' is-listening' : ''}`}
      type="button"
      onClick={onClose}
      aria-label="음성 입력 종료"
      title="음성 입력 종료"
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => <span key={index} ref={node => { barsRef.current[index] = node }} />)}
    </button>
    {status === 'unavailable' && <span className="sr-only" role="alert">마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.</span>}
  </>
}
