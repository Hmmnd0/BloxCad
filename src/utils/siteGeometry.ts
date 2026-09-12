import type {FixtureShape} from './fixtureGeometry'
export const REFINED_SITE=new Set(['site-tree','site-shrub','site-parking-stall','site-sidewalk','site-driveway','site-deck-patio','site-property-line','site-setback-line','site-easement','site-contour','site-fence','site-retaining-wall','site-water-service','site-sewer-lateral','site-gas-service','site-electrical-service'])
/** Real-world division spacing is explicit, never inferred from preview pixels. */
export function siteGeometry(id:string,w:number,h:number,pixelsPerFoot:number,properties:Record<string,unknown>={}):FixtureShape[] {
  if(!REFINED_SITE.has(id)||![w,h,pixelsPerFoot].every(v=>Number.isFinite(v)&&v>0))return []
  const s:FixtureShape[]=[],cx=w/2,cy=h/2,r=Math.min(w,h)/2,u=Math.min(w,h),c='#526957'
  const line=(points:number[],stroke='#a5afa8',weight=.6,dash?:number[])=>s.push({kind:'line',points,stroke,weight,dash})
  const text=(value:string,x:number,y:number,width:number,height:number,fontSize:number,fill='#526170')=>{
    const fittedWidth=Math.max(width,value.length*fontSize*.75+4),fittedHeight=Math.max(height,fontSize*1.3)
    s.push({kind:'text',x:x+(width-fittedWidth)/2,y:y+(height-fittedHeight)/2,width:fittedWidth,height:fittedHeight,text:value,fontSize,fill})
  }
  const font=(fallback=12)=>typeof properties.fontSize==='number'&&Number.isFinite(properties.fontSize)?Math.max(6,Math.min(48,properties.fontSize)):fallback
  if(id==='site-tree') {
    const canopy:number[]=[]
    for(let i=0;i<=96;i++){const a=i*Math.PI/48,rr=r*(.91+.055*Math.sin(a*9)+.03*Math.cos(a*5));canopy.push(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}
    s.push({kind:'line',points:canopy,fill:'#EEF3EE',stroke:c,weight:1.05})
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5+.2,x=cx+Math.cos(a)*r*.55,y=cy+Math.sin(a)*r*.55
      line([cx,cy,x,y],'#92A294',.6)
      line([cx+Math.cos(a)*r*.33,cy+Math.sin(a)*r*.33,cx+Math.cos(a+.4)*r*.62,cy+Math.sin(a+.4)*r*.62],'#A6B3A8',.5)
    }
    s.push({kind:'ellipse',x:cx,y:cy,rx:r*.06,ry:r*.06,fill:c,stroke:c,weight:.5})
  } else if(id==='site-shrub') {
    // Sample the original ten-lobed quadratic outline for portable vector output.
    const points:number[]=[]
    for(let i=0;i<10;i++) {
      const a=i*Math.PI/5,b=(i+1)*Math.PI/5,m=(a+b)/2
      for(let j=0;j<8;j++) {
        const t=j/8,v=1-t
        points.push(cx+r*(v*v*.85*Math.cos(a)+2*v*t*Math.cos(m)+t*t*.85*Math.cos(b)),cy+r*(v*v*.85*Math.sin(a)+2*v*t*Math.sin(m)+t*t*.85*Math.sin(b)))
      }
    }
    points.push(points[0],points[1]);s.push({kind:'line',points,fill:'#F0F4EB',stroke:c,weight:1.05})
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;s.push({kind:'ellipse',x:cx+Math.cos(a)*r*.42,y:cy+Math.sin(a)*r*.42,rx:r*.14,ry:r*.11,fill:'none',stroke:'#A0AF98',weight:.45})}
  } else if(id==='site-property-line') {
    const fs=font()
    line([0,cy,w,cy],'#344050',1.2,[18,4,2,4]);text('PL',w/2-20,cy-fs*1.5,40,fs*1.3,fs)
    // End ticks identify the segment extent without implying surveyed monuments.
    for(const x of [0,w])line([x,cy-3,x,cy+3],'#344050',.8)
    const bearing=typeof properties.bearing==='string'?properties.bearing.trim():''
    text(`${bearing?bearing+'  ':''}${(w/pixelsPerFoot).toFixed(2)}'`,0,cy+4,w,fs*1.3,fs)
    const role=typeof properties.lineType==='string'?properties.lineType.toUpperCase():''
    if(role)text(role,4,cy-fs*3,Math.max(80,role.length*fs*.75+4),fs*1.3,fs,'#7b8794')
  } else if(id==='site-setback-line') {
    const setback=typeof properties.setbackFt==='number'?properties.setbackFt:10,label=`${setback}' SETBACK`,fs=font(),tw=Math.max(50,label.length*fs*.75+8),g=w/2-tw/2
    line([0,cy,Math.max(0,g),cy],'#3a6ea5',.7,[4,4]);line([Math.min(w,g+tw),cy,w,cy],'#3a6ea5',.7,[4,4]);text(label,g,cy-fs*.65,tw,fs*1.3,fs,'#3a6ea5')
  } else if(id==='site-easement') {
    const kind=typeof properties.easementType==='string'?properties.easementType.toUpperCase():'UTILITY',label=`${(h/pixelsPerFoot).toFixed(0)}' ${kind} ESMT`,fs=font()
    s.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill:'#F3F6F8',stroke:'#70879B',weight:.8,dash:[6,4]})
    for(let x=-h;x<w;x+=pixelsPerFoot)line([Math.max(0,x),h-Math.max(0,-x),Math.min(w,x+h),Math.max(0,x+h-w)],'#B4C1CC',.4)
    const labelWidth=Math.min(w,label.length*fs*.75+12)
    s.push({kind:'rect',x:cx-labelWidth/2,y:cy-fs*.8,width:labelWidth,height:fs*1.6,radius:0,fill:'#F3F6F8',stroke:'none',weight:0})
    text(label,0,cy-fs*.7,w,fs*1.4,fs,'#3a6ea5')
  } else if(id==='site-contour') {
    const elev=typeof properties.elevLabel==='string'?properties.elevLabel:'100',fs=font(),tw=Math.max(22,elev.length*fs*.75+8),gap0=Math.max(0,cx-tw/2),gap1=Math.min(w,cx+tw/2)
    for(const [start,end] of [[0,gap0],[gap1,w]]) {
      const pts:number[]=[]
      for(let i=0;i<=24;i++){const x=start+(end-start)*i/24;pts.push(x,cy+Math.sin(x/w*Math.PI*4)*h*.3)}
      line(pts,'#657a68',.8)
    }
    text(elev,cx-tw/2,cy-fs*.65,tw,fs*1.3,fs,'#526957')
  } else if(id==='site-fence') {
    line([0,cy,w,cy],'#66766A',1.05);const spacing=pixelsPerFoot*8
    for(let x=0;x<w;x+=spacing){line([x,cy-h*.4,Math.min(w,x+h*.5),cy+h*.4],'#66766A',.85);line([x,cy+h*.4,Math.min(w,x+h*.5),cy-h*.4],'#66766A',.85)}
    line([w,cy-h*.4,w,cy+h*.4],'#66766A',1.05)
  } else if(id==='site-retaining-wall') {
    s.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill:'#DEDAD1',stroke:'#697268',weight:1.05});
    for(let x=-h;x<w;x+=Math.max(4,h/2))line([Math.max(0,x),Math.max(0,-x),Math.min(w,x+h),h-Math.max(0,x+h-w)],'#685f55',.45)
    line([0,h*.18,w,h*.18],'#747B72',.6)
    // Keep the material hatch intact and put identification outside the wall.
    text('RET WALL',0,-font()*1.6,w,font()*1.3,font(),'#425044')
  } else if(id==='site-water-service'||id==='site-sewer-lateral'||id==='site-gas-service') {
    const data=id==='site-water-service'?['#2a5fa5','W']:id==='site-sewer-lateral'?['#6b4423','SS']:['#b8860b','G']
    const fs=font()
    const tw=data[1].length*fs*.75+12
    line([0,cy,Math.max(0,cx-tw/2),cy],data[0],1.1,[10,4]);line([Math.min(w,cx+tw/2),cy,w,cy],data[0],1.1,[10,4])
    text(data[1],cx-tw/2,cy-fs*.65,tw,fs*1.3,fs,data[0]);text(`${(w/pixelsPerFoot).toFixed(0)}'`,0,cy+fs*.85,w,fs*1.3,fs,data[0])
  } else if(id==='site-electrical-service') {
    line([cx,cy-u*.5,cx+u*.43,cy+u*.25,cx-u*.43,cy+u*.25,cx,cy-u*.5],'#344050',1.0);text('ELEC',0,cy+u*.35,w,u*.5,Math.max(12,u*.16))
  } else {
    s.push({kind:'rect',x:0,y:0,width:w,height:h,radius:0,fill:id==='site-parking-stall'?'none':id==='site-deck-patio'?'#f1eee8':'#eef1f3',stroke:'#536170',weight:1.05})
    const deck=id==='site-deck-patio',spacing=id==='site-parking-stall'?9:id==='site-sidewalk'?5:id==='site-driveway'?8:.5
    const span=deck?h:w,count=Math.min(512,Math.max(0,Math.ceil(span/pixelsPerFoot/spacing-1e-9)-1))
    for(let i=1;i<=count;i++){const at=i*spacing*pixelsPerFoot;line(deck?[0,at,w,at]:[at,0,at,h],id==='site-parking-stall'?'#536170':'#a8b1ba',id==='site-parking-stall'?1.05:.55)}
    if(id==='site-parking-stall'){
      // Open approach side; retained footprint is still the full stall envelope.
      s[0]={kind:'line',points:[0,h,0,0,w,0,w,h],stroke:'#536170',weight:1.05}
    } else if(deck){
      for(let i=1;i<=count;i+=2){const y=i*spacing*pixelsPerFoot,x=w*(i%4===1?.35:.7);line([x,y,x,Math.min(h,y+spacing*pixelsPerFoot)],'#A8B1BA',.45)}
    } else {
      const inset=Math.min(w,h)*.04
      line([inset,0,inset,h],'#BEC7CC',.5);line([w-inset,0,w-inset,h],'#BEC7CC',.5)
    }
  }
  return s
}
