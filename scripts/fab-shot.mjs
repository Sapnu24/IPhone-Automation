// Verify the floating Chat-with-Buzz FAB placement + that it hides in chat.
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
await page.waitForSelector('.fab', { timeout: 8000 })
await page.waitForTimeout(400)
await page.screenshot({ path: `${outDir}/wave8-fab-home.png` })
console.log('shot wave8-fab-home; fab visible on home:', await page.locator('.fab').isVisible())

// Tap it → should land on chat, where the FAB hides.
await page.locator('.fab').click()
await page.waitForTimeout(500)
const onChat = page.url().includes('/chat')
const fabCount = await page.locator('.fab').count()
console.log('navigated to chat:', onChat, '| fab present in chat:', fabCount)
await page.screenshot({ path: `${outDir}/wave8-fab-chat.png` })

console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
