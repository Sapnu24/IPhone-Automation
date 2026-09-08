import type { IncomePlan } from '../types'
import { nextOccurrenceOnOrAfter } from './recurrence'
import { daysUntil, toISODate } from './format'

export interface UpcomingIncome {
  plan: IncomePlan
  dateISO: string
  daysUntil: number
}

export function upcomingIncome(
  plans: IncomePlan[],
  horizonDays: number,
  today: Date = new Date(),
): UpcomingIncome[] {
  const out: UpcomingIncome[] = []
  for (const p of plans) {
    if (p.archived) continue
    const d = nextOccurrenceOnOrAfter(p.nextDate, p.recurrence, today)
    if (!d) continue
    const dateISO = toISODate(d)
    const du = daysUntil(dateISO, today)
    if (du <= horizonDays) out.push({ plan: p, dateISO, daysUntil: du })
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
}

export interface PaydayInfo {
  plan: IncomePlan
  dateISO: string
  daysUntil: number
}

export function paydayInfo(plans: IncomePlan[], today: Date = new Date()): PaydayInfo | null {
  const p = plans.find((x) => x.isPayday && !x.archived)
  if (!p) return null
  const d = nextOccurrenceOnOrAfter(p.nextDate, p.recurrence, today)
  if (!d) return null
  const dateISO = toISODate(d)
  return { plan: p, dateISO, daysUntil: daysUntil(dateISO, today) }
}
