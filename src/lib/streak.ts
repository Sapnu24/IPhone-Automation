import type { FocusSession, Transaction, UsageLog } from '../types'
import { toISODate } from './format'

/** Set of local ISO dates on which the user did something loggable. */
export function activityDays(
  transactions: Transaction[],
  focusSessions: FocusSession[],
  usageLogs: UsageLog[],
): Set<string> {
  const days = new Set<string>()
  for (const t of transactions) days.add(t.date)
  for (const s of focusSessions) if (s.completed) days.add(toISODate(new Date(s.startedAt)))
  for (const u of usageLogs) days.add(u.date)
  return days
}

export function currentStreak(days: Set<string>, today: Date = new Date()): number {
  const d = new Date(today)
  if (!days.has(toISODate(d))) d.setDate(d.getDate() - 1) // today not logged yet is OK
  let n = 0
  while (days.has(toISODate(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function longestStreak(days: Set<string>): number {
  if (days.size === 0) return 0
  const sorted = [...days].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const cur = new Date(sorted[i])
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    run = diff === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

export interface Badge {
  id: string
  label: string
  emoji: string
  days: number
}

export const STREAK_TIERS: Badge[] = [
  { id: 'first-spark', label: 'First Spark', emoji: '🔥', days: 1 },
  { id: 'second-step', label: 'Second Step', emoji: '🌱', days: 2 },
  { id: 'pocket-ember', label: 'Pocket Ember', emoji: '🕯️', days: 3 },
  { id: 'week-keeper', label: 'Week Keeper', emoji: '🗓️', days: 7 },
  { id: 'fortnight', label: 'Fortnight', emoji: '⚡', days: 14 },
  { id: 'month-master', label: 'Month Master', emoji: '🏆', days: 30 },
]

export interface Stats {
  current: number
  longest: number
  txns: number
  budgets: number
  focus: number
  settled: number
}

export interface Achievement {
  id: string
  label: string
  emoji: string
  hint: string
  earned: (s: Stats) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-log', label: 'First Log', emoji: '🧾', hint: 'Log your first transaction', earned: (s) => s.txns >= 1 },
  { id: 'budgeter', label: 'Budgeter', emoji: '🎯', hint: 'Set a monthly budget', earned: (s) => s.budgets >= 1 },
  { id: 'focused', label: 'Focused', emoji: '🍅', hint: 'Finish a focus session', earned: (s) => s.focus >= 1 },
  { id: 'squared-up', label: 'Squared Up', emoji: '🤝', hint: 'Settle a debt or IOU', earned: (s) => s.settled >= 1 },
  { id: 'centurion', label: 'Centurion', emoji: '💯', hint: 'Log 100 transactions', earned: (s) => s.txns >= 100 },
]

/** The next streak tier the user hasn't reached yet, with progress toward it. */
export function nextTier(current: number): { tier: Badge; remaining: number; progress: number } | null {
  const tier = STREAK_TIERS.find((t) => t.days > current)
  if (!tier) return null
  return { tier, remaining: tier.days - current, progress: current / tier.days }
}
