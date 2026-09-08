import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ui'
import { IconChart, IconChevron, IconGear } from '../../components/Icons'

const ACTIVE: { label: string; sub: string; icon: string; to: string }[] = [
  { label: 'Insights', sub: 'Charts, trends & breakdowns', icon: '📊', to: '/insights' },
  { label: 'Settings', sub: 'Currency, theme, backup, data', icon: '⚙️', to: '/settings' },
]

const SOON = [
  { label: 'Plan', sub: 'Payday, subscriptions & salary schedule', icon: '📅' },
  { label: 'Debt', sub: 'Track what you owe', icon: '💳' },
  { label: 'Owed to you', sub: 'IOUs & split bills', icon: '🤝' },
  { label: 'Notes', sub: 'Quick money notes', icon: '📝' },
  { label: 'Tools', sub: 'Currency, tax, shopping list…', icon: '🛠️' },
  { label: 'Coach', sub: 'Bite-size financial literacy', icon: '🎓' },
]

export default function MoreScreen() {
  const nav = useNavigate()
  return (
    <div className="screen">
      <ScreenHeader title="More" />

      <div className="card list">
        {ACTIVE.map((it) => (
          <button key={it.to} className="list__row" onClick={() => nav(it.to)}>
            <div className="avatar hex" style={{ background: 'var(--primary-soft)', fontSize: 18 }}>
              {it.icon}
            </div>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{it.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {it.sub}
              </div>
            </div>
            <span className="muted">
              {it.label === 'Insights' ? <IconChart size={18} /> : <IconGear size={18} />}
              <IconChevron size={16} />
            </span>
          </button>
        ))}
      </div>

      <div className="section-label">Coming soon</div>
      <div className="card list">
        {SOON.map((it) => (
          <div key={it.label} className="list__row" style={{ opacity: 0.7 }}>
            <div className="avatar hex" style={{ background: 'var(--surface-3)', fontSize: 18 }}>
              {it.icon}
            </div>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{it.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {it.sub}
              </div>
            </div>
            <span className="pill" style={{ background: 'var(--accent-soft)', color: 'var(--warning)', border: 'none' }}>
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
