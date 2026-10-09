import { useSyncExternalStore } from 'react'

const routeEvent = 'cuty:navigate'
const mainPages = new Set(['/', '/tours', '/my-trips'])
let navigationTimer: ReturnType<typeof setTimeout> | undefined
let settleTimer: ReturnType<typeof setTimeout> | undefined

function clearTransition() {
  clearTimeout(navigationTimer)
  clearTimeout(settleTimer)
  delete document.documentElement.dataset.routeTransition
}

// History navigation must cancel a pending click so it cannot overwrite Back.
window.addEventListener('popstate', clearTransition)

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(routeEvent, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(routeEvent, onChange)
  }
}

export function navigate(to: string) {
  const url = new URL(to, window.location.origin)
  if (url.origin !== window.location.origin) return
  const next = `${url.pathname}${url.search}${url.hash}`
  clearTransition()
  if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
  const animate = mainPages.has(window.location.pathname) && mainPages.has(url.pathname)
    && window.location.pathname !== url.pathname
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const commit = () => {
    window.history.pushState(null, '', next)
    window.dispatchEvent(new Event(routeEvent))
    if (animate) {
      document.documentElement.dataset.routeTransition = 'entering'
      settleTimer = setTimeout(clearTransition, 700)
    }
  }
  if (animate) {
    document.documentElement.dataset.routeTransition = 'leaving'
    navigationTimer = setTimeout(commit, 280)
  } else commit()
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search)
}
