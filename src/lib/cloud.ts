// Thin wrapper over Firebase Auth + Firestore for optional cloud sync.
// Firebase is dynamically imported so it ships as a separate chunk and only
// loads when sync is actually configured — the offline-first core stays lean.
import type { User } from 'firebase/auth'
import type { Snapshot } from './db'
import { firebaseConfig, cloudConfigured } from '../firebaseConfig'

export function cloudReady(): boolean {
  return cloudConfigured
}

// Cached module namespaces + initialized singletons.
type AppMod = typeof import('firebase/app')
type AuthMod = typeof import('firebase/auth')
type StoreMod = typeof import('firebase/firestore')

let mods: { appMod: AppMod; authMod: AuthMod; storeMod: StoreMod } | null = null
let ready: ReturnType<typeof init> | null = null

async function loadMods() {
  if (!mods) {
    const [appMod, authMod, storeMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])
    mods = { appMod, authMod, storeMod }
  }
  return mods
}

async function init() {
  const { appMod, authMod, storeMod } = await loadMods()
  const app = appMod.initializeApp(firebaseConfig)
  // ignoreUndefinedProperties: our snapshot has optional fields (note?, etc.)
  const db = storeMod.initializeFirestore(app, { ignoreUndefinedProperties: true })
  const auth = authMod.getAuth(app)
  return { authMod, storeMod, db, auth }
}

function ensure() {
  if (!cloudConfigured) throw new Error('Cloud sync is not configured')
  if (!ready) ready = init()
  return ready
}

export function watchAuth(cb: (u: User | null) => void): () => void {
  if (!cloudConfigured) {
    cb(null)
    return () => {}
  }
  let unsub = () => {}
  let cancelled = false
  void (async () => {
    const { auth, authMod } = await ensure()
    void authMod.getRedirectResult(auth).catch(() => {})
    if (cancelled) return
    unsub = authMod.onAuthStateChanged(auth, cb)
  })()
  return () => {
    cancelled = true
    unsub()
  }
}

export async function signIn(): Promise<void> {
  const { auth, authMod } = await ensure()
  const provider = new authMod.GoogleAuthProvider()
  try {
    await authMod.signInWithPopup(auth, provider)
  } catch {
    // Popups are often blocked inside installed PWAs — fall back to redirect.
    await authMod.signInWithRedirect(auth, provider)
  }
}

export async function signOutCloud(): Promise<void> {
  const { auth, authMod } = await ensure()
  await authMod.signOut(auth)
}

export interface RemoteDoc {
  snapshot: Snapshot
  clientTs: number
  updatedBy: string
}

export async function pullOnce(uid: string): Promise<RemoteDoc | null> {
  const { db, storeMod } = await ensure()
  const s = await storeMod.getDoc(storeMod.doc(db, 'users', uid))
  return s.exists() ? (s.data() as RemoteDoc) : null
}

export function watchRemote(uid: string, cb: (d: RemoteDoc | null) => void): () => void {
  let unsub = () => {}
  let cancelled = false
  void (async () => {
    const { db, storeMod } = await ensure()
    if (cancelled) return
    unsub = storeMod.onSnapshot(storeMod.doc(db, 'users', uid), (s) =>
      cb(s.exists() ? (s.data() as RemoteDoc) : null),
    )
  })()
  return () => {
    cancelled = true
    unsub()
  }
}

export async function pushRemote(
  uid: string,
  snapshot: Snapshot,
  deviceId: string,
  clientTs: number,
): Promise<void> {
  const { db, storeMod } = await ensure()
  await storeMod.setDoc(storeMod.doc(db, 'users', uid), {
    snapshot,
    clientTs,
    updatedBy: deviceId,
    updatedAt: storeMod.serverTimestamp(),
  })
}

export type { User }
