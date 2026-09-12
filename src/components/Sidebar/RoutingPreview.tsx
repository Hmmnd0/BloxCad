import React from 'react'
import { routingGeometry } from '../../utils/routingGeometry'
import { symbolBounds } from '../../utils/symbolBounds'

/** Fit the complete routing symbol, including its circuit designation. */
export function RoutingPreview({id}:{id:string}) {
  const shapes=routingGeometry(id,80,32,id==='elec-homerun'?{circuitLabel:'A3'}:{})
  const b=symbolBounds(shapes,80,32),size=Math.max(b.width,b.height)+10
  return <svg width="48" height="48" viewBox={`${b.x+(b.width-size)/2} ${b.y+(b.height-size)/2} ${size} ${size}`} aria-hidden="true">
    {shapes.map((s,i)=>s.kind==='line'
      ? <polyline key={i} points={s.points.join(' ')} fill={s.fill??'none'} stroke={s.stroke} strokeWidth={s.weight*1.5} strokeDasharray={s.dash?.join(' ')}/>
      :s.kind==='text'?<text key={i} x={s.x+s.width/2} y={s.y+s.height/2} textAnchor="middle" dominantBaseline="central" fontFamily="Arial" fontSize={s.fontSize} fill={s.fill}>{s.text}</text>:null)}
  </svg>
}
