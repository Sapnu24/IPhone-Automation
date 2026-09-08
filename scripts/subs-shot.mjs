import { chromium } from 'playwright'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
const baseURL=(process.argv[2]||'http://localhost:4173/').replace(/\/$/,''); const outDir='shots'; mkdirSync(outDir,{recursive:true})
function fc(){const b=process.env.PLAYWRIGHT_BROWSERS_PATH||'/opt/pw-browsers';try{for(const d of readdirSync(b)){if(!d.startsWith('chromium-')||d.includes('headless'))continue;for(const p of ['chrome-linux/chrome','chrome-linux/headless_shell']){const f=`${b}/${d}/${p}`;if(existsSync(f))return f}}}catch{}return undefined}
async function L(){try{return await chromium.launch()}catch{return await chromium.launch({executablePath:fc()})}}
const SEED=`(${async()=>{
  const db=await new Promise((res,rej)=>{const r=indexedDB.open('anchor');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
  const put=(s,v)=>new Promise((res,rej)=>{const t=db.transaction(s,'readwrite');t.objectStore(s).put(v);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})
  const d=(o)=>{const x=new Date();x.setDate(x.getDate()+o);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
  const now=Date.now()
  await put('bills',{id:'s1',name:'Netflix',icon:'🎬',amount:549,categoryId:'cat-subs',dueDate:d(6),recurrence:'monthly',reminderDaysBefore:2,autopay:true,createdAt:now})
  await put('bills',{id:'s2',name:'Spotify',icon:'🎵',amount:149,categoryId:'cat-subs',dueDate:d(12),recurrence:'monthly',reminderDaysBefore:1,autopay:true,createdAt:now})
  await put('bills',{id:'s3',name:'Claude',icon:'🤖',amount:1150,categoryId:'cat-subs',dueDate:d(20),recurrence:'monthly',reminderDaysBefore:2,autopay:true,createdAt:now})
  await put('bills',{id:'s4',name:'Canva',icon:'🎨',amount:149,categoryId:'cat-subs',dueDate:d(3),recurrence:'monthly',reminderDaysBefore:1,autopay:false,createdAt:now})
  await put('bills',{id:'s5',name:'Microsoft 365',icon:'🪟',amount:3990,categoryId:'cat-subs',dueDate:d(40),recurrence:'yearly',reminderDaysBefore:5,autopay:false,createdAt:now})
}})()`
const br=await L(); const ctx=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const e=[]; p.on('pageerror',x=>e.push(String(x)))
await p.goto(baseURL+'/',{waitUntil:'networkidle'}); await p.waitForSelector('.tabbar',{timeout:15000})
await p.evaluate(SEED); await p.goto(baseURL+'/#/subscriptions',{waitUntil:'networkidle'}); await p.reload({waitUntil:'networkidle'})
await p.waitForSelector('.hero-honey',{timeout:8000}); await p.waitForTimeout(500)
await p.screenshot({path:`${outDir}/wave10-subscriptions.png`})
console.log('PAGE ERRORS:', e.length?e:'none')
await br.close(); if(e.length) process.exit(1)
