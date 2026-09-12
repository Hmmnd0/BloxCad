import React from 'react'
import {Text,Group} from 'react-konva'
import {Line,RendererComponent} from './shared'
import {routingGeometry} from '../../../utils/routingGeometry'
export const refinedRouting=(id:string):RendererComponent=>({widthPx,heightPx,properties})=><Group>{routingGeometry(id,widthPx,heightPx,properties).map((s,i)=>s.kind==='text'?<Text key={i} x={s.x} y={s.y} width={s.width} height={s.height} text={s.text} fontSize={s.fontSize} fontFamily="Arial" fontStyle="bold" align="center" verticalAlign="middle" fill={s.fill} listening={false}/>:s.kind==='line'?<Line key={i} points={s.points} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash} closed={!!s.fill} fill={s.fill} lineCap="round" listening={false}/>:null)}</Group>
