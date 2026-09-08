import { useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconBell, IconCheck, IconPlus } from '../../components/Icons'
import { outstandingBills } from '../../lib/money'
import { upcomingIncome, paydayInfo } from '../../lib/plan'
import { formatDate, formatMoney, humanDue, todayISO } from '../../lib/format'
import type { IncomePlan, Recurrence } from '../../types'

export default function PlanScreen() {
  const app = useApp()
  const { currency, locale } = app.settings
  const now = new Date()
  const [sheet, setSheet] = useState<{ open: boolean; edit?: IncomePlan; payday?: boolean }>({ open: false })

  const payday = paydayInfo(app.incomePlans, now)
  const income = upcomingIncome(app.incomePlans, 45, now)
  const due = outstandingBills(app.bills, app.occurrences, now).filter((d) => d.daysUntil <= 45)
  const totalDue = due.reduce((s, d) => s + d.bill.amount, 0)

  const dayLabel = (n: number) => (n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : `${n} days`)

  return (
    <div className="screen">
      <ScreenHeader title="Plan" subtitle="Payday, income & payments" />

      {/* Payday */}
      {payday ? (
        <div className="card card--pad hero-honey">
          <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>Days until payday</div>
          <div className="row row--between" style={{ alignItems: 'flex-end', marginTop: 2 }}>
            <div className="big-number">{dayLabel(payday.daysUntil)}</div>
            <div style={{ textAlign: 'right' }}>
              <div className="tabular" style={{ fontWeight: 800, fontSize: 18 }}>
                {formatMoney(payday.plan.amount, currency, locale)}
              </div>
              <div style={{ opacity: 0.9, fontSize: 12 }}>{formatDate(payday.dateISO, locale)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card--pad stack">
          <div style={{ fontWeight: 700 }}>Set your payday 💸</div>
          <div className="dim" style={{ fontSize: 13 }}>
            Add your salary so Hive can count down to payday and plan around it.
          </div>
          <button
            className="btn btn--primary btn--block"
            onClick={() => setSheet({ open: true, payday: true })}
          >
            <IconPlus size={18} /> Add payday
          </button>
        </div>
      )}

      {/* Upcoming income */}
      <div className="row row--between" style={{ margin: '20px 4px 8px' }}>
        <span className="section-label" style={{ margin: 0 }}>
          Upcoming income
        </span>
        <button className="btn btn--sm btn--ghost" onClick={() => setSheet({ open: true })}>
          <IconPlus size={15} /> Income
        </button>
      </div>
      {income.length === 0 ? (
        <div className="card card--pad dim" style={{ fontSize: 14 }}>
          No planned income yet. Add your salary, side-gig payouts, or allowances.
        </div>
      ) : (
        <div className="card list">
          {income.map(({ plan, dateISO, daysUntil }) => (
            <button key={plan.id} className="list__row" onClick={() => setSheet({ open: true, edit: plan })}>
              <div className="avatar hex" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                💰
              </div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  {plan.name} {plan.isPayday ? '· payday' : ''}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {dayLabel(daysUntil)} · {formatDate(dateISO, locale)}
                  {plan.recurrence !== 'none' ? ` · ${plan.recurrence}` : ''}
                </div>
              </div>
              <span className="tabular" style={{ fontWeight: 700, color: 'var(--success)' }}>
                +{formatMoney(plan.amount, currency, locale)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Payments due */}
      <div className="row row--between" style={{ margin: '20px 4px 8px' }}>
        <span className="section-label" style={{ margin: 0 }}>
          Payments due
        </span>
        {totalDue > 0 && (
          <span className="dim tabular" style={{ fontSize: 13 }}>
            {formatMoney(totalDue, currency, locale)} total
          </span>
        )}
      </div>
      {due.length === 0 ? (
        <EmptyState emoji="✅" title="Nothing due in the next 45 days" />
      ) : (
        <div className="stack">
          {due.map(({ bill, dueISO, overdue }) => {
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
        </div>
      )}

      <Sheet
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
        title={sheet.edit ? 'Edit income' : sheet.payday ? 'Add payday' : 'Add income'}
      >
        <IncomePlanForm
          initial={sheet.edit}
          presetPayday={sheet.payday}
          onDone={() => setSheet({ open: false })}
        />
      </Sheet>
    </div>
  )
}

function IncomePlanForm({
  initial,
  presetPayday,
  onDone,
}: {
  initial?: IncomePlan
  presetPayday?: boolean
  onDone: () => void
}) {
  const app = useApp()
  const accts = app.accounts.filter((a) => !a.archived)
  const [name, setName] = useState(initial?.name ?? (presetPayday ? 'Salary' : ''))
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [nextDate, setNextDate] = useState(initial?.nextDate ?? todayISO())
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'monthly')
  const [accountId, setAccountId] = useState(initial?.accountId ?? accts[0]?.id ?? '')
  const [isPayday, setIsPayday] = useState(initial?.isPayday ?? presetPayday ?? false)

  const value = parseFloat(amount)
  const valid = name.trim() && !Number.isNaN(value) && value > 0 && nextDate

  async function submit() {
    if (!valid) return
    const data = {
      name: name.trim(),
      amount: Math.round(value * 100) / 100,
      nextDate,
      recurrence,
      accountId: accountId || undefined,
      isPayday,
    }
    if (initial) await app.updateIncomePlan({ ...initial, ...data })
    else await app.addIncomePlan(data)
    onDone()
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Salary, online selling payout…"
          maxLength={40}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="field__label">Amount ({app.settings.currency})</label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="field__label">Next date</label>
        <input className="input" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Repeats</label>
        <SegmentedControl
          options={[
            { value: 'none', label: 'Once' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          value={recurrence}
          onChange={(v) => setRecurrence(v as Recurrence)}
        />
      </div>
      {accts.length > 0 && (
        <div className="field">
          <label className="field__label">Into account (optional)</label>
          <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">—</option>
            {accts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="row row--between card card--pad" style={{ cursor: 'pointer' }}>
        <div>
          <div style={{ fontWeight: 700 }}>
            <IconBell size={15} /> This is my payday
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Powers the payday countdown on Home &amp; Plan.
          </div>
        </div>
        <input type="checkbox" checked={isPayday} onChange={(e) => setIsPayday(e.target.checked)} style={{ width: 22, height: 22 }} />
      </label>

      <button className="btn btn--primary btn--block" disabled={!valid} onClick={submit}>
        {initial ? 'Save' : 'Add income'}
      </button>
      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteIncomePlan(initial.id)
            onDone()
          }}
        >
          Delete
        </button>
      )}
    </div>
  )
}
