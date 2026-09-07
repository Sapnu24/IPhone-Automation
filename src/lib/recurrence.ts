import type { Bill, Recurrence } from '../types'
import { parseISO, startOfDay, toISODate } from './format'

const GUARD = 5000 // safety cap on occurrence stepping loops

/** Add `months` to a date, clamping the day to the target month's last day
 *  (e.g. Jan 31 + 1 month = Feb 28/29). */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

/** Advance a date by exactly one recurrence period. */
export function addRecurrence(date: Date, rec: Recurrence): Date {
  const d = new Date(date)
  switch (rec) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      return d
    case 'monthly':
      return addMonthsClamped(date, 1)
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      return d
    case 'none':
    default:
      return d
  }
}

/** The occurrence date for the period that contains (or most recently preceded)
 *  `today`. If the anchor is still in the future, returns the anchor. */
export function occurrenceOnOrBefore(anchorISO: string, rec: Recurrence, today: Date): Date {
  const anchor = parseISO(anchorISO)
  const t = startOfDay(today)
  if (rec === 'none' || anchor >= t) return anchor
  let d = anchor
  for (let i = 0; i < GUARD; i++) {
    const next = addRecurrence(d, rec)
    if (startOfDay(next) > t) break
    d = next
  }
  return d
}

/** The occurrence a bill is currently waiting on: the earliest unpaid occurrence
 *  from the current period forward. Returns null when a one-time bill is paid. */
export function activeOccurrence(
  bill: Pick<Bill, 'dueDate' | 'recurrence'>,
  paidDueDates: ReadonlySet<string>,
  today: Date = new Date(),
): Date | null {
  let d = occurrenceOnOrBefore(bill.dueDate, bill.recurrence, today)
  if (bill.recurrence === 'none') {
    return paidDueDates.has(toISODate(d)) ? null : d
  }
  for (let i = 0; i < GUARD && paidDueDates.has(toISODate(d)); i++) {
    d = addRecurrence(d, bill.recurrence)
  }
  return d
}

/** Upcoming occurrences (dates) within `horizonDays` from today, ignoring paid
 *  status — useful for a calendar-style preview. */
export function upcomingOccurrences(
  bill: Pick<Bill, 'dueDate' | 'recurrence'>,
  horizonDays: number,
  today: Date = new Date(),
): Date[] {
  const t = startOfDay(today)
  const end = new Date(t)
  end.setDate(end.getDate() + horizonDays)
  const out: Date[] = []
  let d = occurrenceOnOrBefore(bill.dueDate, bill.recurrence, today)
  for (let i = 0; i < GUARD; i++) {
    if (startOfDay(d) >= t && startOfDay(d) <= end) out.push(d)
    if (bill.recurrence === 'none') break
    const next = addRecurrence(d, bill.recurrence)
    if (startOfDay(next) > end) break
    d = next
  }
  return out
}
