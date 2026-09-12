import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
import {writeFile,mkdir,readFile} from 'node:fs/promises'
import ts from 'typescript'
import vm from 'node:vm'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
 const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5187')
 await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
 const result=await page.evaluate(async services=>{
   const {useStore}=await import('/src/store/useStore.ts'),s=useStore.getState()
   s.createProject('Willow House · Export study','quarter');s.setShowLegend(true);s.setShowTitleBlock(true)
   s.updateTitleBlock({drawingTitle:'GROUND FLOOR PLAN',address:'Drawing export verification',sheetNumber:'A1.1',drawnBy:'JC',checkedBy:'',jobNumber:'BXC-01',projectDate:'2026-09-06'})
   const add=(id,x,y,w,h)=>{s.placeElement(id,x,y,w,h);return useStore.getState().project.elements.at(-1)}
   const wall=add('wall-exterior',0,0,36,.5)
   add('wall-exterior',0,25.5,36,.5);add('wall-exterior',0,0,.5,26);add('wall-exterior',35.5,0,.5,26)
   s.placeElement('door-double',3,0,6,.5,wall.id);s.placeElement('window-multi',17,0,6,.5,wall.id)
   add('furniture-sofa',4,8,7,2.833);add('furniture-coffee-table',5,12,4,2)
   add('stairs-straight',25,6,3,10);add('fixture-sink-kitchen',4,21,3,2)
   add('elec-outlet',15,20,.5,.5)
   if(services==='site') {
     add('site-tree',3,3,5,5);add('site-shrub',11,3,3,3)
     add('site-parking-stall',17,2,9,4);add('site-sidewalk',3,15,10,2)
     add('site-driveway',17,15,8,3);add('site-deck-patio',26,19,6,5)
   } else if(services) {
     add('elec-panel',3,5,1.5,.5);add('elec-outlet-gfci',8,5,.5,.5)
     add('elec-outlet-240v',13,5,.5,.5);add('elec-switch-dimmer',18,5,.3,.3)
     add('mech-range-hood',12,8,3,2);add('mech-duct-supply',12,12,8,1)
     add('structural-footing',18,19,4,4)
   }
   const note=add('text-note',8,17,10,2);s.updateElement(note.id,{properties:{text:'LIVING / DINING',fontSize:12}})
   s.addDimension({x1:0,y1:0,x2:36,y2:0,offset:-3,measurement:'horizontal'})
   s.addDimension({x1:0,y1:0,x2:0,y2:26,offset:3,measurement:'vertical'})
   const {buildPrintSheet}=await import('/src/utils/printSheet.tsx')
   const project=useStore.getState().project
   const first=await buildPrintSheet(project,true,true,'image/png',true)
   s.setStageTransform(-200,450,.35);s.selectElement(note.id)
   const second=await buildPrintSheet(project,true,true,'image/png')
   if(first.dataUrl!==second.dataUrl)throw new Error('Export changed with viewport zoom or selection')
   const jpeg=await buildPrintSheet(project,true,true,'image/jpeg')
   const {fitView}=await import('/src/utils/exportManager.ts');await fitView()
   return {png:first.dataUrl,jpeg:jpeg.dataUrl,svg:first.svg,width:first.width,height:first.height,page:first.page}
 },process.argv.includes('--site')?'site':process.argv.includes('--services'))
 await mkdir('output/pdf',{recursive:true})
 await writeFile('artifacts/plan-sheet.png',Buffer.from(result.png.split(',')[1],'base64'))
 await writeFile('artifacts/plan-sheet.svg',result.svg)
 // Run the actual Electron PDF builder without launching the app/profile.
 const main=await readFile('electron/main/index.ts','utf8')
 const code=main.slice(main.indexOf('function buildImagePDF('),main.indexOf('\nfunction createWindow',main.indexOf('function buildImagePDF(')))
 const context={Buffer};vm.createContext(context)
 vm.runInContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context)
 const pdf=context.buildImagePDF(Buffer.from(result.jpeg.split(',')[1],'base64'),result.width,result.height)
 await writeFile('output/pdf/plan-sheet.pdf',pdf)
 if(!pdf.toString('latin1').includes(`/MediaBox [0 0 ${result.page.widthIn*72} ${result.page.heightIn*72}]`))throw new Error('Wrong physical PDF dimensions')
 await page.screenshot({path:'artifacts/canvas-sheet-key.png'})
 const svgPage=await browser.newPage({viewport:{width:result.page.width,height:result.page.height}})
 await svgPage.setContent(result.svg);await svgPage.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())))
 await svgPage.screenshot({path:'artifacts/plan-sheet-svg.png',fullPage:true})
 if(errors.length)throw new Error(errors.join('\n'))
 console.log(JSON.stringify({page:result.page,zoomIndependent:true,pdfMediaBox:true,errors}))
} finally {await browser.close()}
