import type { FixtureShape } from './fixtureGeometry'

export const REFINED_STRUCTURAL = new Set(['structural-fireplace','structural-masonry-mass','structural-column-sq','structural-column-round','structural-plumbing-chase','structural-beam','structural-footing','structural-foundation-wall','shape-rect'])

/** Symbolic plan cuts only: no inferred reinforcement, connection or load capacity. */
export function structuralGeometry(id:string,w:number,h:number):FixtureShape[] {
  if (!REFINED_STRUCTURAL.has(id) || ![w,h].every(v=>Number.isFinite(v)&&v>0)) return []
  const shapes:FixtureShape[]=[],u=Math.min(w,h)
  const rect=(x:number,y:number,width:number,height:number,fill='#eef1f4',stroke='#344050',weight=1.05,dash?:number[])=>shapes.push({kind:'rect',x,y,width,height,fill,stroke,weight,radius:0,dash})
  const line=(points:number[],stroke='#9aa6b5',weight=.55)=>shapes.push({kind:'line',points,stroke,weight})
  const hatch=(cross=false)=>{
    // Clip analytically to the footprint; density scales with geometry, not zoom.
    const n=Math.min(80,Math.max(4,Math.ceil((w+h)/u*4)))
    for(let i=1;i<n;i++) {
      const t=(w+h)*i/n,x1=Math.max(0,t-h),y1=t-x1,x2=Math.min(w,t),y2=t-x2
      line([x1,y1,x2,y2])
      if(cross)line([w-x1,y1,w-x2,y2])
    }
  }
  if(id==='shape-rect') {
    rect(0,0,w,h,'#fafbfd','#536170',1.0)
    line([0,0,w,h],'#a5afb9',.55);line([w,0,0,h],'#a5afb9',.55)
  } else if(id==='structural-column-round') {
    // Retain the existing true-circle footprint even in a rectangular selection.
    shapes.push({kind:'ellipse',x:w/2,y:h/2,rx:u/2,ry:u/2,fill:'#404750',stroke:'#263343',weight:1.2})
  } else if(id==='structural-column-sq') {
    rect(0,0,w,h,'#404750','#263343',1.2)
  } else if(id==='structural-foundation-wall') {
    // Actual runs are rendered by the continuous union. Match that fill exactly.
    rect(0,0,w,h,'#9A9A9A')
  } else if(id==='structural-beam') {
    rect(0,0,w,h,'#eef1f4')
    if(w>=h)for(const y of [.2,.8])line([0,h*y,w,h*y],'#647184',.65)
    else for(const x of [.2,.8])line([w*x,0,w*x,h],'#647184',.65)
  } else if(id==='structural-footing') {
    rect(0,0,w,h,'#f1f4f7');hatch()
    // No invented column, reinforcement grid, or pad thickness.
    rect(0,0,w,h,'none','#344050',1.1)
  } else if(id==='structural-plumbing-chase') {
    rect(0,0,w,h,'#fafbfd');hatch(true)
    rect(0,0,w,h,'none','#344050',1.1)
  } else if(id==='structural-masonry-mass') {
    rect(0,0,w,h,'#d8dde3');hatch()
    rect(0,0,w,h,'none','#344050',1.1)
  } else if(id==='structural-fireplace') {
    rect(0,0,w,h,'#d8dde3');hatch()
    // Firebox proportions retained from the existing symbol; no invented clearance.
    rect(w*.225,h*.25,w*.55,h*.5,'#404750','#263343',1.1)
    rect(0,0,w,h,'none','#344050',1.1)
  }
  return shapes
}
