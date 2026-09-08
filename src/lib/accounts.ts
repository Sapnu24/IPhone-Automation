import type { Account, Transaction, Transfer } from '../types'

/** Balance in "money you have" terms. Liability accounts (e.g. credit cards)
 *  naturally carry a negative balance (what you owe), so one formula covers all:
 *  opening + income − expense + transfers-in − transfers-out. */
export function accountBalance(
  account: Account,
  txns: Transaction[],
  transfers: Transfer[],
): number {
  let bal = account.openingBalance
  for (const t of txns) {
    if (t.accountId !== account.id) continue
    bal += t.kind === 'income' ? t.amount : -t.amount
  }
  for (const tr of transfers) {
    if (tr.fromAccountId === account.id) bal -= tr.amount
    if (tr.toAccountId === account.id) bal += tr.amount
  }
  return bal
}

export interface CurrencyTotals {
  currency: string
  assets: number
  liabilities: number
  net: number
}

/** Totals grouped by currency (no FX conversion — mixed currencies stay
 *  separate so the numbers are always truthful). */
export function walletTotals(
  accounts: Account[],
  txns: Transaction[],
  transfers: Transfer[],
): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>()
  for (const a of accounts) {
    if (a.archived) continue
    const bal = accountBalance(a, txns, transfers)
    let c = map.get(a.currency)
    if (!c) {
      c = { currency: a.currency, assets: 0, liabilities: 0, net: 0 }
      map.set(a.currency, c)
    }
    if (bal >= 0) c.assets += bal
    else c.liabilities += -bal
    c.net += bal
  }
  return [...map.values()].sort((a, b) => b.net - a.net)
}
