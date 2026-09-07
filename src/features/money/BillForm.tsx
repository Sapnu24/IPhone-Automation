import { useState } from 'react'
import { useApp } from '../../store'
import { todayISO } from '../../lib/format'
import { CategoryChips, SegmentedControl } from '../../components/ui'
import type { Bill, Recurrence } from '../../types'

interface Props {
  initial?: Bill
  onDone: () => void
}

const REMINDER_OPTIONS = [0, 1, 2, 3, 5, 7]

export default function BillForm({ initial, onDone }: Props) {
  const app = useApp()
  const expenseCats = app.categories.filter((c) => c.kind === 'expense' && !c.archived)

  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? expenseCats.find((c) => c.id === 'cat-utilities')?.id ?? expenseCats[0]?.id ?? '',
  )
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO())
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'monthly')
  const [reminderDaysBefore, setReminder] = useState(initial?.reminderDaysBefore ?? 2)
  const [autopay, setAutopay] = useState(initial?.autopay ?? false)

  const value = parseFloat(amount)
  const valid = name.trim() && !Number.isNaN(value) && value > 0 && categoryId && dueDate

  async function submit() {
    if (!valid) return
    const data = {
      name: name.trim(),
      amount: Math.round(value * 100) / 100,
      categoryId,
      dueDate,
      recurrence,
      reminderDaysBefore,
      autopay,
    }
    if (initial) await app.updateBill({ ...initial, ...data })
    else await app.addBill(data)
    onDone()
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">Bill name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent, Netflix, Electricity…"
          maxLength={60}
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
        <label className="field__label">Category</label>
        <CategoryChips categories={expenseCats} selectedId={categoryId} onSelect={setCategoryId} />
      </div>

      <div className="field">
        <label className="field__label">Next due date</label>
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
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

      <div className="field">
        <label className="field__label">Remind me before</label>
        <select
          className="select"
          value={reminderDaysBefore}
          onChange={(e) => setReminder(Number(e.target.value))}
        >
          {REMINDER_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d === 0 ? 'On the due date' : `${d} day${d > 1 ? 's' : ''} before`}
            </option>
          ))}
        </select>
      </div>

      <label className="row row--between card card--pad" style={{ cursor: 'pointer' }}>
        <div>
          <div style={{ fontWeight: 700 }}>Autopay is on</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Just a reminder — Anchor won't move money.
          </div>
        </div>
        <input
          type="checkbox"
          checked={autopay}
          onChange={(e) => setAutopay(e.target.checked)}
          style={{ width: 22, height: 22 }}
        />
      </label>

      <button className="btn btn--primary btn--block" disabled={!valid} onClick={submit}>
        {initial ? 'Save changes' : 'Add bill'}
      </button>

      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteBill(initial.id)
            onDone()
          }}
        >
          Delete bill
        </button>
      )}
    </div>
  )
}
