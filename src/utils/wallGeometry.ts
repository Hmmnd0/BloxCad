/** Plan-view material graphics. These are symbolic patterns, not assembly
 * specifications or a masonry/glazing layout. No pixel-dependent counts. */
export const REFINED_WALLS=new Set(['wall-exterior','wall-interior','wall-cmu','wall-cmu-footing','wall-glazing','wall-fire-1hr','wall-fire-2hr'])
export type WallShape =
  | {kind:'rect';x:number;y:number;width:number;height:number;fill:string;stroke?:string;weight:number;dash?:number[]}
  | {kind:'line';points:number[];stroke:string;weight:number;dash?:number[]}
  | {kind:'text';x:number;y:number;width:number;height:number;text:string;size:number;rotation:number}
export function wallGeometry(id:string,width:number,height:number,outline=false):WallShape[] {
  if(!REFINED_WALLS.has(id)||![width,height].every(v=>Number.isFinite(v)&&v>0))return []
  const vertical=height>width,w=Math.max(width,height),h=Math.min(width,height),shapes:WallShape[]=[]
  const point=(x:number,y:number)=>vertical?[y,x]:[x,y]
  const rect=(x:number,y:number,rw:number,rh:number,fill:string,stroke?:string,weight=.65,dash?:number[])=>shapes.push({kind:'rect',x:vertical?y:x,y:vertical?x:y,width:vertical?rh:rw,height:vertical?rw:rh,fill,stroke,weight,dash})
  const line=(points:number[],stroke='#9ba5b0',weight=.55,dash?:number[])=>shapes.push({kind:'line',points:points.flatMap((_,i)=>i%2?[]:point(points[i],points[i+1])),stroke,weight,dash})
  const fills:Record<string,string>={'wall-exterior':'#3C3C3C','wall-interior':'#5A5A5A','wall-cmu':'#888888','wall-cmu-footing':'#E4E4E4','wall-glazing':'#BEEBFF','wall-fire-1hr':'#E08A8A','wall-fire-2hr':'#C85050'}
  rect(0,0,w,h,fills[id])
  if(id==='wall-exterior') {
    const count=Math.min(160,Math.max(1,Math.ceil(w/h)))
    for(let i=0;i<count;i++){const x=i*w/count;line([x,0,Math.min(w,x+h),Math.min(h,w-x)],'#a7afb7',.45)}
  }
  if(id==='wall-cmu') {
    // Hollow cells read as a plan cut; staggered brick courses belong in elevation.
    const count=Math.min(64,Math.max(1,Math.round(w/(h*2))))
    const bay=w/count,pad=Math.min(h*.18,bay*.08)
    for(let i=0;i<count;i++) {
      if(i)line([i*bay,0,i*bay,h],'#4e5863',.55)
      for(let cell=0;cell<2;cell++)rect(i*bay+pad+cell*bay/2,h*.22,bay/2-2*pad,h*.56,'#edf0f3','#5a6572',.55)
    }
  }
  if(id==='wall-cmu-footing') {
    // Same all-sided 30% inset as wallUnion; never add outlines per saved run.
    const inset=h*.3
    rect(inset,inset,Math.max(0,w-2*inset),h*.4,'#888888','#344050',.8)
    rect(0,0,w,h,'none','#929ca7',.65,[4,3])
  }
  if(id==='wall-glazing') {
    line([0,h*.28,w,h*.28],'#526b7a',.6);line([0,h*.72,w,h*.72],'#526b7a',.6)
    const count=Math.min(32,Math.max(1,Math.round(w/(h*8))))
    for(let i=1;i<count;i++)rect(i*w/count-h*.06,0,h*.12,h,'#6c7e8d')
  }
  if(id.startsWith('wall-fire-')) {
    const double=id==='wall-fire-2hr'
    for(const y of double?[h*.3,h*.7]:[h*.5])line([0,y,w,y],'#632f35',.65,[h*.6,h*.35])
    const count=Math.min(8,Math.max(1,Math.floor(w/(h*14))))
    const boxW=Math.min(h*2.8,w*.8),size=Math.min(h*.52,boxW/3)
    for(let i=0;i<count;i++) {
      const cx=w*(i+.5)/count
      rect(cx-boxW/2,h*.12,boxW,h*.76,fills[id])
      const [x,y]=point(cx,h/2)
      shapes.push({kind:'text',x,y,width:boxW,height:h*.8,text:double?'2HR':'1HR',size,rotation:vertical?90:0})
    }
  }
  if(outline&&id!=='wall-cmu-footing')rect(0,0,w,h,'none','#344050',.9)
  return shapes
}
export function wallGeometrySVG(id:string,w:number,h:number,outline=false):string {
  return wallGeometry(id,w,h,outline).map(s=>s.kind==='rect'
    ?`<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.fill}"${s.stroke?` stroke="${s.stroke}" stroke-width="${s.weight}"`:''}${s.dash?` stroke-dasharray="${s.dash.join(',')}"`:''}/>`
    :s.kind==='line'?`<polyline points="${s.points.join(' ')}" fill="none" stroke="${s.stroke}" stroke-width="${s.weight}"${s.dash?` stroke-dasharray="${s.dash.join(',')}"`:''}/>`
    :`<text x="${s.x}" y="${s.y}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${s.size}" font-weight="bold" fill="#542930" transform="rotate(${s.rotation} ${s.x} ${s.y})">${s.text}</text>`).join('')
}
