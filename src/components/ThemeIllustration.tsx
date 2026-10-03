import { useId } from 'react'
import type { ThemeId } from '../types/travel'

const palettes = {
  romance: ['#fff2f8', '#eda6c7', '#b76191'],
  healing: ['#edfff8', '#8fdcc7', '#399b8e'],
  golf: ['#f6ffe5', '#bfdc86', '#789d46'],
  outdoor: ['#eff9ff', '#98c8f5', '#588fcb'],
}

export function ThemeIllustration({
  theme,
}: {
  theme: Exclude<ThemeId, 'all'>
}) {
  const id = useId()
  const [light, middle, dark] = palettes[theme]
  return (
    <svg
      className="theme-illustration"
      viewBox="0 0 160 160"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2=".65" y2="1">
          <stop stopColor={light} />
          <stop offset=".4" stopColor={middle} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-light`} x2="0" y2="1">
          <stop stopColor="white" stopOpacity=".95" />
          <stop offset="1" stopColor="white" stopOpacity=".15" />
        </linearGradient>
        <filter
          id={`${id}-shadow`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="4"
            floodColor={dark}
            floodOpacity=".2"
          />
        </filter>
      </defs>
      <ellipse cx="80" cy="133" rx="40" ry="7" fill={dark} opacity=".09" />
      <g
        filter={`url(#${id}-shadow)`}
        stroke={dark}
        strokeWidth="1.4"
        strokeLinejoin="round"
      >
        {theme === 'romance' && (
          <>
            <path
              d="M80 120C67 109 31 85 31 61c0-28 34-37 49-12 16-25 49-16 49 12 0 24-34 48-49 59Z"
              fill={`url(#${id}-body)`}
            />
            <path
              d="M43 59c2-14 16-19 25-9"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              opacity=".8"
            />
            <path
              d="m115 23 4 10 11 3-11 4-4 10-3-10-10-4 10-3Z"
              fill={`url(#${id}-light)`}
              stroke="white"
            />
          </>
        )}
        {theme === 'healing' && (
          <>
            <path
              d="M78 115C27 115 24 53 49 38c33 10 51 40 29 77Z"
              fill={`url(#${id}-body)`}
            />
            <path
              d="M78 115c-8-45 14-67 51-66 7 38-8 65-51 66Z"
              fill={`url(#${id}-body)`}
            />
            <path
              d="m49 54 29 61 32-46"
              fill="none"
              stroke="white"
              strokeWidth="4"
              opacity=".7"
              strokeLinecap="round"
            />
            <path d="M78 114v15" strokeWidth="5" strokeLinecap="round" />
            <circle cx="110" cy="30" r="9" fill="#fff6ce" stroke="#eddb9e" />
          </>
        )}
        {theme === 'golf' && (
          <>
            <path
              d="M25 104c10-17 34-22 60-12 36-19 62-1 51 21-13 25-92 32-111-9Z"
              fill={`url(#${id}-body)`}
            />
            <ellipse
              cx="80"
              cy="104"
              rx="14"
              ry="5"
              fill={dark}
              opacity=".6"
              stroke="none"
            />
            <path
              d="M80 103V28"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M82 29q23-7 39 5l-12 15q-14-8-27-1Z"
              fill="#e4f6ff"
              stroke="#7aafd5"
            />
            <circle
              cx="112"
              cy="111"
              r="10"
              fill={`url(#${id}-light)`}
              stroke="white"
            />
            <path
              d="m108 108 2 1m5 1 1 1m-6 5 1 0"
              stroke="#a5b4bb"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
        {theme === 'outdoor' && (
          <>
            <path d="m18 117 43-75q5-8 10 0l43 75Z" fill={`url(#${id}-body)`} />
            <path d="m75 118 30-58q5-8 10 0l30 58Z" fill={`url(#${id}-body)`} />
            <path
              d="m48 65 17-28 18 29-14-5-7 9Z"
              fill={`url(#${id}-light)`}
              stroke="white"
            />
            <path d="m98 78 12-23 12 23-12-4Z" fill="#e8f8ff" stroke="white" />
            <circle cx="115" cy="28" r="11" fill="#fff4c9" stroke="#eddeaa" />
            <path
              d="m29 117 35-31 13 15-18 16"
              fill="none"
              stroke="#e4f6ff"
              strokeWidth="3"
            />
          </>
        )}
      </g>
      <circle cx="25" cy="38" r="3" fill={middle} />
      <path
        d="m137 70 0 9m-4-4h8"
        stroke={middle}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
