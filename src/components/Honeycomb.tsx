// Decorative honeycomb cluster used as an accent behind headers/hero cards.
function hex(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90) // pointy-top
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function HexCluster({
  color = 'rgba(255,255,255,0.16)',
  style,
}: {
  color?: string
  style?: React.CSSProperties
}) {
  const r = 18
  const w = Math.sqrt(3) * r
  const step = 1.5 * r
  const centers: [number, number][] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 20 + col * w + (row % 2 ? w / 2 : 0)
      const y = 20 + row * step
      centers.push([x, y])
    }
  }
  return (
    <svg width="150" height="120" viewBox="0 0 150 120" aria-hidden="true" style={style}>
      {centers.map(([cx, cy], i) => (
        <polygon key={i} points={hex(cx, cy, r - 2)} fill="none" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  )
}
