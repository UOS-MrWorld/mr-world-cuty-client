/** The supplied C icon and rounded `uty` form a single CUTY wordmark. */
export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`brand-lockup${large ? ' brand-lockup-large' : ''}`}
      role="img"
      aria-label="CUTY"
    >
      <span className="brand-c" aria-hidden="true">
        <img src="/brand/cuty-icon.png" alt="" width="1254" height="1254" />
      </span>
      <span className="brand-uty" aria-hidden="true">
        uty
      </span>
    </span>
  )
}
