import React from 'react'
import { getBloxById } from '../../blox/definitions'
import { equipmentGeometry } from '../../utils/equipmentGeometry'
import { siteGeometry, REFINED_SITE } from '../../utils/siteGeometry'
export function EquipmentPreview({id}:{id:string}) {
  const d=getBloxById(id)!,isSite=REFINED_SITE.has(id)
  const scale=(isSite?140:36)/Math.max(d.defaultWidth,d.defaultHeight),w=d.defaultWidth*scale,h=d.defaultHeight*scale
  const shapes=isSite?siteGeometry(id,w,h,scale,{fontSize:12}):equipmentGeometry(id,w,h)
  let left=0,top=0,right=w,bottom=h
  for(const s of shapes)if(s.kind==='text'){left=Math.min(left,s.x);top=Math.min(top,s.y);right=Math.max(right,s.x+s.width);bottom=Math.max(bottom,s.y+s.height)}
  const size=Math.max(right-left,bottom-top)+6
  const viewWidth=right-left+12,viewHeight=bottom-top+12
  return <svg width={isSite?112:48} height={isSite?56:48} style={{width:isSite?112:48,height:isSite?56:48,maxWidth:'100%'}} viewBox={isSite?`${left-6} ${top-6} ${viewWidth} ${viewHeight}`:`${(left+right-size)/2} ${(top+bottom-size)/2} ${size} ${size}`} aria-hidden="true">
    {shapes.map((s,i)=>s.kind==='text'?<text key={i} x={s.x+s.width/2} y={s.y+s.height/2} fontSize={s.fontSize} fontFamily="Arial" fill={s.fill} textAnchor="middle" dominantBaseline="central">{s.text}</text>
      :s.kind==='rect'?<rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>
      :s.kind==='ellipse'?<ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight}/>
      :<polyline key={i} points={s.points.join(' ')} fill={s.fill??'none'} stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>)}
  </svg>
}
