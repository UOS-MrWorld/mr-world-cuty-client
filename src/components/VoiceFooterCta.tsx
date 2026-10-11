import type { Ref } from 'react'
import { Icon } from './Icon'

type VoiceFooterCtaProps = {
  compact?: boolean
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

export function VoiceFooterCta({ compact = false, onClick, buttonRef }: VoiceFooterCtaProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`voice-neon-cta${compact ? ' is-compact' : ' is-floating'}`}
      onClick={onClick}
      aria-label="음성으로 여행 찾기"
      title="음성으로 여행 찾기"
    >
      <span className="voice-neon-icon" aria-hidden="true">
        <Icon name="mic-filled" size={compact ? 19 : 22} />
      </span>
      {compact && <span className="voice-neon-copy"><strong>음성으로 당신의 여행을 큐레이팅하세요</strong></span>}
    </button>
  )
}
