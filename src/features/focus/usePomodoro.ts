import { useEffect, useReducer, useRef, useState } from 'react'
import { useApp } from '../../store'
import type { FocusType } from '../../types'

const KEY = 'anchor.pomodoro.v1'

interface PomoState {
  mode: FocusType
  running: boolean
  endsAt: number | null // epoch ms when the current run finishes
  remainingMs: number // used while paused / not running
  workStreak: number // completed work sessions since the last long break
  taskLabel: string
}

function load(defaultRemaining: number): PomoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as PomoState
  } catch {
    /* ignore */
  }
  return {
    mode: 'work',
    running: false,
    endsAt: null,
    remainingMs: defaultRemaining,
    workStreak: 0,
    taskLabel: '',
  }
}

export interface Pomodoro {
  mode: FocusType
  running: boolean
  remainingMs: number
  totalMs: number
  workStreak: number
  taskLabel: string
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  setMode: (m: FocusType) => void
  setTaskLabel: (v: string) => void
}

export function usePomodoro(): Pomodoro {
  const app = useApp()
  const pomo = app.settings.pomodoro

  const durMs = (m: FocusType) =>
    (m === 'work' ? pomo.workMin : m === 'shortBreak' ? pomo.shortMin : pomo.longMin) * 60_000

  const [state, setState] = useState<PomoState>(() => load(pomo.workMin * 60_000))
  const ref = useRef(state)
  ref.current = state
  const appRef = useRef(app)
  appRef.current = app
  const pomoRef = useRef(pomo)
  pomoRef.current = pomo
  const [, force] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  // Completion handler kept in a ref so the interval always calls the latest.
  const completeRef = useRef<() => void>(() => {})
  completeRef.current = () => {
    const s = ref.current
    const p = pomoRef.current
    const dm = (m: FocusType) =>
      (m === 'work' ? p.workMin : m === 'shortBreak' ? p.shortMin : p.longMin) * 60_000
    if (s.mode === 'work') {
      void appRef.current.addFocusSession({
        startedAt: (s.endsAt ?? Date.now()) - p.workMin * 60_000,
        endedAt: Date.now(),
        durationMin: p.workMin,
        type: 'work',
        taskLabel: s.taskLabel || undefined,
        completed: true,
      })
      const workStreak = s.workStreak + 1
      const next: FocusType = workStreak % p.longEvery === 0 ? 'longBreak' : 'shortBreak'
      setState({ ...s, mode: next, running: false, endsAt: null, remainingMs: dm(next), workStreak })
    } else {
      setState({ ...s, mode: 'work', running: false, endsAt: null, remainingMs: dm('work') })
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(200)
  }

  useEffect(() => {
    if (!state.running) return
    const iv = setInterval(() => {
      const s = ref.current
      if (s.endsAt && Date.now() >= s.endsAt) completeRef.current()
      else force()
    }, 250)
    return () => clearInterval(iv)
  }, [state.running, state.endsAt])

  const remainingMs =
    state.running && state.endsAt ? Math.max(0, state.endsAt - Date.now()) : state.remainingMs

  return {
    mode: state.mode,
    running: state.running,
    remainingMs,
    totalMs: durMs(state.mode),
    workStreak: state.workStreak,
    taskLabel: state.taskLabel,
    start: () => {
      const s = ref.current
      const full = s.remainingMs > 0 ? s.remainingMs : durMs(s.mode)
      setState({ ...s, running: true, endsAt: Date.now() + full })
    },
    pause: () => {
      const s = ref.current
      const rem = s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs
      setState({ ...s, running: false, endsAt: null, remainingMs: rem })
    },
    reset: () => {
      const s = ref.current
      setState({ ...s, running: false, endsAt: null, remainingMs: durMs(s.mode) })
    },
    skip: () => {
      const s = ref.current
      const next: FocusType = s.mode === 'work' ? 'shortBreak' : 'work'
      setState({ ...s, mode: next, running: false, endsAt: null, remainingMs: durMs(next) })
    },
    setMode: (m) => {
      const s = ref.current
      setState({ ...s, mode: m, running: false, endsAt: null, remainingMs: durMs(m) })
    },
    setTaskLabel: (v) => setState({ ...ref.current, taskLabel: v }),
  }
}
