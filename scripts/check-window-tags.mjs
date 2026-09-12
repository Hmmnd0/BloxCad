import {chromium} from '/Users/joe/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true,executablePath:'/Users/joe/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'})
try {
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.BLOX_PREVIEW_URL??'http://127.0.0.1:5232')
  await page.getByRole('button',{name:'Create Project',exact:true}).waitFor()
  const ids=await page.evaluate(async()=>{
    const {useStore}=await import('/src/store/useStore.ts'),s=useStore.getState()
    s.createProject('Window tag coordination · preview','quarter')
    s.placeElement('window-single',5,5,4,.5)
    const window=useStore.getState().project.elements.at(-1)
    s.updateElement(window.id,{properties:{windowMark:'W1',windowSize:'4\' × 5\''}})
    s.placeElement('annotation-window-tag',6.25,7,1.5,1.5)
    const tag=useStore.getState().project.elements.at(-1)
    s.selectElement(tag.id);s.setStageTransform(100,80,2)
    return {window:window.id,tag:tag.id}
  })
  await page.getByLabel('Callout linked object').selectOption(ids.window)
  if(await page.getByLabel('Opening tag mark').inputValue()!=='W1')throw Error('Link did not adopt mark')
  await page.getByLabel('Opening tag mark').fill('W2')
  await page.evaluate(async({window})=>{
    const {useStore}=await import('/src/store/useStore.ts')
    if(useStore.getState().project.elements.find(e=>e.id===window).properties.windowMark!=='W2')throw Error('Tag edit did not update opening')
  },ids)
  await page.getByLabel('Category',{exact:true}).selectOption('Annotations')
  await page.getByRole('button',{name:'Fit to screen',exact:true}).click()
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  await page.screenshot({path:'artifacts/window-tag-coordination.png'})
  await page.getByTitle('Panels',{exact:true}).click()
  await page.getByRole('button',{name:'Permit Sheet & Schedules',exact:true}).click()
  await page.getByRole('button',{name:'Refresh all from drawing',exact:true}).click()
  const windows=page.locator('.permit-table-section').filter({has:page.getByRole('heading',{name:'Window schedule',exact:true})})
  if(await windows.locator('textarea').first().inputValue()!=='W2')throw Error('Window schedule mark not coordinated')
  if(errors.length)throw Error(errors.join('\n'))
  console.log('Window tag UI linking, mark editing, and schedule population verified.')
} finally {await browser.close()}
