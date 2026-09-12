import {describe,it,expect} from 'vitest'
import {defaultPermitData,syncDoorSchedule,permitSheetHTML} from './permitSheet'
import {useStore} from '../store/useStore'
import {DEMOLITION_IDS,demolitionGeometry} from './demolitionGeometry'
import {buildWallRegions} from './wallUnion'
import {elementSVG} from './svgExport'

describe('permit drawing support',()=>{
  it('refreshes doors without duplicates, invented height, or overwritten specifications',()=>{
    const s=useStore.getState();s.createProject('Permit QA','quarter');s.placeElement('door-single',1,1,3,.5)
    const project=useStore.getState().project!,first=syncDoorSchedule(project,defaultPermitData())
    expect(first.tables.doors).toHaveLength(1)
    expect(first.tables.doors[0].cells.size).toBeUndefined()
    first.tables.doors[0].cells.hardware='H1'
    expect(syncDoorSchedule(project,first).tables.doors).toEqual(first.tables.doors)
  })
  it('stores permit data with undo and keeps jurisdiction matrices separate',()=>{
    const s=useStore.getState();s.createProject('Permit QA','quarter')
    const data=defaultPermitData();data.tables['chicago-zoning'][0].cells.actual='PIN'
    expect(data.tables['indianapolis-zoning'][0].cells.actual).toBeUndefined()
    s.updatePermitData(data);expect(useStore.getState().project?.permitData).toEqual(data)
    s.undo();expect(useStore.getState().project?.permitData).toBeUndefined()
  })
  it('escapes project text in printable sheets',()=>{
    useStore.getState().createProject('<script>alert(1)</script>','quarter')
    const html=permitSheetHTML(useStore.getState().project!,defaultPermitData())
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Door hardware schedule')
  })
  it('does not turn demolition overlays into wall unions and exports dashed vectors',()=>{
    const elements=[...DEMOLITION_IDS].map((bloxId,i)=>({id:String(i),bloxId,x:0,y:0,width:8,height:.5,rotation:0,properties:{},locked:false}))
    expect(buildWallRegions(elements)).toHaveLength(0)
    for(const el of elements)expect(demolitionGeometry(el.bloxId,192,12).length).toBeGreaterThan(0)
    expect(elementSVG(elements[0],24)).toContain('stroke-dasharray="5 3"')
    expect(elementSVG(elements.at(-1)!,24)).not.toContain('stroke-dasharray')
  })
})
