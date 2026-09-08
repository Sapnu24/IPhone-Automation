import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store'
import { Bee } from '../../components/Mascot'
import { IconReset } from '../../components/Icons'
import { answerQuestion, interpret, type Action, type Ctx } from '../../lib/assistant'
import { formatMoney, todayISO } from '../../lib/format'

interface LoggedItem {
  label: string
}
interface Msg {
  id: string
  role: 'user' | 'assistant'
  text?: string
  card?: { items: LoggedItem[]; txnIds: string[]; transferIds: string[]; undone?: boolean }
}

const EXAMPLES = ['500 mcdo', 'spent 120 grab', 'how much on food?', 'balance?']

let seq = 0
const mid = () => `m${Date.now()}_${seq++}`

export default function ChatScreen() {
  const app = useApp()
  const { currency, locale } = app.settings
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: "Hi! I'm Buzz. Type things like “500 mcdo”, “spent 120 grab from gcash”, or ask “how much did I spend on food?”. I run fully offline. 🐝",
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const defaultAccount =
    app.accounts.find((a) => !a.archived && /cash/i.test(a.name)) ??
    app.accounts.find((a) => !a.archived)

  function buildCtx(): Ctx {
    return {
      categories: app.categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
      accounts: app.accounts.filter((a) => !a.archived).map((a) => ({ id: a.id, name: a.name })),
      defaultAccountId: defaultAccount?.id,
    }
  }

  function labelFor(a: Action): string {
    const money = (n: number) => formatMoney(n, currency, locale)
    if (a.type === 'transfer') {
      const from = app.accountById(a.fromAccountId)?.name ?? 'account'
      const to = app.accountById(a.toAccountId)?.name ?? 'account'
      return `Transfer: ${money(a.amount)} from ${from} to ${to}`
    }
    const cat = app.categoryById(a.categoryId)?.name ?? 'Other'
    const acct = a.accountId ? app.accountById(a.accountId)?.name : undefined
    const verb = a.type === 'income' ? 'Income' : 'Expense'
    return `${verb}: ${money(a.amount)} in ${cat}${acct ? ` from ${acct}` : ''}${a.note ? ` for ${a.note}` : ''}`
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((m) => [...m, { id: mid(), role: 'user', text: trimmed }])
    setInput('')

    const results = interpret(trimmed, buildCtx())
    const items: LoggedItem[] = []
    const txnIds: string[] = []
    const transferIds: string[] = []
    const answers: string[] = []

    for (const r of results) {
      if ('action' in r) {
        const a = r.action
        if (a.type === 'transfer') {
          const tr = await app.addTransfer({ fromAccountId: a.fromAccountId, toAccountId: a.toAccountId, amount: a.amount, date: todayISO() })
          transferIds.push(tr.id)
        } else {
          const t = await app.addTransaction({ kind: a.type, amount: a.amount, categoryId: a.categoryId, accountId: a.accountId, note: a.note, date: todayISO() })
          txnIds.push(t.id)
        }
        items.push({ label: labelFor(a) })
      } else if ('question' in r) {
        answers.push(
          answerQuestion(r.question, {
            transactions: app.transactions,
            bills: app.bills,
            occurrences: app.occurrences,
            accounts: app.accounts,
            transfers: app.transfers,
            categories: app.categories,
            settings: app.settings,
          }),
        )
      }
    }

    const out: Msg[] = []
    if (items.length) out.push({ id: mid(), role: 'assistant', card: { items, txnIds, transferIds } })
    if (answers.length) out.push({ id: mid(), role: 'assistant', text: answers.join('\n\n') })
    if (!items.length && !answers.length) {
      out.push({
        id: mid(),
        role: 'assistant',
        text: "I couldn't read that. Try an amount + what it was — e.g. “350 groceries” — or ask “what's due?”.",
      })
    }
    setMessages((m) => [...m, ...out])
  }

  async function undo(msgId: string) {
    const msg = messages.find((m) => m.id === msgId)
    if (!msg?.card) return
    for (const id of msg.card.txnIds) await app.deleteTransaction(id)
    for (const id of msg.card.transferIds) await app.deleteTransfer(id)
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, card: { ...x.card!, undone: true } } : x)))
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="screen__header">
        <div className="row" style={{ gap: 12 }}>
          <div className="hex" style={{ width: 44, height: 44, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flex: 'none' }}>
            <Bee size={38} />
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <div className="screen__title" style={{ fontSize: 22 }}>
                Chat
              </div>
              <span className="pill" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: 'none', fontSize: 11 }}>
                BETA
              </span>
            </div>
            <div className="screen__subtitle">Log money or ask, in plain language · offline</div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ flex: 1, gap: 12, paddingBottom: 90 }}>
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
              <div style={{ background: 'var(--primary)', color: '#fff', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                {m.text}
              </div>
            </div>
          ) : m.card ? (
            <div key={m.id} className="card card--pad" style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'var(--success-soft)' }}>
              <span className="pill pill--ok" style={{ marginBottom: 8 }}>
                {m.card.undone ? 'Undone' : `✓ Logged ${m.card.items.length}`}
              </span>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, textDecoration: m.card.undone ? 'line-through' : 'none', opacity: m.card.undone ? 0.6 : 1 }}>
                {m.card.items.map((it, i) => (
                  <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                    {it.label}
                  </li>
                ))}
              </ul>
              {!m.card.undone && (
                <button className="btn btn--sm btn--ghost" style={{ marginTop: 10 }} onClick={() => undo(m.id)}>
                  <IconReset size={15} /> Undo
                </button>
              )}
            </div>
          ) : (
            <div key={m.id} style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
              <div className="bubble" style={{ whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: 'var(--maxw)',
          padding: '8px 12px',
          background: 'color-mix(in srgb, var(--bg-elev) 92%, transparent)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} className="pill" style={{ flex: 'none' }} onClick={() => void send(ex)}>
              {ex}
            </button>
          ))}
        </div>
        <form
          className="row"
          style={{ gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
        >
          <input
            className="input grow"
            placeholder="e.g. 500 mcdo, 220 starbucks"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn--primary" type="submit" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
