import type {PlacedElement} from '../types'

export const openingTagField=(id:string)=>id==='annotation-window-tag'?'windowMark':id==='annotation-door-tag'?'doorMark':null
export function validOpeningTarget(tag:PlacedElement,target:PlacedElement):boolean {
  return tag.bloxId==='annotation-window-tag'?target.bloxId.startsWith('window-'):tag.bloxId==='annotation-door-tag'&&target.bloxId.startsWith('door-')
}
/** Keep serialized tags consistent so canvas, print, and saved files agree. */
export function coordinateOpeningTags(elements:PlacedElement[]):PlacedElement[] {
  const byId=new Map(elements.map(e=>[e.id,e]))
  return elements.map(tag=>{
    const key=openingTagField(tag.bloxId)
    if(!key)return tag
    if(!tag.properties.targetId)return tag.properties.sourceMissing?{...tag,properties:{...tag.properties,sourceMissing:false}}:tag
    const target=byId.get(String(tag.properties.targetId))
    const missing=!target||!validOpeningTarget(tag,target)
    const label=missing?'?':String(target.properties[key]??'')
    if(tag.properties.label===label&&!!tag.properties.sourceMissing===missing)return tag
    return {...tag,properties:{...tag.properties,label,sourceMissing:missing}}
  })
}
export function updateOpeningTag(elements:PlacedElement[],id:string,updates:Partial<PlacedElement>,isLocked:(el:PlacedElement)=>boolean=el=>el.locked):PlacedElement[] {
  const old=elements.find(e=>e.id===id)
  let next=elements.map(e=>e.id===id?{...e,...updates}:e)
  if(!old||!updates.properties)return next
  const tag=next.find(e=>e.id===id)!,key=openingTagField(tag.bloxId)
  const target=next.find(e=>e.id===tag.properties.targetId)
  if(key&&target&&validOpeningTarget(tag,target)&&!isLocked(target)) {
    const linking=old.properties.targetId!==tag.properties.targetId
    const editing=Object.hasOwn(updates.properties,'label')&&updates.properties.label!==old.properties.label
    if((editing&&!linking)||(linking&&!target.properties[key]&&tag.properties.label&&tag.properties.label!=='?'&&!tag.properties.sourceMissing))
      next=next.map(e=>e.id===target.id?{...e,properties:{...e.properties,[key]:String(tag.properties.label??'')}}:e)
  }
  return next
}
