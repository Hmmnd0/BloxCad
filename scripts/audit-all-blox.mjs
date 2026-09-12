import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  await mkdir('artifacts/blox-audit',{recursive:true})
  const page=await browser.newPage({viewport:{width:1200,height:1100}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5217')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  const records=await page.evaluate(async()=>{
    const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
    const roots=await import('/node_modules/.vite/deps/react-dom_client.js'),createRoot=roots.createRoot??roots.default.createRoot
    const dom=await import('/node_modules/.vite/deps/react-dom.js'),flushSync=dom.flushSync??dom.default.flushSync
    const {Stage,Layer,Group,Rect}=await import('/node_modules/.vite/deps/react-konva.js')
    const {RENDERERS}=await import('/src/components/Canvas/renderers/index.tsx')
    const {BLOX_DEFINITIONS}=await import('/src/blox/definitions.ts')
    const mount=document.createElement('div');document.body.append(mount);mount.style.position='fixed';mount.style.left='-10000px'
    const root=createRoot(mount),records=[]
    for(const d of BLOX_DEFINITIONS) {
      if(!RENDERERS[d.id])throw Error('No renderer: '+d.id)
      let stage,group
      const w=d.defaultWidth*24,hp=d.defaultHeight*24
      const props=d.id==='annotation-drawing-title'?{title:'FLOOR PLAN',drawingNum:'1',scale:'1/4" = 1\'–0"'}:{}
      flushSync(()=>root.render(h(Stage,{width:330,height:170,ref:s=>stage=s},h(Layer,{},h(Group,{ref:g=>group=g},h(Rect,{width:w,height:hp,fill:'transparent'}),h(RENDERERS[d.id],{widthPx:w,heightPx:hp,pixelsPerFoot:24,properties:props,rotation:0,selected:false}))))))
      group.scale({x:1,y:1});group.position({x:0,y:0})
      const b=group.getClientRect({skipTransform:true}),fit=Math.min(300/Math.max(b.width,1),140/Math.max(b.height,1),2)
      if(!Object.values(b).every(Number.isFinite))throw Error('Invalid bounds: '+d.id)
      if(d.id==='annotation-grid-bubble'&&b.height>Math.max(hp,40)+5)throw Error('Unbounded grid line')
      if(d.id==='detail-gutter'&&b.y>=0)throw Error('Gutter strap missing from bounds')
      group.scale({x:fit,y:fit});group.position({x:165-(b.x+b.width/2)*fit,y:85-(b.y+b.height/2)*fit})
      stage.draw()
      const clipped=group.find('Text').filter(t=>t.textArr.map(a=>a.text).join('').replace(/\s/g,'')!==t.text().replace(/\s/g,'')).map(t=>t.text())
      records.push({id:d.id,name:d.name,category:d.category,clipped,image:stage.toDataURL({pixelRatio:2})})
    }
    // Exercise elevation options separately from the default contact sheets.
    const variants=[
      ['elev-window-casement',{hingeLeft:false}],
      ['elev-window-surround',{arch:true}],
      ['elev-louver-fins',{angleDeg:90,finCount:12}],
      ['elev-louver-fins',{angleDeg:35,finCount:8}],
      ['elev-cantilever-slab',{taperFt:2}],
      ['elev-ribbon-window',{solidBays:[0,2]}],
      ['elev-wall-face',{fillPattern:'board-batten'}],
      ['elev-wall-face',{fillPattern:'stone'}],
      ['elev-spandrel-panel',{fillPattern:'brick'}],
    ]
    for(const [id,properties] of variants)for(const scale of [.5,2]) {
      const d=BLOX_DEFINITIONS.find(d=>d.id===id);let group,stage
      flushSync(()=>root.render(h(Stage,{width:600,height:400,ref:s=>stage=s},h(Layer,{},h(Group,{ref:g=>group=g},h(RENDERERS[id],{widthPx:d.defaultWidth*24*scale,heightPx:d.defaultHeight*24*scale,pixelsPerFoot:24*scale,properties,selected:false}))))))
      stage.draw()
      if(!Object.values(group.getClientRect()).every(Number.isFinite))throw Error('Invalid elevation variant: '+id)
    }
    root.unmount();mount.remove();document.getElementById('root').style.display='none'
    return records
  })
  for(const category of [...new Set(records.map(r=>r.category))]) {
    const entries=records.filter(r=>r.category===category)
    for(let start=0;start<entries.length;start+=12) {
      await page.evaluate(({category,entries})=>{
        document.querySelector('#audit')?.remove()
        const panel=document.createElement('main');panel.id='audit';panel.style.cssText='padding:24px;background:#edf0f4;color:#263343;font:13px Arial;min-height:100vh'
        const heading=document.createElement('h1');heading.textContent=category+' · actual drawing renderers';panel.append(heading)
        const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:16px';panel.append(grid)
        for(const entry of entries){const card=document.createElement('section');card.style.cssText='background:white;border:1px solid #ccd4df;border-radius:8px;padding:12px';const name=document.createElement('strong');name.textContent=entry.name;card.append(name);const img=document.createElement('img');img.src=entry.image;img.style.cssText='display:block;width:100%;height:170px;object-fit:contain';card.append(img);const id=document.createElement('small');id.textContent=entry.id+(entry.clipped.length?' · LABEL REVIEW':'');card.append(id);grid.append(card)}
        document.body.append(panel)
      },{category,entries:entries.slice(start,start+12)})
      await page.screenshot({path:`artifacts/blox-audit/${category.replace(/[^a-z]/gi,'-')}-${start/12+1}.png`,fullPage:true})
    }
  }
  const manifest=records.map(({image,...record})=>record)
  await writeFile('artifacts/blox-audit/manifest.json',JSON.stringify({records:manifest,errors},null,2))
  console.log(JSON.stringify({total:records.length,labelReview:manifest.filter(r=>r.clipped.length),errors}))
  if(errors.length)throw Error(errors.join('\n'))
  if(manifest.some(r=>r.clipped.length))throw Error('Clipped default symbol labels; see manifest')
} finally{await browser.close()}
