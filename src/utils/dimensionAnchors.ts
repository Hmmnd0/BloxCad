import type { DimensionAnchor, DimensionLine, PlacedElement, WallFaceReference } from '../types'
import { buildWallRegions, JOINED_WALLS, type WallRegion } from './wallUnion'

type Point = { x:number; y:number }
const EPS=1e-6
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
function faceLine(ref:WallFaceReference,elements:PlacedElement[]):[Point,Point]|undefined {
  const w=elements.find(e=>e.id===ref.wallId)
  if(!w) return
  const inset=Math.min(w.width,w.height)*ref.inset
  const x0=inset,y0=inset,x1=w.width-inset,y1=w.height-inset
  const local=ref.side==='left'?[[x0,y0],[x0,y1]]:ref.side==='right'?[[x1,y0],[x1,y1]]:ref.side==='top'?[[x0,y0],[x1,y0]]:[[x0,y1],[x1,y1]]
  const a=(w.rotation||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a)
  return local.map(([x,y])=>({x:w.x+w.width/2+(x-w.width/2)*c-(y-w.height/2)*s,y:w.y+w.height/2+(x-w.width/2)*s+(y-w.height/2)*c})) as [Point,Point]
}
function intersection(a:[Point,Point],b:[Point,Point]):Point|undefined {
  const dx=a[1].x-a[0].x,dy=a[1].y-a[0].y,ex=b[1].x-b[0].x,ey=b[1].y-b[0].y
  const det=dx*ey-dy*ex
  if(Math.abs(det)<EPS) return
  const t=((b[0].x-a[0].x)*ey-(b[0].y-a[0].y)*ex)/det
  return {x:a[0].x+t*dx,y:a[0].y+t*dy}
}
function onSegment(p:Point,[a,b]:[Point,Point]) {
  return Math.abs(distance(a,p)+distance(p,b)-distance(a,b))<EPS
}
export function regionVertices(region:WallRegion):Point[] {
  return region.polygons.flatMap(poly=>poly.flatMap(r=>r.slice(0,-1).map(([x,y])=>({x,y}))))
}
function anchorAt(point:Point,region:WallRegion,elements:PlacedElement[]):DimensionAnchor|undefined {
  const refs:WallFaceReference[]=[]
  for(const w of elements) {
    const key=`${w.layerId??''}:${w.bloxId}`
    if(w.bloxId!==region.bloxId || (region.key!==key && region.key!==key+':stem')) continue
    for(const side of ['left','right','top','bottom'] as const) {
      const ref={wallId:w.id,side,inset:region.key.endsWith(':stem')?.3:0}
      const line=faceLine(ref,elements)
      if(line&&onSegment(point,line)) refs.push(ref)
    }
  }
  for(let i=0;i<refs.length;i++) for(let j=i+1;j<refs.length;j++) {
    const p=intersection(faceLine(refs[i],elements)!,faceLine(refs[j],elements)!)
    if(p&&distance(p,point)<EPS) return {regionKey:region.key,faces:[refs[i],refs[j]]}
  }
}
export function dimensionSnapPoints(elements:PlacedElement[]) {
  return buildWallRegions(elements).flatMap(r=>regionVertices(r).map(p=>({...p,anchor:anchorAt(p,r,elements)})))
}
/** Snap a dimension endpoint to any visible wall perimeter, not only corners. */
export function nearestWallEdgePoint(cursor:Point,elements:PlacedElement[],threshold:number):Point|undefined {
  let best:Point|undefined, bestDistance=threshold
  for(const region of buildWallRegions(elements)) for(const ring of region.polygons) for(const polygon of ring) {
    for(let i=0;i<polygon.length;i++) {
      const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy
      if(!len2)continue
      const t=Math.max(0,Math.min(1,((cursor.x-a[0])*dx+(cursor.y-a[1])*dy)/len2))
      const point={x:a[0]+t*dx,y:a[1]+t*dy},d=distance(cursor,point)
      if(d<bestDistance){bestDistance=d;best=point}
    }
  }
  return best
}
export function attachDimension(dim:DimensionLine,elements:PlacedElement[]):DimensionLine {
  const points=dimensionSnapPoints(elements)
  return {...dim,
    anchor1:dim.anchor1??points.find(p=>distance(p,{x:dim.x1,y:dim.y1})<EPS)?.anchor,
    anchor2:dim.anchor2??points.find(p=>distance(p,{x:dim.x2,y:dim.y2})<EPS)?.anchor}
}
export function resolveDimensions(dimensions:DimensionLine[],elements:PlacedElement[]):DimensionLine[] {
  if(!dimensions.some(d=>d.anchor1||d.anchor2||d.overall)) return dimensions
  const regions=buildWallRegions(elements)
  const resolve=(ref:DimensionAnchor|undefined):Point|undefined=>{
    if(!ref) return
    const a=faceLine(ref.faces[0],elements),b=faceLine(ref.faces[1],elements)
    if(!a||!b) return
    const p=intersection(a,b),region=regions.find(r=>r.key===ref.regionKey)
    // Keep the face intersection live even when a later wall join buries the
    // original corner. The dimension stays attached to the same wall faces
    // and updates with their new geometry instead of becoming CHECK.
    return p&&region?p:undefined
  }
  return dimensions.map(d=>{
    if(d.overall) {
      if(!d.overall.wallIds.every(id=>elements.some(e=>e.id===id))) return {...d,needsReview:true}
      const overall=wallOverallDimension(elements,d.overall.wallIds,d.overall.direction)
      return overall?{...d,...overall,offset:d.offset,needsReview:false}:{...d,needsReview:true}
    }
    const a=resolve(d.anchor1),b=resolve(d.anchor2)
    return {...d,...(a?{x1:a.x,y1:a.y}:{}),...(b?{x2:b.x,y2:b.y}:{}),needsReview:!!((d.anchor1&&!a)||(d.anchor2&&!b))}
  })
}
/** Auto dimensions follow the selected walls. Connections do not expand the selection. */
export function wallOverallDimension(elements:PlacedElement[],ids:string[],direction:'up'|'down'|'left'|'right'):Omit<DimensionLine,'id'>|undefined {
  const selected=elements.filter(e=>ids.includes(e.id)&&JOINED_WALLS.has(e.bloxId))
  if(!selected.length || selected.length!==ids.length) return
  const regions=buildWallRegions(selected).filter(r=>!r.key.endsWith(':stem'))
  const points=regions.flatMap(r=>regionVertices(r).map(p=>({...p,anchor:anchorAt(p,r,selected)})))
  if(points.length<2) return
  const horizontal=direction==='up'||direction==='down'
  const axis=horizontal?'x':'y',cross=horizontal?'y':'x',sign=direction==='up'||direction==='left'?1:-1
  const min=Math.min(...points.map(p=>p[axis])),max=Math.max(...points.map(p=>p[axis]))
  const pick=(value:number)=>points.filter(p=>Math.abs(p[axis]-value)<EPS).sort((a,b)=>sign*(a[cross]-b[cross]))[0]
  const a=pick(min),b=pick(max)
  if(max-min<EPS) return
  return {x1:a.x,y1:a.y,x2:b.x,y2:b.y,offset:sign*1.5,measurement:horizontal?'horizontal':'vertical',anchor1:a.anchor,anchor2:b.anchor,overall:{wallIds:ids,direction}}
}
