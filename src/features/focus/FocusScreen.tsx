import { ScreenHeader } from '../../components/ui'

export default function FocusScreen() {
  return (
    <div className="screen">
      <ScreenHeader title="Focus" subtitle="Work in calm, focused blocks." />
      <div className="card card--pad" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🍅</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>Pomodoro is coming next</div>
        <div className="dim" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
          A focus timer for work and study, a session log, and a place to track your own screen-time
          habits — arriving in the next update.
        </div>
      </div>
    </div>
  )
}
