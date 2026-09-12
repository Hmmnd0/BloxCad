import React from 'react'
import { getBloxById } from '../../blox/definitions'
import { circulationGeometry } from '../../utils/circulationGeometry'

export function CirculationPreview({id}:{id:string}) {
  const d=getBloxById(id)!
  const scale=32/Math.max(d.defaultWidth,d.defaultHeight)
  // Match the placement defaults (counts are calculated in feet, never pixels).
  const properties=id==='window-multi'?{paneCount:Math.max(1,Math.min(12,Math.round(d.defaultWidth/2)))}
    :id==='stairs-elevation'?{stepCount:Math.max(3,Math.min(24,Math.round(d.defaultWidth/(11/12))))}:{}
  const model=circulationGeometry(id,d.defaultWidth*scale,d.defaultHeight*scale,properties)
  const b=model.bounds, fit=34/Math.max(b.width,b.height)
  return <svg width="48" height="48" viewBox="0 0 40 40" aria-hidden="true"><g transform={`translate(${20-(b.x+b.width/2)*fit},${20-(b.y+b.height/2)*fit}) scale(${fit})`}>
    {model.shapes.map((s,i)=>s.kind==='path'
      ? <path key={i} d={s.d} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight*.7/fit} strokeDasharray={s.dash?.join(' ')} strokeLinejoin="round"/>
      : <text key={i} x={s.x} y={s.y} fontSize={s.fontSize} fontFamily="Arial" fill="#344050" textAnchor="middle" dominantBaseline="central">{s.text}</text>)}
  </g></svg>
}
