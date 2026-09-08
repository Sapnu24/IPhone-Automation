// Offline, rule-based "chat" assistant: turns plain-language money commands into
// transactions/transfers, and answers common questions. No AI service, no network.
import type { Account, Bill, BillOccurrence, Category, Settings, Transaction, Transfer } from '../types'
import { cashflow, categorySpend, currentMonthKey, monthTotals, outstandingBills } from './money'
import { walletTotals } from './accounts'
import { formatMoney, todayISO } from './format'

export interface Ctx {
  categories: Pick<Category, 'id' | 'name' | 'kind'>[]
  accounts: Pick<Account, 'id' | 'name'>[]
  defaultAccountId?: string
}

export type Action =
  | { type: 'expense' | 'income'; amount: number; categoryId: string; accountId?: string; note?: string }
  | { type: 'transfer'; amount: number; fromAccountId: string; toAccountId: string; note?: string }

export type LineResult = { action: Action } | { question: string } | { unknown: string }

// PH-flavoured keyword → default category id.
const KEYWORDS: { catId: string; words: string[] }[] = [
  { catId: 'cat-housing', words: ['rent', 'condo', 'dorm', 'amortization', 'pag-ibig', 'pagibig', 'mortgage'] },
  { catId: 'cat-food', words: ['mcdo', 'mcdonald', 'jollibee', 'jjb', 'chowking', 'kfc', 'starbucks', 'sbux', 'coffee', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'merienda', 'kain', 'ulam', 'palengke', 'food', 'snack', 'milktea', 'milk tea', 'grab food', 'grabfood', 'foodpanda'] },
  { catId: 'cat-transport', words: ['jeep', 'jeepney', 'grab', 'angkas', 'joyride', 'bus', 'mrt', 'lrt', 'fare', 'gas', 'gasoline', 'diesel', 'toll', 'taxi', 'tricycle', 'trike', 'fx', 'parking', 'fuel', 'transport', 'padyak'] },
  { catId: 'cat-utilities', words: ['meralco', 'electric', 'electricity', 'kuryente', 'water', 'maynilad', 'tubig', 'internet', 'converge', 'pldt', 'globe', 'smart', 'load', 'wifi', 'bill', 'utility'] },
  { catId: 'cat-subs', words: ['netflix', 'spotify', 'youtube', 'icloud', 'hbo', 'disney', 'canva', 'subscription', 'viu', 'iwant'] },
  { catId: 'cat-shopping', words: ['shopee', 'lazada', 'shirt', 'shoes', 'clothes', 'tiktok shop', 'shopping', 'uniqlo', 'watsons', 'sm'] },
  { catId: 'cat-health', words: ['medicine', 'gamot', 'hospital', 'clinic', 'gym', 'vitamins', 'doctor', 'dental', 'mercury'] },
  { catId: 'cat-fun', words: ['movie', 'sinehan', 'drinks', 'beer', 'inuman', 'bar', 'concert', 'game', 'fun', 'kape date'] },
]

const INCOME_WORDS = ['salary', 'sweldo', 'payout', 'received', 'refund', 'got paid', 'income', 'kita', 'allowance', 'bonus', 'commission']
const QUESTION_RE = /how much|how many|magkano|balance|net ?worth|safe to spend|what.?s? due|due (soon|today)|left to spend|nagastos|do i owe|can i (afford|spend)/i

function parseAmount(s: string): number | null {
  const m = s.match(/(?:₱|php|p)?\s*([\d][\d,]*(?:\.\d+)?)\s*(k)?/i)
  if (!m) return null
  let n = parseFloat(m[1].replace(/,/g, ''))
  if (m[2]) n *= 1000
  return Number.isNaN(n) ? null : n
}

function stripAmount(s: string): string {
  return s.replace(/(?:₱|php|p)?\s*[\d][\d,]*(?:\.\d+)?\s*k?/i, ' ')
}

function findAccount(text: string, ctx: Ctx): Pick<Account, 'id' | 'name'> | undefined {
  const lower = text.toLowerCase()
  // longest name first so "bpi savings" beats "bpi"
  const byLen = [...ctx.accounts].sort((a, b) => b.name.length - a.name.length)
  for (const a of byLen) {
    const n = a.name.toLowerCase()
    if (n && lower.includes(n)) return a
    // also match the first word of the account name (e.g. "bpi" from "BPI Savings")
    const first = n.split(/\s+/)[0]
    if (first && first.length >= 3 && new RegExp(`\\b${first}\\b`).test(lower)) return a
  }
  return undefined
}

function resolveCategory(text: string, ctx: Ctx): string {
  const lower = text.toLowerCase()
  for (const { catId, words } of KEYWORDS) {
    if (!ctx.categories.some((c) => c.id === catId)) continue
    if (words.some((w) => lower.includes(w))) return catId
  }
  // try matching an existing expense category name
  for (const c of ctx.categories) {
    if (c.kind !== 'expense') continue
    const first = c.name.toLowerCase().split(/[\s&]+/)[0]
    if (first && first.length >= 3 && lower.includes(first)) return c.id
  }
  return ctx.categories.find((c) => c.id === 'cat-other')?.id ?? ctx.categories.find((c) => c.kind === 'expense')?.id ?? 'cat-other'
}

