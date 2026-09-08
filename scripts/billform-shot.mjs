import { chromium } from 'playwright'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
const baseURL=(process.argv[2]||'http://localhost:4173/').replace(/\/$/,''); const outDir='shots'; mkdirSync(outDir,{recursive:true})
function fc(){const b=process.env.PLAYWRIGHT_BROWSERS_PATH||'/opt/pw-browsers';try{for(const d of readdirSync(b)){if(!d.startsWith('chromium-')||d.includes('headless'))continue;for(const p of ['chrome-linux/chrome','chrome-linux/headless_shell']){const f=`${b}/${d}/${p}`;if(existsSync(f))return f}}}catch{}return undefined}
async function L(){try{return await chromium.launch()}catch{return await chromium.launch({executablePath:fc()})}}
const br=await L(); const ctx=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const e=[]; p.on('pageerror',x=>e.push(String(x)))
await p.goto(baseURL+'/',{waitUntil:'networkidle'}); await p.waitForSelector('.tabbar',{timeout:15000})
await p.getByRole('button',{name:'Bill'}).click()
await p.waitForSelector('.preset-row',{timeout:6000})
await p.getByRole('button',{name:/Netflix/}).click()
await p.waitForTimeout(400)
await p.screenshot({path:`${outDir}/wave10-billform.png`})
console.log('PAGE ERRORS:', e.length?e:'none')
await br.close(); if(e.length) process.exit(1)
