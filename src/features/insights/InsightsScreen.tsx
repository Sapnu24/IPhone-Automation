import { useApp } from '../../store'
import { ScreenHeader } from '../../components/ui'
import { EmptyState } from '../../components/ui'
import {
  categorySpend,
  currentMonthKey,
  monthTotals,
} from '../../lib/money'
import {
  formatMoney,
  formatMoneyShort,
  formatMonthLabel,
  toISODate,
} from '../../lib/format'
import { cashflowForecast, netWorthTrend } from '../../lib/stats'
import type { Category } from '../../types'

export default function InsightsScreen() {
  const app = useApp()
  const { currency, locale } = app.settings
  const now = new Date()
  const month = currentMonthKey(now)
  const totals = monthTotals(app.transactions, month)

  return (
    <div className="screen">
      <ScreenHeader title="Insights" subtitle={formatMonthLabel(month, locale)} />

      {/* Stat tiles */}
      <div className="row" style={{ gap: 12 }}>
        <StatTile label="Income" value={formatMoneyShort(totals.income, currency, locale)} tone="income" />
        <StatTile label="Spent" value={formatMoneyShort(totals.expense, currency, locale)} tone="expense" />
        <StatTile
          label="Net"
          value={
            (totals.net >= 0 ? '+' : '−') + formatMoneyShort(Math.abs(totals.net), currency, locale)
          }
          tone={totals.net >= 0 ? 'income' : 'expense'}
        />
      </div>

      <div className="section-label">Net worth trend</div>
      <NetWorthTrend />

      <div className="section-label">Cashflow forecast · next 30 days</div>
      <CashflowForecastCard />

      <div className="section-label">Where your money went</div>
      <CategoryBars />

      <div className="section-label">Income statement · {formatMonthLabel(month, locale)}</div>
      <IncomeStatement />

      <div className="section-label">6-month spending</div>
      <MonthlyTrend />

      <div className="section-label">Focus — last 7 days</div>
      <FocusWeek />
    </div>
  )
}

