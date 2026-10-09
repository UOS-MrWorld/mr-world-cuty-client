import type { AnchorHTMLAttributes } from 'react'
import { navigate } from '../hooks/useRoute'

export function AppLink({ onClick, href = '/', children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} href={href} onClick={(event) => {
      onClick?.(event)
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download != null) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin || url.hash) return
      event.preventDefault()
      navigate(href)
    }}>
      {children}
    </a>
  )
}
