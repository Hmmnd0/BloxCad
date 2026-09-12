import type { FixtureShape } from './fixtureGeometry'

export const REFINED_ELECTRICAL=new Set(['elec-panel','elec-meter','elec-outlet','elec-outlet-gfci','elec-outlet-240v','elec-switch','elec-switch-3way','elec-switch-dimmer','elec-light-ceiling','elec-light-recessed','elec-light-exterior','elec-ceiling-fan','elec-disconnect','elec-doorbell'])
/** Existing device notation, with proportional details shared by every surface.
 * Routing, circuit assignments, voltage selection and protection remain separate. */
export function electricalGeometry(id:string,w:number,h:number):FixtureShape[] {
  if(!REFINED_ELECTRICAL.has(id)||![w,h].every(v=>Number.isFinite(v)&&v>0))return []
  const u=Math.min(w,h),cx=w/2,cy=h/2,r=u/2,c='#80621f',shapes:FixtureShape[]=[]
  const circle=(radius=r,fill='none')=>shapes.push({kind:'ellipse',x:cx,y:cy,rx:radius,ry:radius,fill,stroke:c,weight:1.05})
  const line=(points:number[])=>shapes.push({kind:'line',points,stroke:c,weight:.8})
  const text=(label:string,x=0,y=0,width=w,height=h,size=u*.55,fill=c)=>{
    const fontSize=Math.max(12,size),tw=Math.max(width,label.length*fontSize+2),th=Math.max(height,fontSize*1.25)
    shapes.push({kind:'text',x:x+(width-tw)/2,y:y+(height-th)/2,width:tw,height:th,text:label,fontSize,fill})
  }
  const rect=(fill='none')=>shapes.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill,stroke:c,weight:1.05})
  if(id==='elec-panel') {rect(c);if(h>=15&&w>=25)text('PNL',0,0,w,h,Math.min(w/4,h*.6),'#fff');else text('PNL',0,h+3,w,15,12)}
  else if(id==='elec-disconnect') {rect('#fff');text('DISC',0,h>=15&&w>=33?0:h+3,w,h>=15&&w>=33?h:15,Math.min(w/5,h*.5))}
  else if(id==='elec-meter') {circle(r,'#fff');text('M')}
  else if(id.startsWith('elec-switch')) {
    const suffix=id==='elec-switch-3way'?'3':id==='elec-switch-dimmer'?'D':''
    text(`S${suffix}`,0,0,w,h,u*.65)
  } else if(id.startsWith('elec-outlet')) {
    circle(r,'#fff')
    for(const x of [-.35,.35])line([cx+r*x,cy-r*.4,cx+r*x,cy+r*.4])
    const labelHeight=Math.max(15,u*.325)
    if(id==='elec-outlet-gfci')text('GFCI',cx-u*.65,cy-r-3-labelHeight,u*1.3,labelHeight,u*.26)
    if(id==='elec-outlet-240v')text('240V',cx-u*.65,cy+r+3,u*1.3,labelHeight,u*.26)
  } else if(id==='elec-light-ceiling') {
    circle()
    const d=r/Math.sqrt(2)
    line([cx-d,cy-d,cx+d,cy+d]);line([cx-d,cy+d,cx+d,cy-d])
  } else if(id==='elec-light-recessed') {circle();circle(r*.4,c)}
  else if(id==='elec-light-exterior') {
    circle()
    for(const a of [45,135,225,315]) {
      const dx=Math.cos(a*Math.PI/180),dy=Math.sin(a*Math.PI/180)
      line([cx+dx*r*.5,cy+dy*r*.5,cx+dx*r*1.3,cy+dy*r*1.3])
    }
  } else if(id==='elec-ceiling-fan') {
    circle()
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]])line([cx,cy,cx+dx*r*.9,cy+dy*r*.9])
    circle(r*.15,c)
  } else if(id==='elec-doorbell')circle(r,c)
  return shapes
}
