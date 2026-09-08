// Capture the new illustrated Buzz: the turnaround in Settings and Buzz in Chat.
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
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(baseURL + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })

// Settings turnaround.
await page.goto(baseURL + '/#/settings', { waitUntil: 'networkidle' })
await page.waitForSelector('.turnaround', { timeout: 8000 })
await page.locator('.turnaround').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.locator('.turnaround').screenshot({ path: `${outDir}/wave8-turnaround.png` })
// also grab the whole Meet Buzz card in context
const card = page.locator('.turnaround').locator('xpath=..')
await card.screenshot({ path: `${outDir}/wave8-meetbuzz.png` })
console.log('shot wave8-turnaround + meetbuzz')

// Chat with Buzz.
await page.goto(baseURL + '/#/chat', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: `${outDir}/wave8-chat-buzz.png` })
console.log('shot wave8-chat-buzz')

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
