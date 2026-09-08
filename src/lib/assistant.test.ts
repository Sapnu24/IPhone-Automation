import { describe, it, expect } from 'vitest'
import { interpret, type Ctx, type Action } from './assistant'

const ctx: Ctx = {
  categories: [
    { id: 'cat-food', name: 'Food & Groceries', kind: 'expense' },
    { id: 'cat-transport', name: 'Transport', kind: 'expense' },
    { id: 'cat-subs', name: 'Subscriptions', kind: 'expense' },
    { id: 'cat-other', name: 'Other', kind: 'expense' },
    { id: 'cat-income', name: 'Income', kind: 'income' },
  ],
  accounts: [
    { id: 'acct-cash', name: 'Cash' },
    { id: 'acct-bdo', name: 'BDO Mastercard' },
    { id: 'acct-bpi', name: 'BPI Savings' },
  ],
  defaultAccountId: 'acct-cash',
}

const actions = (rs: ReturnType<typeof interpret>): Action[] =>
  rs.flatMap((r) => ('action' in r ? [r.action] : []))

describe('interpret — batch expense logging', () => {
  it('logs the "500 mcdo / 220 starbucks / 20 jeep" example', () => {
    const a = actions(interpret('500 mcdo\n220 starbucks\n20 jeep', ctx))
    expect(a).toHaveLength(3)
    expect(a[0]).toMatchObject({ type: 'expense', amount: 500, categoryId: 'cat-food', accountId: 'acct-cash' })
    expect(a[1]).toMatchObject({ type: 'expense', amount: 220, categoryId: 'cat-food' })
    expect(a[2]).toMatchObject({ type: 'expense', amount: 20, categoryId: 'cat-transport' })
    expect(a[0].type === 'expense' && a[0].note).toBe('McDo')
  })
})

describe('interpret — clean notes & subscriptions', () => {
  it('reduces a sentence to just the merchant', () => {
    const [x] = actions(interpret('i bought mcdo 280 pesos', ctx))
    expect(x).toMatchObject({ type: 'expense', amount: 280, categoryId: 'cat-food' })
    expect(x.type === 'expense' && x.note).toBe('McDo')
  })
  it('drops the account word from the note', () => {
    const [x] = actions(interpret('1200 groceries from bpi', ctx))
    expect(x.type === 'expense' && x.note).toBe('Groceries')
  })
  it('turns "subscription on canva 480" into a monthly subscription', () => {
    const [x] = actions(interpret('i have a subscription on canva 480 php', ctx))
    expect(x).toMatchObject({ type: 'subscription', amount: 480, name: 'Canva', categoryId: 'cat-subs', icon: '🎨' })
  })
  it('subscribes without over-capturing words', () => {
    const [x] = actions(interpret('subscribed to netflix 549', ctx))
    expect(x).toMatchObject({ type: 'subscription', amount: 549, name: 'Netflix', categoryId: 'cat-subs' })
  })
})

describe('interpret — income, transfer, natural phrasing', () => {
  it('detects income with a keyword', () => {
    const [x] = actions(interpret('got 15000 salary', ctx))
    expect(x).toMatchObject({ type: 'income', amount: 15000, categoryId: 'cat-income' })
  })
  it('parses "spent 225 on lunch" as a food expense', () => {
    const [x] = actions(interpret('spent 225 on lunch', ctx))
    expect(x).toMatchObject({ type: 'expense', amount: 225, categoryId: 'cat-food' })
    expect(x.type === 'expense' && x.note).toBe('Lunch')
  })
  it('handles k-suffix and transfers between accounts', () => {
    const [x] = actions(interpret('transfer 40k from bdo to bpi', ctx))
    expect(x).toMatchObject({ type: 'transfer', amount: 40000, fromAccountId: 'acct-bdo', toAccountId: 'acct-bpi' })
  })
  it('routes account mentions on expenses', () => {
    const [x] = actions(interpret('1200 groceries from bpi', ctx))
    expect(x).toMatchObject({ type: 'expense', amount: 1200, categoryId: 'cat-food', accountId: 'acct-bpi' })
  })
})

describe('interpret — comma batches vs thousands separators', () => {
  it('splits a comma-separated batch', () => {
    const a = actions(interpret('500 mcdo, 220 starbucks', ctx))
    expect(a).toHaveLength(2)
    expect(a[0]).toMatchObject({ amount: 500 })
    expect(a[1]).toMatchObject({ amount: 220 })
  })
  it('does NOT split a thousands separator', () => {
    const a = actions(interpret('1,200 rent', ctx))
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ amount: 1200 })
  })
})

describe('interpret — questions', () => {
  it('treats "how much did I spend on food?" as a question, not a log', () => {
    const r = interpret('how much did I spend on food?', ctx)
    expect(r).toHaveLength(1)
    expect('question' in r[0]).toBe(true)
  })
  it('treats "what is my balance" as a question', () => {
    expect('question' in interpret('what is my balance', ctx)[0]).toBe(true)
  })
})
