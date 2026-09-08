import { useLocation, useNavigate } from 'react-router-dom'
import { Bee } from './Mascot'
import { IconChat } from './Icons'

/** Floating "chat with Buzz" launcher, pinned bottom-right above the tab bar
 *  on every screen (hidden while already in the chat). */
export default function ChatFab() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  if (pathname === '/chat') return null
  return (
    <div className="fab-wrap">
      <button className="fab" aria-label="Chat with Buzz" onClick={() => nav('/chat')}>
        <Bee size={40} />
        <span className="fab__badge" aria-hidden="true">
          <IconChat size={13} />
        </span>
      </button>
    </div>
  )
}
