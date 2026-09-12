import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5217')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  const report=await page.evaluate(async()=>{
    const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js'),createRoot=roots.createRoot??roots.default.createRoot
    const dom=await import('/node_modules/.vite/deps/react-dom.js'),flushSync=dom.flushSync??dom.default.flushSync
    const {useStore}=await import('/src/store/useStore.ts')
    const {BLOX_DEFINITIONS}=await import('/src/blox/definitions.ts')
    const {BloxItem}=await import('/src/components/Sidebar/BloxItem.tsx')
    useStore.getState().createProject('Disposable preview audit','quarter')
    document.getElementById('root').style.display='none'
    const mount=document.createElement('main');mount.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:24px;background:#eef1f5';document.body.append(mount)
    const root=createRoot(mount)
    flushSync(()=>root.render(h(R.Fragment??R.default.Fragment,{},...BLOX_DEFINITIONS.map(def=>h('section',{key:def.id,'data-blox':def.id,style:{background:'white',padding:8,border:'1px solid #ccd4df',borderRadius:8}},h(BloxItem,{def}))))))
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    const results=[]
    for(const def of BLOX_DEFINITIONS) {
      const card=mount.querySelector(`[data-blox="${def.id}"]`),art=card.querySelector('img,svg')
      if(!art)throw Error('No preview artwork: '+def.id)
      const img=new Image()
      img.src=art.tagName.toLowerCase()==='img'?art.src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(art))
      await img.decode()
      const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,96,96)
      const pixels=ctx.getImageData(0,0,96,96).data;let ink=0
      for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>20&&Math.min(pixels[i],pixels[i+1],pixels[i+2])<220)ink++
      if(ink<2)throw Error('Blank preview: '+def.id)
      results.push({id:def.id,kind:art.tagName,ink})
    }
    return results
  })
  await mkdir('artifacts/blox-audit',{recursive:true})
  await page.screenshot({path:'artifacts/blox-audit/library-previews.png',fullPage:true})
  await page.evaluate(()=>{
    for(const card of document.querySelectorAll('[data-blox]'))if(!card.getAttribute('data-blox').startsWith('detail-')&&card.getAttribute('data-blox')!=='insulation-batt')card.style.display='none'
  })
  await page.screenshot({path:'artifacts/blox-audit/detail-library-previews.png',fullPage:true})
  await page.evaluate(()=>{
    for(const card of document.querySelectorAll('[data-blox]'))card.style.display=card.getAttribute('data-blox').startsWith('site-')?'':'none'
  })
  await page.screenshot({path:'artifacts/blox-audit/site-library-previews.png',fullPage:true})
  await page.evaluate(async()=>{
    const {ANNOTATIONS_RENDERERS}=await import('/src/components/Canvas/renderers/annotations.tsx')
    for(const card of document.querySelectorAll('[data-blox]'))card.style.display=card.getAttribute('data-blox') in ANNOTATIONS_RENDERERS?'':'none'
  })
  await page.screenshot({path:'artifacts/blox-audit/annotation-library-previews.png',fullPage:true})
  await page.evaluate(()=>{
    for(const card of document.querySelectorAll('[data-blox]'))card.style.display=card.getAttribute('data-blox').startsWith('elev-')?'':'none'
  })
  await page.screenshot({path:'artifacts/blox-audit/elevation-library-previews.png',fullPage:true})
  await writeFile('artifacts/blox-audit/library-manifest.json',JSON.stringify({previews:report,errors},null,2))
  if(errors.length)throw Error(errors.join('\n'))
  console.log(JSON.stringify({previews:report.length,blank:0,errors}))
} finally {await browser.close()}