function cleanNote(line: string): string {
  return stripAmount(line)
    .replace(/\b(from|for|on|spent|paid|bought|at|sa|kay|ng|the|a|an|to|my)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classify(line: string, ctx: Ctx): LineResult {
  const lower = line.toLowerCase()

  // Transfer: "transfer 40k from bdo to bpi"
  if (/\b(transfer|move|send)\b/.test(lower) && /\bto\b/.test(lower)) {
    const amt = parseAmount(lower)
    const fromM = lower.match(/from\s+(.+?)\s+to\b/)
    const toM = lower.match(/\bto\s+(.+?)\s*$/)
    const from = fromM ? findAccount(fromM[1], ctx) : undefined
    const to = toM ? findAccount(toM[1], ctx) : undefined
    if (amt != null && from && to && from.id !== to.id) {
      return { action: { type: 'transfer', amount: amt, fromAccountId: from.id, toAccountId: to.id } }
    }
    return { unknown: line }
  }

  // Question
  const hasLeadingAmount = /^\+?\s*(?:₱|php|p)?\s*[\d]/.test(lower)
  if (QUESTION_RE.test(lower) && !hasLeadingAmount) return { question: line }

  // Log expense/income
  const amt = parseAmount(lower)
  if (amt != null) {
    const income = INCOME_WORDS.some((w) => lower.includes(w)) || /^\+/.test(line.trim())
    const acct = findAccount(lower, ctx)
    const accountId = acct?.id ?? ctx.defaultAccountId
    const note = cleanNote(line) || undefined
    if (income) {
      const incCat = ctx.categories.find((c) => c.kind === 'income')?.id ?? 'cat-income'
      return { action: { type: 'income', amount: amt, categoryId: incCat, accountId, note } }
    }
    return { action: { type: 'expense', amount: amt, categoryId: resolveCategory(lower, ctx), accountId, note } }
  }

  return { unknown: line }
}

export function interpret(text: string, ctx: Ctx): LineResult[] {
  // Split on newlines/semicolons, and on commas ONLY when followed by a space +
  // number (a batch separator like "500 mcdo, 220 sbux") — never inside "1,200".
  return text
    .split(/\n|;|,(?=\s+(?:₱|php|p)?\d)/i)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => classify(l, ctx))
}

// ---- Question answering -------------------------------------------------

export interface AssistantData {
  transactions: Transaction[]
  bills: Bill[]
  occurrences: BillOccurrence[]
  accounts: Account[]
  transfers: Transfer[]
  categories: Category[]
  settings: Settings
}

export function answerQuestion(q: string, data: AssistantData): string {
  const lower = q.toLowerCase()
  const { currency, locale } = data.settings
  const money = (n: number) => formatMoney(n, currency, locale)
  const month = currentMonthKey()

  if (/balance|net ?worth/.test(lower)) {
    const totals = walletTotals(data.accounts, data.transactions, data.transfers)
    const base = totals.find((t) => t.currency === currency)
    const extra = totals.filter((t) => t.currency !== currency).map((t) => money(t.net)).join(', ')
    return `Your net worth is ${money(base?.net ?? 0)}${extra ? ` (plus ${extra})` : ''} across ${data.accounts.filter((a) => !a.archived).length} account(s).`
  }

  if (/safe to spend|can i (afford|spend)|left to spend/.test(lower)) {
    const cf = cashflow(data.transactions, data.bills, data.occurrences, month, new Date())
    return `You have ${money(cf.safeToSpend)} safe to spend this month — after ${money(cf.spent)} spent and ${money(cf.upcomingBills)} in bills still due.`
  }

  if (/due|owe/.test(lower)) {
    const due = outstandingBills(data.bills, data.occurrences, new Date()).filter((d) => d.daysUntil <= 14)
    if (due.length === 0) return 'Nothing is due in the next two weeks. 🎉'
    const total = due.reduce((s, d) => s + d.bill.amount, 0)
    const overdue = due.filter((d) => d.overdue).length
    return `${due.length} payment(s) coming up totalling ${money(total)}${overdue ? `, and ${overdue} already overdue` : ''}. Check the Bills tab.`
  }

  // Category-specific spend, e.g. "how much did I spend on food"
  const spend = categorySpend(data.transactions, month)
  const cat = data.categories.find(
    (c) => c.kind === 'expense' && lower.includes(c.name.toLowerCase().split(/[\s&]+/)[0]),
  )
  if (cat) {
    return `You've spent ${money(spend[cat.id] ?? 0)} on ${cat.name} this month.`
  }

  // Default: total spend this month
  const totals = monthTotals(data.transactions, month)
  return `This month you've spent ${money(totals.expense)} and earned ${money(totals.income)} — net ${money(totals.net)}.`
}

/** A ready-to-log transaction's date is always today when created from chat. */
export const CHAT_TXN_DATE = todayISO
