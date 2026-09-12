import type { FixtureShape } from './fixtureGeometry'
import { DEMOLITION_BLOX } from '../blox/demolition'
export const DEMOLITION_IDS=new Set(DEMOLITION_BLOX.map(d=>d.id))
export function demolitionSVG(id:string,w:number,h:number):string {
  return demolitionGeometry(id,w,h).map(s=>{
    const style=`fill="none" stroke="#333333" stroke-width="1"${s.kind==='line'||s.kind==='rect'?s.dash?' stroke-dasharray="5 3"':'':''}`
    return s.kind==='rect'?`<rect x="0" y="0" width="${w}" height="${h}" ${style}/>`:s.kind==='line'?`<polyline points="${s.points.join(' ')}" ${style}/>`:''
  }).join('')
}
/** Removal linework is an annotation overlay, never a hosted opening or wall union. */
export function demolitionGeometry(id:string,w:number,h:number):FixtureShape[] {
  if(!DEMOLITION_IDS.has(id)||![w,h].every(n=>Number.isFinite(n)&&n>0))return []
  const shapes:FixtureShape[]=[],dash=id==='existing-wall-remain'?undefined:[5,3]
  const line=(points:number[])=>shapes.push({kind:'line',points,stroke:'#333333',weight:1,dash})
  if(id==='demo-door') {
    line([0,h,0,0]); const points:number[]=[]
    for(let i=0;i<=24;i++){const a=i*Math.PI/48;points.push(w*Math.sin(a),h-h*Math.cos(a))}
    line(points);line([0,h,w,h])
  } else {
    shapes.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill:'none',stroke:'#333333',weight:1,dash})
    if(id==='demo-window')line(w>=h?[0,h*.5,w,h*.5]:[w*.5,0,w*.5,h])
    if(id==='demo-area'){line([0,0,w,h]);line([0,h,w,0])}
  }
  return shapes
}
