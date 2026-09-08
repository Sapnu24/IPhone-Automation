import { chromium } from 'playwright'
import { readdirSync, existsSync } from 'node:fs'

const baseURL = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'
function findChrome() {
  const b = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  try {
    for (const d of readdirSync(b)) {
      if (!d.startsWith('chromium-') || d.includes('headless')) continue
      for (const p of ['chrome-linux/chrome', 'chrome-linux/headless_shell'])
        if (existsSync(`${b}/${d}/${p}`)) return `${b}/${d}/${p}`
    }
  } catch {}
}
let browser
try { browser = await chromium.launch() } catch { browser = await chromium.launch({ executablePath: findChrome() }) }
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })
await page.evaluate(() => { window.location.hash = '#/chat' })
await page.waitForSelector('input[placeholder*="mcdo"]', { timeout: 8000 })

await page.getByPlaceholder(/mcdo/).fill('500 mcdo, 220 starbucks, 20 jeep')
await page.getByRole('button', { name: 'Send' }).click()
await page.waitForSelector('text=/Logged 3/', { timeout: 6000 })
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/12-chat-logged.png` })

await page.getByPlaceholder(/mcdo/).fill('how much did I spend on food?')
await page.getByRole('button', { name: 'Send' }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/13-chat-question.png` })

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
