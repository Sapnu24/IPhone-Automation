import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../store'
import { Bee } from '../../components/Mascot'
import { interpret, type Action, type Ctx } from '../../lib/assistant'
import { formatMoney, todayISO } from '../../lib/format'

/** Deep-link logger: an iOS Shortcut / share sheet opens
 *  #/log?text=<a bank message>  (or ?amount=&type=&note=) and this logs it,
 *  then shows a confirmation. Lets messages become transactions with one tap,
 *  without ever handing over account numbers or inbox access. */
export default function QuickLogScreen() {
  const app = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [labels, setLabels] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || app.loading) return
    ran.current = true
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.loading])

  function buildCtx(): Ctx {
    const defaultAccount =
      app.accounts.find((a) => !a.archived && /cash/i.test(a.name)) ??
      app.accounts.find((a) => !a.archived)
    return {
      categories: app.categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
      accounts: app.accounts.filter((a) => !a.archived).map((a) => ({ id: a.id, name: a.name })),
      defaultAccountId: defaultAccount?.id,
    }
  }

  const money = (n: number) => formatMoney(n, app.settings.currency, app.settings.locale)

  async function apply(a: Action): Promise<string> {
    if (a.type === 'transfer') {
      await app.addTransfer({ fromAccountId: a.fromAccountId, toAccountId: a.toAccountId, amount: a.amount, date: todayISO() })
      return `Transfer ${money(a.amount)}`
    }
    if (a.type === 'subscription') {
      const dupe = app.bills.find(
        (b) => !b.archived && b.categoryId === 'cat-subs' && b.name.toLowerCase() === a.name.toLowerCase(),
      )
      if (dupe) return `Already tracking ${a.name}`
      await app.addBill({
        name: a.name, icon: a.icon, amount: a.amount, categoryId: a.categoryId,
        dueDate: todayISO(), recurrence: 'monthly', reminderDaysBefore: 2, autopay: false,
      })
      return `Subscription: ${money(a.amount)} · ${a.name}`
    }
    await app.addTransaction({ kind: a.type, amount: a.amount, categoryId: a.categoryId, accountId: a.accountId, note: a.note, date: todayISO() })
    const cat = app.categoryById(a.categoryId)?.name ?? 'Other'
    const verb = a.type === 'income' ? 'Income' : 'Expense'
    return `${verb}: ${money(a.amount)} · ${cat}${a.note ? ` · ${a.note}` : ''}`
  }

  async function run() {
    const raw = params.get('text')
    const amount = params.get('amount')
    const text =
      raw ||
      (amount ? `${params.get('type') === 'income' ? '+' : ''}${amount} ${params.get('note') ?? ''}`.trim() : null)
    if (!text) {
      setError('Nothing to log — this link needs a “text” or “amount”.')
      return
    }
    try {
      const out: string[] = []
      for (const r of interpret(text, buildCtx())) {
        if ('action' in r) out.push(await apply(r.action))
      }
      if (out.length) setLabels(out)
      else setError("Couldn't find a transaction in that message.")
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.')
    }
  }

  return (
    <div className="screen" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <div className="hex" style={{ width: 72, height: 72, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}>
          <Bee size={60} />
        </div>
        {labels.length > 0 ? (
          <>
            <h2 style={{ margin: 0 }}>Logged ✓</h2>
            <div className="card card--pad stack" style={{ width: '100%', background: 'var(--success-soft)' }}>
              {labels.map((l, i) => (
                <div key={i} style={{ fontWeight: 600 }}>{l}</div>
              ))}
            </div>
          </>
        ) : error ? (
          <>
            <h2 style={{ margin: 0 }}>Hmm 🤔</h2>
            <div className="card card--pad dim" style={{ width: '100%' }}>{error}</div>
          </>
        ) : (
          <div className="dim">Logging…</div>
        )}
        <button className="btn btn--primary btn--block" onClick={() => nav('/')}>
          Open Hive
        </button>
      </div>
    </div>
  )
}
