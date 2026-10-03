import ExplorePage from './pages/ExplorePage'

export default function App() {
  return (
    <>
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        className="brand-filter-definitions"
      >
        <defs>
          <filter id="cuty-white-key" colorInterpolationFilters="sRGB">
            {/* Key only near-white pixels at render time; keep the source PNG intact. */}
            <feColorMatrix
              result="keyed"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -8 -8 -8 0 23"
            />
            <feComposite in="keyed" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>
      <ExplorePage />
    </>
  )
}
