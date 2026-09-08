import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as db from './lib/db'
import { STORES } from './lib/db'
import { uid } from './lib/id'
import {
  defaultSettings,
  type Account,
  type Bill,
  type BillOccurrence,
  type Budget,
  type Category,
  type FocusSession,
  type IncomePlan,
  type Settings,
  type Transaction,
  type Transfer,
  type UsageLog,
} from './types'

interface AppValue {
  loading: boolean
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  bills: Bill[]
  occurrences: BillOccurrence[]
  budgets: Budget[]
  focusSessions: FocusSession[]
  usageLogs: UsageLog[]
  accounts: Account[]
  transfers: Transfer[]
  incomePlans: IncomePlan[]

  categoryById: (id: string) => Category | undefined
  accountById: (id: string) => Account | undefined

  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>
  updateTransaction: (t: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  addBill: (b: Omit<Bill, 'id' | 'createdAt'>) => Promise<Bill>
  updateBill: (b: Bill) => Promise<void>
  deleteBill: (id: string) => Promise<void>
  payBill: (billId: string, dueISO: string) => Promise<void>
  undoPay: (billId: string, dueISO: string) => Promise<void>

  setBudget: (categoryId: string, monthlyLimit: number) => Promise<void>
  removeBudget: (categoryId: string) => Promise<void>

  addCategory: (c: Omit<Category, 'id'>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>

  addFocusSession: (f: Omit<FocusSession, 'id'>) => Promise<FocusSession>
  addUsageLog: (u: Omit<UsageLog, 'id' | 'createdAt'>) => Promise<UsageLog>
  deleteUsageLog: (id: string) => Promise<void>

  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>
  updateAccount: (a: Account) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  addTransfer: (t: Omit<Transfer, 'id' | 'createdAt'>) => Promise<Transfer>
  deleteTransfer: (id: string) => Promise<void>

  addIncomePlan: (p: Omit<IncomePlan, 'id' | 'createdAt'>) => Promise<IncomePlan>
  updateIncomePlan: (p: IncomePlan) => Promise<void>
  deleteIncomePlan: (id: string) => Promise<void>

  updateSettings: (patch: Partial<Settings>) => Promise<void>
  reloadAll: () => Promise<void>
}

const Ctx = createContext<AppValue | null>(null)

export function useApp(): AppValue {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp must be used inside <AppProvider>')
  return c
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings>(defaultSettings())
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [occurrences, setOccurrences] = useState<BillOccurrence[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [incomePlans, setIncomePlans] = useState<IncomePlan[]>([])

  async function reloadAll() {
    await db.ensureSeed()
    const [s, cats, txns, bl, occ, bud, fs, ul, accts, trs, inc] = await Promise.all([
      db.getSettings(),
      db.getAll<Category>(STORES.categories),
      db.getAll<Transaction>(STORES.transactions),
      db.getAll<Bill>(STORES.bills),
      db.getAll<BillOccurrence>(STORES.billOccurrences),
      db.getAll<Budget>(STORES.budgets),
      db.getAll<FocusSession>(STORES.focusSessions),
      db.getAll<UsageLog>(STORES.usageLogs),
      db.getAll<Account>(STORES.accounts),
      db.getAll<Transfer>(STORES.transfers),
      db.getAll<IncomePlan>(STORES.incomePlans),
    ])
    setSettings(s)
    setCategories(cats)
    setTransactions(txns)
    setBills(bl)
    setOccurrences(occ)
    setBudgets(bud)
    setFocusSessions(fs)
    setUsageLogs(ul)
    setAccounts(accts)
    setTransfers(trs)
    setIncomePlans(inc)
  }

  useEffect(() => {
    void (async () => {
      try {
        await reloadAll()
      } catch (err) {
        console.error('Failed to load local data', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Apply the theme preference to the document root.
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const value: AppValue = {
    loading,
    settings,
    categories,
    transactions,
    bills,
    occurrences,
    budgets,
    focusSessions,
    usageLogs,
    accounts,
    transfers,
    incomePlans,

    categoryById: (id) => categories.find((c) => c.id === id),
    accountById: (id) => accounts.find((a) => a.id === id),

    async addTransaction(input) {
      const t: Transaction = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.transactions, t)
      setTransactions((p) => [t, ...p])
      return t
    },
    async updateTransaction(t) {
      await db.put(STORES.transactions, t)
      setTransactions((p) => p.map((x) => (x.id === t.id ? t : x)))
    },
    async deleteTransaction(id) {
      await db.remove(STORES.transactions, id)
      setTransactions((p) => p.filter((x) => x.id !== id))
    },

    async addBill(input) {
      const b: Bill = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.bills, b)
      setBills((p) => [...p, b])
      return b
    },
    async updateBill(b) {
      await db.put(STORES.bills, b)
      setBills((p) => p.map((x) => (x.id === b.id ? b : x)))
    },
    async deleteBill(id) {
      await db.remove(STORES.bills, id)
      setBills((p) => p.filter((x) => x.id !== id))
    },
    async payBill(billId, dueISO) {
      const o: BillOccurrence = { id: uid(), billId, dueDate: dueISO, paidAt: Date.now() }
      await db.put(STORES.billOccurrences, o)
      setOccurrences((p) => [...p, o])
    },
    async undoPay(billId, dueISO) {
      const found = occurrences.find((o) => o.billId === billId && o.dueDate === dueISO)
      if (!found) return
      await db.remove(STORES.billOccurrences, found.id)
      setOccurrences((p) => p.filter((o) => o.id !== found.id))
    },

    async setBudget(categoryId, monthlyLimit) {
      const existing = budgets.find((b) => b.categoryId === categoryId)
      const b: Budget = existing
        ? { ...existing, monthlyLimit }
        : { id: uid(), categoryId, monthlyLimit }
      await db.put(STORES.budgets, b)
      setBudgets((p) => (existing ? p.map((x) => (x.id === b.id ? b : x)) : [...p, b]))
    },
    async removeBudget(categoryId) {
      const existing = budgets.find((b) => b.categoryId === categoryId)
      if (!existing) return
      await db.remove(STORES.budgets, existing.id)
      setBudgets((p) => p.filter((b) => b.id !== existing.id))
    },

    async addCategory(input) {
      const c: Category = { ...input, id: uid() }
      await db.put(STORES.categories, c)
      setCategories((p) => [...p, c])
      return c
    },
    async deleteCategory(id) {
      await db.remove(STORES.categories, id)
      setCategories((p) => p.filter((c) => c.id !== id))
    },

    async addFocusSession(input) {
      const f: FocusSession = { ...input, id: uid() }
      await db.put(STORES.focusSessions, f)
      setFocusSessions((p) => [f, ...p])
      return f
    },
    async addUsageLog(input) {
      const u: UsageLog = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.usageLogs, u)
      setUsageLogs((p) => [u, ...p])
      return u
    },
    async deleteUsageLog(id) {
      await db.remove(STORES.usageLogs, id)
      setUsageLogs((p) => p.filter((u) => u.id !== id))
    },

    async addAccount(input) {
      const a: Account = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.accounts, a)
      setAccounts((p) => [...p, a])
      return a
    },
    async updateAccount(a) {
      await db.put(STORES.accounts, a)
      setAccounts((p) => p.map((x) => (x.id === a.id ? a : x)))
    },
    async deleteAccount(id) {
      await db.remove(STORES.accounts, id)
      setAccounts((p) => p.filter((a) => a.id !== id))
    },
    async addTransfer(input) {
      const t: Transfer = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.transfers, t)
      setTransfers((p) => [t, ...p])
      return t
    },
    async deleteTransfer(id) {
      await db.remove(STORES.transfers, id)
      setTransfers((p) => p.filter((t) => t.id !== id))
    },

    async addIncomePlan(input) {
      const p: IncomePlan = { ...input, id: uid(), createdAt: Date.now() }
      await db.put(STORES.incomePlans, p)
      setIncomePlans((prev) => [...prev, p])
      return p
    },
    async updateIncomePlan(p) {
      await db.put(STORES.incomePlans, p)
      setIncomePlans((prev) => prev.map((x) => (x.id === p.id ? p : x)))
    },
    async deleteIncomePlan(id) {
      await db.remove(STORES.incomePlans, id)
      setIncomePlans((prev) => prev.filter((x) => x.id !== id))
    },

    async updateSettings(patch) {
      const s = { ...settings, ...patch }
      await db.saveSettings(s)
      setSettings(s)
    },
    reloadAll,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
