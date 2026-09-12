import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1100,height:900}})
  await page.goto('http://127.0.0.1:5217')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  await page.evaluate(async()=>{
    const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js'),createRoot=roots.createRoot??roots.default.createRoot
    const dom=await import('/node_modules/.vite/deps/react-dom.js'),flushSync=dom.flushSync??dom.default.flushSync
    const {Stage,Layer,Group,Rect}=await import('/node_modules/.vite/deps/react-konva.js')
    const {useStore}=await import('/src/store/useStore.ts')
    useStore.getState().createProject('Disposable before-after comparison','quarter')
    const old=await import('/src/components/Canvas/renderers/site.tsx')
    const {RENDERERS}=await import('/src/components/Canvas/renderers/index.tsx')
    const {getBloxById}=await import('/src/blox/definitions.ts')
    document.getElementById('root').style.display='none'
    const mount=document.createElement('div');document.body.append(mount);mount.style.position='fixed';mount.style.left='-10000px'
    const root=createRoot(mount),rows=[]
    const cases=[
      {id:'site-property-line',name:'Property line',old:old.SitePropertyLineRenderer,w:360,h:24,properties:{bearing:'N 30° E'}},
      {id:'site-setback-line',name:'Setback line',old:old.SiteSetbackLineRenderer,w:360,h:24,properties:{setbackFt:10}},
      {id:'detail-drywall',name:'Drywall library icon',icon:true},
      {id:'detail-stud-2x4-edge',name:'Lumber edge library icon',icon:true}
    ]
    for(const c of cases){
      const imgs=[]
      for(const after of [false,true]){
        const d=getBloxById(c.id),w=c.w??d.defaultWidth*24,hp=c.h??d.defaultHeight*24,size=c.icon?48:430
        let stage,group
        flushSync(()=>root.render(h(Stage,{width:size,height:c.icon?48:115,ref:s=>stage=s},h(Layer,{},h(Group,{ref:g=>group=g},h(Rect,{width:w,height:hp,fill:'transparent'}),h(after||c.icon?RENDERERS[c.id]:c.old,{widthPx:w,heightPx:hp,pixelsPerFoot:24,properties:c.properties??{},rotation:0,selected:false}))))))
        group.scale({x:1,y:1});group.position({x:0,y:0})
        const b=group.getClientRect({skipTransform:true}),fit=c.icon?40/Math.max(b.width,b.height,1):1
        group.scale({x:fit,y:fit});group.position({x:size/2-w*fit/2,y:c.icon?24-(b.y+b.height/2)*fit:55-hp/2})
        if(c.icon){
          // Reproduce the previous preview settings vs the new preview-only minimum pen.
          const nodes=after?group.find(n=>n.getClassName()!=='Group'):group.find('Shape')
          for(const n of nodes)if(typeof n.strokeScaleEnabled==='function'){
            n.strokeScaleEnabled(true)
            if(after&&n.stroke())n.strokeWidth(Math.max(n.strokeWidth(),.65/fit))
          }
        }
        stage.draw();imgs.push(stage.toDataURL({pixelRatio:3}))
      }
      rows.push({...c,imgs})
    }
    root.unmount();mount.remove()
    const panel=document.createElement('main');panel.style.cssText='padding:28px;background:#edf0f4;color:#253345;font:15px Arial;min-height:100vh'
    panel.innerHTML='<h1 style="margin:0 0 8px">Last pass: actual before / after</h1><p style="margin:0 0 22px">Previous renderers/settings re-rendered beside current code. Same size and scale within each row.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;font-weight:bold;margin-bottom:12px"><div>BEFORE</div><div>AFTER</div></div>'
    for(const row of rows){
      const label=document.createElement('div');label.textContent=row.name+(row.icon?' · 48px icon shown at 3× for inspection':' · drawing shown at 1×');label.style.cssText='font-weight:bold;margin:14px 0 8px';panel.append(label)
      const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:18px';panel.append(grid)
      for(const src of row.imgs){const card=document.createElement('div');card.style.cssText='height:145px;display:flex;align-items:center;justify-content:center;background:white;border:1px solid #ccd4df;border-radius:8px';const img=document.createElement('img');img.src=src;img.style.width=row.icon?'144px':'430px';card.append(img);grid.append(card)}
    }
    document.body.append(panel)
    await Promise.all([...panel.querySelectorAll('img')].map(i=>i.decode()))
  })
  await page.screenshot({path:'artifacts/last-symbol-pass-before-after.png',fullPage:true})
} finally{await browser.close()}
