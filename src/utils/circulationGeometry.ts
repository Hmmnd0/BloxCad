import type { PlacedElement } from '../types'
import { stairRisers } from './stairReview'

/** One source for plan symbols, thumbnails, export and direction reporting.
 * Coordinates are local; the caller applies element rotation and flipH/flipV.
 * Symbol counts never depend on pixels per foot or viewport zoom. */
export const REFINED_OPENINGS = new Set(['cased-opening', 'door-single', 'door-double', 'door-sliding', 'door-pocket', 'door-bifold', 'door-garage', 'window-single', 'window-double', 'window-multi'])
export const REFINED_STAIRS = new Set(['stairs-straight', 'stairs-hatch', 'stairs-landing', 'stairs-elevation', 'handrail', 'fixture-elevator', 'fixture-ramp'])
export const REFINED_CIRCULATION = new Set([...REFINED_OPENINGS, ...REFINED_STAIRS])
type Point = { x: number; y: number }
export type CirculationShape =
  | { kind: 'path'; d: string; stroke: string; fill: string; weight: number; dash?: number[] }
  | { kind: 'text'; x: number; y: number; text: string; fontSize: number }
export interface CirculationGeometry {
  shapes: CirculationShape[]
  bounds: { x: number; y: number; width: number; height: number }
  cue?: { label: 'UP' | 'DN'; start: Point; end: Point }
}
export function boundedCount(value: unknown, fallback: number, max = 64, min = 2): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value))) : fallback
}

