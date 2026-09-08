import { chromium } from 'playwright'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
const baseURL = (process.argv[2] || 'http://localhost:4173/').replace(/\/$/, '')
const outDir = process.argv[3] || 'shots'
mkdirSync(outDir, { recursive: true })
function findChrome(){const base=process.env.PLAYWRIGHT_BROWSERS_PATH||'/opt/pw-browsers';try{for(const d of readdirSync(base)){if(!d.startsWith('chromium-')||d.includes('headless'))continue;for(const p of ['chrome-linux/chrome','chrome-linux/headless_shell']){const f=`${base}/${d}/${p}`;if(existsSync(f))return f}}}catch{}return undefined}
async function launch(){try{return await chromium.launch()}catch{return await chromium.launch({executablePath:findChrome()})}}
const b=await launch()
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true})
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)))
await p.goto(baseURL+'/#/settings',{waitUntil:'networkidle'})
await p.waitForSelector('.screen',{timeout:15000})
await p.waitForTimeout(500)
await p.screenshot({path:`${outDir}/wave9-settings-sync.png`})
console.log('PAGE ERRORS:', errs.length?errs:'none')
await b.close(); if(errs.length) process.exit(1)
