import React from 'react'
import { structuralGeometry, REFINED_STRUCTURAL } from '../../utils/structuralGeometry'
import { getBloxById } from '../../blox/definitions'
import { furnitureGeometry } from '../../utils/furnitureGeometry'
import { caseworkGeometry, REFINED_CASEWORK } from '../../utils/caseworkGeometry'
import { fixtureGeometry, REFINED_FIXTURES, FixtureShape } from '../../utils/fixtureGeometry'
export function FurniturePreview({ id }: { id: string }) {
  const def = getBloxById(id)!
  const scale = 34 / Math.max(def.defaultWidth,def.defaultHeight)
  const w = def.defaultWidth * scale, h = def.defaultHeight * scale
  const shapes: FixtureShape[] = REFINED_STRUCTURAL.has(id)?structuralGeometry(id,w,h):REFINED_FIXTURES.has(id)?fixtureGeometry(id,w,h):REFINED_CASEWORK.has(id) ? caseworkGeometry(id,w,h) : furnitureGeometry(id,w,h)
  return <svg width="48" height="48" viewBox="0 0 40 40" aria-hidden="true"><g transform={`translate(${(40-w)/2},${(40-h)/2})`}>
    {shapes.map((s,i) => s.kind === 'text'
      ? <text key={i} x={s.x+s.width/2} y={s.y+s.height/2} fontSize={s.fontSize} fontFamily="Arial" fill={s.fill} textAnchor="middle" dominantBaseline="central">{s.text}</text>
      : s.kind === 'rect'
      ? <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.radius} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight * .75} strokeDasharray={s.dash?.join(' ')} />
      : s.kind==='ellipse'?<ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight*.75}/>
      : <polyline key={i} points={s.points.join(' ')} fill="none" stroke={s.stroke} strokeWidth={s.weight * .75} strokeLinecap="round" />)}
  </g></svg>
}
