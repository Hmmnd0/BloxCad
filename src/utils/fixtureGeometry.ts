import type { CaseworkShape } from './caseworkGeometry'
export type FixtureShape = Exclude<CaseworkShape,{kind:'line'}> | {kind:'line';points:number[];stroke:string;weight:number;fill?:string;dash?:number[]} | {kind:'ellipse';x:number;y:number;rx:number;ry:number;fill:string;stroke:string;weight:number} | {kind:'text';x:number;y:number;width:number;height:number;text:string;fontSize:number;fill:string}
export const REFINED_FIXTURES=new Set(['fixture-toilet','fixture-sink-lav','fixture-bathtub','fixture-shower','fixture-sink-kitchen','fixture-refrigerator','fixture-range','fixture-dishwasher','fixture-vanity','fixture-washer','fixture-dryer','fixture-utility-sink'])
/** Proportional plan-view details shared by canvas and library thumbnails. */
export function fixtureGeometry(id:string,width:number,height:number):FixtureShape[] {
  if(!REFINED_FIXTURES.has(id)||![width,height].every(Number.isFinite)||width<=0||height<=0) return []
  const portrait = ['fixture-toilet','fixture-sink-lav','fixture-bathtub'].includes(id)
  const landscape = ['fixture-sink-kitchen','fixture-vanity'].includes(id)
  const transpose=portrait ? width>height : landscape && height>width
  const w=transpose?height:width,h=transpose?width:height,u=Math.min(w,h)
  const shapes:FixtureShape[]=[]
  const rect=(x:number,y:number,width:number,height:number,radius:number,detail=false)=>shapes.push({kind:'rect',x,y,width,height,radius,fill:detail?'#f1f4f7':'#fafbfd',stroke:detail?'#9aa6b5':'#344050',weight:detail?.65:1.05})
  const ellipse=(x:number,y:number,rx:number,ry:number,detail=true)=>shapes.push({kind:'ellipse',x,y,rx,ry,fill:detail?'#f1f4f7':'#fafbfd',stroke:detail?'#9aa6b5':'#344050',weight:detail?.65:1.05})
  const line=(points:number[])=>shapes.push({kind:'line',points,stroke:'#9aa6b5',weight:.65})
  const label=(text:string,cy=.55)=>shapes.push({kind:'text',x:w*.15,y:h*cy-u*.065,width:w*.7,height:u*.13,text,fontSize:u*.11,fill:'#647184'})
  if(id==='fixture-toilet') {
    ellipse(w*.5,h*.62,w*.45,h*.38,false)
    ellipse(w*.5,h*.64,w*.31,h*.26)
    rect(w*.05,0,w*.9,h*.29,u*.055)
    line([w*.7,h*.1,w*.82,h*.1])
  } else if(id==='fixture-sink-lav') {
    rect(0,0,w,h,u*.12)
    ellipse(w*.5,h*.58,w*.34,h*.3)
    ellipse(w*.5,h*.64,u*.035,u*.035)
    line([w*.5,h*.1,w*.5,h*.3])
    line([w*.43,h*.12,w*.57,h*.12])
  } else if(id==='fixture-bathtub') {
    rect(0,0,w,h,u*.06)
    rect(w*.09,h*.12,w*.82,h*.8,u*.2,true)
    ellipse(w*.5,h*.23,u*.035,u*.035)
    line([w*.5,h*.04,w*.5,h*.17])
    line([w*.4,h*.065,w*.6,h*.065])
  } else if(id==='fixture-shower') {
    rect(0,0,w,h,u*.025)
    // Drain and fall lines distinguish a shower tray from a cabinet.
    for(const [x,y] of [[w*.08,h*.08],[w*.92,h*.08],[w*.92,h*.92],[w*.08,h*.92]]) line([x,y,w*.5,h*.5])
    ellipse(w*.5,h*.5,u*.055,u*.055)
    line([w*.08,h*.92,w*.92,h*.92])
    line([w*.5,h*.02,w*.5,h*.12])
  } else if(id==='fixture-sink-kitchen') {
    rect(0,0,w,h,u*.045)
    for(const x of [.06,.53]) {
      rect(w*x,h*.22,w*.41,h*.7,u*.09,true)
      ellipse(w*(x+.205),h*.62,u*.033,u*.033)
    }
    line([w*.5,h*.055,w*.5,h*.27])
    line([w*.44,h*.085,w*.56,h*.085])
  } else if(id==='fixture-vanity') {
    rect(0,0,w,h,u*.035)
    line([0,h*.1,w,h*.1])
    ellipse(w*.5,h*.58,Math.min(w*.3,h*.38),h*.28)
    ellipse(w*.5,h*.64,u*.032,u*.032)
    line([w*.5,h*.14,w*.5,h*.32])
    line([w*.44,h*.18,w*.56,h*.18])
  } else if(id==='fixture-utility-sink') {
    rect(0,0,w,h,u*.035)
    rect(w*.08,h*.2,w*.84,h*.72,u*.055,true)
    ellipse(w*.5,h*.58,u*.04,u*.04)
    line([w*.5,h*.045,w*.5,h*.25])
    line([w*.4,h*.075,w*.6,h*.075])
  } else if(id==='fixture-range') {
    rect(0,0,w,h,u*.035)
    line([w*.06,h*.14,w*.94,h*.14])
    for(const [x,y,r] of [[.28,.37,.12],[.72,.37,.1],[.28,.75,.1],[.72,.75,.12]]) ellipse(w*x,h*y,u*r,u*r)
  } else if(id==='fixture-refrigerator') {
    rect(0,0,w,h,u*.035)
    // Keep the appliance identifier; a blank cabinet-shaped rectangle is ambiguous.
    line([0,h*.85,w,h*.85])
    line([w*.24,h*.925,w*.76,h*.925])
    label('REF',.46)
  } else if(id==='fixture-dishwasher') {
    rect(0,0,w,h,u*.035)
    line([w*.06,h*.86,w*.94,h*.86])
    line([w*.34,h*.93,w*.66,h*.93])
    label('DW',.48)
  } else {
    rect(0,0,w,h,u*.035)
    line([w*.06,h*.14,w*.94,h*.14])
    const r=u*.31
    ellipse(w*.5,h*.56,r,r)
    label(id==='fixture-washer'?'W':'D',.56)
  }
  return transpose?shapes.map(s=>s.kind==='rect'||s.kind==='text'?{...s,x:s.y,y:s.x,width:s.height,height:s.width}:s.kind==='ellipse'?{...s,x:s.y,y:s.x,rx:s.ry,ry:s.rx}:{...s,points:s.points.map((_,i,p)=>p[i%2?i-1:i+1])}):shapes
}
