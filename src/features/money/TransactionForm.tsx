import { useState } from 'react'
import { useApp } from '../../store'
import { todayISO } from '../../lib/format'
import { CategoryChips, SegmentedControl } from '../../components/ui'
import type { Transaction, TxnKind } from '../../types'

interface Props {
  initial?: Transaction
  onDone: () => void
}

export default function TransactionForm({ initial, onDone }: Props) {
  const app = useApp()
  const [kind, setKind] = useState<TxnKind>(initial?.kind ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())

  const cats = app.categories.filter((c) => c.kind === kind && !c.archived)
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? cats[0]?.id ?? app.categories[0]?.id ?? '',
  )

  // Keep the selected category valid when switching expense/income.
  const validCat = cats.some((c) => c.id === categoryId) ? categoryId : cats[0]?.id ?? ''

  const value = parseFloat(amount)
  const valid = !Number.isNaN(value) && value > 0 && validCat

  async function submit() {
    if (!valid) return
    const data = {
      kind,
      amount: Math.round(value * 100) / 100,
      categoryId: validCat,
      note: note.trim() || undefined,
      date,
    }
    if (initial) await app.updateTransaction({ ...initial, ...data })
    else await app.addTransaction(data)
    onDone()
  }

  return (
    <div className="stack">
      <SegmentedControl
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        value={kind}
        onChange={(v) => setKind(v as TxnKind)}
      />

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
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field__label">Category</label>
        <CategoryChips categories={cats} selectedId={validCat} onSelect={setCategoryId} />
      </div>

      <div className="field">
        <label className="field__label">Note (optional)</label>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={kind === 'income' ? 'Salary, refund…' : 'Coffee, groceries…'}
          maxLength={80}
        />
      </div>

      <div className="field">
        <label className="field__label">Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <button className="btn btn--primary btn--block" disabled={!valid} onClick={submit}>
        {initial ? 'Save changes' : 'Add ' + kind}
      </button>

      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteTransaction(initial.id)
            onDone()
          }}
        >
          Delete
        </button>
      )}
    </div>
  )
}