export function circulationGeometry(id: string, w: number, h: number, props: Record<string, unknown> = {}): CirculationGeometry {
  const shapes: CirculationShape[] = []
  const model: CirculationGeometry = { shapes, bounds: { x: 0, y: 0, width: w, height: h } }
  if (!REFINED_CIRCULATION.has(id) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { shapes, bounds: { x: 0, y: 0, width: 0, height: 0 } }
  }
  const ink = '#344050', detail = '#8995a5'
  const opening = REFINED_OPENINGS.has(id), vertical = h > w
  const span = Math.max(w, h), depth = Math.min(w, h)
  // Opening geometry is authored along X then transposed for a vertical wall.
  // Preserve legacy `flipped` semantics; flipH/flipV belong to the outer group.
  const map = (x: number, y: number): Point => {
    let p = opening && vertical ? { x: y, y: x } : { x, y }
    if (props.flipped === true) {
      if (id === 'door-single' || (id === 'door-double' && vertical)) p = { x: w - p.x, y: p.y }
      else if (id === 'door-double') p = { x: p.x, y: h - p.y }
    }
    return p
  }
  let minX = 0, minY = 0, maxX = w, maxY = h
  const track = (p: Point) => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y) }
  const path = (points: number[], stroke = ink, weight = 1.1, fill = 'none', closed = false, dash?: number[]) => {
    const ps = Array.from({ length: points.length / 2 }, (_, i) => map(points[i * 2], points[i * 2 + 1]))
    ps.forEach(track)
    shapes.push({ kind: 'path', d: ps.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ') + (closed ? ' Z' : ''), stroke, weight, fill, dash })
  }
  const rect = (x: number, y: number, rw: number, rh: number, fill = 'white', stroke = ink, weight = 1.1, dash?: number[]) => path([x,y,x+rw,y,x+rw,y+rh,x,y+rh],stroke,weight,fill,true,dash)
  const text = (x: number, y: number, label: string, size: number) => {
    const p = map(x,y); shapes.push({ kind: 'text', ...p, text: label, fontSize: size })
  }
  const arc = (cx: number, r: number, right: boolean) => {
    const a = map(cx + (right ? -r : r), 0), b = map(cx,r)
    track(a); track(b)
    const mirrored = (opening && vertical) !== (props.flipped === true && (id === 'door-single' || id === 'door-double'))
    const sweep = (right ? 0 : 1) ^ Number(mirrored)
    shapes.push({kind:'path',d:`M${a.x},${a.y} A${r},${r} 0 0 ${sweep} ${b.x},${b.y}`,stroke:detail,fill:'none',weight:.65})
  }
  const arrow = (start: Point, end: Point, label: 'UP' | 'DN') => {
    const dx = end.x-start.x, dy = end.y-start.y, len = Math.hypot(dx,dy)
    const ux=dx/len, uy=dy/len, head=Math.min(w,h)*.14
    // White casing separates the direction cue from tread lines, without color dependence.
    path([start.x,start.y,end.x,end.y], 'white', 3.2)
    path([start.x,start.y,end.x,end.y], ink, 1.1)
    path([end.x-ux*head-uy*head*.6,end.y-uy*head+ux*head*.6,end.x,end.y,end.x-ux*head+uy*head*.6,end.y-uy*head-ux*head*.6])
    text(start.x-ux*head,start.y-uy*head,label,Math.min(w,h)*.16)
    model.cue = { label, start, end }
  }

  if (opening) {
    if (id === 'door-single' || id === 'door-double') {
      const r = id === 'door-single' ? span : span/2
      const jamb = Math.min(depth, span*.12)
      path([0,0,0,r], ink, 1.35)
      arc(0,r,false)
      path([0,0,jamb,0], ink, 1.35)
      path([span-jamb,0,span,0], ink, 1.35)
      if (id === 'door-double') { path([span,0,span,r],ink,1.35); arc(span,r,true) }
    } else if (id.startsWith('window-')) {
      rect(0,0,span,depth,'#f5f8fa')
      path([0,depth*.25,span,depth*.25],detail,.55)
      path([0,depth*.75,span,depth*.75],detail,.55)
      path([0,depth*.5,span,depth*.5],ink,.7)
      const count = id === 'window-single' ? 1 : id === 'window-double' ? 2 : boundedCount(props.paneCount, 2, 12, 1)
      const mullion = Math.min(depth*.24,span/count*.16)
      for(let i=1;i<count;i++) rect(span*i/count-mullion/2,0,mullion,depth,'#e4e9ef',ink,.65)
    } else {
      // No masking outside the actual wall opening: pocket/overhead lines are symbolic only.
      rect(0,0,span,depth,'white','none',0)
      const jambDepth=id==='door-bifold'?Math.min(depth,span*.12):depth
      path([0,jambDepth,0,0],ink,1.35); path([span,0,span,jambDepth],ink,1.35)
      if(id==='cased-opening') {
        const tick=Math.min(depth*.35,span*.08)
        for(const y of [0,depth]) {path([0,y,tick,y]);path([span-tick,y,span,y])}
      } else if(id==='door-sliding') {
        rect(0,depth*.15,span*.54,depth*.23,'#f0f4f8',ink,.8)
        rect(span*.46,depth*.62,span*.54,depth*.23,'#f0f4f8',ink,.8)
        path([span*.12,depth*.5,span*.4,depth*.5],detail,.65)
        path([span*.35,depth*.42,span*.4,depth*.5,span*.35,depth*.58],ink,.7)
      } else if(id==='door-pocket') {
        // Retracted leaf occupies the wall cavity, not half of the clear opening.
        rect(-span,depth*.38,span,depth*.24,'none',detail,.65,[3,2])
        path([0,depth*.5,span,depth*.5],detail,.6,'none',false,[3,2])
        path([span*.68,depth*.5,span*.2,depth*.5],ink,.8)
        path([span*.27,depth*.26,span*.2,depth*.5,span*.27,depth*.74],ink,.8)
      } else if(id==='door-bifold') {
        // Two equal rigid panels, folded to 45 degrees about the jamb.
        const half=span/2, fold=half/Math.SQRT2
        path([0,0,fold,fold,fold*2,0],ink,1.35)
        path([0,0,span,0],detail,.55,'none',false,[3,2])
      } else if(id==='door-garage') {
        rect(0,depth*.3,span,depth*.4,'#f0f4f8',ink,.8)
        const overhead=span*.75
        rect(0,depth,span,overhead,'none',detail,.65,[4,3])
        for(const t of [.25,.5,.75]) path([0,depth+overhead*t,span,depth+overhead*t],detail,.5,'none',false,[4,3])
      }
    }
  } else if (id === 'stairs-straight' || id === 'stairs-hatch' || id === 'fixture-ramp') {
    rect(0,0,w,h,id==='stairs-hatch'?'#f0f3f6':'white')
    const landscape=w>h
    if(id!=='fixture-ramp') {
      const physical=id==='stairs-straight'?stairRisers(props):null
      const count=physical!==null?physical-1:boundedCount(props.stepCount,Math.max(6,Math.min(32,Math.round(span/(depth*.3)))))
      for(let i=1;i<count;i++) {
        const pos=span*i/count
        path(landscape?[pos,0,pos,h]:[0,pos,w,pos],detail,.6)
      }
      if(id==='stairs-hatch') {
        const inset=depth*.05
        rect(inset,inset,w-inset*2,h-inset*2,'none',detail,.55,[3,2])
      }
    } else {
      // A ramp has no treads; show only its perimeter and rise direction.
      const inset=depth*.07
      if(landscape){path([0,inset,w,inset],detail,.6);path([0,h-inset,w,h-inset],detail,.6)}
      else{path([inset,0,inset,h],detail,.6);path([w-inset,0,w-inset,h],detail,.6)}
    }
    const straight=id==='stairs-straight'
    const start=landscape?{x:w*.24,y:h*.5}:{x:w*.5,y:h*(straight?.76:.24)}
    const end=landscape?{x:w*.8,y:h*.5}:{x:w*.5,y:h*(straight?.2:.8)}
    arrow(start,end,id==='stairs-hatch'?'DN':'UP')
  } else if(id==='stairs-landing') {
    rect(0,0,w,h)
    text(w*.5,h*.5,'LDG',Math.min(w,h)*.14)
  } else if(id==='stairs-elevation') {
    const count=boundedCount(props.stepCount,11,30), points=[0,h]
    for(let i=0;i<count;i++) points.push(i*w/count,h-(i+1)*h/count,(i+1)*w/count,h-(i+1)*h/count)
    path(points,ink,1.25)
    // Schematic stringer underside, not a solid triangular block.
    path([0,h,w,h*.12],detail,.65)
    text(w*.12,h*.16,'UP',Math.min(w,h)*.13)
  } else if(id==='handrail') {
    const landscape=w>=h, count=boundedCount(props.postCount,3,32)
    path(landscape?[0,h/2,w,h/2]:[w/2,0,w/2,h],ink,1.25)
    for(let i=0;i<count;i++) {
      const t=(i+.5)/count
      path(landscape?[w*t,0,w*t,h]:[0,h*t,w,h*t],detail,.9)
    }
  } else if(id==='fixture-elevator') {
    const portrait=h>=w
    // Open perimeter at the entrance, with two center-opening door leaves.
    if(portrait) {
      path([w*.25,h,0,h,0,0,w,0,w,h,w*.75,h])
      path([w*.25,h*.94,w*.5,h*.94,w*.5,h,w*.75,h],ink,.85)
    } else {
      path([w,h*.25,w,0,0,0,0,h,w,h,w,h*.75])
      path([w*.94,h*.25,w*.94,h*.5,w,h*.5,w,h*.75],ink,.85)
    }
    rect(w*.08,h*.08,w*.84,h*.78,'none',detail,.6)
    text(w*.5,h*.45,'ELEV',Math.min(w,h)*.12)
  }
  model.bounds={x:minX,y:minY,width:maxX-minX,height:maxY-minY}
  return model
}

/** Screen/document axes, not geographic bearings: +X right, +Y down. */
export function circulationDirection(el: Pick<PlacedElement,'bloxId'|'width'|'height'|'rotation'|'properties'>) {
  const cue=circulationGeometry(el.bloxId,el.width,el.height,el.properties).cue
  if(!cue) return undefined
  let x=(cue.end.x-cue.start.x)*(el.properties.flipH?-1:1)
  let y=(cue.end.y-cue.start.y)*(el.properties.flipV?-1:1)
  const len=Math.hypot(x,y), radians=el.rotation*Math.PI/180
  const dx=(x*Math.cos(radians)-y*Math.sin(radians))/len
  const dy=(x*Math.sin(radians)+y*Math.cos(radians))/len
  const angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360
  const direction=['right','down-right','down','down-left','left','up-left','up','up-right'][Math.round(angle/45)%8]
  return {label:cue.label,direction,vector:{x:Math.abs(dx)<1e-10?0:dx,y:Math.abs(dy)<1e-10?0:dy},coordinateSystem:'document: +x right, +y down'}
}

export function circulationSVG(model: CirculationGeometry, w: number, h: number, props: Record<string,unknown> = {}): string {
  const flip=`translate(${props.flipH?w:0},${props.flipV?h:0}) scale(${props.flipH?-1:1},${props.flipV?-1:1})`
  return `<g transform="${flip}">`+model.shapes.map(s=>s.kind==='path'
    ? `<path d="${s.d}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.weight}" stroke-linejoin="round"${s.dash?` stroke-dasharray="${s.dash.join(',')}"`:''}/>`
    : `<g transform="translate(${s.x},${s.y}) scale(${props.flipH?-1:1},${props.flipV?-1:1})"><text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${s.fontSize}" fill="#344050">${s.text}</text></g>`).join('')+'</g>'
}
