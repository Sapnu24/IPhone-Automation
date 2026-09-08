import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { SegmentedControl } from '../../components/ui'
import { MascotTip } from '../../components/Mascot'
import { HexCluster } from '../../components/Honeycomb'
import { Donut, type DonutItem } from '../../components/Donut'
import {
  IconBell,
  IconCamera,
  IconChart,
  IconChat,
  IconCheck,
  IconChevron,
  IconGear,
  IconPlus,
  IconTimer,
  IconWallet,
} from '../../components/Icons'
import TransactionForm from '../money/TransactionForm'
import BillForm from '../money/BillForm'
import {
  categorySpend,
  currentMonthKey,
  inMonth,
  monthTotals,
  outstandingBills,
} from '../../lib/money'
import { paydayInfo } from '../../lib/plan'
import { daysUntil, formatMoney, humanDue, formatDate, toISODate, todayISO } from '../../lib/format'

type Range = 'day' | 'week' | 'month'

function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function loggingStreak(days: Set<string>, today: Date): number {
  const d = new Date(today)
  if (!days.has(toISODate(d))) d.setDate(d.getDate() - 1) // today not logged yet is OK
  let streak = 0
  while (days.has(toISODate(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function HomeScreen() {
  const app = useApp()
  const nav = useNavigate()
  const { currency, locale, name } = app.settings
  const now = new Date()
  const month = currentMonthKey(now)
  const [range, setRange] = useState<Range>('month')
  const [txnOpen, setTxnOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)

  const dueSoon = outstandingBills(app.bills, app.occurrences, now).filter((d) => d.daysUntil <= 14)
  const focusToday = app.focusSessions.filter(
    (s) => s.completed && toISODate(new Date(s.startedAt)) === todayISO(),
  ).length

  const streak = useMemo(() => {
    const days = new Set<string>([
      ...app.transactions.map((t) => t.date),
      ...app.focusSessions.filter((s) => s.completed).map((s) => toISODate(new Date(s.startedAt))),
    ])
    return loggingStreak(days, now)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.transactions, app.focusSessions])

  const rangeTotals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of app.transactions) {
      const d = daysUntil(t.date, now)
      const inR =
        range === 'day'
          ? t.date === toISODate(now)
          : range === 'week'
            ? d <= 0 && d > -7
            : inMonth(t.date, month)
      if (!inR) continue
      if (t.kind === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.transactions, range])

  const donut = useMemo<{ items: DonutItem[]; topPct: string; topName: string }>(() => {
    const spend = categorySpend(app.transactions, month)
    const entries = Object.entries(spend).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0)
    const top = entries.slice(0, 5)
    const restSum = entries.slice(5).reduce((s, [, v]) => s + v, 0)
    const items: DonutItem[] = top.map(([id, v]) => ({
      label: app.categoryById(id)?.name ?? 'Other',
      value: v,
      color: app.categoryById(id)?.color ?? 'var(--c-other)',
    }))
    if (restSum > 0) items.push({ label: 'Other', value: restSum, color: 'var(--c-other)' })
    const topPct = total > 0 && top[0] ? Math.round((top[0][1] / total) * 100) + '%' : '—'
    const topName = top[0] ? app.categoryById(top[0][0])?.name ?? '' : ''
    return { items, topPct, topName }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.transactions])

  const empty = app.transactions.length === 0 && app.bills.length === 0
  const tip = useMemo(() => {
    if (empty) return "Let's set you up — add a bill you don't want to miss, or log what you just spent."
    if (dueSoon.some((d) => d.overdue)) return "You've got an overdue bill — tap Bills to catch up."
    if (donut.topName)
      return `${donut.topName} is about ${donut.topPct} of your spending this month. Keep it planned so the total stays predictable.`
    return 'Log a few expenses and I’ll start spotting patterns for you.'
  }, [empty, dueSoon, donut])

  return (
    <div className="screen">
      <div className="screen__header">
        <div className="row row--between">
          <div>
            <div className="screen__title">
              {greeting(now)}
              {name ? `, ${name}` : ''}
            </div>
            <div className="screen__subtitle">Here's where your money stands today.</div>
          </div>
          {streak > 0 && (
            <span className="pill" style={{ background: 'var(--accent-soft)', color: 'var(--warning)', border: 'none' }}>
              🔥 {streak}
            </span>
          )}
        </div>
      </div>

      <div className="stack">
        <MascotTip text={tip} />

        {!empty && (
          <>
            {/* Safe to spend hero */}
            <div className="card card--pad hero-honey">
              <HexCluster style={{ position: 'absolute', top: -16, right: -10, opacity: 0.5 }} />
              <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>Safe to spend</div>
              <div className="big-number" style={{ marginTop: 4 }}>
                {formatMoney(safeToSpend(app, month, now), currency, locale)}
              </div>
              <div style={{ opacity: 0.9, fontSize: 12, marginTop: 2 }}>
                after this month's income, spending &amp; bills
              </div>
            </div>

            {/* Quick actions */}
            <div className="quickgrid">
              <QuickAction label="Expense" color="var(--primary)" onClick={() => setTxnOpen(true)}>
                <IconPlus size={22} />
              </QuickAction>
              <QuickAction label="Bill" color="var(--accent)" onClick={() => setBillOpen(true)}>
                <IconBell size={22} />
              </QuickAction>
              <QuickAction label="Budgets" color="var(--c-fun)" onClick={() => nav('/money')}>
                <IconWallet size={22} />
              </QuickAction>
              <QuickAction label="Focus" color="var(--c-utilities)" onClick={() => nav('/focus')}>
                <IconTimer size={22} />
              </QuickAction>
              <QuickAction label="Insights" color="var(--c-health)" onClick={() => nav('/insights')}>
                <IconChart size={22} />
              </QuickAction>
              <QuickAction label="Scan" color="var(--c-transport)" onClick={() => setTxnOpen(true)}>
                <IconCamera size={22} />
              </QuickAction>
              <QuickAction label="Chat" color="var(--c-shopping)" onClick={() => nav('/chat')}>
                <IconChat size={22} />
              </QuickAction>
              <QuickAction label="Settings" color="var(--c-other)" onClick={() => nav('/settings')}>
                <IconGear size={22} />
              </QuickAction>
            </div>

            {/* This period + donut */}
            <div className="card card--pad stack">
              <div className="row row--between">
                <span style={{ fontWeight: 800 }}>Overview</span>
                <div style={{ width: 190 }}>
                  <SegmentedControl
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                    ]}
                    value={range}
                    onChange={(v) => setRange(v as Range)}
                  />
                </div>
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 800 }}>↑</span>
                    <span className="dim">In</span>
                    <span className="right tabular" style={{ fontWeight: 700 }}>
                      {formatMoney(rangeTotals.income, currency, locale)}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 800 }}>↓</span>
                    <span className="dim">Out</span>
                    <span className="right tabular" style={{ fontWeight: 700 }}>
                      {formatMoney(rangeTotals.expense, currency, locale)}
                    </span>
                  </div>
                </div>
                {donut.items.length > 0 && (
                  <Donut
                    items={donut.items}
                    size={104}
                    thickness={13}
                    centerLabel={donut.topPct}
                    centerSub={donut.topName.split(' ')[0]}
                  />
                )}
              </div>
            </div>

            {/* Payday */}
            {(() => {
              const pd = paydayInfo(app.incomePlans, now)
              if (!pd) return null
              const lbl = pd.daysUntil <= 0 ? 'Today' : pd.daysUntil === 1 ? 'Tomorrow' : `${pd.daysUntil} days`
              return (
                <button
                  className="card card--pad row row--between"
                  onClick={() => nav('/plan')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <div className="row" style={{ gap: 12 }}>
                    <div className="avatar hex" style={{ background: 'var(--accent-soft)', color: 'var(--warning)' }}>
                      💸
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Payday in {lbl}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {formatMoney(pd.plan.amount, currency, locale)} · {formatDate(pd.dateISO, locale)}
                      </div>
                    </div>
                  </div>
                  <IconChevron size={18} />
                </button>
              )
            })()}

            {/* Due soon */}
            {dueSoon.length > 0 && (
              <>
                <div className="section-label">Due soon</div>
                <div className="stack">
                  {dueSoon.slice(0, 3).map(({ bill, dueISO, overdue }) => {
                    const cat = app.categoryById(bill.categoryId)
                    return (
                      <div key={bill.id} className="card card--pad row">
                        <div className="avatar hex" style={{ background: cat?.color ?? 'var(--c-other)' }}>
                          {cat?.icon ?? '📦'}
                        </div>
                        <div className="grow" style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{bill.name}</div>
                          <div style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-3)' }}>
                            {humanDue(dueISO, now)} · {formatDate(dueISO, locale)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular" style={{ fontWeight: 800, marginBottom: 6 }}>
                            {formatMoney(bill.amount, currency, locale)}
                          </div>
                          <button className="btn btn--sm btn--primary" onClick={() => app.payBill(bill.id, dueISO)}>
                            <IconCheck size={15} /> Paid
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <button className="btn btn--ghost btn--block" onClick={() => nav('/money')}>
                    See all bills <IconChevron size={16} />
                  </button>
                </div>
              </>
            )}

            {/* Focus teaser */}
            <button
              className="card card--pad row row--between"
              onClick={() => nav('/focus')}
              style={{ width: '100%', textAlign: 'left', marginTop: 4 }}
            >
              <div className="row" style={{ gap: 12 }}>
                <div className="avatar hex" style={{ background: 'var(--c-utilities)' }}>
                  <IconTimer size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {focusToday > 0 ? `${focusToday} focus session${focusToday > 1 ? 's' : ''} today` : 'Start a focus session'}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>Pomodoro for work &amp; study</div>
                </div>
              </div>
              <IconChevron size={18} />
            </button>
          </>
        )}

        {empty && (
          <div className="card card--pad stack" style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Welcome to Hive 🐝</div>
            <div className="dim" style={{ fontSize: 14 }}>
              Your private money &amp; focus companion. Nothing leaves your phone.
            </div>
            <button className="btn btn--primary btn--block" onClick={() => setBillOpen(true)}>
              <IconBell size={18} /> Add your first bill
            </button>
            <button className="btn btn--block" onClick={() => setTxnOpen(true)}>
              <IconPlus size={18} /> Log an expense
            </button>
          </div>
        )}
      </div>

      <Sheet open={txnOpen} onClose={() => setTxnOpen(false)} title="Add transaction">
        <TransactionForm onDone={() => setTxnOpen(false)} />
      </Sheet>
      <Sheet open={billOpen} onClose={() => setBillOpen(false)} title="Add bill">
        <BillForm onDone={() => setBillOpen(false)} />
      </Sheet>
    </div>
  )
}

function QuickAction({
  label,
  color,
  onClick,
  children,
}: {
  label: string
  color: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button className="quick" onClick={onClick}>
      <div className="quick__icon" style={{ background: color }}>
        {children}
      </div>
      {label}
    </button>
  )
}

// Safe-to-spend for the current month (income − spent − unpaid bills due).
function safeToSpend(app: ReturnType<typeof useApp>, month: string, now: Date): number {
  const { income, expense } = monthTotals(app.transactions, month)
  const unpaid = outstandingBills(app.bills, app.occurrences, now)
    .filter((d) => d.dueISO.slice(0, 7) === month)
    .reduce((s, d) => s + d.bill.amount, 0)
  return income - expense - unpaid
}
