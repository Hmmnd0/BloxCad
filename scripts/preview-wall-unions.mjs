import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1200,height:850}})
  const errors=[]; page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:5178')
  await page.evaluate(async()=>{
    const {buildWallRegions,wallRegionPath}=await import('/src/utils/wallUnion.ts')
    const wall=(id,x,y,width,height,bloxId='wall-cmu-footing',rotation=0)=>({id,x,y,width,height,bloxId,rotation,properties:{},locked:false})
    const samples=[
      ['Continuous foundation',[wall('a',0,0,20,2),wall('b',0,12,20,2),wall('c',0,0,2,14),wall('d',18,0,2,14)]],
      ['T junction',[wall('a',0,0,20,2),wall('b',9,0,2,14)]],
      ['Unequal wall thickness',[wall('a',0,0,20,1,'wall-interior'),wall('b',0,0,2,14,'wall-interior')]],
      ['Angled intersection',[wall('a',0,6,20,1,'wall-interior'),wall('b',0,6,20,1,'wall-interior',45)]],
      ['Duplicate sections',[wall('a',0,0,20,2),wall('b',0,0,20,2)]],
      ['Real gaps stay open',[wall('a',0,0,8,2),wall('b',9,0,11,2)]]
    ]
    document.body.innerHTML='<main style="padding:32px;font-family:system-ui;background:#f2f4f7;color:#263343"><h1>Continuous wall geometry</h1><p>Exact polygon unions · preserved voids · no internal overlap edges</p><div id="samples" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px"></div></main>'
    document.querySelector('#samples').innerHTML=samples.map(([name,walls])=>`<section style="padding:18px;border-radius:14px;background:white"><h3>${name}</h3><svg width="310" height="260" viewBox="-2 -3 25 22">${buildWallRegions(walls).map(r=>`<path d="${wallRegionPath(r.polygons)}" fill="${r.fill}" fill-rule="evenodd" stroke="#202832" stroke-width=".09" ${r.footing?'stroke-dasharray=".4 .25"':''}/>`).join('')}</svg></section>`).join('')
  })
  await page.screenshot({path:'artifacts/wall-unions.png'})
  await page.reload()
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  await page.evaluate(async()=>{
    const {useStore}=await import('/src/store/useStore.ts')
    const s=useStore.getState(); s.createProject('Foundation union verification','quarter')
    for(const [x,y,w,h] of [[0,0,28,1.667],[0,20,28,1.667],[0,0,1.667,21.667],[26.333,0,1.667,21.667]]) s.placeElement('wall-cmu-footing',x,y,w,h)
  })
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.evaluate(async()=>{const {useStore}=await import('/src/store/useStore.ts'); useStore.getState().setStageTransform(90,70,1)})
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.screenshot({path:'artifacts/foundation-workspace.png'})
  if(errors.length) throw new Error(errors.join('\n'))
} finally {await browser.close()}
