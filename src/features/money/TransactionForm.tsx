import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store'
import { todayISO } from '../../lib/format'
import { CategoryChips, SegmentedControl } from '../../components/ui'
import { IconCamera, IconClose } from '../../components/Icons'
import { resizeImage } from '../../lib/image'
import { scanReceipt } from '../../lib/receipt'
import { getImage, putImage, remove, STORES } from '../../lib/db'
import { uid } from '../../lib/id'
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
  const validCat = cats.some((c) => c.id === categoryId) ? categoryId : cats[0]?.id ?? ''

  // ---- Receipt capture ----
  const [receiptId, setReceiptId] = useState<string | undefined>(initial?.receiptImageId)
  const [receiptURL, setReceiptURL] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanPct, setScanPct] = useState(0)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    if (initial?.receiptImageId) {
      void getImage(initial.receiptImageId).then((b) => {
        if (b && alive) {
          const u = URL.createObjectURL(b)
          urlRef.current = u
          setReceiptURL(u)
        }
      })
    }
    return () => {
      alive = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [initial?.receiptImageId])

  async function onPickFile(file: File) {
    const resized = await resizeImage(file)
    const id = uid()
    await putImage(id, resized)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const u = URL.createObjectURL(resized)
    urlRef.current = u
    setReceiptURL(u)
    setReceiptId(id)

    setScanning(true)
    setScanPct(0)
    setScanMsg('Reading receipt…')
    try {
      const res = await scanReceipt(resized, {
        preferDMY: !app.settings.locale.startsWith('en-US'),
        onProgress: setScanPct,
      })
      const filled: string[] = []
      if (res.amount) {
        setAmount((prev) => prev || String(res.amount))
        filled.push('amount')
      }
      if (res.date) {
        setDate(res.date)
        filled.push('date')
      }
      setScanMsg(
        filled.length
          ? `Filled ${filled.join(' & ')} from the receipt — please double-check.`
          : 'Could not read an amount — type it in below.',
      )
    } catch (err) {
      setScanMsg((err as Error).message)
    } finally {
      setScanning(false)
    }
  }

  async function removeReceipt() {
    if (receiptId) await remove(STORES.images, receiptId)
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setReceiptURL(null)
    setReceiptId(undefined)
    setScanMsg(null)
  }

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
      receiptImageId: receiptId,
    }
    // If we replaced an existing receipt, clean up the old orphaned image.
    if (initial?.receiptImageId && initial.receiptImageId !== receiptId) {
      await remove(STORES.images, initial.receiptImageId).catch(() => {})
    }
    if (initial) {
      await app.updateTransaction({ ...initial, ...data })
    } else {
      await app.addTransaction(data)
    }
    onDone()
  }

  async function del() {
    if (!initial) return
    if (initial.receiptImageId) await remove(STORES.images, initial.receiptImageId).catch(() => {})
    await app.deleteTransaction(initial.id)
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

      {/* Receipt scan / attach */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void onPickFile(f)
        }}
      />
      {receiptURL ? (
        <div className="card card--pad row" style={{ gap: 12 }}>
          <img
            src={receiptURL}
            alt="Receipt"
            style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 10, flex: 'none' }}
          />
          <div className="grow" style={{ minWidth: 0, fontSize: 13 }}>
            {scanning ? (
              <>
                <div style={{ fontWeight: 700 }}>Reading receipt… {scanPct}%</div>
                <div className="progress" style={{ marginTop: 6 }}>
                  <div className="progress__fill" style={{ width: `${scanPct}%` }} />
                </div>
              </>
            ) : (
              <span className="dim">{scanMsg ?? 'Receipt attached.'}</span>
            )}
          </div>
          <button className="btn btn--sm btn--ghost" onClick={removeReceipt} aria-label="Remove receipt">
            <IconClose size={16} />
          </button>
        </div>
      ) : (
        <button className="btn btn--ghost btn--block" onClick={() => fileRef.current?.click()}>
          <IconCamera size={18} /> Scan a receipt (auto-fill)
        </button>
      )}

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
        <button className="btn btn--danger btn--block" onClick={del}>
          Delete
        </button>
      )}
    </div>
  )
}
