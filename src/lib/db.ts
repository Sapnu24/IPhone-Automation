import { openDB, type IDBPDatabase } from 'idb'
import {
  defaultCategories,
  defaultSettings,
  type Bill,
  type BillOccurrence,
  type Budget,
  type Category,
  type FocusSession,
  type Settings,
  type Transaction,
  type UsageLog,
} from '../types'

const DB_NAME = 'anchor'
const DB_VERSION = 1

export const STORES = {
  transactions: 'transactions',
  bills: 'bills',
  billOccurrences: 'billOccurrences',
  budgets: 'budgets',
  categories: 'categories',
  focusSessions: 'focusSessions',
  usageLogs: 'usageLogs',
  images: 'images',
  meta: 'meta',
} as const

export type StoreName = (typeof STORES)[keyof typeof STORES]

let dbp: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbp) {
    dbp = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const txns = db.createObjectStore(STORES.transactions, { keyPath: 'id' })
        txns.createIndex('by-date', 'date')

        db.createObjectStore(STORES.bills, { keyPath: 'id' })

        const occ = db.createObjectStore(STORES.billOccurrences, { keyPath: 'id' })
        occ.createIndex('by-bill', 'billId')

        db.createObjectStore(STORES.budgets, { keyPath: 'id' })
        db.createObjectStore(STORES.categories, { keyPath: 'id' })

        const focus = db.createObjectStore(STORES.focusSessions, { keyPath: 'id' })
        focus.createIndex('by-start', 'startedAt')

        const usage = db.createObjectStore(STORES.usageLogs, { keyPath: 'id' })
        usage.createIndex('by-date', 'date')

        db.createObjectStore(STORES.images, { keyPath: 'id' })
        db.createObjectStore(STORES.meta) // out-of-line keys: 'settings', 'seeded'
      },
    })
  }
  return dbp
}

// ---- Generic CRUD -------------------------------------------------------

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return (await getDB()).getAll(store) as Promise<T[]>
}

export async function getOne<T>(store: StoreName, id: string): Promise<T | undefined> {
  return (await getDB()).get(store, id) as Promise<T | undefined>
}

export async function put<T>(store: StoreName, value: T): Promise<T> {
  await (await getDB()).put(store, value)
  return value
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const v of values) await tx.store.put(v)
  await tx.done
}

export async function remove(store: StoreName, id: string): Promise<void> {
  await (await getDB()).delete(store, id)
}

export async function clearStore(store: StoreName): Promise<void> {
  await (await getDB()).clear(store)
}

// ---- Settings (singleton in `meta`) ------------------------------------

export async function getSettings(): Promise<Settings> {
  const db = await getDB()
  const s = (await db.get(STORES.meta, 'settings')) as Settings | undefined
  if (!s) return defaultSettings()
  // Merge to tolerate older records missing newer fields.
  return { ...defaultSettings(), ...s, pomodoro: { ...defaultSettings().pomodoro, ...s.pomodoro } }
}

export async function saveSettings(s: Settings): Promise<Settings> {
  const db = await getDB()
  await db.put(STORES.meta, s, 'settings')
  return s
}

// ---- Seeding ------------------------------------------------------------

export async function ensureSeed(): Promise<void> {
  const db = await getDB()
  const seeded = await db.get(STORES.meta, 'seeded')
  if (seeded) return
  const tx = db.transaction([STORES.categories, STORES.meta], 'readwrite')
  for (const c of defaultCategories()) await tx.objectStore(STORES.categories).put(c)
  const existing = await tx.objectStore(STORES.meta).get('settings')
  if (!existing) await tx.objectStore(STORES.meta).put(defaultSettings(), 'settings')
  await tx.objectStore(STORES.meta).put(true, 'seeded')
  await tx.done
}

// ---- Receipt images (blobs) --------------------------------------------

export async function putImage(id: string, blob: Blob): Promise<void> {
  await (await getDB()).put(STORES.images, { id, blob })
}

export async function getImage(id: string): Promise<Blob | undefined> {
  const rec = (await getOne<{ id: string; blob: Blob }>(STORES.images, id)) ?? undefined
  return rec?.blob
}

// ---- Backup snapshot (for export / import) -----------------------------

export interface Snapshot {
  version: number
  exportedAt: string
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  bills: Bill[]
  billOccurrences: BillOccurrence[]
  budgets: Budget[]
  focusSessions: FocusSession[]
  usageLogs: UsageLog[]
}

export async function exportSnapshot(): Promise<Snapshot> {
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    categories: await getAll<Category>(STORES.categories),
    transactions: await getAll<Transaction>(STORES.transactions),
    bills: await getAll<Bill>(STORES.bills),
    billOccurrences: await getAll<BillOccurrence>(STORES.billOccurrences),
    budgets: await getAll<Budget>(STORES.budgets),
    focusSessions: await getAll<FocusSession>(STORES.focusSessions),
    usageLogs: await getAll<UsageLog>(STORES.usageLogs),
  }
}

/** Replace all data with a snapshot (used by Restore from backup). */
export async function importSnapshot(snap: Snapshot): Promise<void> {
  await Promise.all([
    clearStore(STORES.categories),
    clearStore(STORES.transactions),
    clearStore(STORES.bills),
    clearStore(STORES.billOccurrences),
    clearStore(STORES.budgets),
    clearStore(STORES.focusSessions),
    clearStore(STORES.usageLogs),
  ])
  await Promise.all([
    putMany(STORES.categories, snap.categories ?? []),
    putMany(STORES.transactions, snap.transactions ?? []),
    putMany(STORES.bills, snap.bills ?? []),
    putMany(STORES.billOccurrences, snap.billOccurrences ?? []),
    putMany(STORES.budgets, snap.budgets ?? []),
    putMany(STORES.focusSessions, snap.focusSessions ?? []),
    putMany(STORES.usageLogs, snap.usageLogs ?? []),
  ])
  if (snap.settings) await saveSettings(snap.settings)
}

/** Erase everything (used by "reset all data"). */
export async function wipeAll(): Promise<void> {
  await Promise.all(Object.values(STORES).map((s) => clearStore(s)))
  await ensureSeed()
}
