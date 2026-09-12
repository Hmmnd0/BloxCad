import React from 'react'
import { Group } from 'react-konva'
import { Rect, Line, RendererProps } from './shared'
import { caseworkGeometry } from '../../../utils/caseworkGeometry'
export function refinedCasework(id: string): React.FC<RendererProps> {
  return function Casework({widthPx,heightPx}) {
    return <Group>{caseworkGeometry(id,widthPx,heightPx).map((s,i) => s.kind === 'rect'
      ? <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} cornerRadius={s.radius} fill={s.fill === 'none' ? undefined : s.fill} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash} />
      : <Line key={i} points={s.points} stroke={s.stroke} strokeWidth={s.weight} lineCap="round" />)}</Group>
  }
}
