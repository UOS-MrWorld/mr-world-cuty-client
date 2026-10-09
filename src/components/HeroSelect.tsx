import { useEffect, useId, useRef, useState } from 'react'

export interface HeroSelectOption {
  value: string
  label: string
}

interface Props {
  label: string
  name: string
  value: string
  options: HeroSelectOption[]
  onChange: (value: string) => void
  className?: string
}

export function HeroSelect({ label, name, value, options, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const selected = options.find(option => option.value === value) ?? options[0]

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

  return <div className={`hero-field hero-glass-select ${className}`} ref={root} data-selected={value !== 'all'}>
    <span id={labelId}>{label}</span>
    <input type="hidden" name={name} value={value} />
    <button
      ref={trigger}
      type="button"
      className="hero-field-trigger"
      aria-labelledby={labelId}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen(current => !current)}
    >
      <span>{selected?.label}</span><span aria-hidden="true" className="hero-field-chevron">⌄</span>
    </button>
    {open && <div className="hero-field-popover hero-select-options" role="listbox" aria-labelledby={labelId}>
      {options.map(option => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        key={option.value}
        onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus() }}
      >{option.label}</button>)}
    </div>}
  </div>
}
