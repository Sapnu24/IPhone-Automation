import { useMemo, useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, Fab, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconCheck, IconReset } from '../../components/Icons'
import TransactionForm from './TransactionForm'
import BillForm from './BillForm'
import {
  budgetProgress,
  categorySpend,
  currentMonthKey,
  monthTotals,
  paidSetByBill,
} from '../../lib/money'
import { activeOccurrence } from '../../lib/recurrence'
import {
  daysUntil,
  formatDate,
  formatMoney,
  formatMonthLabel,
  humanDue,
  toISODate,
} from '../../lib/format'
import type { Bill, Transaction } from '../../types'

type Tab = 'txns' | 'bills' | 'budgets'

export default function MoneyScreen() {
  const app = useApp()
  const { locale } = app.settings
  const [tab, setTab] = useState<Tab>('txns')
  const [txnSheet, setTxnSheet] = useState<{ open: boolean; edit?: Transaction }>({ open: false })
  const [billSheet, setBillSheet] = useState<{ open: boolean; edit?: Bill }>({ open: false })
  const [budgetCat, setBudgetCat] = useState<string | null>(null)

  const month = currentMonthKey()

  return (
    <div className="screen">
      <ScreenHeader title="Money" subtitle={formatMonthLabel(month, locale)} />

      <SegmentedControl
        options={[
          { value: 'txns', label: 'Spending' },
          { value: 'bills', label: 'Bills' },
          { value: 'budgets', label: 'Budgets' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      <div style={{ marginTop: 16 }}>
        {tab === 'txns' && <TxnList onEdit={(t) => setTxnSheet({ open: true, edit: t })} />}
        {tab === 'bills' && <BillsList onEdit={(b) => setBillSheet({ open: true, edit: b })} />}
        {tab === 'budgets' && <BudgetsList onEdit={(catId) => setBudgetCat(catId)} />}
      </div>

      {tab !== 'budgets' && (
        <Fab
          onClick={() =>
            tab === 'txns' ? setTxnSheet({ open: true }) : setBillSheet({ open: true })
          }
        />
      )}

      <Sheet
        open={txnSheet.open}
        onClose={() => setTxnSheet({ open: false })}
        title={txnSheet.edit ? 'Edit transaction' : 'Add transaction'}
      >
        <TransactionForm initial={txnSheet.edit} onDone={() => setTxnSheet({ open: false })} />
      </Sheet>

      <Sheet
        open={billSheet.open}
        onClose={() => setBillSheet({ open: false })}
        title={billSheet.edit ? 'Edit bill' : 'Add bill'}
      >
        <BillForm initial={billSheet.edit} onDone={() => setBillSheet({ open: false })} />
      </Sheet>

      <Sheet open={budgetCat != null} onClose={() => setBudgetCat(null)} title="Set monthly budget">
        {budgetCat && <BudgetEditor categoryId={budgetCat} onDone={() => setBudgetCat(null)} />}
      </Sheet>
    </div>
  )
}

function TxnList({ onEdit }: { onEdit: (t: Transaction) => void }) {
  const app = useApp()
  const { currency, locale } = app.settings
  const rows = useMemo(
    () =>
      [...app.transactions].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
      ),
    [app.transactions],
  )

  if (rows.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="No transactions yet"
        subtitle="Tap + to log your first expense or income."
      />
    )
  }

  return (
    <div className="card list">
      {rows.map((t) => {
        const cat = app.categoryById(t.categoryId)
        return (
          <button key={t.id} className="list__row" onClick={() => onEdit(t)}>
            <div className="avatar" style={{ background: (cat?.color ?? 'var(--c-other)') + '' }}>
              <span style={{ filter: 'saturate(1.2)' }}>{cat?.icon ?? '📦'}</span>
            </div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.note || cat?.name || 'Transaction'}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {cat?.name} · {formatDate(t.date, locale)}
              </div>
            </div>
            <span
              className="tabular"
              style={{
                fontWeight: 700,
                color: t.kind === 'income' ? 'var(--success)' : 'var(--text)',
              }}
            >
              {t.kind === 'income' ? '+' : '−'}
              {formatMoney(t.amount, currency, locale)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function BillsList({ onEdit }: { onEdit: (b: Bill) => void }) {
  const app = useApp()
  const { currency, locale } = app.settings
  const now = new Date()
  const paid = useMemo(() => paidSetByBill(app.occurrences), [app.occurrences])

  const rows = useMemo(() => {
    return app.bills
      .filter((b) => !b.archived)
      .map((b) => {
        const due = activeOccurrence(b, paid.get(b.id) ?? new Set(), now)
        return { bill: b, dueISO: due ? toISODate(due) : null }
      })
      .sort((a, b) => {
        if (a.dueISO && b.dueISO) return a.dueISO.localeCompare(b.dueISO)
        if (a.dueISO) return -1
        if (b.dueISO) return 1
        return 0
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.bills, paid])

  if (rows.length === 0) {
    return (
      <EmptyState
        emoji="📅"
        title="No bills yet"
        subtitle="Add rent, subscriptions or utilities to never miss a due date."
      />
    )
  }

  return (
    <div className="stack">
      {rows.map(({ bill, dueISO }) => {
        const cat = app.categoryById(bill.categoryId)
        const lastPaid = app.occurrences
          .filter((o) => o.billId === bill.id)
          .sort((a, b) => b.paidAt - a.paidAt)[0]
        const days = dueISO ? daysUntil(dueISO, now) : null
        const overdue = days != null && days < 0
        const soon = days != null && days >= 0 && days <= 5

        return (
          <div key={bill.id} className="card card--pad">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="avatar" style={{ background: cat?.color ?? 'var(--c-other)' }}>
                {bill.icon ?? cat?.icon ?? '📦'}
              </div>
              <button
                className="grow"
                onClick={() => onEdit(bill)}
                style={{ background: 'none', border: 'none', textAlign: 'left', minWidth: 0 }}
              >
                <div style={{ fontWeight: 700 }}>{bill.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {bill.recurrence === 'none' ? 'One-time' : `Repeats ${bill.recurrence}`}
                  {bill.autopay ? ' · autopay' : ''}
                </div>
              </button>
              <div style={{ textAlign: 'right' }}>
                <div className="tabular" style={{ fontWeight: 800 }}>
                  {formatMoney(bill.amount, currency, locale)}
                </div>
              </div>
            </div>

            <div className="row row--between" style={{ marginTop: 12 }}>
              {dueISO ? (
                <span
                  className={
                    'pill ' + (overdue ? 'pill--danger' : soon ? 'pill--warn' : '')
                  }
                >
                  {humanDue(dueISO, now)} · {formatDate(dueISO, locale)}
                </span>
              ) : (
                <span className="pill pill--ok">
                  <IconCheck size={14} /> Paid
                </span>
              )}

              <div className="row" style={{ gap: 8 }}>
                {lastPaid && (
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() => app.undoPay(bill.id, lastPaid.dueDate)}
                  >
                    <IconReset size={15} /> Undo
                  </button>
                )}
                {dueISO && (
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => app.payBill(bill.id, dueISO)}
                  >
                    <IconCheck size={15} /> Mark paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BudgetsList({ onEdit }: { onEdit: (categoryId: string) => void }) {
  const app = useApp()
  const { currency, locale } = app.settings
  const month = currentMonthKey()
  const spend = categorySpend(app.transactions, month)
  const totals = monthTotals(app.transactions, month)
  const totalBudget = app.budgets.reduce((s, b) => s + b.monthlyLimit, 0)

  const expenseCats = app.categories.filter((c) => c.kind === 'expense' && !c.archived)

  return (
    <div className="stack">
      <div className="card card--pad">
        <div className="row row--between">
          <span className="dim">Spent this month</span>
          <span className="tabular" style={{ fontWeight: 800 }}>
            {formatMoney(totals.expense, currency, locale)}
          </span>
        </div>
        {totalBudget > 0 && (
          <>
            <div className="progress" style={{ marginTop: 10 }}>
              <div
                className="progress__fill"
                style={{
                  width: Math.min(100, (totals.expense / totalBudget) * 100) + '%',
                  background: totals.expense > totalBudget ? 'var(--danger)' : 'var(--primary)',
                }}
              />
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              of {formatMoney(totalBudget, currency, locale)} total budget
            </div>
          </>
        )}
      </div>

      <div className="section-label">Category budgets</div>
      <div className="card list">
        {expenseCats.map((c) => {
          const budget = app.budgets.find((b) => b.categoryId === c.id)
          const spent = spend[c.id] ?? 0
          const [p] = budget ? budgetProgress([budget], app.transactions, month) : [null]
          return (
            <button key={c.id} className="list__row" onClick={() => onEdit(c.id)}>
              <div className="avatar" style={{ background: c.color }}>
                {c.icon}
              </div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                {budget ? (
                  <div className="progress" style={{ marginTop: 8 }}>
                    <div
                      className="progress__fill"
                      style={{
                        width: Math.min(100, (p!.pct || 0) * 100) + '%',
                        background: p!.over ? 'var(--danger)' : c.color,
                      }}
                    />
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 12 }}>
                    Tap to set a monthly limit
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', minWidth: 92 }}>
                <div className="tabular" style={{ fontWeight: 700 }}>
                  {formatMoney(spent, currency, locale)}
                </div>
                {budget && (
                  <div className="muted tabular" style={{ fontSize: 12 }}>
                    / {formatMoney(budget.monthlyLimit, currency, locale)}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BudgetEditor({ categoryId, onDone }: { categoryId: string; onDone: () => void }) {
  const app = useApp()
  const cat = app.categoryById(categoryId)
  const existing = app.budgets.find((b) => b.categoryId === categoryId)
  const [limit, setLimit] = useState(existing ? String(existing.monthlyLimit) : '')
  const value = parseFloat(limit)

  return (
    <div className="stack">
      <div className="row">
        <div className="avatar" style={{ background: cat?.color ?? 'var(--c-other)' }}>
          {cat?.icon ?? '📦'}
        </div>
        <div style={{ fontWeight: 700 }}>{cat?.name}</div>
      </div>
      <div className="field">
        <label className="field__label">Monthly limit ({app.settings.currency})</label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          step="1"
          min="0"
          placeholder="0.00"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          autoFocus
        />
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={Number.isNaN(value) || value <= 0}
        onClick={async () => {
          await app.setBudget(categoryId, Math.round(value * 100) / 100)
          onDone()
        }}
      >
        Save budget
      </button>
      {existing && (
        <button
          className="btn btn--ghost btn--block"
          onClick={async () => {
            await app.removeBudget(categoryId)
            onDone()
          }}
        >
          Remove budget
        </button>
      )}
    </div>
  )
}
