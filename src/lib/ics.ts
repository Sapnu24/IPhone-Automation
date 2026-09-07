import type { Bill, Category, Recurrence } from '../types'
import { formatMoney } from './format'

const RRULE_FREQ: Record<Exclude<Recurrence, 'none'>, string> = {
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(iso: string): string {
  return iso.replace(/-/g, '') // YYYYMMDD for a VALUE=DATE
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function veventForBill(
  bill: Bill,
  category: Category | undefined,
  currency: string,
  locale: string,
): string[] {
  const amount = formatMoney(bill.amount, currency, locale)
  const emoji = category?.icon ?? '💸'
  const summary = escapeText(`${emoji} ${bill.name} — ${amount} due`)
  const reminder = Math.max(0, Math.round(bill.reminderDaysBefore))
  const trigger = reminder > 0 ? `-P${reminder}D` : '-PT9H'
  const lines = [
    'BEGIN:VEVENT',
    `UID:${bill.id}@anchor-app`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${icsDate(bill.dueDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapeText(
      `Bill reminder from Anchor.${bill.autopay ? ' (Autopay is on.)' : ''}`,
    )}`,
    'TRANSP:TRANSPARENT',
  ]
  if (bill.recurrence !== 'none') {
    lines.push(`RRULE:FREQ=${RRULE_FREQ[bill.recurrence]}`)
  }
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `TRIGGER:${trigger}`,
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
  )
  return lines
}

/** Build a full .ics calendar for one or more bills. */
export function icsForBills(
  bills: Bill[],
  categoriesById: Record<string, Category>,
  currency: string,
  locale: string,
): string {
  const body: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Anchor//Bills//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Anchor Bills',
  ]
  for (const bill of bills) {
    if (bill.archived) continue
    body.push(...veventForBill(bill, categoriesById[bill.categoryId], currency, locale))
  }
  body.push('END:VCALENDAR')
  return body.join('\r\n')
}

export function icsForBill(
  bill: Bill,
  category: Category | undefined,
  currency: string,
  locale: string,
): string {
  return icsForBills(
    [bill],
    category ? { [category.id]: category } : {},
    currency,
    locale,
  )
}
