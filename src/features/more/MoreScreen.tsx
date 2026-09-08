import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ui'
import { IconChevron } from '../../components/Icons'

const ACTIVE: { label: string; sub: string; icon: string; to: string }[] = [
  { label: 'Chat with Buzz', sub: 'Log money or ask, in plain language', icon: '💬', to: '/chat' },
  { label: 'Plan', sub: 'Payday, income & payments due', icon: '📅', to: '/plan' },
  { label: 'Insights', sub: 'Charts, trends & breakdowns', icon: '📊', to: '/insights' },
  { label: 'Rewards', sub: 'Streaks & badges', icon: '🔥', to: '/rewards' },
  { label: 'Debt', sub: 'Track what you owe', icon: '💳', to: '/debt' },
  { label: 'Owed to you', sub: 'IOUs & split bills', icon: '🤝', to: '/owed' },
  { label: 'Notes', sub: 'Quick money notes', icon: '📝', to: '/notes' },
  { label: 'Tools', sub: 'Currency, tax, shopping, warranty', icon: '🛠️', to: '/tools' },
  { label: 'Coach', sub: 'Bite-size financial literacy', icon: '🎓', to: '/coach' },
  { label: 'Settings', sub: 'Currency, theme, backup, data', icon: '⚙️', to: '/settings' },
]

const SOON: { label: string; sub: string; icon: string }[] = []

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
              <IconChevron size={16} />
            </span>
          </button>
        ))}
      </div>

      {SOON.length > 0 && <div className="section-label">Coming soon</div>}
      {SOON.length > 0 && (
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
      )}
    </div>
  )
}
