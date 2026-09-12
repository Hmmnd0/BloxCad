import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const phase=process.argv[2]??'after'
if(!['before','after'].includes(phase)) throw new Error('Use before or after')
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1120,height:1170}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:5178')
  await page.evaluate(async phase=>{
    const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js'),createRoot=roots.createRoot??roots.default.createRoot
    const {Stage,Layer}=await import('/node_modules/.vite/deps/react-konva.js')
    const {FIXTURES_RENDERERS}=await import('/src/components/Canvas/renderers/fixtures.tsx')
    const {getBloxById}=await import('/src/blox/definitions.ts')
    const ids=['sink-kitchen','refrigerator','range','dishwasher','vanity','washer','dryer','utility-sink','shower']
    document.getElementById('root').style.display='none'
    const target=document.createElement('div');document.body.append(target)
    createRoot(target).render(h('main',{style:{padding:32,background:'#f2f4f7',color:'#263343',fontFamily:'system-ui'}},
      h('h1',{style:{fontSize:28,marginBottom:8}},`${phase==='before'?'Before':'After'} · Kitchen, bath & laundry`),
      h('p',{style:{fontSize:13,color:'#657286',marginBottom:24}},'Actual canvas symbols · unchanged footprints · 48 pixels per foot'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}},...ids.map(id=>{
        const d=getBloxById('fixture-'+id),w=d.defaultWidth*48,hp=d.defaultHeight*48
        return h('section',{key:id,style:{padding:18,background:'#fff',border:'1px solid #dce2e9',borderRadius:14,height:320}},
          h('div',{style:{fontWeight:600,fontSize:14}},d.name),h('div',{style:{fontSize:12,color:'#7a8795',marginTop:6}},`${d.defaultWidth}′ × ${d.defaultHeight}′`),
          h(Stage,{width:290,height:250},h(Layer,{x:(290-w)/2,y:(250-hp)/2},h(FIXTURES_RENDERERS[d.id],{widthPx:w,heightPx:hp,selected:false,properties:{}}))))
      }))))
  },phase)
  await page.waitForFunction(()=>document.querySelectorAll('main canvas').length===9)
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.screenshot({path:`artifacts/fixtures-${phase}.png`})
  if(errors.length) throw new Error(errors.join('\n'))
} finally {await browser.close()}
