import { describe, it, expect } from 'vitest'
import { parseAmount, parseDate, parseReceiptText } from './receipt'

describe('parseAmount', () => {
  it('prefers the TOTAL line over subtotal/tax', () => {
    const text = ['MARKET', 'SUBTOTAL 18.00', 'TAX 1.44', 'TOTAL 19.44'].join('\n')
    expect(parseAmount(text)).toBe(19.44)
  })
  it('falls back to the largest money value when no total keyword', () => {
    expect(parseAmount('Item A 5.00\nItem B 12.50')).toBe(12.5)
  })
  it('handles comma decimals', () => {
    expect(parseAmount('TOTAL 12,50')).toBe(12.5)
  })
  it('handles US thousands separators', () => {
    expect(parseAmount('GRAND TOTAL 1,234.56')).toBe(1234.56)
  })
  it('handles European thousands + comma decimals', () => {
    expect(parseAmount('TOTAL 1.234,56')).toBe(1234.56)
  })
  it('returns undefined when there is no money', () => {
    expect(parseAmount('thanks for shopping')).toBeUndefined()
  })
})

describe('parseDate', () => {
  it('parses ISO dates', () => {
    expect(parseDate('Date: 2026-09-07')).toBe('2026-09-07')
  })
  it('parses US m/d/y by default', () => {
    expect(parseDate('09/07/2026')).toBe('2026-09-07')
  })
  it('detects d/m/y when day > 12', () => {
    expect(parseDate('13/09/2026')).toBe('2026-09-13')
  })
  it('honors preferDMY for ambiguous dates', () => {
    expect(parseDate('07/09/2026', true)).toBe('2026-09-07')
    expect(parseDate('07/09/2026', false)).toBe('2026-07-09')
  })
  it('parses month names', () => {
    expect(parseDate('Sep 7, 2026')).toBe('2026-09-07')
    expect(parseDate('7 September 2026')).toBe('2026-09-07')
  })
  it('expands 2-digit years', () => {
    expect(parseDate('09-07-26')).toBe('2026-09-07')
  })
})

describe('parseReceiptText', () => {
  it('extracts both amount and date from a realistic receipt', () => {
    const text = [
      'CORNER CAFE',
      '123 Main St',
      '09/07/2026  14:32',
      'Latte        4.50',
      'Muffin       3.25',
      'SUBTOTAL     7.75',
      'TAX          0.62',
      'TOTAL        8.37',
      'VISA ....1234',
    ].join('\n')
    expect(parseReceiptText(text)).toEqual({ amount: 8.37, date: '2026-09-07' })
  })
})
