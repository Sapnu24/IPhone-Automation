// Drive the built app in Chromium at an iPhone size, seed representative data,
// and capture screenshots. Usage: node scripts/screenshots.mjs [baseURL] [outDir]
import { chromium } from 'playwright'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'

const baseURL = process.argv[2] || 'http://localhost:4173/'
const outDir = process.argv[3] || 'shots'
mkdirSync(outDir, { recursive: true })

function findChrome() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  try {
    for (const d of readdirSync(base)) {
      if (!d.startsWith('chromium-') || d.includes('headless')) continue
      for (const p of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const full = `${base}/${d}/${p}`
        if (existsSync(full)) return full
      }
    }
  } catch {
    /* ignore */
  }
  return undefined
}

async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ executablePath: findChrome() })
  }
}

const SEED = `(${async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('anchor', 1)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  const put = (store, val) =>
    new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(val)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
  const d = (off) => {
    const x = new Date()
    x.setDate(x.getDate() + off)
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(
      x.getDate(),
    ).padStart(2, '0')}`
  }
  const now = Date.now()
  await put('bills', { id: 'b1', name: 'Rent', amount: 1200, categoryId: 'cat-housing', dueDate: d(4), recurrence: 'monthly', reminderDaysBefore: 3, autopay: false, createdAt: now })
  await put('bills', { id: 'b2', name: 'Electricity', amount: 84.5, categoryId: 'cat-utilities', dueDate: d(-2), recurrence: 'monthly', reminderDaysBefore: 2, autopay: false, createdAt: now })
  await put('bills', { id: 'b3', name: 'Netflix', amount: 15.99, categoryId: 'cat-subs', dueDate: d(12), recurrence: 'monthly', reminderDaysBefore: 1, autopay: true, createdAt: now })
  await put('bills', { id: 'b4', name: 'Gym', amount: 40, categoryId: 'cat-health', dueDate: d(20), recurrence: 'monthly', reminderDaysBefore: 2, autopay: true, createdAt: now })
  await put('transactions', { id: 't1', kind: 'income', amount: 3200, categoryId: 'cat-income', note: 'Salary', date: d(-6), createdAt: now })
  await put('transactions', { id: 't2', kind: 'expense', amount: 62.4, categoryId: 'cat-food', note: 'Groceries', date: d(-1), createdAt: now })
  await put('transactions', { id: 't3', kind: 'expense', amount: 4.5, categoryId: 'cat-fun', note: 'Coffee', date: d(0), createdAt: now })
  await put('transactions', { id: 't4', kind: 'expense', amount: 20, categoryId: 'cat-transport', note: 'Bus card', date: d(-3), createdAt: now })
  await put('transactions', { id: 't5', kind: 'expense', amount: 45, categoryId: 'cat-shopping', note: 'T-shirt', date: d(-2), createdAt: now })
  await put('budgets', { id: 'bud1', categoryId: 'cat-food', monthlyLimit: 400 })
  await put('budgets', { id: 'bud2', categoryId: 'cat-fun', monthlyLimit: 150 })
  await put('budgets', { id: 'bud3', categoryId: 'cat-transport', monthlyLimit: 120 })
  await put('budgets', { id: 'bud4', categoryId: 'cat-shopping', monthlyLimit: 200 })
  const dt = (offDays, hour) => {
    const x = new Date()
    x.setDate(x.getDate() + offDays)
    x.setHours(hour, 0, 0, 0)
    return x.getTime()
  }
  const fs = (id, offDays, hour, min) =>
    put('focusSessions', { id, startedAt: dt(offDays, hour), endedAt: dt(offDays, hour) + min * 60000, durationMin: min, type: 'work', taskLabel: 'Deep work', completed: true })
  await fs('f1', 0, 9, 25); await fs('f2', 0, 10, 25); await fs('f3', 0, 14, 25)
  await fs('f4', -1, 9, 25); await fs('f5', -1, 11, 25)
  await fs('f6', -2, 15, 25)
  await fs('f7', -3, 10, 25); await fs('f8', -3, 16, 25)
  await fs('f9', -5, 9, 25); await fs('f10', -6, 20, 25)
  await put('usageLogs', { id: 'u1', date: d(0), label: 'Instagram', minutes: 45, createdAt: now })
  await put('usageLogs', { id: 'u2', date: d(0), label: 'YouTube', minutes: 30, createdAt: now })
}})()`

const browser = await launch()
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

async function shot(name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${outDir}/${name}.png` })
  console.log('shot', name)
}

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })

// Seed then reload so the store picks it up.
await page.evaluate(SEED)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })

await shot('01-home-light')

await page.getByRole('link', { name: 'Money' }).click()
await page.getByRole('tab', { name: 'Spending' }).click()
await shot('02-money-spending')
await page.getByRole('tab', { name: 'Bills' }).click()
await shot('03-money-bills')
await page.getByRole('tab', { name: 'Budgets' }).click()
await shot('04-money-budgets')

await page.getByRole('link', { name: 'Focus' }).click()
await shot('05-focus')

await page.getByRole('link', { name: 'Insights' }).click()
await shot('06-insights')
await page.screenshot({ path: `${outDir}/07-insights-full.png`, fullPage: true })

await page.getByRole('link', { name: 'Settings' }).click()
await shot('08-settings')

// Dark mode
await page.getByRole('tab', { name: 'Dark' }).click()
await page.getByRole('link', { name: 'Home' }).click()
await shot('09-home-dark')
await page.getByRole('link', { name: 'Insights' }).click()
await shot('10-insights-dark')

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
