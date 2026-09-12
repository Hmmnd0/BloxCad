import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1700,height:1150}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5231')
  const html=await page.evaluate(async()=>{
    const {defaultPermitData,permitSheetHTML}=await import('/src/utils/permitSheet.ts')
    const {syncPermitSchedules}=await import('/src/utils/permitSync.ts')
    const el=(id,bloxId,properties,width=3)=>({id,bloxId,x:0,y:0,width,height:.5,rotation:0,properties,locked:false})
    const project={id:'preview',name:'Residential renovation',scale:'quarter',elements:[
      el('d1','door-single',{doorMark:'D1',location:'Entry',doorType:'Insulated entry door',doorSize:'3\'0" × 6\'8" × 1¾"',doorFinish:'Paint',frame:'Wood / paint',hardwareSet:'H1'}),
      el('d2','door-single',{doorMark:'D2',location:'Bedroom',doorType:'Solid-core hinged door',doorSize:'2\'8" × 6\'8" × 1⅜"',doorFinish:'Paint',frame:'Wood / paint',hardwareSet:'H2'},2+8/12),
      el('w1','window-single',{windowMark:'W1',location:'Living room',windowType:'Double hung',windowSize:'3\'0" × 5\'0"',sillHeight:'2\'6"',glazing:'Insulated glazing; final product selection pending'},3),
      el('w2','window-single',{windowMark:'W2',location:'Kitchen',windowType:'Casement',windowSize:'2\'6" × 4\'0"',sillHeight:'3\'6"',glazing:'Insulated glazing; final product selection pending'},2.5),
      el('r1','annotation-room-tag',{roomNum:'101',roomName:'Living room',roomArea:'240 SF',floorFinish:'Wood',baseFinish:'Painted wood',wallFinish:'Paint',ceilingFinish:'Paint'}),
      el('r2','annotation-room-tag',{roomNum:'102',roomName:'Kitchen',roomArea:'160 SF',floorFinish:'Tile',baseFinish:'Painted wood',wallFinish:'Paint / tile backsplash',ceilingFinish:'Paint'}),
      el('note','annotation-leader',{mark:'01',label:'Coordinate replacement opening with existing framing. Verify field dimensions before ordering.',targetId:'w1',sheetRef:'A1.0'}),
    ],dimensions:[],titleBlock:{address:'Sample project - presentation study only',drawingTitle:'Residential schedules',drawnBy:'',checkedBy:'',jobNumber:'DEMO',projectDate:'2026-09-09',sheetNumber:'A1.0'}}
    let data=defaultPermitData();data.scope='SAMPLE DATA ONLY - NOT FOR CONSTRUCTION. Residential renovation schedule layout study. Product sizes, finishes and notes are illustrative and are not verified project specifications.'
    data.tables.hardware=[{id:'h1',cells:{set:'H1',description:'Entry lockset and hinges',quantity:'Per selected hardware package',notes:'Confirm final selection with owner.'}},{id:'h2',cells:{set:'H2',description:'Passage latch and hinges',quantity:'Per selected hardware package',notes:'Confirm final selection with owner.'}}]
    data=syncPermitSchedules(project,data)
    window.permitSample={project,data}
    return permitSheetHTML(project,data)
  })
  const render=await browser.newPage({viewport:{width:1700,height:1150}})
  await render.setContent(html)
  const check=async()=>render.evaluate(()=>{
    const problems=[]
    for(const [i,sheet] of [...document.querySelectorAll('.permit-page')].entries()) {
      const footer=sheet.querySelector('.sheet-footer').getBoundingClientRect(),content=sheet.querySelector('.sheet-content').getBoundingClientRect()
      for(const table of sheet.querySelectorAll('.schedule')) {
        const r=table.getBoundingClientRect()
        if(r.bottom>footer.top-5)problems.push(`Page ${i+1}: table overlaps footer`)
        if(r.right>content.right+1)problems.push(`Page ${i+1}: table exceeds column`)
      }
      const strip=sheet.querySelector('.title-strip')
      if(strip.scrollHeight>strip.clientHeight+2)problems.push(`Page ${i+1}: title strip overflow`)
    }
    return {pages:document.querySelectorAll('.permit-page').length,problems}
  })
  const sample=await check();if(sample.problems.length)throw Error(sample.problems.join('\n'))
  if(sample.pages!==3)throw Error('Standard residential schedules should fit three companion sheets')
  if(await render.locator('.matrix .schedule').count())throw Error('Nested matrix table')
  const statuses=await render.locator('.matrix tbody tr td:nth-child(5)').allTextContents()
  if(statuses.some(s=>s!=='Unreviewed'))throw Error('Review status split inside a word')
  await mkdir('output/pdf',{recursive:true});await mkdir('tmp/pdfs',{recursive:true})
  await writeFile('tmp/pdfs/residential-permit-preview.html',html)
  await render.pdf({path:'tmp/pdfs/residential-tables.pdf',preferCSSPageSize:true,printBackground:true})
  const combined=await page.evaluate(async()=>{
    const {buildPermitSetHTML}=await import('/src/utils/permitSet.ts')
    const {project,data}=window.permitSample
    const p=structuredClone(project)
    const at=(id,x,y,width,height)=>{const e=p.elements.find(e=>e.id===id);Object.assign(e,{x,y,width,height})}
    at('d1',3,15.5,3,.5);at('d2',11.75,10,2+8/12,.5)
    at('w1',3,0,3,.5);at('w2',17,0,2.5,.5)
    at('r1',2.5,6,7,2);at('r2',15,6,7,2);at('note',2,18,18,2)
    const wall=(id,x,y,width,height)=>({id,bloxId:'wall-exterior',x,y,width,height,rotation:0,properties:{},locked:false})
    p.elements.push(wall('top',0,0,24,.5),wall('left',0,0,.5,16),wall('right',23.5,0,.5,16),wall('bottom',0,15.5,24,.5))
    p.elements.push({...wall('partition',11.75,.5,.5,15),bloxId:'wall-interior'})
    // Vertical opening encoded by dimensions, matching the wall-hosting convention.
    at('d2',11.75,10,.5,2+8/12)
    p.dimensions=[{id:'overall-width',x1:0,y1:0,x2:24,y2:0,offset:2,measurement:'horizontal'},
      {id:'overall-height',x1:0,y1:0,x2:0,y2:16,offset:2,measurement:'vertical'}]
    p.titleBlock.drawingTitle='SAMPLE FLOOR PLAN'
    const {useStore}=await import('/src/store/useStore.ts')
    useStore.setState({project:p})
    return buildPermitSetHTML(p,data)
  })
  await render.setContent(combined)
  await render.locator('.permit-drawing img').evaluate(img=>img.decode())
  const combinedCheck=await check()
  if(combinedCheck.problems.length)throw Error(combinedCheck.problems.join('\n'))
  const drawing=await render.locator('.permit-drawing').evaluate(el=>({widthIn:el.getBoundingClientRect().width/96,heightIn:el.getBoundingClientRect().height/96}))
  await render.pdf({path:'output/pdf/residential-permit-preview.pdf',preferCSSPageSize:true,printBackground:true})
  await writeFile('tmp/pdfs/residential-combined-preview.html',combined)
  const stressHTML=await page.evaluate(async()=>{
    const {permitSheetHTML}=await import('/src/utils/permitSheet.ts')
    const {project,data}=window.permitSample
    data.tables.doors=Array.from({length:80},(_,i)=>({id:String(i),cells:{mark:'D'+(i+1),location:'Bedroom',description:'Solid-core interior door',size:'2\'8" × 6\'8"',notes:i===3?'Long specification retained. '.repeat(180):'Verify selected assembly.'}}))
    data.scope='Long project scope paragraph. '.repeat(220)
    return permitSheetHTML(project,data)
  })
  await render.setContent(stressHTML)
  const stress=await check();if(stress.problems.length)throw Error(stress.problems.join('\n'))
  const stressText=(await render.locator('.sheet-content').allTextContents()).join(' ').replace(/\s+/g,' ')
  if((stressText.match(/Long specification retained\./g)??[]).length!==180)throw Error('Long specification text lost during pagination')
  await render.pdf({path:'tmp/pdfs/permit-pagination-stress.pdf',preferCSSPageSize:true,printBackground:true})
  if(errors.length)throw Error(errors.join('\n'))
  console.log(JSON.stringify({sample,combined:combinedCheck,drawing,stress,errors}))
} finally {await browser.close()}
