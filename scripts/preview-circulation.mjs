import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const phase = process.argv[2] ?? 'after'
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after')
const browser = await chromium.launch({headless:true, executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page = await browser.newPage({viewport:{width:1200,height:1600}})
  const errors=[]; page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL ?? 'http://127.0.0.1:5184')
  await page.evaluate(async phase => {
    const R=await import('/node_modules/.vite/deps/react.js'), h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js')
    const {Stage,Layer,Group}=await import('/node_modules/.vite/deps/react-konva.js')
    const {OPENINGS_RENDERERS}=await import('/src/components/Canvas/renderers/openings.tsx')
    const {STAIRS_RENDERERS}=await import('/src/components/Canvas/renderers/stairs.tsx')
    const {getBloxById}=await import('/src/blox/definitions.ts')
    const geometry=phase==='after'?(await import('/src/utils/circulationGeometry.ts')).circulationGeometry:null
    const renderers={...OPENINGS_RENDERERS,...STAIRS_RENDERERS}
    const samples=[...Object.keys(renderers).map(id=>({id})),{id:'stairs-straight',flipV:true},{id:'door-double',vertical:true},{id:'window-multi',vertical:true}]
    document.getElementById('root').style.display='none'
    const target=document.createElement('div');document.body.append(target)
    ;(roots.createRoot??roots.default.createRoot)(target).render(h('main',{style:{padding:28,background:'#f2f4f7',color:'#263343',fontFamily:'system-ui'}},
      h('h1',{style:{fontSize:26,margin:'0 0 8px'}},`${phase==='before'?'Before':'After'} · Openings & circulation`),
      h('p',{style:{fontSize:13,color:'#657286',margin:'0 0 20px'}},'Actual canvas symbols · fitted views · unchanged saved footprints'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}},...samples.map((s,i)=>{
        const d=getBloxById(s.id)
        const properties={flipV:!!s.flipV,...(s.id==='window-multi'?{paneCount:3}:{}),...(s.id==='stairs-elevation'?{stepCount:11}:{})}
        let w=d.defaultWidth,hp=d.defaultHeight
        if(s.vertical){hp=w;w=.5}
        const scale=150/Math.max(w,hp);w*=scale;hp*=scale
        const bounds=geometry?geometry(s.id,w,hp).bounds:{x:0,y:0,width:w,height:hp}
        const fit=Math.min(1,210/bounds.width,170/bounds.height)
        return h('section',{key:i,style:{padding:14,background:'#fff',border:'1px solid #dce2e9',borderRadius:12,height:260}},
          h('div',{style:{fontWeight:600,fontSize:13}},d.name),
          h('div',{style:{fontSize:11,color:'#7a8795',marginTop:5}},s.flipV?'Flipped vertically':s.vertical?'Vertical wall':`${d.defaultWidth}′ × ${d.defaultHeight}′`),
          h(Stage,{width:240,height:205},h(Layer,{x:(240-bounds.width*fit)/2-bounds.x*fit,y:(205-bounds.height*fit)/2-bounds.y*fit,scaleX:fit,scaleY:fit},
            h(Group,{y:s.flipV?hp:0,scaleY:s.flipV?-1:1},h(renderers[s.id],{widthPx:w,heightPx:hp,selected:false,properties})))))
      }))))
  },phase)
  await page.waitForFunction(()=>document.querySelectorAll('main canvas').length===20)
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.screenshot({path:`artifacts/circulation-${phase}.png`,fullPage:true})
  if(errors.length) throw new Error(errors.join('\n'))
  console.log(JSON.stringify({symbols:17,variants:3,errors}))
} finally {await browser.close()}
