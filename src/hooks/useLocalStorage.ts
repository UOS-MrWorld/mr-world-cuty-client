import { useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
      return validate(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  })
  const [storageError, setStorageError] = useState(false)
  function save(next: T) {
    setValue(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
      setStorageError(false)
      return true
    } catch {
      setStorageError(true)
      return false
    }
  }
  return [value, save, storageError] as const
}
