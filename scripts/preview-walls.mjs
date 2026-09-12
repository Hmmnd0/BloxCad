import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const structural=process.argv.includes('--structural')
const electrical=process.argv.includes('--electrical')
const equipment=process.argv.includes('--equipment')
const site=process.argv.includes('--site')
const routing=process.argv.includes('--routing')
const browser = await chromium.launch({headless:true, executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1100,height:900}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL ?? 'http://127.0.0.1:5189')
  const symbolCount=await page.evaluate(async ({structural,electrical,equipment,site,routing})=>{
    const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js')
    const {Stage,Layer}=await import('/node_modules/.vite/deps/react-konva.js')
    const {WALLS_RENDERERS}=await import('/src/components/Canvas/renderers/walls.tsx')
    const {REFINED_WALLS}=await import('/src/utils/wallGeometry.ts')
    const {STRUCTURAL_RENDERERS}=await import('/src/components/Canvas/renderers/structural.tsx')
    const {REFINED_STRUCTURAL}=await import('/src/utils/structuralGeometry.ts')
    const {MEP_RENDERERS}=await import('/src/components/Canvas/renderers/mep.tsx')
    const {REFINED_ELECTRICAL}=await import('/src/utils/electricalGeometry.ts')
    const {REFINED_EQUIPMENT}=await import('/src/utils/equipmentGeometry.ts')
    const {FIRE_SAFETY_RENDERERS}=await import('/src/components/Canvas/renderers/fireSafety.tsx')
    const {LOW_VOLTAGE_RENDERERS}=await import('/src/components/Canvas/renderers/lowVoltage.tsx')
    const {SITE_RENDERERS}=await import('/src/components/Canvas/renderers/site.tsx')
    const {REFINED_SITE}=await import('/src/utils/siteGeometry.ts')
    const renderers=routing?MEP_RENDERERS:site?SITE_RENDERERS:equipment?{...MEP_RENDERERS,...FIRE_SAFETY_RENDERERS,...LOW_VOLTAGE_RENDERERS}:electrical?MEP_RENDERERS:structural?STRUCTURAL_RENDERERS:WALLS_RENDERERS
    const ids=routing?new Set(['elec-conduit','elec-circuit-wire','elec-homerun']):site?REFINED_SITE:equipment?REFINED_EQUIPMENT:electrical?REFINED_ELECTRICAL:structural?REFINED_STRUCTURAL:REFINED_WALLS
    const {getBloxById}=await import('/src/blox/definitions.ts')
    document.getElementById('root').style.display='none'
    window.__previewStages=[]
    const target=document.createElement('div');document.body.append(target)
    ;(roots.createRoot??roots.default.createRoot)(target).render(h('main',{style:{padding:28,background:'#f2f4f7',color:'#263343',fontFamily:'system-ui'}},
      h('h1',{style:{fontSize:26,margin:'0 0 8px'}},`${routing?'Electrical routing':site?'Planting & paved areas':equipment?'Mechanical, plumbing, life safety & low voltage':electrical?'Electrical':structural?'Structural':'Walls'} · reviewed plan symbols`),
      h('p',{style:{fontSize:13,color:'#657286'}},routing?'Restored canvas graphics · horizontal above · narrow/portrait sample below':'Actual canvas graphics · fitted sample above · small sample below (devices mirrored; labels stay readable)'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}},...[...ids].map(id=>{
        const d=getBloxById(id),fit=Math.min(180/d.defaultWidth,110/d.defaultHeight)
        const w=electrical||structural||equipment||site?d.defaultWidth*fit:190,hp=electrical||structural||equipment||site?d.defaultHeight*fit:20
        return h('section',{key:id,style:{padding:14,background:'#fff',border:'1px solid #dce2e9',borderRadius:12}},
        h('div',{style:{fontWeight:600,fontSize:13}},getBloxById(id).name),
        h(Stage,{width:220,height:330,ref:node=>{if(node)window.__previewStages.push(node)}},h(Layer,{x:(220-w)/2,y:50},h(renderers[id],{widthPx:w,heightPx:hp,pixelsPerFoot:fit,selected:false,properties:{}})),h(Layer,{x:100+(electrical?d.defaultWidth*24:equipment?20:0),y:220,scaleX:electrical||equipment?-1:1},h(renderers[id],{widthPx:site?36:electrical?d.defaultWidth*24:20,heightPx:site?36*d.defaultHeight/d.defaultWidth:electrical?d.defaultHeight*24:30,pixelsPerFoot:site?36/d.defaultWidth:24,selected:false,properties:{flipH:electrical||equipment}}))))}))))
    return ids.size
  },{structural,electrical,equipment,site,routing})
  await page.waitForFunction(n=>document.querySelectorAll('main canvas').length===n,symbolCount*2)
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.evaluate(()=>{for(const stage of window.__previewStages)for(const node of stage.find('Text')) {
    const rendered=node.textArr.map(t=>t.text).join('')
    if(rendered!==node.text())throw new Error(`Clipped label: ${node.text()} rendered as ${rendered}`)
    const m=node.getAbsoluteTransform().getMatrix()
    if(m[0]*m[3]-m[1]*m[2]<=0)throw new Error(`Mirrored label: ${node.text()}`)
  }})
  await page.screenshot({path:routing?'artifacts/routing-reviewed.png':site?'artifacts/site-refined.png':equipment?'artifacts/equipment-refined.png':electrical?'artifacts/electrical-refined.png':structural?'artifacts/structural-refined.png':'artifacts/walls-refined.png',fullPage:true})
  if(errors.length)throw new Error(errors.join('\n'))
  console.log(JSON.stringify({symbols:symbolCount,samplesPerSymbol:2,labelsUnclipped:true,errors}))
} finally {await browser.close()}
