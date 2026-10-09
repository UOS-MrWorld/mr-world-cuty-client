export type IconName =
  | 'arrow'
  | 'search'
  | 'heart'
  | 'cart'
  | 'leaf'
  | 'flag'
  | 'mountain'
  | 'sparkles'
  | 'pin'
  | 'close'
  | 'check'
  | 'compass'
  | 'mic'
  | 'mic-filled'
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  search: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  cart: 'M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6m5 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  leaf: 'M20 3C6 2 2 8 5 15c3 7 16 4 15-12ZM4 21 15 10',
  flag: 'M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  mountain: 'm2 20 8-16 5 9 3-5 5 12H2Zm5-10 3 3 3-3',
  sparkles: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-7-3-2 5-4 1 2-5 4-1Z',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1M12 18v4m-3 0h6',
  'mic-filled': 'M12 2a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z',
}
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'mic-filled' ? <>
        <path d={paths[name]} fill="currentColor" stroke="none" />
        <path d="M5 11v2a7 7 0 0 0 14 0v-2m-7 9v2m-4 0h8" fill="none" stroke="currentColor" strokeWidth="2" />
      </> : <path d={paths[name]} />}
    </svg>
  )
}
