import type { Project, PlacedElement } from '../types'
import { SCALES } from '../types'
import { getBloxById } from '../blox/definitions'
import { getElementAABB } from './snap'
import { circulationGeometry, REFINED_CIRCULATION } from './circulationGeometry'
import { dimensionLayout } from './dimensionLayout'
import { resolveDimensions } from './dimensionAnchors'
import { electricalGeometry, REFINED_ELECTRICAL } from './electricalGeometry'
import { equipmentGeometry, REFINED_EQUIPMENT } from './equipmentGeometry'
import { symbolBounds } from './symbolBounds'

export const SHEET_DPI = 96
export const EXPORT_PIXEL_RATIO = 3
export function visiblePlanElements(project:Project) {
  return (project.mode==='detail'?project.detailElements??[]:project.elements).filter(e=>!project.layers?.some(l=>l.id===e.layerId&&!l.visible))
}
export function planDimensions(project:Project) {
  return project.mode==='detail'?project.detailDimensions??[]:resolveDimensions(project.dimensions??[],project.elements)
}
export interface PlanLegendEntry { id:string; name:string; category:string; example:PlacedElement }
/** A symbol key, not an inventory or door/window schedule. No bounding-box
 * dimensions, quantities, repeated wall segments, or hidden-layer entries. */
export function buildPlanLegend(project:Project):PlanLegendEntry[] {
  const entries=new Map<string,PlanLegendEntry>()
  for(const el of visiblePlanElements(project)) {
    if(el.bloxId.startsWith('shape-')||['text-note','annotation-room-tag','annotation-drawing-title'].includes(el.bloxId)) continue
    const def=getBloxById(el.bloxId)
    if(def&&!entries.has(el.bloxId)) entries.set(el.bloxId,{id:el.bloxId,name:def.name,category:def.category,example:el})
  }
  return [...entries.values()].sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name))
}
export function planBounds(project:Project) {
  const p=SCALES[project.scale].pixelsPerFoot
  let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity
  const include=(x:number,y:number)=>{if(!Number.isFinite(x)||!Number.isFinite(y))return;x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y)}
  for(const e of visiblePlanElements(project)) {
    if(REFINED_CIRCULATION.has(e.bloxId)) {
      const b=circulationGeometry(e.bloxId,e.width,e.height,e.properties).bounds,a=e.rotation*Math.PI/180
      for(const x of [b.x,b.x+b.width]) for(const y of [b.y,b.y+b.height]) {
        const dx=(e.properties.flipH?e.width-x:x)-e.width/2,dy=(e.properties.flipV?e.height-y:y)-e.height/2
        include((e.x+e.width/2+dx*Math.cos(a)-dy*Math.sin(a))*p,(e.y+e.height/2+dx*Math.sin(a)+dy*Math.cos(a))*p)
      }
    } else if(REFINED_ELECTRICAL.has(e.bloxId)||REFINED_EQUIPMENT.has(e.bloxId)) {
      const w=e.width*p,h=e.height*p,geometry=REFINED_ELECTRICAL.has(e.bloxId)?electricalGeometry:equipmentGeometry
      const b=symbolBounds(geometry(e.bloxId,w,h),w,h),a=e.rotation*Math.PI/180
      for(const x of [b.x,b.x+b.width])for(const y of [b.y,b.y+b.height]) {
        const dx=(e.properties.flipH?w-x:x)-w/2,dy=(e.properties.flipV?h-y:y)-h/2
        include((e.x+e.width/2)*p+dx*Math.cos(a)-dy*Math.sin(a),(e.y+e.height/2)*p+dx*Math.sin(a)+dy*Math.cos(a))
      }
    } else {const b=getElementAABB(e);include(b.x*p,b.y*p);include((b.x+b.width)*p,(b.y+b.height)*p)}
  }
  for(const d of planDimensions(project)) {
    const g=dimensionLayout(d,p)
    for(const ps of [g.line,g.ext1,g.ext2,g.tick1,g.tick2]) for(let i=0;i<ps.length;i+=2) include(ps[i],ps[i+1])
    include(g.label.x-60,g.label.y-12);include(g.label.x+60,g.label.y+12)
  }
  if(project.mode!=='elevation') for(const a of project.arcWalls??[]) {
    if(project.layers?.some(l=>l.id===a.layerId&&!l.visible))continue
    const r=a.radius+a.thickness/2;include((a.cx-r)*p,(a.cy-r)*p);include((a.cx+r)*p,(a.cy+r)*p)
  }
  const u=project.underlay
  if(u?.visible) {
    const c=u.calibration
    const w=!c?u.naturalWidth:c.method==='simple'?c.realWidthFt*p:c.method==='multi-point'?u.naturalWidth*p/c.pixelsPerFoot:u.naturalWidth*c.realDistFt*p/Math.hypot(c.p2px.x-c.p1px.x,c.p2px.y-c.p1px.y)
    include(0,0);include(w,w*u.naturalHeight/u.naturalWidth)
  }
  if(!Number.isFinite(x1)) return {x:0,y:0,width:480,height:360}
  return {x:x1,y:y1,width:Math.max(1,x2-x1),height:Math.max(1,y2-y1)}
}
export function planNotesLayout(project:Project,legend:boolean) {
  const bounds=planBounds(project),entries=legend?buildPlanLegend(project):[]
  const rows=18,columns=Math.max(1,Math.ceil(entries.length/rows))
  return {x:bounds.x+bounds.width+48,y:bounds.y,width:304*columns,height:110+Math.min(rows,entries.length)*44,entries,rows,columns}
}
export function planScaleLabel(project:Project) {
  return project.mode==='detail'?`1:${96/SCALES[project.scale].pixelsPerFoot} (detail)`:SCALES[project.scale].label
}
export function sheetSize(width:number,height:number) {
  // Half-inch margins, no fit-to-page scaling. Pick the smallest sheet that
  // fits at the selected scale, or a whole-inch custom sheet when necessary.
  const neededW=width+96,neededH=height+96
  const sizes=[[11,8.5],[17,11],[24,18],[36,24],[48,36]].flatMap(([w,h])=>[[w,h],[h,w]])
  const fit=sizes.find(([w,h])=>w*96>=neededW&&h*96>=neededH)
  const [w,h]=fit??[Math.ceil(neededW/96),Math.ceil(neededH/96)]
  return {width:w*96,height:h*96,widthIn:w,heightIn:h}
}
