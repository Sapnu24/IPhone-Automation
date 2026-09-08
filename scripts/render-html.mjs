// Render an HTML file's #sheet element to a PNG via the pre-installed Chromium.
// Usage: node scripts/render-html.mjs <input.html> <output.png>
import { chromium } from 'playwright'
import { readdirSync, existsSync } from 'node:fs'

function findChrome() {
  const b = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  try {
    for (const d of readdirSync(b)) {
      if (!d.startsWith('chromium-') || d.includes('headless')) continue
      for (const p of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        if (existsSync(`${b}/${d}/${p}`)) return `${b}/${d}/${p}`
      }
    }
  } catch {}
  return undefined
}

let browser
try {
  browser = await chromium.launch()
} catch {
  browser = await chromium.launch({ executablePath: findChrome() })
}
const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' })
const el = (await page.$('#sheet')) ?? page
await el.screenshot({ path: process.argv[3] })
await browser.close()
console.log('rendered', process.argv[3])
