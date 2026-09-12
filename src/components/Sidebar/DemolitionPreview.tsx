import React from 'react'
import { demolitionGeometry } from '../../utils/demolitionGeometry'
export function DemolitionPreview({id}:{id:string}) {
  const h=id==='demo-door'?30:id==='demo-area'?24:8
  return <svg width="48" height="48" viewBox="-5 -5 50 40" aria-hidden="true"><g transform={`translate(0 ${(30-h)/2})`}>
    {demolitionGeometry(id,40,h).map((s,i)=>s.kind==='rect'?<rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>:s.kind==='line'?<polyline key={i} points={s.points.join(' ')} fill="none" stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>:null)}
  </g></svg>
}
