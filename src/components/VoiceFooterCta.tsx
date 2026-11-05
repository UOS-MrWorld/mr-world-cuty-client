import type { Ref } from 'react'
import { Icon } from './Icon'

type VoiceFooterCtaProps = {
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

export function VoiceFooterCta({ onClick, buttonRef }: VoiceFooterCtaProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="voice-neon-cta is-floating"
      onClick={onClick}
      aria-label="음성으로 여행 찾기"
      title="음성으로 여행 찾기"
    >
      <span className="voice-neon-icon" aria-hidden="true">
        <Icon name="mic-filled" size={22} />
      </span>
    </button>
  )
}
