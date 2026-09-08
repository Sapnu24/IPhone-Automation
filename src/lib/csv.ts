import type { Account, Category, Transaction } from '../types'
import { todayISO } from './format'
import { uid } from './id'

function esc(s: string): string {
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

const HEADER = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Note']

export function transactionsToCSV(
  txns: Transaction[],
  currency: string,
  categoryName: (id: string) => string,
  accountName: (id?: string) => string,
): string {
  const rows = [HEADER]
  for (const t of [...txns].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([
      t.date,
      t.kind,
      String(t.amount),
      currency,
      categoryName(t.categoryId),
      accountName(t.accountId),
      t.note ?? '',
    ])
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

/** Split one CSV line honoring quotes. */
function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

/** Parse the CSV we export back into transactions (new ids). Resolves category
 *  and account by name; unknown category -> Other, unknown account -> default. */
export function parseTransactionsCSV(
  text: string,
  categories: Category[],
  accounts: Account[],
  defaultAccountId?: string,
): Transaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const ci = { date: col('date'), type: col('type'), amount: col('amount'), category: col('category'), account: col('account'), note: col('note') }
  const findCat = (name: string, kind: 'expense' | 'income') => {
    const n = name.trim().toLowerCase()
    return (
      categories.find((c) => c.name.toLowerCase() === n)?.id ??
      categories.find((c) => c.id === (kind === 'income' ? 'cat-income' : 'cat-other'))?.id ??
      categories.find((c) => c.kind === kind)?.id ??
      'cat-other'
    )
  }
  const findAcct = (name: string) => {
    const n = name.trim().toLowerCase()
    return accounts.find((a) => a.name.toLowerCase() === n)?.id ?? defaultAccountId
  }
  const out: Transaction[] = []
  for (let i = 1; i < lines.length; i++) {
    const f = splitCSVLine(lines[i])
    const amount = parseFloat((f[ci.amount] ?? '').replace(/[^\d.-]/g, ''))
    if (Number.isNaN(amount) || amount <= 0) continue
    const kind = (f[ci.type] ?? 'expense').trim().toLowerCase() === 'income' ? 'income' : 'expense'
    out.push({
      id: uid(),
      kind,
      amount: Math.round(amount * 100) / 100,
      categoryId: ci.category >= 0 ? findCat(f[ci.category] ?? '', kind) : 'cat-other',
      accountId: ci.account >= 0 ? findAcct(f[ci.account] ?? '') : defaultAccountId,
      note: (f[ci.note] ?? '').trim() || undefined,
      date: /^\d{4}-\d{2}-\d{2}$/.test(f[ci.date] ?? '') ? f[ci.date] : todayISO(),
      createdAt: Date.now(),
    })
  }
  return out
}
