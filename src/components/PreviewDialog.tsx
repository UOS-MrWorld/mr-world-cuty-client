import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export function PreviewDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const element = dialog.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    element.showModal()
    return () => { if (element.open) element.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return <dialog className="preview-dialog" ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose() } }}><div className="dialog-title"><h2 id={titleId}>{title}</h2><button type="button" aria-label="닫기" onClick={onClose}><Icon name="close" size={22} /></button></div>{children}</dialog>
}
