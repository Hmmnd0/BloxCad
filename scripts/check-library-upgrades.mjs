import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5194')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  const audit=await page.evaluate(async()=>{
    const {useStore}=await import('/src/store/useStore.ts')
    const {BLOX_DEFINITIONS}=await import('/src/blox/definitions.ts')
    const {RENDERERS}=await import('/src/components/Canvas/renderers/index.tsx')
    const upgraded=new Set()
    for(const [file,key] of [['furniture','REFINED_FURNITURE'],['fixture','REFINED_FIXTURES'],['casework','REFINED_CASEWORK'],['circulation','REFINED_CIRCULATION'],['wall','REFINED_WALLS'],['structural','REFINED_STRUCTURAL'],['electrical','REFINED_ELECTRICAL'],['equipment','REFINED_EQUIPMENT'],['site','REFINED_SITE']]) {
      const module=await import(`/src/utils/${file}Geometry.ts`)
      for(const id of module[key]) {
        if(!BLOX_DEFINITIONS.some(d=>d.id===id)||!RENDERERS[id])throw new Error(`Missing definition or renderer: ${id}`)
        upgraded.add(id)
      }
    }
    const remaining={}
    for(const d of BLOX_DEFINITIONS)if(!upgraded.has(d.id))remaining[d.category]=(remaining[d.category]??0)+1
    const s=useStore.getState();s.createProject('Library upgrade verification','quarter')
    s.placeElement('exit-sign',3,3,1.5,.5)
    const e=useStore.getState().project.elements.at(-1);s.selectElement(e.id)
    return {total:BLOX_DEFINITIONS.length,upgraded:upgraded.size,remaining,categories:Object.fromEntries(['Site','Structural','Electrical','Mechanical','Plumbing','LowVoltage','Fire/Safety'].map(c=>[c,BLOX_DEFINITIONS.filter(d=>d.category===c).length]))}
  })
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  if(await page.locator('.inspector-preview svg').count()!==1)throw new Error('Inspector has no shared preview')
  for(const [category,count] of Object.entries(audit.categories)) {
    await page.getByLabel('Category',{exact:true}).selectOption(category)
    const cards=page.locator('.blox-card')
    if(await cards.count()!==count)throw new Error(`Missing ${category} cards`)
    for(const card of await cards.all())if(await card.locator('.blox-preview svg').count()!==1)throw new Error(`Missing ${category} SVG thumbnail: ${await card.innerText()}`)
  }
  await page.screenshot({path:'artifacts/library-life-safety.png'})
  await page.getByLabel('Category',{exact:true}).selectOption('Electrical')
  await page.screenshot({path:'artifacts/library-electrical.png'})
  if(errors.length)throw new Error(errors.join('\n'))
  console.log(JSON.stringify({...audit,errors}))
} finally {await browser.close()}
