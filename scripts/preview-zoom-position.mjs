import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1600,height:1000}})
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5198')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  await page.evaluate(async()=>{const {useStore}=await import('/src/store/useStore.ts');useStore.getState().createProject('Zoom control placement preview','quarter')})
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.evaluate(()=>{const s=document.createElement('style');s.id='preview-old';s.textContent='.zoom-dock{left:18px!important;right:auto!important}.cursor-readout{bottom:70px!important}';document.head.append(s)})
  await page.screenshot({path:'artifacts/zoom-control-before.png'})
  await page.evaluate(()=>document.getElementById('preview-old')?.remove())
  await page.screenshot({path:'artifacts/zoom-control-after.png'})
  await page.evaluate(()=>{const old=document.querySelector('.zoom-dock');if(!old)throw new Error('Zoom control missing');const r=old.getBoundingClientRect();if(r.right<1200)throw new Error('Zoom control is not bottom-right')})
  console.log(JSON.stringify({before:'artifacts/zoom-control-before.png',after:'artifacts/zoom-control-after.png'}))
} finally {await browser.close()}
