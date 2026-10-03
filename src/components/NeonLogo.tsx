/** Standalone brand illustration; the navigation keeps the full wordmark. */
export function NeonLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`neon-logo${compact ? ' neon-logo-compact' : ''}`}>
      <span className="neon-aura" aria-hidden="true" />
      <span className="neon-ring neon-ring-one" aria-hidden="true" />
      <span className="neon-ring neon-ring-two" aria-hidden="true" />
      <img
        src="/brand/cuty-icon.png"
        alt="구름과 비행기를 품은 CUTY C 로고"
        width="1254"
        height="1254"
        loading={compact ? 'lazy' : 'eager'}
      />
      <span className="neon-star star-left" aria-hidden="true">
        ✦
      </span>
      <span className="neon-star star-right" aria-hidden="true">
        ✧
      </span>
    </div>
  )
}
