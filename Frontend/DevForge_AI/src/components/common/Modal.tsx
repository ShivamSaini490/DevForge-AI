import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
export default function Modal({ open, onClose, title, children, dismissible = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; dismissible?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [open])
  return <dialog ref={ref} className="modal" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (dismissible) onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      if (dismissible && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose()
    } }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2><Button variant="ghost" aria-label="Close dialog" disabled={!dismissible} onClick={onClose}><X size={20} /></Button></div>
    {children}
  </dialog>
}
