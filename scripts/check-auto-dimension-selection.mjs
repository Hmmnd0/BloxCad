import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5221')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  await page.evaluate(async()=>{const {useStore}=await import('/src/store/useStore.ts');useStore.getState().createProject('Auto dimension selection regression','quarter')})
  await page.getByLabel('Selection properties',{exact:true}).waitFor()
  await page.evaluate(async()=>{
    const {useStore}=await import('/src/store/useStore.ts');const s=useStore.getState()
    s.placeElement('wall-exterior',4,10,.5,9+8/12)
    s.placeElement('wall-exterior',4,13,15,.5)
    s.placeElement('wall-exterior',18.5,-108,.5,121.5)
    s.selectElement(useStore.getState().project.elements[0].id)
    s.setStageTransform(130,-40,1)
  })
  await page.getByTitle('Add dimension to the left',{exact:true}).click()
  await page.evaluate(async()=>{
    const {useStore,getActiveDimensions}=await import('/src/store/useStore.ts');const s=useStore.getState()
    const d=getActiveDimensions(s)[0]
    if(Math.abs(d.y1-10)>1e-8||Math.abs(d.y2-d.y1-(9+8/12))>1e-8)throw Error('Auto dimension escaped selected wall')
    s.selectMany([], [d.id])
  })
  await page.getByText('Selected walls · outer edges',{exact:true}).waitFor()
  await page.screenshot({path:'artifacts/auto-dimension-selected-wall.png'})
  await page.evaluate(async()=>{
    const {useStore,getActiveDimensions}=await import('/src/store/useStore.ts');let s=useStore.getState()
    const id=s.project.elements[0].id
    s.updateElement(id,{height:10})
    let d=getActiveDimensions(useStore.getState())[0]
    if(Math.abs(d.y2-d.y1-10)>1e-8)throw Error('Resize failed')
    s.undo();d=getActiveDimensions(useStore.getState())[0]
    if(Math.abs(d.y2-d.y1-(9+8/12))>1e-8)throw Error('Undo failed')
  })
  if(errors.length)throw Error(errors.join('\n'))
  console.log(JSON.stringify({selectedSegment:true,resize:true,undo:true,errors}))
} finally{await browser.close()}
