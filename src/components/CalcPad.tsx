import { formatMoney } from '../lib/format'
import { evalExpr, type CalcKey } from '../lib/calc'

interface Props {
  expr: string
  onKey: (k: CalcKey) => void
  currency: string
  locale: string
}

// Rows mirror a familiar calculator layout: operators down the right edge.
const ROWS: { key: CalcKey; label?: string; variant?: 'op' | 'accent' | 'ghost' }[][] = [
  [
    { key: 'C', label: 'C', variant: 'ghost' },
    { key: '%', label: '%', variant: 'ghost' },
    { key: '⌫', label: '⌫', variant: 'ghost' },
    { key: '÷', label: '÷', variant: 'op' },
  ],
  [
    { key: '7' },
    { key: '8' },
    { key: '9' },
    { key: '×', label: '×', variant: 'op' },
  ],
  [
    { key: '4' },
    { key: '5' },
    { key: '6' },
    { key: '-', label: '−', variant: 'op' },
  ],
  [
    { key: '1' },
    { key: '2' },
    { key: '3' },
    { key: '+', label: '+', variant: 'op' },
  ],
  [
    { key: '00' },
    { key: '0' },
    { key: '.' },
    { key: '=', label: '=', variant: 'accent' },
  ],
]

export default function CalcPad({ expr, onKey, currency, locale }: Props) {
  const value = evalExpr(expr)
  const hasMath = /[+\-×÷]/.test(expr.slice(1)) // ignore a leading minus
  const display = expr.replace(/-/g, '−').replace(/(?!^)[+−×÷]/g, (m) => ` ${m} `)

  return (
    <div className="calc">
      <div className="calc__display" aria-live="polite">
        {hasMath && <div className="calc__expr">{display}</div>}
        <div className="calc__value">{formatMoney(value, currency, locale)}</div>
      </div>
      <div className="calc__pad">
        {ROWS.flat().map((b) => (
          <button
            key={b.key}
            type="button"
            className={`calc__key${b.variant ? ' calc__key--' + b.variant : ''}`}
            onClick={() => {
              navigator.vibrate?.(6) // subtle tap where supported; no-op elsewhere
              onKey(b.key)
            }}
            aria-label={ariaLabel(b.key)}
          >
            {b.label ?? b.key}
          </button>
        ))}
      </div>
    </div>
  )
}

function ariaLabel(k: CalcKey): string {
  const map: Partial<Record<CalcKey, string>> = {
    '⌫': 'Delete',
    C: 'Clear',
    '÷': 'Divide',
    '×': 'Multiply',
    '-': 'Minus',
    '+': 'Plus',
    '=': 'Equals',
    '%': 'Percent',
    '.': 'Decimal point',
  }
  return map[k] ?? k
}
