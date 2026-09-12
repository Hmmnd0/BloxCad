import React from 'react'
import { Group,Text } from 'react-konva'
import { wallGeometry } from '../../../utils/wallGeometry'
import { Rect,Line,RendererComponent } from './shared'
export const refinedWall=(id:string):RendererComponent=>({widthPx,heightPx})=><Group>
  {wallGeometry(id,widthPx,heightPx).map((s,i)=>s.kind==='rect'
    ?<Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill==='none'?undefined:s.fill} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash}/>
    :s.kind==='line'?<Line key={i} points={s.points} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash}/>
    :<Text key={i} x={s.x} y={s.y} width={s.width} height={s.height} offsetX={s.width/2} offsetY={s.height/2} rotation={s.rotation} text={s.text} fontSize={s.size} fontFamily="Arial" fontStyle="bold" align="center" verticalAlign="middle" fill="#542930" listening={false}/>)}
</Group>
