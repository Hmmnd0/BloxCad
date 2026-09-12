import type { PlacedElement, Project } from '../types'
import {formatFeet} from './scale'
import {formatLengthInput} from './lengthInput'
const planSpan=(el:PlacedElement)=>{const span=Math.max(el.width,el.height);return Math.abs(span*12-Math.round(span*12))<1e-6?formatFeet(span):formatLengthInput(span)}
import {getBloxById} from '../blox/definitions'
import {newPermitRow,type PermitData,type PermitRow} from './permitSheet'

const text=(v:unknown)=>typeof v==='string'?v:typeof v==='number'&&Number.isFinite(v)?String(v):''
/** Stable source IDs and source snapshots distinguish an imported value from a manual edit. */
function mergeRows(existing:PermitRow[],sources:Map<string,Record<string,string>>):PermitRow[] {
  const seen=new Set<string>()
  const rows=existing.map(row=>{
    if(!row.elementId)return row
    const source=sources.get(row.elementId)
    if(!source)return {...row,sourceMissing:true}
    seen.add(row.elementId)
    const cells={...row.cells}
    for(const [key,value] of Object.entries(source)) {
      if(row.overrides?.includes(key))continue
      const previous=row.sourceCells?.[key]
      if(previous!==undefined?cells[key]===previous:!cells[key])cells[key]=value
    }
    return {...row,cells,sourceCells:source,sourceMissing:false}
  })
  for(const [elementId,cells] of sources)if(!seen.has(elementId))rows.push({...newPermitRow(cells),elementId,sourceCells:{...cells},sourceMissing:false})
  return rows
}

