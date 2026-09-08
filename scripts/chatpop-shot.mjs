// Verify the Buzz FAB opens the chat as a popup overlay (no navigation).
import { chromium } from 'playwright'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'

const baseURL = (process.argv[2] || 'http://localhost:4173/').replace(/\/$/, '')
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(baseURL + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('.fab', { timeout: 15000 })
const urlBefore = page.url()
await page.locator('.fab').click()
await page.waitForSelector('.chat-pop', { timeout: 6000 })
await page.waitForTimeout(450)
const urlAfter = page.url()
console.log('URL unchanged (no navigation):', urlBefore === urlAfter, '|', urlAfter)
await page.screenshot({ path: `${outDir}/wave8-chatpop.png` })

// Type a quick expense to confirm it logs inside the popup.
await page.getByPlaceholder('e.g. 500 mcdo, 220 starbucks').fill('500 mcdo')
await page.getByRole('button', { name: 'Send', exact: true }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${outDir}/wave8-chatpop-logged.png` })
console.log('shot wave8-chatpop + logged')

// Backdrop click closes it.
await page.mouse.click(195, 60)
await page.waitForTimeout(300)
console.log('closed on backdrop click:', (await page.locator('.chat-pop').count()) === 0)

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
