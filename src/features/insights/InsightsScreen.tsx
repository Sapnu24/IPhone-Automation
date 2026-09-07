import { ScreenHeader } from '../../components/ui'

export default function InsightsScreen() {
  return (
    <div className="screen">
      <ScreenHeader title="Insights" subtitle="See where your money goes." />
      <div className="card card--pad" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>Charts are coming next</div>
        <div className="dim" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
          Spending by category, month-over-month trends, and budget progress at a glance — arriving
          in the next update.
        </div>
      </div>
    </div>
  )
}
