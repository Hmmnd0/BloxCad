import React from 'react'
import { getBloxById } from '../../blox/definitions'
import { wallGeometry } from '../../utils/wallGeometry'
/** A typical material segment, not a miniature of an arbitrarily long wall. */
export function WallPreview({id}:{id:string}) {
  const d=getBloxById(id)!,w=42,h=id==='wall-cmu-footing'?16:Math.max(6,Math.min(12,d.defaultHeight*14))
  return <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><g transform={`translate(3,${(48-h)/2})`}>
    {wallGeometry(id,w,h,true).map((s,i)=>s.kind==='rect'
      ?<rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>
      :s.kind==='line'?<polyline key={i} points={s.points.join(' ')} fill="none" stroke={s.stroke} strokeWidth={s.weight} strokeDasharray={s.dash?.join(' ')}/>
      :<text key={i} x={s.x} y={s.y} fontSize={s.size} fontFamily="Arial" fontWeight="bold" textAnchor="middle" dominantBaseline="central" fill="#542930">{s.text}</text>)}
  </g></svg>
}
