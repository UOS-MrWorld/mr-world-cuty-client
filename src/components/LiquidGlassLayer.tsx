import { useEffect, useRef } from 'react'

export function LiquidGlassLayer() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)')

    if (reducedTransparency.matches || !('WebGLRenderingContext' in window)) {
      host.current?.setAttribute('data-glass-state', 'native')
      return
    }

    host.current?.setAttribute('data-glass-state', 'loading')
    void import('../vendor/liquid-glass/container.js').then(({ default: Container }) => {
      if (cancelled || !host.current) return
      const glass = new Container({ borderRadius: 22, type: 'rounded', tintOpacity: .05 })
      glass.element.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:22px;overflow:hidden'
      glass.canvas.style.zIndex = '0'
      host.current.appendChild(glass.element)
      host.current.setAttribute('data-glass-state', 'ready')

      let visible = true
      const resizeObserver = new ResizeObserver(() => {
        if (!visible) return
        glass.updateSizeFromDOM()
        glass.render?.()
      })
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? false
        host.current?.toggleAttribute('data-glass-visible', visible)
        if (visible) glass.render?.()
      }, { threshold: .01 })
      resizeObserver.observe(host.current)
      visibilityObserver.observe(host.current)
      dispose = () => {
        resizeObserver.disconnect()
        visibilityObserver.disconnect()
        glass.destroy()
      }
    }).catch(() => {
      host.current?.setAttribute('data-glass-state', 'native')
    })
    return () => { cancelled = true; dispose?.() }
  }, [])
  return <div className="liquid-glass-optics" ref={host} aria-hidden="true" data-glass-source="dashersw/liquid-glass-js" />
}
