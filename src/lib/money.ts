import type { Bill, BillOccurrence, Budget, Transaction } from '../types'
import { daysUntil, toISODate } from './format'
import { activeOccurrence } from './recurrence'

export function monthKeyOfISO(iso: string): string {
  return iso.slice(0, 7)
}

export function currentMonthKey(today: Date = new Date()): string {
  return toISODate(today).slice(0, 7)
}

export function inMonth(iso: string, monthKey: string): boolean {
  return iso.slice(0, 7) === monthKey
}

export function transactionsInMonth(txns: Transaction[], monthKey: string): Transaction[] {
  return txns.filter((t) => inMonth(t.date, monthKey))
}

export interface MonthTotals {
  income: number
  expense: number
  net: number
}

export function monthTotals(txns: Transaction[], monthKey: string): MonthTotals {
  let income = 0
  let expense = 0
  for (const t of transactionsInMonth(txns, monthKey)) {
    if (t.kind === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, net: income - expense }
}

/** Expense totals per category for a month (categoryId -> amount). */
export function categorySpend(txns: Transaction[], monthKey: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of transactionsInMonth(txns, monthKey)) {
    if (t.kind !== 'expense') continue
    out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount
  }
  return out
}

export interface BudgetProgress {
  categoryId: string
  spent: number
  limit: number
  remaining: number
  pct: number // 0..1+ (can exceed 1 when over budget)
  over: boolean
}

export function budgetProgress(
  budgets: Budget[],
  txns: Transaction[],
  monthKey: string,
): BudgetProgress[] {
  const spendByCat = categorySpend(txns, monthKey)
  return budgets.map((b) => {
    const spent = spendByCat[b.categoryId] ?? 0
    const limit = b.monthlyLimit
    const pct = limit > 0 ? spent / limit : 0
    return {
      categoryId: b.categoryId,
      spent,
      limit,
      remaining: limit - spent,
      pct,
      over: spent > limit,
    }
  })
}

/** Build billId -> set of paid occurrence due dates. */
export function paidSetByBill(occurrences: BillOccurrence[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const o of occurrences) {
    let set = map.get(o.billId)
    if (!set) {
      set = new Set()
      map.set(o.billId, set)
    }
    set.add(o.dueDate)
  }
  return map
}

export interface DueBill {
  bill: Bill
  dueISO: string
  daysUntil: number
  overdue: boolean
}

/** Every non-archived bill with an outstanding occurrence, sorted soonest-first. */
export function outstandingBills(
  bills: Bill[],
  occurrences: BillOccurrence[],
  today: Date = new Date(),
): DueBill[] {
  const paid = paidSetByBill(occurrences)
  const out: DueBill[] = []
  for (const bill of bills) {
    if (bill.archived) continue
    const due = activeOccurrence(bill, paid.get(bill.id) ?? new Set(), today)
    if (!due) continue
    const dueISO = toISODate(due)
    const d = daysUntil(dueISO, today)
    out.push({ bill, dueISO, daysUntil: d, overdue: d < 0 })
  }
  out.sort((a, b) => a.dueISO.localeCompare(b.dueISO))
  return out
}

/** Bills whose current outstanding occurrence falls within the given month. */
export function unpaidBillsInMonth(
  bills: Bill[],
  occurrences: BillOccurrence[],
  monthKey: string,
  today: Date = new Date(),
): DueBill[] {
  return outstandingBills(bills, occurrences, today).filter((d) => inMonth(d.dueISO, monthKey))
}

export interface Cashflow {
  income: number
  spent: number
  upcomingBills: number
  safeToSpend: number
}

/** "Safe to spend" this month = income logged − spending logged − money still
 *  owed on bills due this month. */
export function cashflow(
  txns: Transaction[],
  bills: Bill[],
  occurrences: BillOccurrence[],
  monthKey: string,
  today: Date = new Date(),
): Cashflow {
  const { income, expense } = monthTotals(txns, monthKey)
  const upcomingBills = unpaidBillsInMonth(bills, occurrences, monthKey, today).reduce(
    (sum, d) => sum + d.bill.amount,
    0,
  )
  return {
    income,
    spent: expense,
    upcomingBills,
    safeToSpend: income - expense - upcomingBills,
  }
}
