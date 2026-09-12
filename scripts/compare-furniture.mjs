import { chromium } from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const phase = process.argv[2] ?? 'before'
const collection = process.argv[3] === 'storage' ? 'storage' : 'furniture'
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after')
const browser = await chromium.launch({ headless: true, executablePath: '/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' })
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 880 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:5178')
  await page.evaluate(async ({phase, collection}) => {
    const React = await import('/node_modules/.vite/deps/react.js')
    const rootModule = await import('/node_modules/.vite/deps/react-dom_client.js')
    const createRoot = rootModule.createRoot ?? rootModule.default.createRoot
    const { Stage, Layer } = await import('/node_modules/.vite/deps/react-konva.js')
    const { FURNITURE_RENDERERS } = await import('/src/components/Canvas/renderers/furniture.tsx')
    const h = React.createElement ?? React.default.createElement
    document.getElementById('root').style.display = 'none'
    const target = document.createElement('div'); document.body.append(target)
    document.body.style.background = '#f2f4f7'
    const items = collection === 'storage' ? [['dresser','Dresser',4,1.5],['nightstand','Nightstand',1.667,1.667],['bookcase','Bookcase',3,1],['tv-unit','Media unit',5,1.5],['dresser','Dresser · portrait',1.5,4],['bookcase','Bookcase · portrait',1,3]] : [['sofa','Sofa',7,2.833],['chair','Armchair',2.5,2.5],['bed-queen','Queen bed',5,6.667],['dining-table','Dining table',6,3],['coffee-table','Coffee table',4,2],['desk','Desk',5,2.5]]
    createRoot(target).render(h('main', { style: { padding: '36px', color:'#263343', fontFamily:'-apple-system, sans-serif' } },
      h('div', { style:{color:'#5276a4',fontSize:12,letterSpacing:2} }, 'BLOXCAD / FURNITURE STUDY'),
      h('h1', { style:{fontSize:30,margin:'10px 0'} }, phase === 'before' ? 'Before · Existing geometry' : 'After · Refined geometry'),
      h('p', {style:{fontSize:13,color:'#647080',marginBottom:24}}, 'Actual canvas renderers · identical footprints · 36 pixels per foot'),
      h('div', {style:{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:16}}, ...items.map(([id,name,w,d]) => h('section', {key:id,style:{background:'#fff',border:'1px solid #dde2e9',borderRadius:14,padding:18,height:325}},
        h('div',{style:{fontSize:14,fontWeight:600}},name),h('div',{style:{fontSize:11,color:'#7d8895',marginTop:5}},`${w}′ × ${d}′`),
        h(Stage,{width:300,height:260},h(Layer,{x:(300-w*36)/2,y:(260-d*36)/2},h(FURNITURE_RENDERERS[`furniture-${id}`],{widthPx:w*36,heightPx:d*36,selected:false,properties:{}}))))))))
  }, {phase, collection})
  await page.waitForFunction(() => document.querySelectorAll('main canvas').length === 6)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.screenshot({ path: `artifacts/${collection}-${phase}.png` })
} finally { await browser.close() }
