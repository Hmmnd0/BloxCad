import {beforeEach,describe,it,expect} from 'vitest'
import {useStore} from '../store/useStore'
import {syncPermitSchedules} from './permitSync'
import {defaultPermitData} from './permitSheet'
import {buildProjectSVG} from './svgExport'

const state=()=>useStore.getState()
const elements=()=>state().project!.elements
const get=(id:string)=>elements().find(e=>e.id===id)!
function props(id:string,properties:Record<string,unknown>) {
  state().updateElement(id,{properties:{...get(id).properties,...properties}})
}
function add(bloxId:string) {
  state().placeElement(bloxId,2,2)
  return elements().at(-1)!.id
}
function fixture() {
  const window=add('window-single'),tag=add('annotation-window-tag')
  props(window,{windowMark:'W1'})
  props(tag,{targetId:window})
  return {window,tag}
}
beforeEach(()=>state().createProject('Window tag test','quarter'))
describe('linked opening tags',()=>{
  it('coordinates mark edits in both directions and undoes atomically',()=>{
    const {window,tag}=fixture(),other=add('annotation-window-tag')
    props(other,{targetId:window})
    expect(get(tag).properties.label).toBe('W1')
    props(tag,{label:'W2'})
    expect(get(window).properties.windowMark).toBe('W2')
    expect(get(other).properties.label).toBe('W2')
    state().undo()
    expect(get(window).properties.windowMark).toBe('W1')
    expect(get(tag).properties.label).toBe('W1')
    props(window,{windowMark:'W3'})
    expect(get(other).properties.label).toBe('W3')
  })
  it('flags deletion and never seeds a missing marker into a replacement window',()=>{
    const {window,tag}=fixture()
    state().selectElement(window)
    state().deleteSelectedElements()
    expect(get(tag).properties).toMatchObject({label:'?',sourceMissing:true})
    const replacement=add('window-single')
    props(tag,{targetId:replacement})
    expect(get(replacement).properties.windowMark).toBeUndefined()
    expect(get(tag).properties).toMatchObject({label:'',sourceMissing:false})
    props(tag,{targetId:'missing'})
    props(tag,{targetId:undefined})
    expect(get(tag).properties.sourceMissing).toBe(false)
  })
  it('remaps copied references and keeps the original independent',()=>{
    const {window,tag}=fixture()
    state().selectElement(window)
    state().selectElement(tag,true)
    state().copySelected();state().pasteClipboard()
    const pasted=elements().filter(e=>e.id!==window&&e.id!==tag)
    const newWindow=pasted.find(e=>e.bloxId==='window-single')!
    const newTag=pasted.find(e=>e.bloxId==='annotation-window-tag')!
    expect(newTag.properties.targetId).toBe(newWindow.id)
    props(newTag.id,{label:'W2'})
    expect(get(window).properties.windowMark).toBe('W1')
  })
  it('does not edit a locked opening through its tag',()=>{
    const {window,tag}=fixture()
    state().updateElement(window,{locked:true})
    props(tag,{label:'W9'})
    expect(get(window).properties.windowMark).toBe('W1')
    expect(get(tag).properties.label).toBe('W1')
  })
  it('rejects incompatible target types',()=>{
    const {tag}=fixture(),door=add('door-single')
    props(tag,{targetId:door,label:'W9'})
    expect(get(door).properties.windowMark).toBeUndefined()
    expect(get(tag).properties.sourceMissing).toBe(true)
  })
  it('populates schedules and exports the window mark as a diamond',()=>{
    const {window,tag}=fixture()
    const data=syncPermitSchedules(state().project!,defaultPermitData())
    expect(data.tables.windows.find(r=>r.elementId===window)?.cells.mark).toBe('W1')
    expect(data.tables.callouts.find(r=>r.elementId===tag)?.cells.mark).toBe('W1')
    const svg=buildProjectSVG(state().project!)
    expect(svg).toContain('>W1</text>')
    expect(svg).not.toContain('>Window Tag</text>')
  })
})