function NetWorthTrend() {
  const app = useApp()
  const { currency, locale } = app.settings
  const data = netWorthTrend(6, app.accounts, app.transactions, app.transfers, currency, locale)
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)))
  const hasAny = data.some((d) => d.value !== 0)
  if (!hasAny) return <EmptyState emoji="📈" title="Net worth appears as you add accounts & activity" />
  const H = 130
  return (
    <div className="card card--pad">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, alignItems: 'end', gap: 10, height: H }}>
        {data.map((d) => (
          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div className="tabular muted" style={{ fontSize: 10, marginBottom: 4 }}>
              {formatMoneyShort(d.value, currency, locale)}
            </div>
            <div
              style={{
                width: '72%',
                height: Math.max(4, (Math.abs(d.value) / max) * (H - 26)),
                background: d.value < 0 ? 'var(--danger)' : 'var(--primary)',
                borderRadius: '6px 6px 3px 3px',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 10, marginTop: 6 }}>
        {data.map((d) => (
          <div key={d.key} className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
            {d.label}
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        Foreign balances converted with approximate rates.
      </div>
    </div>
  )
}

function CashflowForecastCard() {
  const app = useApp()
  const { currency, locale } = app.settings
  const f = cashflowForecast(app.incomePlans, app.bills, app.occurrences, 30)
  const money = (n: number) => formatMoney(n, currency, locale)
  return (
    <div className="card card--pad stack">
      <div className="row row--between">
        <span className="dim">Expected in</span>
        <span className="tabular" style={{ fontWeight: 700, color: 'var(--success)' }}>+{money(f.inflow)}</span>
      </div>
      <div className="row row--between">
        <span className="dim">Expected out</span>
        <span className="tabular" style={{ fontWeight: 700, color: 'var(--danger)' }}>−{money(f.outflow)}</span>
      </div>
      <div className="row row--between" style={{ fontSize: 18 }}>
        <span style={{ fontWeight: 800 }}>Projected net</span>
        <span className="tabular" style={{ fontWeight: 800, color: f.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {f.net >= 0 ? '+' : '−'}
          {money(Math.abs(f.net))}
        </span>
      </div>
    </div>
  )
}

function IncomeStatement() {
  const app = useApp()
  const { currency, locale } = app.settings
  const month = currentMonthKey()
  const totals = monthTotals(app.transactions, month)
  const spend = categorySpend(app.transactions, month)
  const top = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const money = (n: number) => formatMoney(n, currency, locale)
  return (
    <div className="card card--pad stack">
      <div className="row row--between">
        <span style={{ fontWeight: 700, color: 'var(--success)' }}>Revenue</span>
        <span className="tabular" style={{ fontWeight: 700 }}>{money(totals.income)}</span>
      </div>
      <div className="row row--between">
        <span style={{ fontWeight: 700 }}>Expenses</span>
        <span className="tabular" style={{ fontWeight: 700 }}>{money(totals.expense)}</span>
      </div>
      {top.map(([id, v]) => (
        <div key={id} className="row row--between" style={{ paddingLeft: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {app.categoryById(id)?.icon} {app.categoryById(id)?.name ?? 'Other'}
          </span>
          <span className="tabular muted" style={{ fontSize: 13 }}>{money(v)}</span>
        </div>
      ))}
      <div className="row row--between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 18 }}>
        <span style={{ fontWeight: 800 }}>Net</span>
        <span className="tabular" style={{ fontWeight: 800, color: totals.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {totals.net >= 0 ? '+' : '−'}
          {money(Math.abs(totals.net))}
        </span>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'income' | 'expense'
}) {
  return (
    <div className="card card--pad grow" style={{ minWidth: 0 }}>
      <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>
        {label}
      </div>
      <div
        className="tabular"
        style={{
          fontWeight: 800,
          fontSize: 16,
          marginTop: 4,
          color: tone === 'income' ? 'var(--success)' : 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function CategoryBars() {
  const app = useApp()
  const { currency, locale } = app.settings
  const month = currentMonthKey()
  const spend = categorySpend(app.transactions, month)

  const items = Object.entries(spend)
    .map(([categoryId, value]) => ({ cat: app.categoryById(categoryId), categoryId, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)

  if (items.length === 0) {
    return <EmptyState emoji="💸" title="No spending logged this month yet" />
  }

  const total = items.reduce((s, x) => s + x.value, 0)
  const max = items[0].value

  return (
    <div className="card card--pad stack">
      {items.map(({ cat, categoryId, value }) => {
        const c = cat as Category | undefined
        const pctOfTotal = Math.round((value / total) * 100)
        return (
          <div key={categoryId}>
            <div className="row row--between" style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {c?.icon} {c?.name ?? 'Other'}
              </span>
              <span className="tabular" style={{ fontWeight: 700, fontSize: 14 }}>
                {formatMoney(value, currency, locale)}{' '}
                <span className="muted" style={{ fontWeight: 500 }}>
                  · {pctOfTotal}%
                </span>
              </span>
            </div>
            <div className="progress" style={{ height: 10 }}>
              <div
                className="progress__fill"
                style={{
                  width: Math.max(3, (value / max) * 100) + '%',
                  background: c?.color ?? 'var(--c-other)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function lastMonths(n: number, locale: string, today: Date) {
  const out: { key: string; label: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1)
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleDateString(locale, { month: 'short' }),
    })
  }
  return out
}

function MonthlyTrend() {
  const app = useApp()
  const { currency, locale } = app.settings
  const months = lastMonths(6, locale, new Date())
  const data = months.map((m) => ({
    ...m,
    value: monthTotals(app.transactions, m.key).expense,
  }))
  const max = Math.max(1, ...data.map((d) => d.value))
  const hasAny = data.some((d) => d.value > 0)

  if (!hasAny) {
    return <EmptyState emoji="📈" title="Spending trends appear as you log expenses" />
  }

  const H = 130
  return (
    <div className="card card--pad">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          alignItems: 'end',
          gap: 10,
          height: H,
        }}
      >
        {data.map((d) => (
          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div className="tabular muted" style={{ fontSize: 10, marginBottom: 4 }}>
              {d.value > 0 ? formatMoneyShort(d.value, currency, locale) : ''}
            </div>
            <div
              style={{
                width: '78%',
                height: Math.max(4, (d.value / max) * (H - 26)),
                background: 'var(--primary)',
                borderRadius: '6px 6px 3px 3px',
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          gap: 10,
          marginTop: 6,
        }}
      >
        {data.map((d) => (
          <div key={d.key} className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function FocusWeek() {
  const app = useApp()
  const today = new Date()
  const days: { iso: string; label: string; minutes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const iso = toISODate(d)
    const minutes = app.focusSessions
      .filter((s) => s.completed && toISODate(new Date(s.startedAt)) === iso)
      .reduce((sum, s) => sum + s.durationMin, 0)
    days.push({ iso, label: d.toLocaleDateString(app.settings.locale, { weekday: 'narrow' }), minutes })
  }
  const max = Math.max(1, ...days.map((d) => d.minutes))
  const totalMin = days.reduce((s, d) => s + d.minutes, 0)

  if (totalMin === 0) {
    return <EmptyState emoji="🍅" title="Finish a focus session to see your week" />
  }

  const H = 120
  return (
    <div className="card card--pad">
      <div className="row row--between" style={{ marginBottom: 10 }}>
        <span className="dim">This week</span>
        <span style={{ fontWeight: 700 }}>
          {Math.floor(totalMin / 60)}h {totalMin % 60}m focused
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          alignItems: 'end',
          gap: 8,
          height: H,
        }}
      >
        {days.map((d) => (
          <div key={d.iso} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '70%',
                height: Math.max(4, (d.minutes / max) * (H - 16)),
                background: 'var(--success)',
                borderRadius: '6px 6px 3px 3px',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 6 }}>
        {days.map((d) => (
          <div key={d.iso} className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
