import ChatPanel from './ChatPanel'

// Full-page chat (direct /chat link). The floating Buzz button opens the same
// panel as a popup; this route keeps deep links working.
export default function ChatScreen() {
  return (
    <div className="chat-page">
      <ChatPanel />
    </div>
  )
}
