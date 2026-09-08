import { useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconCheck, IconPlus } from '../../components/Icons'
import { formatDate, formatMoney } from '../../lib/format'
import type { Ledger, LedgerDirection } from '../../types'

const CONFIG: Record<
  LedgerDirection,
  {
    title: string
    subtitle: string
    hero: string
    add: string
    prefix: string
    settle: string
    emoji: string
    empty: string
  }
> = {
  debt: {
    title: 'Debt',
    subtitle: 'Track what you owe',
    hero: 'Outstanding debt',
    add: 'New debt',
    prefix: 'to',
    settle: 'Settle',
    emoji: '💳',
    empty: 'No debts — nice and clear.',
  },
  owed: {
    title: 'Owed to you',
    subtitle: "Track what's owed to you",
    hero: 'Still to collect',
    add: 'New entry',
    prefix: 'from',
    settle: 'Collected',
    emoji: '🤝',
    empty: 'Nobody owes you right now.',
  },
}

export default function LedgerScreen({ direction }: { direction: LedgerDirection }) {
  const app = useApp()
  const { currency, locale } = app.settings
  const cfg = CONFIG[direction]
  const [tab, setTab] = useState<'open' | 'settled'>('open')
  const [sheet, setSheet] = useState<{ open: boolean; edit?: Ledger }>({ open: false })

  const all = app.ledgers.filter((l) => l.direction === direction)
  const remainingOf = (l: Ledger) => Math.max(0, l.amount - l.settledAmount)
  const outstanding = all.reduce((s, l) => s + remainingOf(l), 0)
  const rows = all
    .filter((l) => (tab === 'open' ? remainingOf(l) > 0.009 : remainingOf(l) <= 0.009))
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || b.createdAt - a.createdAt)

  return (
    <div className="screen">
      <ScreenHeader title={cfg.title} subtitle={cfg.subtitle} />

      <div className="card card--pad hero-honey">
        <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>{cfg.hero}</div>
        <div className="big-number" style={{ marginTop: 4 }}>
          {formatMoney(outstanding, currency, locale)}
        </div>
      </div>

      <div className="row" style={{ gap: 12, margin: '14px 0' }}>
        <button className="btn btn--primary grow" onClick={() => setSheet({ open: true })}>
          <IconPlus size={18} /> {cfg.add}
        </button>
      </div>

      <SegmentedControl
        options={[
          { value: 'open', label: 'Open' },
          { value: 'settled', label: direction === 'owed' ? 'Collected' : 'Settled' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'open' | 'settled')}
      />

      <div style={{ marginTop: 14 }}>
        {rows.length === 0 ? (
          <EmptyState emoji={cfg.emoji} title={tab === 'open' ? cfg.empty : 'Nothing here yet.'} />
        ) : (
          <div className="stack">
            {rows.map((l) => {
              const remaining = remainingOf(l)
              const pct = l.amount > 0 ? (l.settledAmount / l.amount) * 100 : 0
              return (
                <div key={l.id} className="card card--pad">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <button
                      className="grow"
                      onClick={() => setSheet({ open: true, edit: l })}
                      style={{ background: 'none', border: 'none', textAlign: 'left', minWidth: 0 }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {cfg.prefix} {l.person}
                      </div>
                      {l.note && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {l.note}
                        </div>
                      )}
                      {l.dueDate && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          due {formatDate(l.dueDate, locale)}
                        </div>
                      )}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular" style={{ fontWeight: 800 }}>
                        {formatMoney(remaining, currency, locale)}
                      </div>
                      {l.settledAmount > 0 && remaining > 0 && (
                        <div className="muted tabular" style={{ fontSize: 12 }}>
                          of {formatMoney(l.amount, currency, locale)}
                        </div>
                      )}
                    </div>
                  </div>
                  {l.settledAmount > 0 && remaining > 0 && (
                    <div className="progress" style={{ marginTop: 10 }}>
                      <div className="progress__fill" style={{ width: Math.min(100, pct) + '%' }} />
                    </div>
                  )}
                  {remaining > 0 && (
                    <button
                      className="btn btn--sm btn--primary"
                      style={{ marginTop: 12 }}
                      onClick={() => app.updateLedger({ ...l, settledAmount: l.amount })}
                    >
                      <IconCheck size={15} /> {cfg.settle}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Sheet
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
        title={sheet.edit ? 'Edit' : cfg.add}
      >
        <LedgerForm direction={direction} initial={sheet.edit} onDone={() => setSheet({ open: false })} />
      </Sheet>
    </div>
  )
}

function LedgerForm({
  direction,
  initial,
  onDone,
}: {
  direction: LedgerDirection
  initial?: Ledger
  onDone: () => void
}) {
  const app = useApp()
  const cfg = CONFIG[direction]
  const [person, setPerson] = useState(initial?.person ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [settled, setSettled] = useState(initial ? String(initial.settledAmount) : '0')
  const [note, setNote] = useState(initial?.note ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')

  const value = parseFloat(amount)
  const settledVal = parseFloat(settled)
  const valid = person.trim() && !Number.isNaN(value) && value > 0

  async function submit() {
    if (!valid) return
    const data = {
      direction,
      person: person.trim(),
      amount: Math.round(value * 100) / 100,
      settledAmount: Math.min(value, Math.max(0, Number.isNaN(settledVal) ? 0 : settledVal)),
      note: note.trim() || undefined,
      dueDate: dueDate || undefined,
    }
    if (initial) await app.updateLedger({ ...initial, ...data })
    else await app.addLedger(data)
    onDone()
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">Person {cfg.prefix === 'to' ? '(who you owe)' : '(who owes you)'}</label>
        <input className="input" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Carlo, Mom, BDO…" maxLength={40} autoFocus />
      </div>
      <div className="field">
        <label className="field__label">Amount ({app.settings.currency})</label>
        <input className="input" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      {initial && (
        <div className="field">
          <label className="field__label">Already {direction === 'owed' ? 'collected' : 'settled'} ({app.settings.currency})</label>
          <input className="input" type="number" inputMode="decimal" step="0.01" min="0" value={settled} onChange={(e) => setSettled(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label className="field__label">Note (optional)</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" maxLength={80} />
      </div>
      <div className="field">
        <label className="field__label">Due date (optional)</label>
        <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <button className="btn btn--primary btn--block" disabled={!valid} onClick={submit}>
        {initial ? 'Save' : cfg.add}
      </button>
      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteLedger(initial.id)
            onDone()
          }}
        >
          Delete
        </button>
      )}
    </div>
  )
}
