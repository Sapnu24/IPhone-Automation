// Parse amount + date out of OCR'd receipt text. `parseReceiptText` is pure and
// unit-tested; `scanReceipt` lazy-loads tesseract.js and runs OCR in-browser.

export interface ParsedReceipt {
  amount?: number
  date?: string // local ISO 'YYYY-MM-DD'
}

const MONEY_RE = /(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})|\d+[.,]\d{2})/g
const TOTAL_HINT = /\b(grand\s*total|amount\s*due|balance\s*due|total\s*due|total)\b/i
const NEGATIVE_HINT = /\b(sub\s*total|subtotal|change|cash|tender|savings|items?)\b/i

/** Convert a matched money token like "1,234.56" / "1.234,56" / "12,50" to a number. */
function toNumber(token: string): number {
  const lastSep = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','))
  if (lastSep === -1) return parseFloat(token)
  const intPart = token.slice(0, lastSep).replace(/[.,]/g, '')
  const decPart = token.slice(lastSep + 1)
  return parseFloat(`${intPart}.${decPart}`)
}

function moneyOnLine(line: string): number[] {
  const out: number[] = []
  const matches = line.match(MONEY_RE)
  if (matches) for (const m of matches) out.push(toNumber(m))
  return out
}

export function parseAmount(text: string): number | undefined {
  const lines = text.split(/\r?\n/)
  // 1) Prefer a "total" line that isn't a subtotal/change line.
  const totals: number[] = []
  for (const line of lines) {
    if (TOTAL_HINT.test(line) && !NEGATIVE_HINT.test(line)) {
      totals.push(...moneyOnLine(line))
    }
  }
  if (totals.length) return Math.max(...totals)

  // 2) Fallback: the largest money-looking number anywhere (usually the total).
  const all = moneyOnLine(text.replace(/\n/g, ' '))
  if (all.length) return Math.max(...all)
  return undefined
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

function iso(y: number, m: number, d: number): string | undefined {
  if (y < 100) y += 2000
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return undefined
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function parseDate(text: string, preferDMY = false): string | undefined {
  // ISO first: 2026-09-07
  const isoM = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (isoM) {
    const r = iso(+isoM[1], +isoM[2], +isoM[3])
    if (r) return r
  }
  // Month name: Sep 7, 2026  /  7 Sep 2026
  const named = text.match(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/,
  )
  if (named) {
    const mo = MONTHS[named[1].slice(0, 4).toLowerCase()] ?? MONTHS[named[1].slice(0, 3).toLowerCase()]
    if (mo) {
      const r = iso(+named[3], mo, +named[2])
      if (r) return r
    }
  }
  const named2 = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{2,4})\b/)
  if (named2) {
    const mo = MONTHS[named2[2].slice(0, 3).toLowerCase()]
    if (mo) {
      const r = iso(+named2[3], mo, +named2[1])
      if (r) return r
    }
  }
  // Numeric d/m/y or m/d/y
  const num = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/)
  if (num) {
    const a = +num[1]
    const b = +num[2]
    const y = +num[3]
    let m: number
    let d: number
    if (a > 12) {
      d = a
      m = b
    } else if (b > 12) {
      m = a
      d = b
    } else if (preferDMY) {
      d = a
      m = b
    } else {
      m = a
      d = b
    }
    const r = iso(y, m, d)
    if (r) return r
  }
  return undefined
}

export function parseReceiptText(text: string, preferDMY = false): ParsedReceipt {
  return { amount: parseAmount(text), date: parseDate(text, preferDMY) }
}

export interface ScanResult extends ParsedReceipt {
  raw: string
}

/** Run OCR on a receipt image entirely in the browser (tesseract.js, lazy-loaded).
 *  The first run downloads a language file (~a few MB) from a CDN and caches it;
 *  it needs a connection once. Throws a friendly error on failure. */
export async function scanReceipt(
  blob: Blob,
  opts: { preferDMY?: boolean; onProgress?: (pct: number) => void } = {},
): Promise<ScanResult> {
  let worker: { recognize: (b: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> } | undefined
  try {
    const { createWorker } = await import('tesseract.js')
    // Everything is served from our own origin, so OCR works offline and needs
    // no CDN. BASE_URL adapts to GitHub Pages' subpath automatically.
    const base = import.meta.env.BASE_URL
    worker = await createWorker('eng', 1, {
      workerPath: `${base}tesseract/worker.min.js`,
      corePath: `${base}tesseract/tesseract-core-simd-lstm.wasm.js`,
      langPath: `${base}tesseract/lang`,
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') opts.onProgress?.(Math.round(m.progress * 100))
      },
    })
    const { data } = await worker.recognize(blob)
    const raw = data.text ?? ''
    return { raw, ...parseReceiptText(raw, opts.preferDMY) }
  } catch (err) {
    throw new Error(
      'Could not read the receipt automatically — you can still type the amount. ' +
        ((err as Error)?.message ?? ''),
    )
  } finally {
    await worker?.terminate().catch(() => {})
  }
}
