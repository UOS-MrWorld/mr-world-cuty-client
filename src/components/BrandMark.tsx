/** Display the complete transparent wordmark without cropping or aspect-ratio distortion. */
export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`brand-lockup${large ? ' brand-lockup-large' : ''}`}
      role="img"
      aria-label="CUTY"
    >
      <img src="/brand/cuty-wordmark-transparent.png" alt="" width="1678" height="937" aria-hidden="true" />
    </span>
  )
}
