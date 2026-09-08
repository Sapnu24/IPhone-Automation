import { useRef, useState, type ChangeEvent } from 'react'
import { useApp } from '../../store'
import Sheet from '../../components/Sheet'
import { ScreenHeader, SegmentedControl } from '../../components/ui'
import { BuzzTurnaround } from '../../components/Mascot'
import { useSync } from '../../lib/sync'
import { IconDownload, IconPlus, IconTrash, IconUpload, IconCalendar } from '../../components/Icons'
import { exportBackup, downloadText, importBackupFile } from '../../lib/backup'
import { transactionsToCSV, parseTransactionsCSV } from '../../lib/csv'
import { icsForBills } from '../../lib/ics'
import { wipeAll } from '../../lib/db'
import { CURRENCIES } from '../../lib/currencies'
import type { CategoryKind, ThemePref } from '../../types'

const PALETTE = [
  'var(--c-housing)',
  'var(--c-food)',
  'var(--c-transport)',
  'var(--c-utilities)',
  'var(--c-subs)',
  'var(--c-health)',
  'var(--c-shopping)',
  'var(--c-fun)',
  'var(--c-other)',
]

export default function SettingsScreen() {
  const app = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(null), 2600)
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await importBackupFile(file)
      await app.reloadAll()
      flash('Backup restored ✓')
    } catch (err) {
      flash((err as Error).message || 'Could not import that file.')
    }
  }

  function exportCalendar() {
    const bills = app.bills.filter((b) => !b.archived)
    if (bills.length === 0) {
      flash('Add a bill first — then export it to your calendar.')
      return
    }
    const byId = Object.fromEntries(app.categories.map((c) => [c.id, c]))
    const ics = icsForBills(bills, byId, app.settings.currency, app.settings.locale)
    downloadText('anchor-bills.ics', ics, 'text/calendar')
    flash('Calendar file created — open it to add reminders.')
  }

  function exportCSV() {
    if (app.transactions.length === 0) {
      flash('No transactions to export yet.')
      return
    }
    const csv = transactionsToCSV(
      app.transactions,
      app.settings.currency,
      (id) => app.categoryById(id)?.name ?? 'Other',
      (id) => (id ? (app.accountById(id)?.name ?? '') : ''),
    )
    downloadText('hive-transactions.csv', csv, 'text/csv')
    flash('Transactions exported (CSV).')
  }

  async function onImportCSV(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const defAcct =
        app.accounts.find((a) => !a.archived && /cash/i.test(a.name))?.id ??
        app.accounts.find((a) => !a.archived)?.id
      const txns = parseTransactionsCSV(text, app.categories, app.accounts, defAcct)
      if (txns.length === 0) {
        flash('No rows found in that CSV.')
        return
      }
      for (const t of txns) {
        await app.addTransaction({ kind: t.kind, amount: t.amount, categoryId: t.categoryId, accountId: t.accountId, note: t.note, date: t.date })
      }
      flash(`Imported ${txns.length} transaction(s).`)
    } catch {
      flash('Could not read that CSV.')
    }
  }

  async function resetAll() {
    if (!window.confirm('Erase ALL Hive data on this device? This cannot be undone.')) return
    await wipeAll()
    await app.reloadAll()
    flash('All data cleared.')
  }

  return (
    <div className="screen">
      <ScreenHeader title="Settings" />

      {msg && (
        <div className="card card--pad" style={{ background: 'var(--primary-soft)', marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <div className="section-label">Account &amp; sync</div>
      <SyncCard />

      <div className="section-label">Appearance</div>
      <div className="card card--pad stack">
        <div className="field">
          <label className="field__label">Your name (for the greeting)</label>
          <input
            className="input"
            value={app.settings.name ?? ''}
            onChange={(e) => app.updateSettings({ name: e.target.value.trim() || undefined })}
            placeholder="e.g. Pam"
            maxLength={20}
          />
        </div>
        <div className="field">
          <label className="field__label">Theme</label>
          <SegmentedControl
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={app.settings.theme}
            onChange={(v) => app.updateSettings({ theme: v as ThemePref })}
          />
        </div>
        <div className="field">
          <label className="field__label">Currency</label>
          <select
            className="select"
            value={app.settings.currency}
            onChange={(e) => {
              const c = CURRENCIES.find((x) => x.code === e.target.value)
              app.updateSettings({ currency: e.target.value, locale: c?.locale ?? 'en-US' })
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-label">Reminders &amp; data</div>
      <div className="card list">
        <button className="list__row" onClick={exportCalendar}>
          <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <IconCalendar size={20} />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Add bills to Calendar</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Export an .ics with due-date alarms (reliable iPhone reminders)
            </div>
          </div>
        </button>
        <button className="list__row" onClick={() => exportBackup()}>
          <div className="avatar" style={{ background: 'var(--surface-3)' }}>
            <IconDownload size={20} />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Export backup</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Save all your data as a JSON file
            </div>
          </div>
        </button>
        <button className="list__row" onClick={() => fileRef.current?.click()}>
          <div className="avatar" style={{ background: 'var(--surface-3)' }}>
            <IconUpload size={20} />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Restore backup</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Replace data from a backup file
            </div>
          </div>
        </button>
        <button className="list__row" onClick={exportCSV}>
          <div className="avatar" style={{ background: 'var(--surface-3)' }}>
            <IconDownload size={20} />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Export transactions (CSV)</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Open in Excel / Sheets
            </div>
          </div>
        </button>
        <button className="list__row" onClick={() => csvRef.current?.click()}>
          <div className="avatar" style={{ background: 'var(--surface-3)' }}>
            <IconUpload size={20} />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Import transactions (CSV)</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Same columns as the export
            </div>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImportFile}
        />
        <input ref={csvRef} type="file" accept="text/csv,.csv" hidden onChange={onImportCSV} />
      </div>

      <div className="section-label">Categories</div>
      <div className="card list">
        {app.categories.map((c) => (
          <div key={c.id} className="list__row">
            <div className="avatar" style={{ background: c.color }}>
              {c.icon}
            </div>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {c.kind === 'income' ? 'Income' : 'Expense'}
              </div>
            </div>
            <button
              className="btn btn--sm btn--ghost"
              aria-label={'Delete ' + c.name}
              onClick={() => app.deleteCategory(c.id)}
            >
              <IconTrash size={16} />
            </button>
          </div>
        ))}
        <button className="list__row" onClick={() => setAddCatOpen(true)}>
          <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <IconPlus size={20} />
          </div>
          <div className="grow" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Add category
          </div>
        </button>
      </div>

      <div className="section-label">Focus timer defaults</div>
      <div className="card card--pad stack">
        {(
          [
            ['workMin', 'Focus (min)'],
            ['shortMin', 'Short break (min)'],
            ['longMin', 'Long break (min)'],
            ['longEvery', 'Long break every'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="row row--between">
            <span className="dim">{label}</span>
            <input
              className="input"
              style={{ width: 90, textAlign: 'center' }}
              type="number"
              min="1"
              value={app.settings.pomodoro[key]}
              onChange={(e) =>
                app.updateSettings({
                  pomodoro: { ...app.settings.pomodoro, [key]: Math.max(1, Number(e.target.value)) },
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="section-label">Install on your iPhone</div>
      <div className="card card--pad dim" style={{ fontSize: 14, lineHeight: 1.5 }}>
        In <strong>Safari</strong>, tap the <strong>Share</strong> button, then{' '}
        <strong>Add to Home Screen</strong>. Hive will open full-screen with its own icon and work
        offline — your data stays on this device.
      </div>

      <div className="section-label">Meet Buzz</div>
      <div className="card card--pad">
        <BuzzTurnaround />
        <div className="dim" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 12 }}>
          <strong>Buzz</strong> is Hive's little bookkeeper bee — cap on, always ready to help you
          keep your money in order.
        </div>
      </div>

      <div className="section-label">About</div>
      <div className="card card--pad dim" style={{ fontSize: 14, lineHeight: 1.5 }}>
        <strong>Hive</strong> keeps everything on your device — no account, no servers. Screen-time
        limits and app-locking need a native iOS app; see the{' '}
        <a
          href="https://github.com/Sapnu24/IPhone-Automation/blob/main/docs/NATIVE_ROADMAP.md"
          target="_blank"
          rel="noreferrer"
        >
          native roadmap
        </a>
        .
      </div>

      <button className="btn btn--danger btn--block" style={{ marginTop: 20 }} onClick={resetAll}>
        Erase all data
      </button>

      <Sheet open={addCatOpen} onClose={() => setAddCatOpen(false)} title="New category">
        <AddCategoryForm onDone={() => setAddCatOpen(false)} />
      </Sheet>
    </div>
  )
}

function SyncCard() {
  const sync = useSync()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!sync.available) {
    return (
      <div className="card card--pad dim" style={{ fontSize: 14, lineHeight: 1.5 }}>
        ☁️ <strong>Cloud sync</strong> isn't switched on yet. Once it's configured, you'll be able to
        <strong> sign in with Google</strong> here to back up your data and sync it across your
        devices. Everything stays on-device until then.
      </div>
    )
  }

  const when =
    sync.lastSyncedAt != null
      ? new Date(sync.lastSyncedAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null

  async function withBusy(fn: () => Promise<void>) {
    setErr(null)
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setErr((e as Error).message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!sync.user) {
    return (
      <div className="card card--pad stack">
        <div style={{ fontWeight: 700 }}>Back up &amp; sync across devices</div>
        <div className="dim" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Sign in with Google to keep your money data safe and in sync on every device. Your data is
          stored privately in your own cloud project.
        </div>
        <button className="btn btn--primary btn--block" disabled={busy} onClick={() => void withBusy(sync.signIn)}>
          {busy ? 'Opening…' : 'Continue with Google'}
        </button>
        {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      </div>
    )
  }

  const statusLabel =
    sync.status === 'syncing'
      ? 'Syncing…'
      : sync.status === 'error'
        ? 'Sync error — will retry'
        : when
          ? `Synced · ${when}`
          : 'Synced'

  return (
    <div className="card card--pad stack">
      <div className="row" style={{ gap: 12 }}>
        <div className="avatar hex" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
          ☁️
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sync.user.displayName || sync.user.email || 'Signed in'}
          </div>
          <div
            className="muted"
            style={{ fontSize: 12, color: sync.status === 'error' ? 'var(--danger)' : undefined }}
          >
            {statusLabel}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn btn--ghost grow"
          disabled={busy || sync.status === 'syncing'}
          onClick={() => void withBusy(sync.syncNow)}
        >
          Sync now
        </button>
        <button className="btn btn--ghost grow" disabled={busy} onClick={() => void withBusy(sync.signOut)}>
          Sign out
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
    </div>
  )
}

function AddCategoryForm({ onDone }: { onDone: () => void }) {
  const app = useApp()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏷️')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [color, setColor] = useState(PALETTE[0])

  return (
    <div className="stack">
      <div className="row">
        <input
          className="input"
          style={{ width: 64, textAlign: 'center', fontSize: 24 }}
          value={icon}
          onChange={(e) => setIcon(e.target.value.slice(0, 2) || '🏷️')}
          aria-label="Emoji"
        />
        <input
          className="input grow"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoFocus
        />
      </div>
      <SegmentedControl
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        value={kind}
        onChange={(v) => setKind(v as CategoryKind)}
      />
      <div className="field">
        <label className="field__label">Color</label>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="pick color"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: c,
                border: color === c ? '3px solid var(--text)' : '2px solid var(--border)',
              }}
            />
          ))}
        </div>
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={!name.trim()}
        onClick={async () => {
          await app.addCategory({ name: name.trim(), icon, color, kind })
          onDone()
        }}
      >
        Add category
      </button>
    </div>
  )
}
