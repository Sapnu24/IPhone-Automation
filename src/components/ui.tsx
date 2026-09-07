import type { ReactNode } from 'react'
import type { Category } from '../types'
import { formatMoney } from '../lib/format'
import { IconPlus } from './Icons'

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="screen__header">
      <div className="row row--between">
        <div>
          <div className="screen__title">{title}</div>
          {subtitle && <div className="screen__subtitle">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="segment" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={'segment__btn' + (o.value === value ? ' is-active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function CategoryChips({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        margin: '0 -4px',
        paddingInline: 4,
      }}
    >
      {categories.map((c) => {
        const active = c.id === selectedId
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="pill"
            style={{
              flex: 'none',
              padding: '8px 12px',
              fontSize: 13,
              background: active ? c.color : 'var(--surface-2)',
              color: active ? '#fff' : 'var(--text-2)',
              borderColor: active ? 'transparent' : 'var(--border)',
            }}
          >
            <span>{c.icon}</span>
            {c.name}
          </button>
        )
      })}
    </div>
  )
}

export function MoneyText({
  amount,
  currency,
  locale,
  kind = 'expense',
  className,
}: {
  amount: number
  currency: string
  locale: string
  kind?: 'expense' | 'income' | 'neutral'
  className?: string
}) {
  const color =
    kind === 'income' ? 'var(--success)' : kind === 'expense' ? 'var(--text)' : 'var(--text)'
  const sign = kind === 'income' ? '+' : kind === 'expense' ? '−' : ''
  return (
    <span className={'tabular ' + (className ?? '')} style={{ color, fontWeight: 700 }}>
      {sign}
      {formatMoney(amount, currency, locale)}
    </span>
  )
}

export function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="empty">
      <div className="empty__emoji">{emoji}</div>
      <div style={{ fontWeight: 700, color: 'var(--text-2)', marginTop: 6 }}>{title}</div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 13 }}>{subtitle}</div>}
    </div>
  )
}

export function Fab({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'fixed',
        right: 'max(16px, calc(50% - var(--maxw) / 2 + 16px))',
        bottom: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)',
        width: 56,
        height: 56,
        borderRadius: 18,
        border: 'none',
        background: 'var(--primary)',
        color: 'var(--primary-ink)',
        boxShadow: 'var(--shadow-2)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 40,
      }}
    >
      <IconPlus size={26} />
    </button>
  )
}
