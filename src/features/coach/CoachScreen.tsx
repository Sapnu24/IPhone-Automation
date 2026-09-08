import { useState } from 'react'
import Sheet from '../../components/Sheet'
import { ScreenHeader } from '../../components/ui'
import { IconCheck } from '../../components/Icons'

interface Lesson {
  id: string
  emoji: string
  title: string
  minutes: number
  summary: string
  body: string[]
}

const LESSONS: Lesson[] = [
  {
    id: '50-30-20',
    emoji: '🥧',
    title: '50/30/20, but make it real',
    minutes: 3,
    summary: 'A simple way to split your money into needs, wants, and savings.',
    body: [
      'A classic starting point: aim to spend about 50% of your take-home pay on needs (rent, food, utilities, transport), 30% on wants (dining out, subscriptions, fun), and 20% on savings and debt payments.',
      'It is a guide, not a rule. If your rent is high, your needs slice may be bigger — the point is to give every peso a job before the month starts.',
      'In Hive: set category budgets that roughly follow these buckets, then let the Home “safe to spend” number keep you honest.',
    ],
  },
  {
    id: 'emergency-fund',
    emoji: '🛟',
    title: 'Emergency fund first',
    minutes: 3,
    summary: 'Save for real emergencies so one hard month does not become new debt.',
    body: [
      'Before investing or aggressive extra debt payments, build a small cushion — start with one month of essential expenses, then work toward three.',
      'Keep it somewhere separate and boring (a savings account you will not touch). Its only job is to turn a crisis into an inconvenience.',
      'In Hive: make a “Savings” account in your Wallet and transfer into it right after payday — pay yourself first.',
    ],
  },
  {
    id: 'compound-interest',
    emoji: '🌱',
    title: 'Compound interest works both ways',
    minutes: 4,
    summary: 'It grows your savings — and your debt. Put it on your side.',
    body: [
      'Compounding means you earn returns on your returns. Small amounts invested consistently can grow surprisingly large given time.',
      'The same force powers credit-card debt: unpaid balances grow on top of themselves. That is why high-interest debt is usually the best “investment” to pay off.',
      'Time matters more than amount. Starting small and early usually beats starting big and late.',
    ],
  },
  {
    id: 'needs-wants',
    emoji: '⚖️',
    title: 'Needs vs wants (the honest version)',
    minutes: 2,
    summary: 'A quick test to spend on what actually matters to you.',
    body: [
      'Before a purchase, pause and ask: would I still want this in a week? Does it move me toward something I care about?',
      'Wants are not bad — guilt-free spending on what you love is the reward for planning. The goal is to cut the wants you will not even remember.',
      'In Hive: use Chat to log fast (“220 starbucks”), then check Insights at month-end to see which wants were worth it.',
    ],
  },
  {
    id: 'lifestyle-inflation',
    emoji: '🎈',
    title: 'Beat lifestyle inflation',
    minutes: 3,
    summary: 'When income rises, keep some of the raise instead of spending it all.',
    body: [
      'A raise feels great — but if every peso of it goes to a nicer lifestyle, your savings rate never improves.',
      'Try to “save the raise”: when income goes up, send at least half of the increase straight to savings or debt before you adjust your spending.',
      'Automate it so the money never sits in your spending account tempting you.',
    ],
  },
  {
    id: 'sinking-funds',
    emoji: '🪣',
    title: 'Sinking funds beat surprises',
    minutes: 3,
    summary: 'Save a little each month for big, predictable, non-monthly costs.',
    body: [
      'Tuition, insurance, Christmas, a new phone — these are not emergencies, they are predictable. A sinking fund saves a small amount monthly so the big bill is already covered.',
      'Divide the expected cost by the months until it is due, and set that aside each month.',
      'In Hive: track these as recurring bills in Plan, or a dedicated savings account you top up automatically.',
    ],
  },
]

const KEY = 'anchor.coach.read.v1'
function loadRead(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export default function CoachScreen() {
  const [read, setRead] = useState<Set<string>>(() => loadRead())
  const [open, setOpen] = useState<Lesson | null>(null)

  function markRead(id: string) {
    setRead((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className="screen">
      <ScreenHeader title="Buzz Coach" subtitle="Simple lessons for everyday money" />

      <div className="card card--pad row row--between">
        <span className="dim">Progress</span>
        <span style={{ fontWeight: 800 }}>
          {read.size} / {LESSONS.length} read
        </span>
      </div>

      <div className="section-label">Foundations</div>
      <div className="card list">
        {LESSONS.map((l) => (
          <button key={l.id} className="list__row" onClick={() => setOpen(l)}>
            <div className="avatar hex" style={{ background: 'var(--primary-soft)', fontSize: 18 }}>
              {l.emoji}
            </div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {l.minutes} min · {l.summary}
              </div>
            </div>
            {read.has(l.id) && <IconCheck size={18} className="" />}
          </button>
        ))}
      </div>

      <Sheet open={open != null} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="stack">
            <div className="muted" style={{ fontSize: 13 }}>
              {open.emoji} {open.minutes} min read
            </div>
            {open.body.map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.55 }}>
                {p}
              </p>
            ))}
            <button
              className="btn btn--primary btn--block"
              onClick={() => {
                markRead(open.id)
                setOpen(null)
              }}
            >
              <IconCheck size={17} /> {read.has(open.id) ? 'Read' : 'Mark as read'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
