import { useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconChevron, IconPlus, IconSwap, IconTrash } from '../../components/Icons'
import { convert, FX_CODES } from '../../lib/fx'
import { addMonthsClamped } from '../../lib/recurrence'
import { daysUntil, formatMoney, formatDate, parseISO, toISODate, todayISO } from '../../lib/format'
import type { Warranty } from '../../types'

type Tool = 'convert' | 'vat' | 'shopping' | 'warranty'

const TOOLS: { id: Tool; label: string; sub: string; icon: string }[] = [
  { id: 'convert', label: 'Currency exchange', sub: 'Quick offline converter', icon: '💱' },
  { id: 'vat', label: 'VAT & % calculator', sub: 'Add/remove tax, percentages', icon: '🧮' },
  { id: 'shopping', label: 'Shopping list', sub: 'Check items off, see the total', icon: '🛒' },
  { id: 'warranty', label: 'Warranty tracker', sub: 'Never miss an expiry', icon: '🧾' },
]

export default function ToolsScreen() {
  const [tool, setTool] = useState<Tool | null>(null)

  if (tool) {
    const meta = TOOLS.find((t) => t.id === tool)!
    return (
      <div className="screen">
        <ScreenHeader
          title={meta.label}
          right={
            <button className="btn btn--sm btn--ghost" onClick={() => setTool(null)}>
              Tools
            </button>
          }
        />
        {tool === 'convert' && <Converter />}
        {tool === 'vat' && <VatCalc />}
        {tool === 'shopping' && <ShoppingList />}
        {tool === 'warranty' && <WarrantyTracker />}
      </div>
    )
  }

  return (
    <div className="screen">
      <ScreenHeader title="Tools" subtitle="Handy money helpers" />
      <div className="card list">
        {TOOLS.map((t) => (
          <button key={t.id} className="list__row" onClick={() => setTool(t.id)}>
            <div className="avatar hex" style={{ background: 'var(--primary-soft)', fontSize: 18 }}>
              {t.icon}
            </div>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{t.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {t.sub}
              </div>
            </div>
            <IconChevron size={16} className="muted" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Converter() {
  const app = useApp()
  const [amount, setAmount] = useState('1000')
  const [from, setFrom] = useState(app.settings.currency)
  const [to, setTo] = useState(app.settings.currency === 'USD' ? 'PHP' : 'USD')
  const value = parseFloat(amount)
  const result = Number.isNaN(value) ? null : convert(value, from, to)

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">Amount</label>
        <input className="input" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
        <div className="field grow">
          <label className="field__label">From</label>
          <select className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
            {FX_CODES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn--ghost"
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
          aria-label="Swap"
        >
          <IconSwap size={18} />
        </button>
        <div className="field grow">
          <label className="field__label">To</label>
          <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
            {FX_CODES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card card--pad hero-honey" style={{ textAlign: 'center' }}>
        <div style={{ opacity: 0.9, fontSize: 13, fontWeight: 700 }}>
          {Number.isNaN(value) ? 0 : value.toLocaleString()} {from} =
        </div>
        <div className="big-number">{result == null ? '—' : formatMoney(result, to, app.settings.locale)}</div>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Approximate offline rates — for quick estimates, not live pricing.
      </div>
    </div>
  )
}

function VatCalc() {
  const app = useApp()
  const { currency, locale } = app.settings
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('12')
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const a = parseFloat(amount)
  const r = parseFloat(rate)
  const money = (n: number) => formatMoney(n, currency, locale)

  let base = 0
  let tax = 0
  let total = 0
  if (!Number.isNaN(a) && !Number.isNaN(r)) {
    if (mode === 'add') {
      base = a
      tax = (a * r) / 100
      total = a + tax
    } else {
      total = a
      base = a / (1 + r / 100)
      tax = a - base
    }
  }

  return (
    <div className="stack">
      <SegmentedControl
        options={[
          { value: 'add', label: 'Add tax' },
          { value: 'remove', label: 'Remove tax' },
        ]}
        value={mode}
        onChange={(v) => setMode(v as 'add' | 'remove')}
      />
      <div className="field">
        <label className="field__label">Amount ({currency})</label>
        <input className="input" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Rate %</label>
        <input className="input" type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <div className="card card--pad stack">
        <div className="row row--between">
          <span className="dim">Net</span>
          <span className="tabular" style={{ fontWeight: 700 }}>{money(base)}</span>
        </div>
        <div className="row row--between">
          <span className="dim">Tax ({Number.isNaN(r) ? 0 : r}%)</span>
          <span className="tabular" style={{ fontWeight: 700 }}>{money(tax)}</span>
        </div>
        <div className="row row--between" style={{ fontSize: 18 }}>
          <span style={{ fontWeight: 800 }}>Total</span>
          <span className="tabular" style={{ fontWeight: 800 }}>{money(total)}</span>
        </div>
      </div>
    </div>
  )
}

function ShoppingList() {
  const app = useApp()
  const { currency, locale } = app.settings
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const items = [...app.shoppingItems].sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt - b.createdAt)
  const remaining = items.filter((i) => !i.checked).reduce((s, i) => s + (i.price ?? 0), 0)

  async function add() {
    if (!name.trim()) return
    const p = parseFloat(price)
    await app.addShoppingItem({ name: name.trim(), price: Number.isNaN(p) ? undefined : p })
    setName('')
    setPrice('')
  }

  return (
    <div className="stack">
      <div className="row" style={{ gap: 8 }}>
        <input className="input grow" placeholder="Add item…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input className="input" style={{ width: 90 }} type="number" inputMode="decimal" placeholder="₱" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="btn btn--primary" onClick={add} aria-label="Add">
          <IconPlus size={20} />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState emoji="🛒" title="List is empty" subtitle="Add what you need to buy." />
      ) : (
        <>
          <div className="card card--pad row row--between">
            <span className="dim">Est. remaining</span>
            <span className="tabular" style={{ fontWeight: 800 }}>{formatMoney(remaining, currency, locale)}</span>
          </div>
          <div className="card list">
            {items.map((i) => (
              <div key={i.id} className="list__row">
                <input
                  type="checkbox"
                  checked={i.checked}
                  onChange={() => app.updateShoppingItem({ ...i, checked: !i.checked })}
                  style={{ width: 22, height: 22 }}
                />
                <div className="grow" style={{ textDecoration: i.checked ? 'line-through' : 'none', opacity: i.checked ? 0.55 : 1 }}>
                  {i.name}
                </div>
                {i.price != null && <span className="tabular dim">{formatMoney(i.price, currency, locale)}</span>}
                <button className="btn btn--sm btn--ghost" onClick={() => app.deleteShoppingItem(i.id)} aria-label="Delete">
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
          {items.some((i) => i.checked) && (
            <button className="btn btn--ghost btn--block" onClick={() => app.clearCheckedShopping()}>
              Clear checked
            </button>
          )}
        </>
      )}
    </div>
  )
}

function WarrantyTracker() {
  const app = useApp()
  const { locale } = app.settings
  const now = new Date()
  const [sheet, setSheet] = useState<{ open: boolean; edit?: Warranty }>({ open: false })

  const rows = app.warranties
    .map((w) => {
      const expiry = toISODate(addMonthsClamped(parseISO(w.purchaseDate), w.months))
      return { w, expiry, days: daysUntil(expiry, now) }
    })
    .sort((a, b) => a.expiry.localeCompare(b.expiry))

  return (
    <div className="stack">
      <button className="btn btn--primary btn--block" onClick={() => setSheet({ open: true })}>
        <IconPlus size={18} /> Add item
      </button>
      {rows.length === 0 ? (
        <EmptyState emoji="🧾" title="No warranties tracked" subtitle="Add gadgets & appliances to track expiry." />
      ) : (
        <div className="card list">
          {rows.map(({ w, expiry, days }) => (
            <button key={w.id} className="list__row" onClick={() => setSheet({ open: true, edit: w })}>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  expires {formatDate(expiry, locale)}
                </div>
              </div>
              <span className={'pill ' + (days < 0 ? 'pill--danger' : days < 30 ? 'pill--warn' : 'pill--ok')}>
                {days < 0 ? 'Expired' : `${days}d left`}
              </span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={sheet.open} onClose={() => setSheet({ open: false })} title={sheet.edit ? 'Edit item' : 'Add item'}>
        <WarrantyForm initial={sheet.edit} onDone={() => setSheet({ open: false })} />
      </Sheet>
    </div>
  )
}

function WarrantyForm({ initial, onDone }: { initial?: Warranty; onDone: () => void }) {
  const app = useApp()
  const [name, setName] = useState(initial?.name ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayISO())
  const [months, setMonths] = useState(String(initial?.months ?? 12))
  const [note, setNote] = useState(initial?.note ?? '')
  const m = parseInt(months, 10)
  const valid = name.trim() && purchaseDate && !Number.isNaN(m) && m > 0

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">Item</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="iPhone, aircon, laptop…" maxLength={40} autoFocus />
      </div>
      <div className="field">
        <label className="field__label">Purchase date</label>
        <input className="input" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Warranty length (months)</label>
        <input className="input" type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Note (optional)</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} />
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={!valid}
        onClick={async () => {
          const data = { name: name.trim(), purchaseDate, months: m, note: note.trim() || undefined }
          if (initial) await app.updateWarranty({ ...initial, ...data })
          else await app.addWarranty(data)
          onDone()
        }}
      >
        {initial ? 'Save' : 'Add item'}
      </button>
      {initial && (
        <button className="btn btn--danger btn--block" onClick={async () => { await app.deleteWarranty(initial.id); onDone() }}>
          Delete
        </button>
      )}
    </div>
  )
}