export function syncPermitSchedules(project:Project,data:PermitData):PermitData {
  const sources:Record<string,Map<string,Record<string,string>>>=Object.fromEntries(['doors','windows','walls','equipment','demolition','rooms','callouts'].map(key=>[key,new Map()]))
  const els=project.elements,byId=new Map(els.map(e=>[e.id,e]))
  const linked=(el:PlacedElement,id:string)=>els.filter(tag=>tag.bloxId===id&&tag.properties.targetId===el.id)
  const unique=(values:string[])=>{const nonempty=[...new Set(values.map(v=>v.trim()).filter(Boolean))];return nonempty.length===1?nonempty[0]:''}
  for(const el of els) {
    const p=el.properties,def=getBloxById(el.bloxId)
    const labels=linked(el,'annotation-leader').map(tag=>text(tag.properties.label))
    const description=unique(labels)||def?.name||el.bloxId
    if(el.bloxId.startsWith('door-')) {
      const marks=linked(el,'annotation-door-tag').map(tag=>text(tag.properties.label).trim())
      const conflict=new Set([...marks,text(p.doorMark).trim()].filter(Boolean)).size>1
      sources.doors.set(el.id,{mark:text(p.doorMark)||unique(marks),location:text(p.location),description:text(p.doorType)||description,span:planSpan(el),size:text(p.doorSize),clear:text(p.clearOpening),closer:text(p.closer),rating:text(p.fireRating),finish:text(p.doorFinish),frame:text(p.frame),hardware:text(p.hardwareSet),notes:[text(p.notes),conflict?'Conflicting door mark / linked tags — review.':''].filter(Boolean).join('\n')})
    }
    if(def?.category==='Openings'&&el.bloxId.startsWith('window-')) {
      const marks=linked(el,'annotation-window-tag').map(tag=>text(tag.properties.label).trim())
      const conflict=new Set([...marks,text(p.windowMark).trim()].filter(Boolean)).size>1
      sources.windows.set(el.id,{mark:text(p.windowMark)||unique(marks),location:text(p.location),description:text(p.windowType)||description,span:planSpan(el),size:text(p.windowSize),sill:text(p.sillHeight),glazing:text(p.glazing),manufacturer:text(p.manufacturer),model:text(p.model),notes:[text(p.notes),conflict?'Conflicting window mark / linked tags — review.':''].filter(Boolean).join('\n')})
    }
    if(def?.category==='Walls'&&p.wallMark)sources.walls.set(el.id,{mark:text(p.wallMark),assembly:text(p.assembly)||description,rating:text(p.fireRating),listing:text(p.assemblyReference),notes:text(p.notes)})
    if(['Fixtures','Furniture','Mechanical','Plumbing','Electrical','LowVoltage'].includes(def?.category??'')&&!['elec-conduit','elec-circuit-wire','elec-homerun'].includes(el.bloxId))sources.equipment.set(el.id,{mark:text(p.scheduleMark),description,quantity:'1',dimensions:text(p.equipmentDimensions),manufacturer:text(p.manufacturer),model:text(p.model),input:text(p.input),output:text(p.output),notes:text(p.notes)})
    if(el.bloxId.startsWith('demo-'))sources.demolition.set(el.id,{mark:text(p.mark),scope:unique(labels)||text(p.notes)||description,sheet:text(p.sheetRef)})
    if(el.bloxId==='annotation-room-tag')sources.rooms.set(el.id,{mark:text(p.roomNum),name:text(p.roomName),area:text(p.roomArea),floor:text(p.floorFinish),base:text(p.baseFinish),wall:text(p.wallFinish),ceiling:text(p.ceilingFinish)})
    if(['annotation-leader','annotation-door-tag','annotation-window-tag','annotation-detail-bubble','annotation-section-ref','text-note'].includes(el.bloxId)) {
      const target=byId.get(text(p.targetId))
      const referenceMark=el.bloxId==='annotation-detail-bubble'?text(p.detailNum):el.bloxId==='annotation-section-ref'?text(p.secNum):['annotation-door-tag','annotation-window-tag'].includes(el.bloxId)?text(p.label):''
      sources.callouts.set(el.id,{mark:text(p.mark)||referenceMark,text:text(p.text)||text(p.label),target:target?(getBloxById(target.bloxId)?.name??target.bloxId):p.targetId?'Linked object removed':'Unlinked',sheet:text(p.sheetRef)||text(p.sheetNum)})
    }
  }
  const tables={...data.tables}
  for(const [key,values] of Object.entries(sources))tables[key]=mergeRows(tables[key]??[],values)
  // Hardware rows are specifications, not invented selections. Link every item in
  // a set to its current door marks; create a blank review row for a new set.
  const usage=new Map<string,string[]>()
  for(const row of tables.doors??[])if(!row.sourceMissing&&row.cells.hardware?.trim()) {
    const set=row.cells.hardware.trim()
    usage.set(set,[...(usage.get(set)??[]),row.cells.mark||'Unmarked door'])
  }
  tables.hardware=(tables.hardware??[]).map(row=>({...row,cells:{...row.cells,openings:(usage.get(row.cells.set?.trim())??[]).join(', ')}}))
  for(const [set,marks] of usage)if(!tables.hardware.some(row=>row.cells.set?.trim()===set))
    tables.hardware.push(newPermitRow({set,openings:marks.join(', ')}))
  for(const key of ['doors','windows']) {
    const rows=tables[key]
    const counts=new Map<string,number>()
    for(const row of rows)if(!row.sourceMissing&&row.cells.mark?.trim())counts.set(row.cells.mark.trim(),(counts.get(row.cells.mark.trim())??0)+1)
    tables[key]=rows.map(row=>{
      const issues:string[]=[]
      if(row.sourceMissing)issues.push('Source removed or no longer scheduled; remove or review this row.')
      else {
        if(row.sourceCells?.notes?.includes('Conflicting door mark'))issues.push('Door mark and linked tags disagree.')
        if(row.sourceCells?.notes?.includes('Conflicting window mark'))issues.push('Window mark and linked tags disagree.')
        if(!row.cells.mark?.trim())issues.push('Missing mark.')
        else if((counts.get(row.cells.mark.trim())??0)>1)issues.push('Duplicate mark; each opening needs a unique mark.')
        if(!row.cells.size?.trim())issues.push('Missing specified size; plan span is not a leaf/unit size or height.')
        if(key==='doors'&&!row.cells.hardware?.trim())issues.push('Hardware set not selected.')
        if(key==='windows'&&!row.cells.glazing?.trim())issues.push('Glazing not specified.')
      }
      return {...row,issues}
    })
  }
  tables.hardware=tables.hardware.map(row=>({...row,issues:[
    ...(!row.cells.openings?['No current doors reference this set.']:[]),
    ...(!row.cells.description?.trim()?['Hardware items not specified.']:[]),
  ]}))
  return {...data,tables}
}
