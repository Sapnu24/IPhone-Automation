// Rasterize public/favicon.svg into the PNG app icons using the pre-installed
// Chromium (no native image deps needed). Run: npm run gen:icons
import { chromium } from 'playwright'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')

const targets = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 512, name: 'icon-512-maskable.png' },
]

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
    const executablePath = findChrome()
    if (!executablePath) throw new Error('Could not locate a Chromium binary')
    return await chromium.launch({ executablePath })
  }
}

const browser = await launch()
const page = await browser.newPage()

for (const { size, name } of targets) {
  const scaled = svg.replace(
    '<svg ',
    `<svg width="${size}" height="${size}" `,
  )
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<!doctype html><html><body style="margin:0;padding:0">${scaled}</body></html>`,
    { waitUntil: 'networkidle' },
  )
  await page.locator('svg').screenshot({ path: resolve(root, 'public', name) })
  console.log('wrote public/' + name + ' (' + size + 'px)')
}

await browser.close()
