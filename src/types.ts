// ---- Domain types -------------------------------------------------------

export type CategoryKind = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  icon: string // emoji
  color: string // a CSS color, typically a var(--c-*) token reference
  kind: CategoryKind
  archived?: boolean
}

export type TxnKind = 'expense' | 'income'

export interface Transaction {
  id: string
  kind: TxnKind
  amount: number // positive number in the app's currency
  categoryId: string
  note?: string
  date: string // local ISO date 'YYYY-MM-DD'
  createdAt: number
  receiptImageId?: string
}

export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly'

export interface Bill {
  id: string
  name: string
  amount: number
  categoryId: string
  dueDate: string // anchor due date, local ISO 'YYYY-MM-DD'
  recurrence: Recurrence
  reminderDaysBefore: number
  autopay: boolean
  createdAt: number
  archived?: boolean
}

/** A record that a specific occurrence of a bill (identified by its due date)
 *  has been paid. Absence of a record means that occurrence is still due. */
export interface BillOccurrence {
  id: string
  billId: string
  dueDate: string // the occurrence's due date this payment settles
  paidAt: number
}

export interface Budget {
  id: string
  categoryId: string
  monthlyLimit: number
}

export type FocusType = 'work' | 'shortBreak' | 'longBreak'

export interface FocusSession {
  id: string
  startedAt: number
  endedAt?: number
  durationMin: number
  type: FocusType
  taskLabel?: string
  completed: boolean
}

export interface UsageLog {
  id: string
  date: string // local ISO date
  label: string
  minutes: number
  createdAt: number
}

export type ThemePref = 'system' | 'light' | 'dark'

export interface PomodoroConfig {
  workMin: number
  shortMin: number
  longMin: number
  longEvery: number // number of work sessions before a long break
}

export interface Settings {
  currency: string
  locale: string
  theme: ThemePref
  pomodoro: PomodoroConfig
}

// ---- Defaults -----------------------------------------------------------

export function defaultSettings(): Settings {
  return {
    currency: 'USD',
    locale: 'en-US',
    theme: 'system',
    pomodoro: { workMin: 25, shortMin: 5, longMin: 15, longEvery: 4 },
  }
}

export function defaultCategories(): Category[] {
  return [
    { id: 'cat-housing', name: 'Housing', icon: '🏠', color: 'var(--c-housing)', kind: 'expense' },
    { id: 'cat-food', name: 'Food & Groceries', icon: '🍽️', color: 'var(--c-food)', kind: 'expense' },
    { id: 'cat-transport', name: 'Transport', icon: '🚗', color: 'var(--c-transport)', kind: 'expense' },
    { id: 'cat-utilities', name: 'Utilities', icon: '💡', color: 'var(--c-utilities)', kind: 'expense' },
    { id: 'cat-subs', name: 'Subscriptions', icon: '🔁', color: 'var(--c-subs)', kind: 'expense' },
    { id: 'cat-health', name: 'Health', icon: '🩺', color: 'var(--c-health)', kind: 'expense' },
    { id: 'cat-shopping', name: 'Shopping', icon: '🛍️', color: 'var(--c-shopping)', kind: 'expense' },
    { id: 'cat-fun', name: 'Fun & Dining', icon: '🎉', color: 'var(--c-fun)', kind: 'expense' },
    { id: 'cat-other', name: 'Other', icon: '📦', color: 'var(--c-other)', kind: 'expense' },
    { id: 'cat-income', name: 'Income', icon: '💰', color: 'var(--c-income)', kind: 'income' },
  ]
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'One-time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}
