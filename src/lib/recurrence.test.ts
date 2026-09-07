import { describe, it, expect } from 'vitest'
import {
  addMonthsClamped,
  addRecurrence,
  occurrenceOnOrBefore,
  activeOccurrence,
  upcomingOccurrences,
} from './recurrence'
import { toISODate } from './format'

describe('addMonthsClamped', () => {
  it('clamps Jan 31 to Feb 28 in a non-leap year', () => {
    expect(toISODate(addMonthsClamped(new Date(2026, 0, 31), 1))).toBe('2026-02-28')
  })
  it('clamps Jan 31 to Feb 29 in a leap year', () => {
    expect(toISODate(addMonthsClamped(new Date(2028, 0, 31), 1))).toBe('2028-02-29')
  })
  it('keeps the day when it fits', () => {
    expect(toISODate(addMonthsClamped(new Date(2026, 0, 15), 1))).toBe('2026-02-15')
  })
})

describe('addRecurrence', () => {
  it('weekly adds 7 days', () => {
    expect(toISODate(addRecurrence(new Date(2026, 8, 7), 'weekly'))).toBe('2026-09-14')
  })
  it('yearly adds a year', () => {
    expect(toISODate(addRecurrence(new Date(2026, 8, 7), 'yearly'))).toBe('2027-09-07')
  })
})

describe('occurrenceOnOrBefore', () => {
  it('returns the anchor when it is still in the future', () => {
    expect(toISODate(occurrenceOnOrBefore('2026-10-01', 'monthly', new Date(2026, 8, 15)))).toBe(
      '2026-10-01',
    )
  })
  it('rolls a monthly bill forward to the current period', () => {
    expect(toISODate(occurrenceOnOrBefore('2026-01-01', 'monthly', new Date(2026, 8, 15)))).toBe(
      '2026-09-01',
    )
  })
})

describe('activeOccurrence', () => {
  const today = new Date(2026, 8, 15) // Sep 15, 2026

  it('surfaces the overdue current occurrence when unpaid', () => {
    const due = activeOccurrence({ dueDate: '2026-01-05', recurrence: 'monthly' }, new Set(), today)
    expect(toISODate(due!)).toBe('2026-09-05')
  })
  it('advances to the next period once the current one is paid', () => {
    const due = activeOccurrence(
      { dueDate: '2026-01-05', recurrence: 'monthly' },
      new Set(['2026-09-05']),
      today,
    )
    expect(toISODate(due!)).toBe('2026-10-05')
  })
  it('returns null for a paid one-time bill', () => {
    const due = activeOccurrence(
      { dueDate: '2026-09-20', recurrence: 'none' },
      new Set(['2026-09-20']),
      today,
    )
    expect(due).toBeNull()
  })
  it('keeps a future one-time bill', () => {
    const due = activeOccurrence({ dueDate: '2026-09-20', recurrence: 'none' }, new Set(), today)
    expect(toISODate(due!)).toBe('2026-09-20')
  })
})

describe('upcomingOccurrences', () => {
  it('lists weekly occurrences within the horizon', () => {
    const list = upcomingOccurrences(
      { dueDate: '2026-09-01', recurrence: 'weekly' },
      21,
      new Date(2026, 8, 7),
    )
    expect(list.map(toISODate)).toEqual(['2026-09-08', '2026-09-15', '2026-09-22'])
  })
})
