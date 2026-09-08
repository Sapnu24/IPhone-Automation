/** A tiny, safe arithmetic evaluator for the amount keypad. It supports + − × ÷
 *  and evaluates strictly left-to-right (no operator precedence) — which is what
 *  people expect from a calculator keypad, e.g. "1 + 2 × 3" = 9, not 7. */

export type CalcKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '00' | '.'
  | '+' | '-' | '×' | '÷'
  | '=' | 'C' | '⌫' | '%'

const OPS = new Set(['+', '-', '×', '÷'])

/** Evaluate a keypad expression to a number (rounded to cents). Partial or
 *  malformed input evaluates as far as it sensibly can; empty → 0. */
export function evalExpr(expr: string): number {
  if (!expr) return 0
  const tokens = expr.match(/\d+(?:\.\d*)?|\.\d+|[+\-×÷]/g)
  if (!tokens || tokens.length === 0) return 0
  let acc = parseFloat(tokens[0])
  if (Number.isNaN(acc)) acc = 0
  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i]
    if (!OPS.has(tok)) continue
    const next = tokens[i + 1]
    if (next === undefined || OPS.has(next)) break // trailing operator — stop here
    const n = parseFloat(next)
    if (Number.isNaN(n)) break
    if (tok === '+') acc += n
    else if (tok === '-') acc -= n
    else if (tok === '×') acc *= n
    else if (tok === '÷') acc = n === 0 ? acc : acc / n
    i += 1
  }
  if (!Number.isFinite(acc)) return 0
  return Math.round(acc * 100) / 100
}

/** Apply a key press to the current expression, returning the next expression. */
export function applyKey(expr: string, key: CalcKey): string {
  const last = expr.slice(-1)
  switch (key) {
    case 'C':
      return ''
    case '⌫':
      return expr.slice(0, -1)
    case '=':
      return trimZeros(evalExpr(expr))
    case '%':
      return trimZeros(Math.round((evalExpr(expr) / 100) * 10000) / 10000)
    case '+':
    case '-':
    case '×':
    case '÷':
      if (expr === '') return key === '-' ? '-' : expr // allow a leading minus only
      if (OPS.has(last)) return expr.slice(0, -1) + key // replace a dangling operator
      return expr + key
    case '.': {
      // one decimal point per number segment
      const seg = currentSegment(expr)
      if (seg.includes('.')) return expr
      return seg === '' ? expr + '0.' : expr + '.'
    }
    case '00':
    case '0': {
      const seg = currentSegment(expr)
      if (seg === '0') return expr // no 0 → 00 pileup before a decimal
      return expr + key
    }
    default:
      return expr + key
  }
}

/** The numeric segment currently being typed (after the last operator). */
function currentSegment(expr: string): string {
  const m = expr.match(/[+\-×÷]/g)
  if (!m) return expr
  const idx = Math.max(expr.lastIndexOf('+'), expr.lastIndexOf('-'), expr.lastIndexOf('×'), expr.lastIndexOf('÷'))
  return expr.slice(idx + 1)
}

function trimZeros(n: number): string {
  if (!Number.isFinite(n)) return '0'
  // avoid scientific notation and trailing .00 noise
  return String(Math.round(n * 100) / 100)
}
