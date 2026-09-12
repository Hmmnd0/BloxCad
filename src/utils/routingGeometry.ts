import type {FixtureShape} from './fixtureGeometry'
export const REFINED_ROUTING=new Set(['elec-conduit','elec-circuit-wire','elec-homerun'])
/** Electrical path graphics. Coordinates are local; metadata remains on the element. */
export function routingGeometry(id:string,w:number,h:number,properties:Record<string,unknown>={}):FixtureShape[] {
  if(!REFINED_ROUTING.has(id)||![w,h].every(v=>Number.isFinite(v)&&v>0))return []
  const c='#80621f',s:FixtureShape[]=[],line=(p:number[],weight=.8,dash?:number[])=>s.push({kind:'line',points:p,stroke:c,weight,dash})
  const label=(value:string,y:number)=>{if(value)s.push({kind:'text',x:w*.2,y:y-8,width:w*.6,height:16,text:value,fontSize:Math.max(12,Math.min(18,h*2.2)),fill:c})}
  if(id==='elec-conduit') {
    if(w>=h) {
      line([0,h*.3,w,h*.3]);line([0,h*.7,w,h*.7]);
      if(typeof properties.conduitLabel==='string')label(properties.conduitLabel,h*.5)
    } else {
      line([w*.3,0,w*.3,h]);line([w*.7,0,w*.7,h]);
    }
  } else if(id==='elec-circuit-wire') {
    const pts:number[]=[]
    // Sample the original quadratic curve, preserving endpoints and control point.
    for(let i=0;i<=24;i++){const t=i/24;pts.push(w*t,h*(.85*(1-t)*(1-t)+.05*2*t*(1-t)+.85*t*t))}
    line(pts,.8,[6,4])
  } else {
    const cy=h*.6,bx=w*.4,ah=Math.min(h*.35,7)
    line([0,cy,bx,cy],1.1);line([bx-3,cy+5,bx+3,cy-5]);line([bx+3,cy,w-ah,cy],1.1)
    s.push({kind:'line',points:[w-ah*2,cy-ah*.65,w,cy,w-ah*2,cy+ah*.65],stroke:c,weight:.4,fill:c})
    if(typeof properties.circuitLabel==='string')label(properties.circuitLabel,cy-ah*.65-3)
  }
  return s
}
