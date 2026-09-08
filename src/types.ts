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
  accountId?: string // which wallet/account this moved through
  note?: string
  date: string // local ISO date 'YYYY-MM-DD'
  createdAt: number
  receiptImageId?: string
}

export type AccountType = 'cash' | 'ewallet' | 'bank' | 'savings' | 'card' | 'other'
export type AccountGroup = 'asset' | 'liability'

export interface Account {
  id: string
  name: string
  type: AccountType
  group: AccountGroup
  currency: string
  openingBalance: number
  icon: string
  color: string
  archived?: boolean
  createdAt: number
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  note?: string
  createdAt: number
}

export interface IncomePlan {
  id: string
  name: string
  amount: number
  accountId?: string
  nextDate: string // anchor ISO date of the next occurrence
  recurrence: Recurrence
  isPayday?: boolean
  createdAt: number
  archived?: boolean
}

export type LedgerDirection = 'debt' | 'owed' // money you owe / money owed to you

export interface Ledger {
  id: string
  direction: LedgerDirection
  person: string
  amount: number
  settledAmount: number
  note?: string
  dueDate?: string
  createdAt: number
}

export interface Note {
  id: string
  text: string
  pinned?: boolean
  createdAt: number
  updatedAt: number
}

export interface ShoppingItem {
  id: string
  name: string
  price?: number
  checked: boolean
  createdAt: number
}

export interface Warranty {
  id: string
  name: string
  purchaseDate: string // ISO date
  months: number // warranty length in months
  note?: string
  createdAt: number
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string; group: AccountGroup }[] = [
  { value: 'cash', label: 'Cash', icon: '💵', group: 'asset' },
  { value: 'ewallet', label: 'E-wallet', icon: '📱', group: 'asset' },
  { value: 'bank', label: 'Bank', icon: '🏦', group: 'asset' },
  { value: 'savings', label: 'Savings', icon: '🐷', group: 'asset' },
  { value: 'card', label: 'Credit card', icon: '💳', group: 'liability' },
  { value: 'other', label: 'Other', icon: '📦', group: 'asset' },
]

export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly'

export interface Bill {
  id: string
  name: string
  amount: number
  categoryId: string
  icon?: string // optional emoji shown instead of the category icon
  dueDate: string // anchor due date, local ISO 'YYYY-MM-DD'
  recurrence: Recurrence
  reminderDaysBefore: number
  autopay: boolean
  createdAt: number
  archived?: boolean
}

/** Quick-add presets for common subscriptions & bills. Amounts are typical
 *  PH monthly prices — just a starting point the user can edit. */
export interface SubscriptionPreset {
  name: string
  icon: string
  categoryId: string
  amount?: number
}
export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { name: 'Netflix', icon: '🎬', categoryId: 'cat-subs', amount: 549 },
  { name: 'Spotify', icon: '🎵', categoryId: 'cat-subs', amount: 149 },
  { name: 'YouTube Premium', icon: '▶️', categoryId: 'cat-subs', amount: 179 },
  { name: 'HBO Max', icon: '📺', categoryId: 'cat-subs', amount: 299 },
  { name: 'Disney+', icon: '🏰', categoryId: 'cat-subs', amount: 159 },
  { name: 'Prime Video', icon: '📦', categoryId: 'cat-subs', amount: 149 },
  { name: 'Canva', icon: '🎨', categoryId: 'cat-subs', amount: 149 },
  { name: 'Claude', icon: '🤖', categoryId: 'cat-subs', amount: 1150 },
  { name: 'ChatGPT Plus', icon: '💬', categoryId: 'cat-subs', amount: 1150 },
  { name: 'Apple iCloud+', icon: '☁️', categoryId: 'cat-subs', amount: 49 },
  { name: 'Apple Music', icon: '🎧', categoryId: 'cat-subs', amount: 149 },
  { name: 'Microsoft 365', icon: '🪟', categoryId: 'cat-subs', amount: 399 },
  { name: 'Google One', icon: '🔷', categoryId: 'cat-subs', amount: 89 },
  { name: 'iQIYI', icon: '🎞️', categoryId: 'cat-subs', amount: 129 },
  { name: 'Viu', icon: '📱', categoryId: 'cat-subs', amount: 149 },
  { name: 'Globe', icon: '📶', categoryId: 'cat-utilities', amount: 999 },
  { name: 'Smart', icon: '📲', categoryId: 'cat-utilities', amount: 999 },
  { name: 'Converge', icon: '🌐', categoryId: 'cat-utilities', amount: 1500 },
  { name: 'PLDT Home', icon: '🏠', categoryId: 'cat-utilities', amount: 1699 },
]

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
  name?: string // optional first name for the greeting
}

// ---- Defaults -----------------------------------------------------------

export function defaultSettings(): Settings {
  return {
    currency: 'PHP',
    locale: 'en-PH',
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

export function defaultAccounts(): Account[] {
  return [
    {
      id: 'acct-cash',
      name: 'Cash',
      type: 'cash',
      group: 'asset',
      currency: 'PHP',
      openingBalance: 0,
      icon: '💵',
      color: 'var(--c-income)',
      createdAt: Date.now(),
    },
  ]
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'One-time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}
