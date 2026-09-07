// Date + money formatting helpers. Dates are stored as local ISO strings
// ('YYYY-MM-DD') and parsed as *local* dates (never UTC) so a due date never
// slips a day across time zones.

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Days from today to the given ISO date. Negative = in the past (overdue). */
export function daysUntil(iso: string, today: Date = new Date()): number {
  return daysBetween(today, parseISO(iso))
}

export function formatMoney(amount: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/** Compact money for tight spaces, e.g. "$1.2k". Falls back to full format. */
export function formatMoneyShort(amount: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return formatMoney(amount, currency, locale)
  }
}

export function formatDate(iso: string, locale = 'en-US'): string {
  try {
    return parseISO(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

export function formatMonthLabel(monthKey: string, locale = 'en-US'): string {
  const [y, m] = monthKey.split('-').map(Number)
  try {
    return new Date(y, (m || 1) - 1, 1).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return monthKey
  }
}

/** Friendly relative label for a due date. */
export function humanDue(iso: string, today: Date = new Date()): string {
  const diff = daysUntil(iso, today)
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff === -1) return 'Overdue by 1 day'
  if (diff < 0) return `Overdue by ${-diff} days`
  if (diff < 7) return `Due in ${diff} days`
  if (diff < 14) return 'Due next week'
  return `Due in ${diff} days`
}
