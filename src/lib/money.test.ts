import { describe, it, expect } from 'vitest'
import {
  monthTotals,
  categorySpend,
  budgetProgress,
  cashflow,
  outstandingBills,
} from './money'
import type { Bill, BillOccurrence, Budget, Transaction } from '../types'

const t = (o: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  kind: 'expense',
  amount: 0,
  categoryId: 'cat-food',
  date: '2026-09-10',
  createdAt: 0,
  ...o,
})

const bill = (o: Partial<Bill>): Bill => ({
  id: 'bill',
  name: 'Bill',
  amount: 0,
  categoryId: 'cat-housing',
  dueDate: '2026-09-25',
  recurrence: 'monthly',
  reminderDaysBefore: 2,
  autopay: false,
  createdAt: 0,
  ...o,
})

describe('monthTotals', () => {
  it('sums income and expense within the month only', () => {
    const txns = [
      t({ amount: 100, kind: 'income', date: '2026-09-01' }),
      t({ amount: 30, date: '2026-09-05' }),
      t({ amount: 999, date: '2026-08-30' }),
    ]
    const r = monthTotals(txns, '2026-09')
    expect(r.income).toBe(100)
    expect(r.expense).toBe(30)
    expect(r.net).toBe(70)
  })
})

describe('categorySpend', () => {
  it('aggregates expenses per category and ignores income', () => {
    const txns = [
      t({ amount: 20, categoryId: 'cat-food' }),
      t({ amount: 5, categoryId: 'cat-food' }),
      t({ amount: 50, categoryId: 'cat-fun' }),
      t({ amount: 100, kind: 'income', categoryId: 'cat-income' }),
    ]
    const r = categorySpend(txns, '2026-09')
    expect(r['cat-food']).toBe(25)
    expect(r['cat-fun']).toBe(50)
    expect(r['cat-income']).toBeUndefined()
  })
})

describe('budgetProgress', () => {
  it('computes percentage and over-budget flag', () => {
    const budgets: Budget[] = [{ id: 'b1', categoryId: 'cat-food', monthlyLimit: 100 }]
    const txns = [t({ amount: 120, categoryId: 'cat-food' })]
    const [p] = budgetProgress(budgets, txns, '2026-09')
    expect(p.spent).toBe(120)
    expect(p.over).toBe(true)
    expect(p.pct).toBeCloseTo(1.2)
    expect(p.remaining).toBe(-20)
  })
})

describe('cashflow', () => {
  const today = new Date(2026, 8, 15)

  it('safe-to-spend subtracts logged spend and unpaid bills due this month', () => {
    const txns = [
      t({ amount: 1000, kind: 'income', date: '2026-09-01' }),
      t({ amount: 200, date: '2026-09-10' }),
    ]
    const bills = [bill({ id: 'rent', amount: 500, dueDate: '2026-09-25' })]
    const cf = cashflow(txns, bills, [], '2026-09', today)
    expect(cf.income).toBe(1000)
    expect(cf.spent).toBe(200)
    expect(cf.upcomingBills).toBe(500)
    expect(cf.safeToSpend).toBe(300)
  })

  it('drops a bill from upcoming once its occurrence is paid', () => {
    const bills = [bill({ id: 'rent', amount: 500, dueDate: '2026-09-25' })]
    const occ: BillOccurrence[] = [
      { id: 'o1', billId: 'rent', dueDate: '2026-09-25', paidAt: 0 },
    ]
    const cf = cashflow([], bills, occ, '2026-09', today)
    expect(cf.upcomingBills).toBe(0)
  })
})

describe('outstandingBills', () => {
  it('sorts soonest first and flags overdue occurrences', () => {
    const today = new Date(2026, 8, 15)
    const bills = [
      bill({ id: 'a', dueDate: '2026-09-20', recurrence: 'none' }),
      bill({ id: 'b', dueDate: '2026-09-05', recurrence: 'monthly' }),
    ]
    const r = outstandingBills(bills, [], today)
    expect(r[0].bill.id).toBe('b')
    expect(r[0].overdue).toBe(true)
    expect(r[1].bill.id).toBe('a')
    expect(r[1].overdue).toBe(false)
  })
})
