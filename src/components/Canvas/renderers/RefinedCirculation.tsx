import React from 'react'
import { Group, Path, Text } from 'react-konva'
import { circulationGeometry } from '../../../utils/circulationGeometry'
import type { RendererComponent } from './shared'

export const refinedCirculation = (id: string): RendererComponent => ({widthPx:w,heightPx:h,properties}) => (
  <Group>
    {circulationGeometry(id,w,h,properties).shapes.map((s,i)=>s.kind==='path'
      ? <Path key={i} data={s.d} fill={s.fill==='none'?undefined:s.fill} stroke={s.stroke==='none'?undefined:s.stroke} strokeWidth={s.weight} dash={s.dash} strokeScaleEnabled={false} lineJoin="round" />
      : <Group key={i} x={s.x} y={s.y} scaleX={properties.flipH?-1:1} scaleY={properties.flipV?-1:1}>
          <Text x={-s.fontSize*2} y={-s.fontSize*.6} width={s.fontSize*4} height={s.fontSize*1.2} text={s.text} fontSize={s.fontSize} fontFamily="Arial" align="center" verticalAlign="middle" fill="#344050" listening={false}/>
        </Group>)}
  </Group>
)
