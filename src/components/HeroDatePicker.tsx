import { useEffect, useId, useMemo, useRef, useState } from 'react'

interface Props {
  label: string
  name: string
  min: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const weekdays = ['월', '화', '수', '목', '금', '토', '일']
const pad = (value: number) => String(value).padStart(2, '0')
const toValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function HeroDatePicker({ label, name, min, value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => monthStart(value ? parseDate(value) : parseDate(min)))
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const minDate = useMemo(() => parseDate(min), [min])

  const dates = useMemo(() => {
    const first = monthStart(view)
    const mondayOffset = (first.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index - mondayOffset + 1))
  }, [view])

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const readable = value
    ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(parseDate(value))
    : '날짜 선택'

  return <div className={`hero-field hero-date-picker ${className}`} ref={root} data-selected={Boolean(value)}>
    <span id={labelId}>{label}</span>
    <input type="hidden" name={name} value={value} />
    <button ref={trigger} type="button" className="hero-field-trigger" aria-labelledby={labelId} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{readable}</span><span aria-hidden="true" className="hero-field-calendar">◫</span>
    </button>
    {open && <div className="hero-field-popover hero-calendar" role="dialog" aria-modal="false" aria-label="출발 희망일">
      <div className="hero-calendar-head">
        <button type="button" aria-label="이전 달" onClick={() => setView(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>‹</button>
        <strong>{view.getFullYear()}년 {view.getMonth() + 1}월</strong>
        <button type="button" aria-label="다음 달" onClick={() => setView(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="hero-calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
      <div className="hero-calendar-grid">
        {dates.map(date => {
          const dateValue = toValue(date)
          const outside = date.getMonth() !== view.getMonth()
          const disabled = date < minDate
          return <button
            type="button"
            key={dateValue}
            className={outside ? 'is-outside' : ''}
            disabled={disabled}
            aria-pressed={dateValue === value}
            aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
            onClick={() => { onChange(dateValue); setOpen(false); trigger.current?.focus() }}
          >{date.getDate()}</button>
        })}
      </div>
    </div>}
  </div>
}
