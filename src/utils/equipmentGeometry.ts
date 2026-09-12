import type { FixtureShape } from './fixtureGeometry'
export const REFINED_EQUIPMENT=new Set(['mech-furnace','mech-condenser','mech-register-supply','mech-register-return','mech-thermostat','mech-exhaust-fan-bath','mech-range-hood','mech-duct-supply','mech-duct-return','mech-minisplit','mech-erv','mech-dryer-vent-cap','plumb-water-heater','plumb-cleanout','plumb-gas-meter','plumb-hose-bibb','plumb-roof-vent','plumb-floor-drain','plumb-sump-pump','plumb-water-softener','plumb-washer-box','fire-extinguisher','exit-sign','smoke-detector','emergency-light','co-alarm'])
for(const id of ['plumb-shutoff-valve','lv-data-jack','lv-coax-jack','lv-panel','lv-security-keypad','lv-camera'])REFINED_EQUIPMENT.add(id)
/** Preserves existing equipment notation. Louvers and fan spokes are symbolic,
 * not product specifications. Does not infer airflow, pipe sizes or capacity. */
export function equipmentGeometry(id:string,w:number,h:number):FixtureShape[] {
  if(!REFINED_EQUIPMENT.has(id)||![w,h].every(v=>Number.isFinite(v)&&v>0))return []
  const s:FixtureShape[]=[],u=Math.min(w,h),cx=w/2,cy=h/2,c=id.startsWith('lv-')?'#725c91':id.startsWith('mech-')||id==='exit-sign'?'#426c5d':id.startsWith('plumb-')?'#486b91':id==='fire-extinguisher'?'#a34545':id==='smoke-detector'?'#344050':'#80621f'
  const rect=(dash?:number[])=>s.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill:'#fafbfd',stroke:c,weight:1.05,dash})
  const circle=(r=u/2,fill='#fafbfd',x=cx,y=cy)=>s.push({kind:'ellipse',x,y,rx:r,ry:r,fill,stroke:c,weight:.8})
  const line=(points:number[])=>s.push({kind:'line',points,stroke:c,weight:.65})
  const polygon=(points:number[])=>s.push({kind:'line',points,stroke:c,weight:1.05,fill:'#fafbfd'})
  const label=(text:string,outside=false)=>{
    const fs=Math.max(12,Math.min(u*.28,18)),tw=text.length*fs+2,th=fs*1.25
    const fits=!outside&&tw<=w*.85&&th<=h*.8
    s.push({kind:'text',x:cx-tw/2,y:fits?cy-th/2:h+3,width:tw,height:th,text,fontSize:fs,fill:c})
  }
  if(id==='plumb-shutoff-valve') {polygon([0,0,cx,cy,0,h,0,0]);polygon([w,0,cx,cy,w,h,w,0])}
  else if(id==='lv-data-jack'||id==='lv-coax-jack') {polygon([w*.1,h*.15,w*.9,h*.15,cx,h*.85,w*.1,h*.15]);label(id==='lv-data-jack'?'D':'C',true)}
  else if(id==='lv-panel') {rect();label('LV')}
  else if(id==='lv-security-keypad') {rect();line([w*.2,h*.35,w*.8,h*.35]);line([w*.2,h*.6,w*.8,h*.6]);label('KP',true)}
  else if(id==='lv-camera') {circle();circle(u*.225,c);label('CAM',true)}
  else if(id==='exit-sign') {rect();label('EXIT')}
  else if(id==='fire-extinguisher'||id==='co-alarm') {circle();label(id==='co-alarm'?'CO':'FE')}
  else if(id==='smoke-detector') {circle();circle(u*.225,c);label('SD',true)}
  else if(id==='emergency-light') {rect();line([w*.65,h*.15,w*.35,h*.5,w*.55,h*.5,w*.35,h*.85,w*.65,h*.5,w*.45,h*.5,w*.65,h*.15])}
  else if(['mech-furnace','mech-erv','mech-range-hood','plumb-gas-meter','plumb-water-softener'].includes(id)) {
    rect(id==='mech-range-hood'?[5,3]:undefined)
    label(({'mech-furnace':'FURNACE','mech-erv':'ERV','mech-range-hood':'HOOD','plumb-gas-meter':'GAS','plumb-water-softener':'WS'} as Record<string,string>)[id])
  } else if(id==='mech-condenser'||id==='mech-exhaust-fan-bath') {
    rect();const r=u*(id==='mech-condenser'?.35:.3);circle(r)
    const count=id==='mech-condenser'?6:4
    for(let i=0;i<count;i++){const a=i*Math.PI*2/count;line([cx,cy,cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
  } else if(id==='mech-register-supply'||id==='mech-duct-return') {
    rect(id==='mech-duct-return'?[6,3]:undefined)
    line([0,0,w,h]);line([w,0,0,h])
  } else if(id==='mech-register-return'||id==='mech-minisplit') {
    rect();const count=id==='mech-minisplit'?3:4
    for(let i=1;i<=count;i++) {
      const t=i/(count+1)
      if(id==='mech-minisplit')line([w*.1,h*t,w*.9,h*t])
      else if(w>=h)line([w*t,h*.15,w*t,h*.85])
      else line([w*.15,h*t,w*.85,h*t])
    }
  } else if(id==='mech-duct-supply') {
    rect()
    if(w>=h){line([w*.1,cy,w*.85,cy]);line([w*.7,cy-h*.15,w*.85,cy,w*.7,cy+h*.15])}
    else {line([cx,h*.1,cx,h*.85]);line([cx-w*.15,h*.7,cx,h*.85,cx+w*.15,h*.7])}
  } else if(id==='mech-thermostat'||id==='plumb-water-heater'||id==='plumb-sump-pump') {
    circle();label(id==='mech-thermostat'?'T':id==='plumb-water-heater'?'WH':'SP')
  } else if(id==='mech-dryer-vent-cap') {circle();line([cx-u*.3,cy,cx+u*.3,cy])}
  else if(id==='plumb-cleanout'||id==='plumb-roof-vent') {circle();circle(u*.2,c);label(id==='plumb-cleanout'?'CO':'VTR',true)}
  else if(id==='plumb-hose-bibb') {circle();line([cx,cy-u/2,cx,cy+u/2]);label('HB',true)}
  else if(id==='plumb-floor-drain') {circle();line([cx-u*.25,cy,cx+u*.25,cy]);line([cx,cy-u*.25,cx,cy+u*.25]);label('FD',true)}
  else if(id==='plumb-washer-box') {rect();circle(u*.1,'none',w*.3,h*.3);circle(u*.1,'none',w*.7,h*.3);circle(u*.12,'none',cx,h*.7)}
  return s
}
