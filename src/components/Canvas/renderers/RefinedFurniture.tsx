import React from 'react'
import { Group } from 'react-konva'
import { Rect, Line, RendererProps } from './shared'
import { furnitureGeometry } from '../../../utils/furnitureGeometry'
export function refinedFurniture(id: string): React.FC<RendererProps> {
  return function Furniture({widthPx,heightPx}) {
    return <Group>{furnitureGeometry(id,widthPx,heightPx).map((s,i) => s.kind === 'rect'
      ? <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} cornerRadius={s.radius} fill={s.fill} stroke={s.stroke} strokeWidth={s.weight} />
      : <Line key={i} points={s.points} stroke={s.stroke} strokeWidth={s.weight} lineCap="round" />)}</Group>
  }
}
