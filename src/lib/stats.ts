import type { Account, Bill, BillOccurrence, IncomePlan, Transaction, Transfer } from '../types'
import { convert } from './fx'
import { toISODate } from './format'
import { outstandingBills } from './money'
import { upcomingIncome } from './plan'

/** An account's balance considering only activity dated on/before `dateISO`. */
export function balanceAsOf(
  account: Account,
  txns: Transaction[],
  transfers: Transfer[],
  dateISO: string,
): number {
  let bal = account.openingBalance
  for (const t of txns) {
    if (t.accountId === account.id && t.date <= dateISO) bal += t.kind === 'income' ? t.amount : -t.amount
  }
  for (const tr of transfers) {
    if (tr.date > dateISO) continue
    if (tr.fromAccountId === account.id) bal -= tr.amount
    if (tr.toAccountId === account.id) bal += tr.amount
  }
  return bal
}

/** Net worth as of a date, foreign balances converted to `base` with approx FX. */
export function netWorthAsOf(
  dateISO: string,
  accounts: Account[],
  txns: Transaction[],
  transfers: Transfer[],
  base: string,
): number {
  let sum = 0
  for (const a of accounts) {
    if (a.archived) continue
    const b = balanceAsOf(a, txns, transfers, dateISO)
    sum += a.currency === base ? b : (convert(b, a.currency, base) ?? 0)
  }
  return sum
}

export interface TrendPoint {
  key: string
  label: string
  value: number
}

export function netWorthTrend(
  n: number,
  accounts: Account[],
  txns: Transaction[],
  transfers: Transfer[],
  base: string,
  locale: string,
  today: Date = new Date(),
): TrendPoint[] {
  const out: TrendPoint[] = []
  for (let i = n - 1; i >= 0; i--) {
    const first = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    const asOf = i === 0 ? today : lastDay
    out.push({
      key: `${first.getFullYear()}-${first.getMonth() + 1}`,
      label: first.toLocaleDateString(locale, { month: 'short' }),
      value: netWorthAsOf(toISODate(asOf), accounts, txns, transfers, base),
    })
  }
  return out
}

export interface Forecast {
  inflow: number
  outflow: number
  net: number
}

export function cashflowForecast(
  incomePlans: IncomePlan[],
  bills: Bill[],
  occurrences: BillOccurrence[],
  horizonDays: number,
  today: Date = new Date(),
): Forecast {
  const inflow = upcomingIncome(incomePlans, horizonDays, today).reduce((s, x) => s + x.plan.amount, 0)
  const outflow = outstandingBills(bills, occurrences, today)
    .filter((d) => d.daysUntil <= horizonDays)
    .reduce((s, d) => s + d.bill.amount, 0)
  return { inflow, outflow, net: inflow - outflow }
}
