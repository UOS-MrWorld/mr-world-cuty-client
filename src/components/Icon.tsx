export type IconName =
  | 'arrow'
  | 'search'
  | 'heart'
  | 'leaf'
  | 'flag'
  | 'mountain'
  | 'sparkles'
  | 'pin'
  | 'close'
  | 'check'
  | 'compass'
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  search: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  leaf: 'M20 3C6 2 2 8 5 15c3 7 16 4 15-12ZM4 21 15 10',
  flag: 'M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  mountain: 'm2 20 8-16 5 9 3-5 5 12H2Zm5-10 3 3 3-3',
  sparkles: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-7-3-2 5-4 1 2-5 4-1Z',
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
      <path d={paths[name]} />
    </svg>
  )
}
