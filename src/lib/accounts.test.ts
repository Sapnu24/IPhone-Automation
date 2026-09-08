import { describe, it, expect } from 'vitest'
import { accountBalance, walletTotals } from './accounts'
import type { Account, Transaction, Transfer } from '../types'

const acct = (o: Partial<Account>): Account => ({
  id: 'a',
  name: 'A',
  type: 'cash',
  group: 'asset',
  currency: 'PHP',
  openingBalance: 0,
  icon: '👛',
  color: '#000',
  createdAt: 0,
  ...o,
})
const txn = (o: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  kind: 'expense',
  amount: 0,
  categoryId: 'c',
  date: '2026-09-10',
  createdAt: 0,
  ...o,
})

describe('accountBalance', () => {
  it('applies opening + income − expense for its own account only', () => {
    const a = acct({ id: 'cash', openingBalance: 100 })
    const txns = [
      txn({ accountId: 'cash', kind: 'income', amount: 50 }),
      txn({ accountId: 'cash', kind: 'expense', amount: 20 }),
      txn({ accountId: 'other', kind: 'expense', amount: 999 }),
    ]
    expect(accountBalance(a, txns, [])).toBe(130)
  })
  it('applies transfers in and out', () => {
    const a = acct({ id: 'bank', openingBalance: 1000 })
    const transfers: Transfer[] = [
      { id: 't1', fromAccountId: 'bank', toAccountId: 'card', amount: 300, date: '2026-09-01', createdAt: 0 },
      { id: 't2', fromAccountId: 'cash', toAccountId: 'bank', amount: 100, date: '2026-09-02', createdAt: 0 },
    ]
    expect(accountBalance(a, [], transfers)).toBe(800)
  })
})

describe('walletTotals', () => {
  it('splits assets and liabilities by sign, per currency', () => {
    const accounts = [
      acct({ id: 'cash', openingBalance: 5000 }),
      acct({ id: 'card', group: 'liability', type: 'card', openingBalance: -1500 }),
      acct({ id: 'usd', currency: 'USD', openingBalance: 420 }),
    ]
    const totals = walletTotals(accounts, [], [])
    const php = totals.find((t) => t.currency === 'PHP')!
    const usd = totals.find((t) => t.currency === 'USD')!
    expect(php.assets).toBe(5000)
    expect(php.liabilities).toBe(1500)
    expect(php.net).toBe(3500)
    expect(usd.net).toBe(420)
  })
})
