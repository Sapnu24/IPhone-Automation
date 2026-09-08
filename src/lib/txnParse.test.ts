import { describe, it, expect } from 'vitest'
import { parseMessage } from './txnParse'

describe('parseMessage — bank / e-wallet / payout notifications', () => {
  it('GCash received', () => {
    expect(parseMessage('You have received PHP 1,000.00 from MARIA S. via GCash.')).toMatchObject({
      kind: 'income',
      amount: 1000,
      currency: 'PHP',
      merchant: 'MARIA S',
    })
  })
  it('GCash sent', () => {
    expect(parseMessage('You have sent PHP 500.00 to Juan Dela Cruz.')).toMatchObject({
      kind: 'expense',
      amount: 500,
      merchant: 'Juan Dela Cruz',
    })
  })
  it('BPI debit', () => {
    expect(parseMessage('Your BPI account ending in 1234 was debited PHP2,000.00 on Sep 8.')).toMatchObject({
      kind: 'expense',
      amount: 2000,
      currency: 'PHP',
    })
  })
  it('BPI credit', () => {
    expect(parseMessage('Your BPI account was credited with PHP 5,000.00.')).toMatchObject({
      kind: 'income',
      amount: 5000,
    })
  })
  it('Upwork USD payout', () => {
    expect(parseMessage("You've earned $50.00 — payment sent to your bank.")).toMatchObject({
      kind: 'income',
      amount: 50,
      currency: 'USD',
    })
  })
  it('paid a merchant', () => {
    expect(parseMessage('You paid PHP 149.00 to Spotify')).toMatchObject({
      kind: 'expense',
      amount: 149,
      merchant: 'Spotify',
    })
  })
  it('ignores casual input without a currency marker', () => {
    expect(parseMessage('500 mcdo')).toBeNull()
    expect(parseMessage('spent 120 grab')).toBeNull()
  })
  it('ignores text with no money direction', () => {
    expect(parseMessage('Your OTP is 123456. Do not share.')).toBeNull()
  })
})
