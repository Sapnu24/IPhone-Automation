// Parse a raw bank / e-wallet / payout notification (SMS or email text) into a
// transaction. Pure + heuristic — no network. Used by Buzz (paste a message)
// and the one-tap #/log deep link (iOS Shortcut / share sheet).

export interface ParsedMessage {
  kind: 'income' | 'expense'
  amount: number
  currency: 'PHP' | 'USD'
  merchant?: string
}

const IN_RE =
  /\b(received|credited|credit(?:ing)?|deposited|refund(?:ed)?|cash[\s-]?in|you got|you'?ve earned|earned|payment received|sent you|added to your)\b/i
const OUT_RE =
  /\b(sent|debited|debit(?:ing)?|paid|payment to|purchase[d]?|deducted|spent|withdrawn|withdrew|cash[\s-]?out|transferred to|charged|bought)\b/i
// A currency marker must be present so casual "500 mcdo" is NOT treated as a
// bank message (that stays with the normal Buzz parser).
const CUR_RE = /(₱|php|\bp(?=\s?\d)|\$|\busd\b)/i

const TRAILING_JUNK =
  /\b(your|the|a|an|account|acct|acc|ref(?:erence)?|no\.?|number|via|using|thru|through|gcash|maya|paymaya|bpi|bdo|unionbank|seabank|on|dated?|last|balance|bal)\b.*$/i

function pickAmount(t: string): number | null {
  // Prefer a number attached to a currency marker; else the first money-looking number.
  const m =
    t.match(/(?:₱|php|usd|\$)\s*([\d][\d,]*(?:\.\d+)?)/i) ||
    t.match(/\bp\s*([\d][\d,]*(?:\.\d+)?)/i) ||
    t.match(/([\d][\d,]*\.\d{2})\b/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Returns a parsed transaction if the text looks like a money notification,
 *  else null (so the caller can fall back to normal parsing). */
export function parseMessage(text: string): ParsedMessage | null {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t || !CUR_RE.test(t)) return null
  const inc = IN_RE.test(t)
  const out = OUT_RE.test(t)
  if (!inc && !out) return null

  const amount = pickAmount(t)
  if (amount == null) return null

  let kind: 'income' | 'expense'
  if (inc && !out) kind = 'income'
  else if (out && !inc) kind = 'expense'
  else {
    // Both present ("received … then sent"): go by whichever appears first.
    const i = t.search(IN_RE)
    const o = t.search(OUT_RE)
    kind = i >= 0 && (o < 0 || i < o) ? 'income' : 'expense'
  }

  const rel = kind === 'income' ? /\bfrom\s+([^,.\n]{2,40})/i : /\bto\s+([^,.\n]{2,40})/i
  let merchant = t.match(rel)?.[1]?.trim()
  if (merchant) {
    merchant = merchant.replace(TRAILING_JUNK, '').replace(/\s+/g, ' ').trim()
    if (merchant.length < 2) merchant = undefined
  }

  const currency = /\$|\busd\b/i.test(t) ? 'USD' : 'PHP'
  return { kind, amount, currency, merchant: merchant || undefined }
}
