import type { FurnitureShape } from './furnitureGeometry'

export const REFINED_CASEWORK = new Set(['casework-base', 'casework-upper', 'casework-island', 'casework-pantry', 'casework-bath-storage', 'casework-closet-rod'])
export type CaseworkShape = FurnitureShape & { dash?: number[] }

/** Plan geometry shared by the library and canvas; no pixel-count-based divisions. */
export function caseworkGeometry(id: string, width: number, height: number): CaseworkShape[] {
  if (!REFINED_CASEWORK.has(id) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return []
  const transpose = height > width
  const w = Math.max(width,height), h = Math.min(width,height)
  const overhead = id === 'casework-upper' || id === 'casework-bath-storage'
  const shapes: CaseworkShape[] = [{kind:'rect',x:0,y:0,width:w,height:h,radius:h*.025,fill:overhead ? 'none' : '#f7f9fb',stroke:'#344050',weight:1.05,...(overhead ? {dash:[5,3]} : {})}]
  const line = (points: number[], weight = .65) => shapes.push({kind:'line',points,stroke:'#9aa6b5',weight})
  if (id === 'casework-island') {
    shapes.push({kind:'rect',x:h*.07,y:h*.07,width:w-h*.14,height:h*.86,radius:h*.015,fill:'none',stroke:'#9aa6b5',weight:.65})
  } else if (id === 'casework-closet-rod') {
    line([0,h*.28,w,h*.28])
    line([w*.04,h*.64,w*.96,h*.64],1.2)
    for (const t of [.25,.75]) line([w*t,h*.57,w*t,h*.71])
  } else {
    // Counter edge remains distinct from overhead cabinetry's dashed boundary.
    if (!overhead) line([0,h*.86,w,h*.86])
    const bays = Math.max(1,Math.min(8,Math.round(w/h)))
    for (let i=1;i<bays;i++) line([w*i/bays,h*.08,w*i/bays,h*.8])
    if (id === 'casework-pantry') {
      for (let i=0;i<bays;i++) line([w*(i+.4)/bays,h*.72,w*(i+.6)/bays,h*.72])
    }
  }
  return transpose ? shapes.map(s => s.kind === 'rect' ? {...s,x:s.y,y:s.x,width:s.height,height:s.width} : {...s,points:s.points.map((_,i,p)=>p[i%2 ? i-1 : i+1])}) : shapes
}
