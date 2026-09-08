import { useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader } from '../../components/ui'
import { IconPlus } from '../../components/Icons'
import BillForm from '../money/BillForm'
import { nextOccurrenceOnOrAfter } from '../../lib/recurrence'
import { formatDate, formatMoney, humanDue, toISODate } from '../../lib/format'
import { RECURRENCE_LABELS, type Bill } from '../../types'

const SUBS_CAT = 'cat-subs'

/** Estimated cost per month, normalizing the recurrence. */
function perMonth(b: Bill): number {
  if (b.recurrence === 'monthly') return b.amount
  if (b.recurrence === 'yearly') return b.amount / 12
  if (b.recurrence === 'weekly') return (b.amount * 52) / 12
  return 0 // one-time bills aren't a monthly commitment
}

export default function SubscriptionsScreen() {
  const app = useApp()
  const { currency, locale } = app.settings
  const now = new Date()
  const [sheet, setSheet] = useState<{ open: boolean; edit?: Bill }>({ open: false })

  const subs = app.bills
    .filter((b) => !b.archived && b.categoryId === SUBS_CAT)
    .map((b) => ({ bill: b, nextDue: nextOccurrenceOnOrAfter(b.dueDate, b.recurrence, now) }))
    .sort((a, b) => {
      const ax = a.nextDue ? a.nextDue.getTime() : Infinity
      const bx = b.nextDue ? b.nextDue.getTime() : Infinity
      return ax - bx
    })

  const monthlyTotal = subs.reduce((s, { bill }) => s + perMonth(bill), 0)

  return (
    <div className="screen">
      <ScreenHeader title="Subscriptions" subtitle="Recurring memberships you pay for" />

      <div className="card card--pad hero-honey">
        <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>Estimated per month</div>
        <div className="big-number" style={{ marginTop: 2 }}>
          {formatMoney(monthlyTotal, currency, locale)}
        </div>
        <div style={{ opacity: 0.9, fontSize: 13, marginTop: 2 }}>
          {subs.length} active {subs.length === 1 ? 'subscription' : 'subscriptions'}
          {monthlyTotal > 0 ? ` · ${formatMoney(monthlyTotal * 12, currency, locale)} / year` : ''}
        </div>
      </div>

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 12 }}
        onClick={() => setSheet({ open: true })}
      >
        <IconPlus size={18} /> Add a subscription
      </button>

      {subs.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            emoji="🔁"
            title="No subscriptions yet"
            subtitle="Tap “Add a subscription” and pick one — Netflix, Spotify, Claude, Canva and more are one tap away."
          />
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {subs.map(({ bill, nextDue }) => {
            const cat = app.categoryById(bill.categoryId)
            return (
              <button
                key={bill.id}
                className="card card--pad row"
                style={{ textAlign: 'left', width: '100%' }}
                onClick={() => setSheet({ open: true, edit: bill })}
              >
                <div className="avatar hex" style={{ background: cat?.color ?? 'var(--c-subs)' }}>
                  {bill.icon ?? cat?.icon ?? '🔁'}
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bill.name}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {RECURRENCE_LABELS[bill.recurrence]}
                    {nextDue ? ` · ${humanDue(toISODate(nextDue), now)} · ${formatDate(toISODate(nextDue), locale)}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div className="tabular" style={{ fontWeight: 800 }}>
                    {formatMoney(bill.amount, currency, locale)}
                  </div>
                  {bill.recurrence !== 'monthly' && perMonth(bill) > 0 && (
                    <div className="muted" style={{ fontSize: 11 }}>
                      ≈ {formatMoney(perMonth(bill), currency, locale)}/mo
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Sheet
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
        title={sheet.edit ? 'Edit subscription' : 'Add a subscription'}
      >
        <BillForm
          initial={sheet.edit}
          defaultCategoryId={SUBS_CAT}
          onDone={() => setSheet({ open: false })}
        />
      </Sheet>
    </div>
  )
}
