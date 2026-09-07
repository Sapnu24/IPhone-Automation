import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { ScreenHeader } from '../../components/ui'
import { IconBell, IconCheck, IconChevron, IconPlus, IconTimer } from '../../components/Icons'
import TransactionForm from '../money/TransactionForm'
import BillForm from '../money/BillForm'
import { cashflow, currentMonthKey, monthTotals, outstandingBills } from '../../lib/money'
import { formatDate, formatMoney, humanDue, toISODate, todayISO } from '../../lib/format'

function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeScreen() {
  const app = useApp()
  const nav = useNavigate()
  const { currency, locale } = app.settings
  const now = new Date()
  const month = currentMonthKey(now)
  const [txnOpen, setTxnOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)

  const cf = cashflow(app.transactions, app.bills, app.occurrences, month, now)
  const totals = monthTotals(app.transactions, month)
  const totalBudget = app.budgets.reduce((s, b) => s + b.monthlyLimit, 0)
  const dueSoon = outstandingBills(app.bills, app.occurrences, now).filter((d) => d.daysUntil <= 14)
  const focusToday = app.focusSessions.filter(
    (s) => s.completed && toISODate(new Date(s.startedAt)) === todayISO(),
  ).length

  const empty = app.transactions.length === 0 && app.bills.length === 0

  return (
    <div className="screen">
      <ScreenHeader title={greeting(now)} subtitle="Here's where your money stands today." />

      {empty ? (
        <div className="card card--pad stack" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>⚓️</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Welcome to Anchor</div>
          <div className="dim" style={{ fontSize: 14 }}>
            Your private money &amp; focus companion. Nothing leaves your phone. Start by adding a
            bill you don't want to miss, or logging what you just spent.
          </div>
          <button className="btn btn--primary btn--block" onClick={() => setBillOpen(true)}>
            <IconBell size={18} /> Add your first bill
          </button>
          <button className="btn btn--block" onClick={() => setTxnOpen(true)}>
            <IconPlus size={18} /> Log an expense
          </button>
        </div>
      ) : (
        <>
          {/* Safe to spend hero */}
          <div
            className="card card--pad"
            style={{
              background:
                'linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)',
              color: '#fff',
              border: 'none',
            }}
          >
            <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>Safe to spend</div>
            <div className="big-number" style={{ marginTop: 4 }}>
              {formatMoney(cf.safeToSpend, currency, locale)}
            </div>
            <div style={{ opacity: 0.9, fontSize: 12, marginTop: 2 }}>
              after this month's income, spending &amp; bills
            </div>
            <div className="row" style={{ gap: 18, marginTop: 14 }}>
              <MiniStat label="Income" value={formatMoney(cf.income, currency, locale)} />
              <MiniStat label="Spent" value={formatMoney(cf.spent, currency, locale)} />
              <MiniStat label="Bills left" value={formatMoney(cf.upcomingBills, currency, locale)} />
            </div>
          </div>

          {/* Due soon */}
          <div className="section-label">Due soon</div>
          {dueSoon.length === 0 ? (
            <div className="card card--pad dim" style={{ fontSize: 14 }}>
              🎉 Nothing due in the next two weeks. Nice.
            </div>
          ) : (
            <div className="stack">
              {dueSoon.slice(0, 4).map(({ bill, dueISO, overdue }) => {
                const cat = app.categoryById(bill.categoryId)
                return (
                  <div key={bill.id} className="card card--pad row">
                    <div className="avatar" style={{ background: cat?.color ?? 'var(--c-other)' }}>
                      {cat?.icon ?? '📦'}
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{bill.name}</div>
                      <div
                        className={overdue ? '' : 'muted'}
                        style={{ fontSize: 12, color: overdue ? 'var(--danger)' : undefined }}
                      >
                        {humanDue(dueISO, now)} · {formatDate(dueISO, locale)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular" style={{ fontWeight: 800, marginBottom: 6 }}>
                        {formatMoney(bill.amount, currency, locale)}
                      </div>
                      <button
                        className="btn btn--sm btn--primary"
                        onClick={() => app.payBill(bill.id, dueISO)}
                      >
                        <IconCheck size={15} /> Paid
                      </button>
                    </div>
                  </div>
                )
              })}
              <button
                className="btn btn--ghost btn--block"
                onClick={() => nav('/money')}
              >
                See all bills <IconChevron size={16} />
              </button>
            </div>
          )}

          {/* This month */}
          <div className="section-label">This month</div>
          <div className="card card--pad stack">
            <div className="row row--between">
              <span className="dim">Spent</span>
              <span className="tabular" style={{ fontWeight: 800 }}>
                {formatMoney(totals.expense, currency, locale)}
              </span>
            </div>
            {totalBudget > 0 && (
              <div className="progress">
                <div
                  className="progress__fill"
                  style={{
                    width: Math.min(100, (totals.expense / totalBudget) * 100) + '%',
                    background: totals.expense > totalBudget ? 'var(--danger)' : 'var(--primary)',
                  }}
                />
              </div>
            )}
            <div className="row row--between">
              <span className="dim">Net this month</span>
              <span
                className="tabular"
                style={{
                  fontWeight: 800,
                  color: totals.net >= 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {totals.net >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(totals.net), currency, locale)}
              </span>
            </div>
          </div>

          {/* Focus teaser */}
          <div className="section-label">Focus</div>
          <button
            className="card card--pad row row--between"
            onClick={() => nav('/focus')}
            style={{ width: '100%', textAlign: 'left', border: '1px solid var(--border)' }}
          >
            <div className="row" style={{ gap: 12 }}>
              <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <IconTimer size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {focusToday > 0 ? `${focusToday} focus session${focusToday > 1 ? 's' : ''} today` : 'Start a focus session'}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Pomodoro timer for work &amp; study
                </div>
              </div>
            </div>
            <IconChevron size={18} />
          </button>

          {/* Quick actions */}
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <button className="btn btn--primary grow" onClick={() => setTxnOpen(true)}>
              <IconPlus size={18} /> Expense
            </button>
            <button className="btn grow" onClick={() => setBillOpen(true)}>
              <IconBell size={18} /> Bill
            </button>
          </div>
        </>
      )}

      <Sheet open={txnOpen} onClose={() => setTxnOpen(false)} title="Add transaction">
        <TransactionForm onDone={() => setTxnOpen(false)} />
      </Sheet>
      <Sheet open={billOpen} onClose={() => setBillOpen(false)} title="Add bill">
        <BillForm onDone={() => setBillOpen(false)} />
      </Sheet>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, opacity: 0.85 }}>{label}</div>
      <div className="tabular" style={{ fontWeight: 700, fontSize: 14 }}>
        {value}
      </div>
    </div>
  )
}
