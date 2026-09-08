import { useApp } from '../../store'
import { ScreenHeader } from '../../components/ui'
import {
  ACHIEVEMENTS,
  STREAK_TIERS,
  activityDays,
  currentStreak,
  longestStreak,
  nextTier,
  type Stats,
} from '../../lib/streak'

export default function RewardsScreen() {
  const app = useApp()
  const days = activityDays(app.transactions, app.focusSessions, app.usageLogs)
  const current = currentStreak(days)
  const longest = longestStreak(days)
  const stats: Stats = {
    current,
    longest,
    txns: app.transactions.length,
    budgets: app.budgets.length,
    focus: app.focusSessions.filter((s) => s.completed).length,
    settled: app.ledgers.filter((l) => l.amount > 0 && l.settledAmount >= l.amount).length,
  }

  const tiers = STREAK_TIERS.map((t) => ({ ...t, hint: `${t.days}-day streak`, earned: longest >= t.days }))
  const achs = ACHIEVEMENTS.map((a) => ({ ...a, earned: a.earned(stats) }))
  const badges = [...tiers, ...achs]
  const earnedCount = badges.filter((b) => b.earned).length
  const next = nextTier(current)

  const buzzLine =
    current === 0
      ? 'Log anything today to start a streak — Buzz is ready! 🐝'
      : current < 3
        ? 'Nice start — keep the flame alive! 🔥'
        : current < 7
          ? "You're on a roll. Consistency is the whole game."
          : 'Incredible discipline — Buzz is proud of you! 🏆'

  return (
    <div className="screen">
      <ScreenHeader title="Rewards" subtitle="Stay consistent, earn badges" />

      {/* Streak hero */}
      <div className="card card--pad hero-honey" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 54, lineHeight: 1 }}>🔥</div>
        <div className="big-number" style={{ fontSize: 44, marginTop: 4 }}>
          {current}
        </div>
        <div style={{ fontWeight: 800, opacity: 0.95 }}>day streak!</div>
        <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6 }}>Longest: {longest} days</div>
      </div>

      <div className="card card--pad" style={{ marginTop: 14 }}>
        <div className="dim" style={{ fontSize: 14 }}>
          {buzzLine}
        </div>
      </div>

      {/* Next badge */}
      {next ? (
        <>
          <div className="section-label">Next badge</div>
          <div className="card card--pad">
            <div className="row row--between">
              <div className="row" style={{ gap: 10 }}>
                <div className="avatar hex" style={{ background: 'var(--accent-soft)' }}>
                  {next.tier.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{next.tier.label}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {current}/{next.tier.days} days · {next.remaining} to go
                  </div>
                </div>
              </div>
            </div>
            <div className="progress" style={{ marginTop: 12 }}>
              <div className="progress__fill" style={{ width: Math.min(100, next.progress * 100) + '%' }} />
            </div>
          </div>
        </>
      ) : (
        <div className="card card--pad" style={{ marginTop: 14, fontWeight: 700 }}>
          🏆 You've earned every streak badge. Legend.
        </div>
      )}

      {/* Badge collection */}
      <div className="row row--between" style={{ margin: '20px 4px 8px' }}>
        <span className="section-label" style={{ margin: 0 }}>
          Badges
        </span>
        <span className="dim" style={{ fontSize: 13 }}>
          {earnedCount} of {badges.length}
        </span>
      </div>
      <div className="card card--pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {badges.map((b) => (
            <div key={b.id} style={{ textAlign: 'center', opacity: b.earned ? 1 : 0.4 }}>
              <div
                className="hex"
                style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 30,
                  background: b.earned ? 'var(--accent-soft)' : 'var(--surface-3)',
                  filter: b.earned ? 'none' : 'grayscale(1)',
                }}
              >
                {b.earned ? b.emoji : '🔒'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, marginTop: 6 }}>{b.label}</div>
              <div className="muted" style={{ fontSize: 10.5 }}>
                {b.hint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
