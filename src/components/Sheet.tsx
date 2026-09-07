import { useEffect, type ReactNode } from 'react'
import { IconClose } from './Icons'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        {title && (
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <div className="sheet__title">{title}</div>
            <button className="btn btn--sm btn--ghost" onClick={onClose} aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
