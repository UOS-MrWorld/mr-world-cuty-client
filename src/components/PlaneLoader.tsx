import { useReducedMotion } from '../hooks/useReducedMotion'

export function PlaneLoader({ label = '여행을 찾고 있어요' }: { label?: string }) {
  const reduced = useReducedMotion()
  return <div className={`plane-loader${reduced ? ' is-still' : ''}`} role="status"><div className="plane-loader-sky"><span className="loader-cloud cloud-one"/><span className="loader-cloud cloud-two"/><svg className="loader-airplane" viewBox="0 0 80 60" aria-hidden="true"><path d="M9 30L33 23L42 7Q44 3 49 4L48 19L64 14Q73 11 76 17Q78 23 69 27L48 35L37 54Q34 58 29 56L32 39L14 43L4 36Z" fill="currentColor"/><path d="M57 20L66 17" stroke="#e7f6ff" strokeWidth="3" strokeLinecap="round"/></svg><span className="plane-flight-line"/></div><p>{label}</p><small>조건에 맞는 여행을 준비하고 있습니다.</small></div>
}
