import { useSyncExternalStore } from 'react'

const routeEvent = 'cuty:navigate'
const routeTransitionEvent = 'cuty:route-transition'
const mainPages = new Set(['/', '/tours', '/my-trips'])
let navigationTimer: ReturnType<typeof setTimeout> | undefined
let settleTimer: ReturnType<typeof setTimeout> | undefined
let routeTransitioning = false

function setRouteTransitioning(next: boolean) {
  if (routeTransitioning === next) return
  routeTransitioning = next
  window.dispatchEvent(new Event(routeTransitionEvent))
}

function clearTransition() {
  clearTimeout(navigationTimer)
  clearTimeout(settleTimer)
  delete document.documentElement.dataset.routeTransition
  delete document.documentElement.dataset.routeMotion
  setRouteTransitioning(false)
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

function subscribeTransition(onChange: () => void) {
  window.addEventListener(routeTransitionEvent, onChange)
  return () => window.removeEventListener(routeTransitionEvent, onChange)
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
  const motion = window.location.pathname === '/' ? 'zoom-in' : url.pathname === '/' ? 'zoom-out' : 'fade'
  const commit = () => {
    window.history.pushState(null, '', next)
    window.dispatchEvent(new Event(routeEvent))
    if (animate) {
      document.documentElement.dataset.routeTransition = 'entering'
      settleTimer = setTimeout(clearTransition, motion === 'zoom-in' || motion === 'zoom-out' ? 440 : 240)
    }
  }
  if (animate) {
    setRouteTransitioning(true)
    document.documentElement.dataset.routeMotion = motion
    if (motion === 'zoom-in') commit()
    else {
      document.documentElement.dataset.routeTransition = 'leaving'
      navigationTimer = setTimeout(commit, 160)
    }
  } else commit()
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search)
}

export function useRouteTransitioning() {
  return useSyncExternalStore(subscribeTransition, () => routeTransitioning)
}
