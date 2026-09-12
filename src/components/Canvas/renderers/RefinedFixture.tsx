import React from 'react'
import { Group, Text } from 'react-konva'
import { Rect, Line, Ellipse, RendererProps } from './shared'
import { fixtureGeometry } from '../../../utils/fixtureGeometry'
import { FixtureShape } from '../../../utils/fixtureGeometry'
export function refinedFixture(id:string,geometry:(id:string,w:number,h:number)=>FixtureShape[]=fixtureGeometry):React.FC<RendererProps> {
  return function Fixture({widthPx,heightPx,properties}) {
    return <Group>{geometry(id,widthPx,heightPx).map((s,i)=>s.kind==='text'
      ? <Text key={i} x={s.x+s.width/2} y={s.y+s.height/2} offsetX={s.width/2} offsetY={s.height/2} scaleX={properties?.flipH?-1:1} scaleY={properties?.flipV?-1:1} width={s.width} height={s.height} text={s.text} fontSize={s.fontSize} fontFamily="Arial" fill={s.fill} align="center" verticalAlign="middle" wrap="none" listening={false}/>
      : s.kind==='rect'
      ? <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} cornerRadius={s.radius} fill={s.fill==='none'?undefined:s.fill} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash}/>
      : s.kind==='ellipse'?<Ellipse key={i} x={s.x} y={s.y} radiusX={s.rx} radiusY={s.ry} fill={s.fill==='none'?undefined:s.fill} stroke={s.stroke} strokeWidth={s.weight}/>
      : <Line key={i} points={s.points} stroke={s.stroke} strokeWidth={s.weight} dash={s.dash} fill={s.fill} closed={!!s.fill} lineCap="round"/>)}</Group>
  }
}
