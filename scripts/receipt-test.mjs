// End-to-end test of the receipt scan flow: render a fake receipt image, feed
// it to the Add-transaction form, and watch OCR fill the fields.
import { chromium } from 'playwright'
import { readdirSync, existsSync } from 'node:fs'

const baseURL = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'

function findChrome() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  try {
    for (const d of readdirSync(base)) {
      if (!d.startsWith('chromium-') || d.includes('headless')) continue
      for (const p of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        if (existsSync(`${base}/${d}/${p}`)) return `${base}/${d}/${p}`
      }
    }
  } catch {}
  return undefined
}
async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ executablePath: findChrome() })
  }
}

const receiptHTML = `<div style="width:360px;padding:24px;font:20px/1.5 monospace;background:#fff;color:#111">
CORNER CAFE<br>123 Main St<br>09/07/2026 14:32<br>--------------------<br>
Latte&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4.50<br>Muffin&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.25<br>
SUBTOTAL&nbsp;&nbsp;&nbsp;7.75<br>TAX&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.62<br>
<b>TOTAL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8.37</b><br>--------------------<br>VISA ....1234<br>THANK YOU!</div>`

const browser = await launch()

// 1) Render the receipt image to a PNG file.
const p0 = await browser.newPage()
await p0.setContent(`<body style="margin:0">${receiptHTML}</body>`)
const receiptPath = `${out}/_receipt.png`
await p0.locator('div').first().screenshot({ path: receiptPath })
await p0.close()
console.log('rendered receipt ->', receiptPath)

// 2) Drive the app.
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.waitForSelector('.tabbar', { timeout: 15000 })
await page.getByRole('link', { name: 'Money' }).click()
await page.getByRole('button', { name: 'Add' }).click()
await page.waitForSelector('input[type=file]', { state: 'attached', timeout: 8000 })

await page.setInputFiles('input[type=file]', receiptPath)
console.log('receipt uploaded; waiting for OCR…')

// Wait until the amount field is filled OR a scan message resolves (<=40s).
let filledAmount = ''
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000)
  filledAmount = await page.locator('input[type=number]').first().inputValue().catch(() => '')
  const scanning = await page.locator('text=Reading receipt').count()
  if (filledAmount && filledAmount !== '' && filledAmount !== '0') break
  if (i > 4 && scanning === 0) break // scan finished (success or fallback)
}
const dateVal = await page.locator('input[type=date]').first().inputValue().catch(() => '')
console.log('amount field =', JSON.stringify(filledAmount), '| date field =', JSON.stringify(dateVal))

await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/11-receipt-scan.png` })
console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
