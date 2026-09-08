import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useApp } from '../store'
import { exportSnapshot, importSnapshot } from './db'
import {
  cloudReady,
  watchAuth,
  watchRemote,
  pushRemote,
  signIn as cloudSignIn,
  signOutCloud,
  type RemoteDoc,
  type User,
} from './cloud'

type Status = 'idle' | 'syncing' | 'synced' | 'error'

interface SyncValue {
  available: boolean
  user: User | null
  status: Status
  lastSyncedAt: number | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const Ctx = createContext<SyncValue | null>(null)

export function useSync(): SyncValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSync must be used within SyncProvider')
  return v
}

const LS_TS = 'hive.sync.ts'
const LS_DEV = 'hive.sync.device'

function deviceId(): string {
  let d = localStorage.getItem(LS_DEV)
  if (!d) {
    d = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(LS_DEV, d)
  }
  return d
}
const getLocalTs = () => Number(localStorage.getItem(LS_TS) || 0)
const setLocalTs = (n: number) => localStorage.setItem(LS_TS, String(n))

export function SyncProvider({ children }: { children: ReactNode }) {
  const app = useApp()
  const available = cloudReady()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(getLocalTs() || null)

  const applyingRemote = useRef(false)
  const firstDataRun = useRef(true)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dev = useRef('')
  const userRef = useRef<User | null>(null)
  const initialSynced = useRef(false)

  useEffect(() => {
    if (available) dev.current = deviceId()
  }, [available])

  // Track auth state.
  useEffect(() => {
    if (!available) return
    return watchAuth((u) => {
      setUser(u)
      userRef.current = u
      initialSynced.current = false
      if (!u) setStatus('idle')
    })
  }, [available])

  async function applyRemote(d: RemoteDoc) {
    applyingRemote.current = true
    await importSnapshot(d.snapshot)
    await app.reloadAll()
    setLocalTs(d.clientTs)
    setLastSyncedAt(d.clientTs)
  }

  async function doPush() {
    const u = userRef.current
    if (!u) return
    setStatus('syncing')
    try {
      const snap = await exportSnapshot()
      const ts = Date.now()
      await pushRemote(u.uid, snap, dev.current, ts)
      setLocalTs(ts)
      setLastSyncedAt(ts)
      setStatus('synced')
    } catch (err) {
      setStatus('error')
      console.error('Cloud push failed', err)
    }
  }

  function schedulePush() {
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => void doPush(), 2500)
  }

  // Initial reconcile + live updates from other devices.
  useEffect(() => {
    if (!available || !user) return
    setStatus('syncing')
    const unsub = watchRemote(user.uid, (remote) => {
      void (async () => {
        try {
          if (!initialSynced.current) {
            initialSynced.current = true
            if (!remote) {
              await doPush() // first device — seed the cloud
            } else if (remote.clientTs > getLocalTs()) {
              await applyRemote(remote) // cloud is newer — pull it down
              setStatus('synced')
            } else {
              await doPush() // local is newer — push it up
            }
          } else if (remote && remote.updatedBy !== dev.current && remote.clientTs > getLocalTs()) {
            // A change landed from another device.
            await applyRemote(remote)
            setStatus('synced')
          }
        } catch (err) {
          setStatus('error')
          console.error('Cloud sync failed', err)
        }
      })()
    })
    return unsub
  }, [available, user])

  // Push local edits (skip the first run and any cycle caused by a remote import).
  useEffect(() => {
    if (!available) return
    if (firstDataRun.current) {
      firstDataRun.current = false
      return
    }
    if (applyingRemote.current) {
      applyingRemote.current = false
      return
    }
    if (!userRef.current) return
    schedulePush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    app.transactions,
    app.bills,
    app.occurrences,
    app.budgets,
    app.categories,
    app.focusSessions,
    app.usageLogs,
    app.accounts,
    app.transfers,
    app.incomePlans,
    app.ledgers,
    app.notes,
    app.shoppingItems,
    app.warranties,
    app.settings,
  ])

  const value: SyncValue = {
    available,
    user,
    status,
    lastSyncedAt,
    signIn: cloudSignIn,
    signOut: signOutCloud,
    syncNow: doPush,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
