// Capture the calculator amount keypad inside the Add-transaction sheet.
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

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })

// Open the Add-transaction sheet from Home's quick action.
await page.getByRole('button', { name: 'Expense' }).click()
await page.waitForSelector('.calc__pad', { timeout: 8000 })

// Punch in a small calculation: 1200 + 45.50
for (const k of ['1', '2', '0', '0', '+', '4', '5', '.', '5', '0']) {
  await page.getByRole('button', { name: keyName(k), exact: true }).click()
}
await page.waitForTimeout(300)
await page.screenshot({ path: `${outDir}/wave8-calc.png` })
console.log('shot wave8-calc')

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)

function keyName(k) {
  const map = { '+': 'Plus', '.': 'Decimal point' }
  return map[k] ?? k
}
