import { useMemo, useState } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconPlus, IconSwap } from '../../components/Icons'
import { accountBalance, walletTotals } from '../../lib/accounts'
import { formatMoney, todayISO } from '../../lib/format'
import { CURRENCIES } from '../../lib/currencies'
import {
  ACCOUNT_TYPES,
  type Account,
  type AccountGroup,
  type AccountType,
} from '../../types'

const ACCOUNT_COLORS = [
  'var(--c-income)',
  'var(--c-housing)',
  'var(--c-utilities)',
  'var(--c-fun)',
  'var(--c-health)',
  'var(--c-shopping)',
  'var(--c-transport)',
  'var(--c-other)',
]

type Tab = 'all' | 'asset' | 'liability'

export default function WalletScreen() {
  const app = useApp()
  const { currency: base, locale } = app.settings
  const [tab, setTab] = useState<Tab>('all')
  const [acctSheet, setAcctSheet] = useState<{ open: boolean; edit?: Account }>({ open: false })
  const [transferOpen, setTransferOpen] = useState(false)

  const totals = useMemo(
    () => walletTotals(app.accounts, app.transactions, app.transfers),
    [app.accounts, app.transactions, app.transfers],
  )
  const baseTotals = totals.find((t) => t.currency === base)
  const others = totals.filter((t) => t.currency !== base)

  const accounts = app.accounts
    .filter((a) => !a.archived && (tab === 'all' || a.group === tab))
    .map((a) => ({ a, bal: accountBalance(a, app.transactions, app.transfers) }))

  return (
    <div className="screen">
      <ScreenHeader title="Wallet" subtitle="Accounts & balances" />

      {/* Net worth hero */}
      <div className="card card--pad hero-honey">
        <div style={{ opacity: 0.9, fontWeight: 700, fontSize: 13 }}>Net worth</div>
        <div className="big-number" style={{ marginTop: 4 }}>
          {formatMoney(baseTotals?.net ?? 0, base, locale)}
        </div>
        <div className="row" style={{ gap: 18, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Assets</div>
            <div className="tabular" style={{ fontWeight: 700 }}>
              {formatMoney(baseTotals?.assets ?? 0, base, locale)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Liabilities</div>
            <div className="tabular" style={{ fontWeight: 700 }}>
              {formatMoney(baseTotals?.liabilities ?? 0, base, locale)}
            </div>
          </div>
        </div>
        {others.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
            {others.map((t) => (
              <span key={t.currency} style={{ marginRight: 12 }}>
                {formatMoney(t.net, t.currency, locale)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 12, margin: '14px 0' }}>
        <button className="btn btn--primary grow" onClick={() => setAcctSheet({ open: true })}>
          <IconPlus size={18} /> Account
        </button>
        <button
          className="btn grow"
          onClick={() => setTransferOpen(true)}
          disabled={app.accounts.length < 2}
        >
          <IconSwap size={18} /> Transfer
        </button>
      </div>

      <SegmentedControl
        options={[
          { value: 'all', label: 'All' },
          { value: 'asset', label: 'Assets' },
          { value: 'liability', label: 'Liabilities' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      <div style={{ marginTop: 14 }}>
        {accounts.length === 0 ? (
          <EmptyState emoji="🏦" title="No accounts here" subtitle="Tap Account to add one." />
        ) : (
          <div className="card list">
            {accounts.map(({ a, bal }) => (
              <button key={a.id} className="list__row" onClick={() => setAcctSheet({ open: true, edit: a })}>
                <div className="avatar hex" style={{ background: a.color }}>
                  {a.icon}
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label} · {a.currency}
                  </div>
                </div>
                <span
                  className="tabular"
                  style={{ fontWeight: 700, color: bal < 0 ? 'var(--danger)' : 'var(--text)' }}
                >
                  {formatMoney(bal, a.currency, locale)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={acctSheet.open}
        onClose={() => setAcctSheet({ open: false })}
        title={acctSheet.edit ? 'Edit account' : 'New account'}
      >
        <AccountForm initial={acctSheet.edit} onDone={() => setAcctSheet({ open: false })} />
      </Sheet>

      <Sheet open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer">
        <TransferForm onDone={() => setTransferOpen(false)} />
      </Sheet>
    </div>
  )
}

function AccountForm({ initial, onDone }: { initial?: Account; onDone: () => void }) {
  const app = useApp()
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccountType>(initial?.type ?? 'cash')
  const meta = ACCOUNT_TYPES.find((t) => t.value === type)!
  const group: AccountGroup = meta.group
  const [currency, setCurrency] = useState(initial?.currency ?? app.settings.currency)
  const [icon, setIcon] = useState(initial?.icon ?? meta.icon)
  const [color, setColor] = useState(initial?.color ?? ACCOUNT_COLORS[0])
  // Show liabilities as a positive "amount owed"; store negative internally.
  const [balance, setBalance] = useState(
    initial ? String(Math.abs(initial.openingBalance)) : '',
  )

  const value = parseFloat(balance)
  const valid = name.trim() && currency

  async function submit() {
    const raw = Number.isNaN(value) ? 0 : Math.round(value * 100) / 100
    const openingBalance = group === 'liability' ? -Math.abs(raw) : raw
    const data = { name: name.trim(), type, group, currency, openingBalance, icon, color }
    if (initial) await app.updateAccount({ ...initial, ...data })
    else await app.addAccount(data)
    onDone()
  }

  return (
    <div className="stack">
      <div className="row">
        <input
          className="input"
          style={{ width: 64, textAlign: 'center', fontSize: 24 }}
          value={icon}
          onChange={(e) => setIcon(e.target.value.slice(0, 2) || meta.icon)}
          aria-label="Emoji"
        />
        <input
          className="input grow"
          placeholder="Account name (e.g. GCash, BPI)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field__label">Type</label>
        <select
          className="select"
          value={type}
          onChange={(e) => {
            const t = e.target.value as AccountType
            setType(t)
            const m = ACCOUNT_TYPES.find((x) => x.value === t)
            if (m && (!initial || icon === meta.icon)) setIcon(m.icon)
          }}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label">
          {group === 'liability' ? 'Amount currently owed' : 'Current balance'} ({currency})
        </label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field__label">Currency</label>
        <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label">Color</label>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="pick color"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: c,
                border: color === c ? '3px solid var(--text)' : '2px solid var(--border)',
              }}
            />
          ))}
        </div>
      </div>

      <button className="btn btn--primary btn--block" disabled={!valid} onClick={submit}>
        {initial ? 'Save account' : 'Add account'}
      </button>

      {initial && (
        <button
          className="btn btn--danger btn--block"
          onClick={async () => {
            await app.deleteAccount(initial.id)
            onDone()
          }}
        >
          Delete account
        </button>
      )}
    </div>
  )
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const app = useApp()
  const accts = app.accounts.filter((a) => !a.archived)
  const [from, setFrom] = useState(accts[0]?.id ?? '')
  const [to, setTo] = useState(accts[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const value = parseFloat(amount)
  const valid = from && to && from !== to && !Number.isNaN(value) && value > 0

  return (
    <div className="stack">
      <div className="field">
        <label className="field__label">From</label>
        <select className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
          {accts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field__label">To</label>
        <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
          {accts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
            </option>
          ))}
        </select>
      </div>
      {from === to && <div className="pill pill--warn">Pick two different accounts.</div>}
      <div className="field">
        <label className="field__label">Amount</label>
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
        <label className="field__label">Date</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={!valid}
        onClick={async () => {
          await app.addTransfer({ fromAccountId: from, toAccountId: to, amount: Math.round(value * 100) / 100, date })
          onDone()
        }}
      >
        Transfer
      </button>
    </div>
  )
}
