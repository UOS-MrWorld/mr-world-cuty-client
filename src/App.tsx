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
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -8 -8 -8 0 23"
            />
          </filter>
        </defs>
      </svg>
      <ExplorePage />
    </>
  )
}
