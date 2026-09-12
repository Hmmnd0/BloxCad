import React from 'react'
import { electricalGeometry } from '../../utils/electricalGeometry'
/** Reserve room for device qualifiers outside the saved footprint. */
export function ElectricalPreview({id}:{id:string}) {
  return <svg width="48" height="48" viewBox="-10 -20 60 80" aria-hidden="true">
    {electricalGeometry(id,40,40).map((s,i)=>s.kind==='text'
      ?<text key={i} x={s.x+s.width/2} y={s.y+s.height/2} fontSize={s.fontSize} fontFamily="Arial" fill={s.fill} textAnchor="middle" dominantBaseline="central">{s.text}</text>
      :s.kind==='ellipse'?<ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight}/>
      :s.kind==='rect'?<rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight}/>
      :<polyline key={i} points={s.points.join(' ')} fill="none" stroke={s.stroke} strokeWidth={s.weight}/>)}
  </svg>
}
