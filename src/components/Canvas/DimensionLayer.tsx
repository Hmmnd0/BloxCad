import React from 'react'
import { Layer, Group, Line, Text, Circle } from 'react-konva'
import type Konva from 'konva'
import { DimensionLine, DrawingMode } from '../../types'
import { formatFeet, formatInches } from '../../utils/scale'
import { dimensionLayout } from '../../utils/dimensionLayout'
import { LINE_WEIGHTS } from '../../utils/lineWeights'

function DimShape({dim,pixelsPerFoot,selected,preview,mode,onClick,onOffsetDrag}:{dim:DimensionLine;pixelsPerFoot:number;selected:boolean;preview?:boolean;mode?:DrawingMode;onClick?:(e:Konva.KonvaEventObject<MouseEvent>)=>void;onOffsetDrag?:(offset:number)=>void}) {
  const g=dimensionLayout(dim,pixelsPerFoot)
  const color=dim.needsReview?'#B45309':selected||preview?'#4F9EFF':'#3A3A3A'
  const label=dim.needsReview?'CHECK':mode==='detail'?formatInches(g.value):formatFeet(g.value)
  return <Group opacity={preview?.7:1} onClick={e=>{e.cancelBubble=true;onClick?.(e)}}>
    {[g.ext1,g.ext2].map((points,i)=><Line key={i} points={points} stroke={color} strokeWidth={LINE_WEIGHTS.reference} strokeScaleEnabled={false} listening={false}/>)}
    <Line points={g.line} stroke={color} strokeWidth={selected?1.5:LINE_WEIGHTS.reference} strokeScaleEnabled={false} hitStrokeWidth={10}/>
    {[g.tick1,g.tick2].map((points,i)=><Line key={i} points={points} stroke={color} strokeWidth={1.2} strokeScaleEnabled={false} listening={false}/>)}
    <Text text={label} x={g.label.x} y={g.label.y} rotation={g.rotation} width={120} offsetX={60} offsetY={7} align="center" fontSize={12} fontFamily="Arial" fill={color} listening={false}/>
    {selected&&<>
      <Circle x={dim.x1*pixelsPerFoot} y={dim.y1*pixelsPerFoot} radius={3} fill={color} listening={false}/>
      <Circle x={dim.x2*pixelsPerFoot} y={dim.y2*pixelsPerFoot} radius={3} fill={color} listening={false}/>
      <Circle x={g.handle.x} y={g.handle.y} radius={5} fill={color} stroke="white" strokeWidth={1.5} draggable
        onDragMove={e=>{const d=((e.target.x()-g.reference.x)*g.normal.x+(e.target.y()-g.reference.y)*g.normal.y)/pixelsPerFoot;onOffsetDrag?.(d)}}
        onDragEnd={e=>{e.target.position(g.handle)}}/>
    </>}
  </Group>
}
interface DimensionLayerProps {
  dimensions:DimensionLine[];selectedDimIds:string[];pixelsPerFoot:number;mode?:DrawingMode
  onSelect:(id:string,multi:boolean)=>void;onOffsetDrag:(id:string,newOffset:number)=>void
  preview?:Omit<DimensionLine,'id'|'offset'>;previewOffset?:number
}
export function DimensionLayer({dimensions,selectedDimIds,pixelsPerFoot,mode,onSelect,onOffsetDrag,preview,previewOffset=1.5}:DimensionLayerProps) {
  return <Layer>
    {dimensions.map(dim=><DimShape key={dim.id} dim={dim} pixelsPerFoot={pixelsPerFoot} mode={mode} selected={selectedDimIds.includes(dim.id)} onClick={e=>onSelect(dim.id,!!(e.evt.shiftKey||e.evt.metaKey))} onOffsetDrag={off=>onOffsetDrag(dim.id,off>=0?Math.max(.5,off):Math.min(-.5,off))}/>)}
    {preview&&<DimShape dim={{...preview,id:'__preview__',offset:previewOffset,measurement:preview.measurement??(Math.abs(preview.x2-preview.x1)>1e-6&&Math.abs(preview.y2-preview.y1)>1e-6?'aligned':undefined)}} pixelsPerFoot={pixelsPerFoot} mode={mode} selected={false} preview/>}
  </Layer>
}
