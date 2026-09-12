import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
const phase=process.argv[2]??'after'
if(!['before','after'].includes(phase))throw Error('Expected before or after')
const dir='artifacts/symbol-direction'
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try{
 const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5231')
 await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
 const samples=await page.evaluate(async()=>{
  const R=await import('/node_modules/.vite/deps/react.js'),h=R.createElement??R.default.createElement
  const D=await import('/node_modules/.vite/deps/react-dom_client.js'),createRoot=D.createRoot??D.default.createRoot
  const F=await import('/node_modules/.vite/deps/react-dom.js'),flushSync=F.flushSync??F.default.flushSync
  const {Stage,Layer,Group}=await import('/node_modules/.vite/deps/react-konva.js')
  const {RENDERERS}=await import('/src/components/Canvas/renderers/index.tsx')
  const {BLOX_DEFINITIONS}=await import('/src/blox/definitions.ts')
  const mount=document.createElement('div');document.body.append(mount);const root=createRoot(mount),result=[]
  for(const id of ['detail-shingles','annotation-drawing-title','annotation-revision-delta']){
   const d=BLOX_DEFINITIONS.find(d=>d.id===id);let stage,group
   flushSync(()=>root.render(h(Stage,{width:520,height:165,ref:s=>stage=s},h(Layer,{},h(Group,{ref:g=>group=g},h(RENDERERS[id],{widthPx:d.defaultWidth*24,heightPx:d.defaultHeight*24,pixelsPerFoot:24,properties:id==='annotation-drawing-title'?{title:'FLOOR PLAN',drawingNum:'1',scale:'1/4" = 1\'–0"'}:{},selected:false,rotation:0}))))))
   const b=group.getClientRect({skipTransform:true}),scale=Math.min(460/b.width,130/b.height,2)
   group.scale({x:scale,y:scale});group.position({x:260-(b.x+b.width/2)*scale,y:82-(b.y+b.height/2)*scale});stage.draw()
   result.push({id,name:d.name,image:stage.toDataURL({pixelRatio:2})})
  }
  root.unmount();mount.remove();return result
 })
 await writeFile(`${dir}/${phase}.json`,JSON.stringify(samples))
 if(phase==='after'){
  const before=JSON.parse(await readFile(`${dir}/before.json`,'utf8'))
  await page.evaluate(({before,samples})=>{
   document.body.innerHTML='';document.body.style.cssText='margin:0;padding:32px;background:#eef1f4;color:#263343;font:15px Arial'
   const title=document.createElement('h1');title.textContent='Blox design study';document.body.append(title)
   const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:14px';document.body.append(grid)
   for(const t of ['BEFORE · previous pass','AFTER · proposed direction']){const label=document.createElement('strong');label.textContent=t;grid.append(label)}
   samples.forEach((sample,i)=>{for(const item of [before[i],sample]){const card=document.createElement('section');card.style.cssText='padding:14px;background:white;border:1px solid #d5dce3;border-radius:8px';const name=document.createElement('strong');name.textContent=item.name;const img=document.createElement('img');img.src=item.image;img.style.cssText='display:block;width:100%;height:165px;object-fit:contain';card.append(name,img);grid.append(card)}})
  },{before,samples})
  await page.screenshot({path:`${dir}/before-after.png`,fullPage:true})
 }
 if(errors.length)throw Error(errors.join('\n'))
 console.log(`${phase}: ${samples.length} actual-renderer samples; no browser errors`)
}finally{await browser.close()}
