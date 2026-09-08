import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bee } from './Mascot'
import { IconChat } from './Icons'
import ChatPopup from '../features/chat/ChatPopup'

/** Floating "chat with Buzz" launcher, pinned bottom-right above the tab bar
 *  on every screen. Opens the chat as a popup overlay (not a navigation), and
 *  hides on the full-page /chat route. */
export default function ChatFab() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  if (pathname === '/chat') return null
  return (
    <>
      <div className="fab-wrap">
        <button className="fab" aria-label="Chat with Buzz" onClick={() => setOpen(true)}>
          <Bee size={40} />
          <span className="fab__badge" aria-hidden="true">
            <IconChat size={13} />
          </span>
        </button>
      </div>
      {open && <ChatPopup onClose={() => setOpen(false)} />}
    </>
  )
}
