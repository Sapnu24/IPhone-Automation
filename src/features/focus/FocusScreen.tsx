import { useState } from 'react'
import { useApp } from '../../store'
import { usePomodoro } from './usePomodoro'
import { EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui'
import { IconPause, IconPlay, IconPlus, IconReset, IconTrash } from '../../components/Icons'
import { todayISO, toISODate } from '../../lib/format'
import type { FocusType } from '../../types'

const MODE: Record<FocusType, { label: string; color: string; emoji: string }> = {
  work: { label: 'Focus', color: 'var(--primary)', emoji: '🍅' },
  shortBreak: { label: 'Short break', color: 'var(--success)', emoji: '☕️' },
  longBreak: { label: 'Long break', color: 'var(--c-utilities)', emoji: '🌿' },
}

function mmss(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function FocusScreen() {
  const app = useApp()
  const p = usePomodoro()
  const meta = MODE[p.mode]

  const R = 118
  const C = 2 * Math.PI * R
  const frac = p.totalMs > 0 ? p.remainingMs / p.totalMs : 0
  const offset = C * (1 - frac)

  const today = todayISO()
  const todaySessions = app.focusSessions.filter(
    (s) => s.completed && toISODate(new Date(s.startedAt)) === today,
  )
  const focusedMin = todaySessions.reduce((sum, s) => sum + s.durationMin, 0)

  return (
    <div className="screen">
      <ScreenHeader title="Focus" subtitle="Work in calm, focused blocks." />

      <SegmentedControl
        options={[
          { value: 'work', label: 'Focus' },
          { value: 'shortBreak', label: 'Short' },
          { value: 'longBreak', label: 'Long' },
        ]}
        value={p.mode}
        onChange={(v) => p.setMode(v as FocusType)}
      />

      <input
        className="input"
        style={{ marginTop: 14 }}
        placeholder="What are you working on? (optional)"
        value={p.taskLabel}
        onChange={(e) => p.setTaskLabel(e.target.value)}
        maxLength={60}
      />

      {/* Timer ring */}
      <div style={{ display: 'grid', placeItems: 'center', margin: '18px 0 8px' }}>
        <div style={{ position: 'relative', width: 260, height: 260 }}>
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
            <circle
              cx="130"
              cy="130"
              r={R}
              fill="none"
              stroke={meta.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              transform="rotate(-90 130 130)"
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: meta.color }}>
                {meta.emoji} {meta.label}
              </div>
              <div className="tabular" style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {mmss(p.remainingMs)}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {p.workStreak % app.settings.pomodoro.longEvery}/{app.settings.pomodoro.longEvery}{' '}
                to long break
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 12 }}>
        <button className="btn grow btn--ghost" onClick={p.reset}>
          <IconReset size={18} /> Reset
        </button>
        <button
          className="btn grow btn--primary"
          style={{ background: meta.color }}
          onClick={p.running ? p.pause : p.start}
        >
          {p.running ? <IconPause size={18} /> : <IconPlay size={18} />}
          {p.running ? 'Pause' : 'Start'}
        </button>
        <button className="btn grow btn--ghost" onClick={p.skip}>
          Skip
        </button>
      </div>

      <div className="card card--pad row row--between" style={{ marginTop: 16 }}>
        <span className="dim">Today</span>
        <span style={{ fontWeight: 700 }}>
          🍅 {todaySessions.length} sessions · {focusedMin}m focused
        </span>
      </div>

      <UsageSection />
    </div>
  )
}

function UsageSection() {
  const app = useApp()
  const today = todayISO()
  const [label, setLabel] = useState('')
  const [minutes, setMinutes] = useState('')

  const todayLogs = app.usageLogs.filter((u) => u.date === today)
  const total = todayLogs.reduce((s, u) => s + u.minutes, 0)
  const mins = parseInt(minutes, 10)
  const valid = label.trim() && !Number.isNaN(mins) && mins > 0

  async function add() {
    if (!valid) return
    await app.addUsageLog({ date: today, label: label.trim(), minutes: mins })
    setLabel('')
    setMinutes('')
  }

  return (
    <>
      <div className="section-label">Screen time &amp; habits (self-tracked)</div>
      <div className="card card--pad stack">
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          A web app can't read your device Screen Time (that needs the native app — see the
          roadmap). Until then, log time here to stay aware of your habits.
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input grow"
            placeholder="Instagram, Reading, YouTube…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
          />
          <input
            className="input"
            style={{ width: 92 }}
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="min"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <button className="btn btn--primary" disabled={!valid} onClick={add} aria-label="Add">
            <IconPlus size={20} />
          </button>
        </div>
      </div>

      {todayLogs.length > 0 && (
        <>
          <div className="row row--between" style={{ margin: '12px 4px 6px' }}>
            <span className="section-label" style={{ margin: 0 }}>
              Today
            </span>
            <span className="dim" style={{ fontSize: 13 }}>
              {Math.floor(total / 60)}h {total % 60}m total
            </span>
          </div>
          <div className="card list">
            {todayLogs.map((u) => (
              <div key={u.id} className="list__row">
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{u.label}</div>
                </div>
                <span className="tabular dim">{u.minutes}m</span>
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => app.deleteUsageLog(u.id)}
                  aria-label="Delete"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {todayLogs.length === 0 && (
        <EmptyState emoji="📱" title="No screen-time logged today" />
      )}
    </>
  )
}
