import { useEffect } from 'react'
import ChatPanel from './ChatPanel'

/** Floating chat window — slides up over the current screen (chatbot style)
 *  instead of navigating away. Backdrop tap or Esc closes it. */
export default function ChatPopup({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="chat-pop-backdrop" onClick={onClose}>
      <div
        className="chat-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Chat with Buzz"
        onClick={(e) => e.stopPropagation()}
      >
        <ChatPanel onClose={onClose} />
      </div>
    </div>
  )
}
