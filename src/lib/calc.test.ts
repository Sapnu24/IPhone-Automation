import { describe, it, expect } from 'vitest'
import { applyKey, evalExpr, type CalcKey } from './calc'

/** Type a sequence of keys onto an empty expression. */
function type(...keys: CalcKey[]): string {
  return keys.reduce((e, k) => applyKey(e, k), '')
}

describe('evalExpr', () => {
  it('is 0 for empty / junk', () => {
    expect(evalExpr('')).toBe(0)
    expect(evalExpr('+')).toBe(0)
  })
  it('reads a plain number', () => {
    expect(evalExpr('42')).toBe(42)
    expect(evalExpr('8.37')).toBe(8.37)
  })
  it('evaluates strictly left-to-right (no precedence)', () => {
    expect(evalExpr('1+2×3')).toBe(9)
    expect(evalExpr('100-30-20')).toBe(50)
  })
  it('handles division and rounds to cents', () => {
    expect(evalExpr('10÷3')).toBe(3.33)
  })
  it('ignores a trailing operator', () => {
    expect(evalExpr('12+')).toBe(12)
  })
  it('guards divide by zero (leaves accumulator)', () => {
    expect(evalExpr('5÷0')).toBe(5)
  })
})

describe('applyKey', () => {
  it('types digits and decimals', () => {
    expect(type('1', '2', '.', '5')).toBe('12.5')
  })
  it('blocks a second decimal in the same segment', () => {
    expect(type('1', '.', '2', '.', '3')).toBe('1.23')
  })
  it('starts a decimal with a leading zero', () => {
    expect(type('.', '5')).toBe('0.5')
  })
  it('replaces a dangling operator instead of stacking', () => {
    expect(type('5', '+', '-')).toBe('5-')
  })
  it('allows a leading minus only', () => {
    expect(type('+')).toBe('')
    expect(type('-')).toBe('-')
  })
  it('C clears and ⌫ deletes one char', () => {
    expect(applyKey('123', 'C')).toBe('')
    expect(applyKey('123', '⌫')).toBe('12')
  })
  it('= collapses the expression to its value', () => {
    expect(applyKey('2+3', '=')).toBe('5')
    expect(applyKey('10÷4', '=')).toBe('2.5')
  })
  it('% divides the current value by 100', () => {
    expect(applyKey('50', '%')).toBe('0.5')
  })
})
