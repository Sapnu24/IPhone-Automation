export interface DonutItem {
  label: string
  value: number
  color: string
}

export function Donut({
  items,
  size = 132,
  thickness = 16,
  centerLabel,
  centerSub,
}: {
  items: DonutItem[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  const r = (size - thickness) / 2
  const C = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  const gap = items.length > 1 ? 2 : 0
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {items.map((seg, i) => {
          const frac = seg.value / total
          const len = Math.max(0, frac * C - gap)
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += frac * C
          return el
        })}
      </g>
      {centerLabel && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 22, fontWeight: 800, fill: 'var(--text)' }}
        >
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 11, fill: 'var(--text-3)' }}
        >
          {centerSub}
        </text>
      )}
    </svg>
  )
}
