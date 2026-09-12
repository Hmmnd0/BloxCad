import React, { useLayoutEffect, useRef } from 'react'
import Konva from 'konva'
import { Group, Layer, Rect, Line, Text } from 'react-konva'
import type { Project, PlacedElement } from '../../types'
import { SCALES } from '../../types'
import { RENDERERS } from './renderers'
import { JOINED_WALLS } from '../../utils/wallUnion'
import { planNotesLayout, planScaleLabel } from '../../utils/planSheet'

function LegendSymbol({element}:{element:PlacedElement}) {
  const ref=useRef<Konva.Group>(null)
  const Renderer=RENDERERS[element.bloxId]
  useLayoutEffect(()=>{
    const node=ref.current;if(!node)return
    node.scale({x:1,y:1});node.position({x:0,y:0})
    const b=node.getClientRect({skipTransform:true}),s=Math.min(46/Math.max(b.width,1),28/Math.max(b.height,1))
    node.scale({x:s,y:s});node.position({x:25-(b.x+b.width/2)*s,y:17-(b.y+b.height/2)*s})
  },[element])
  if(!Renderer)return null
  return <Group ref={ref}><Renderer widthPx={(JOINED_WALLS.has(element.bloxId)?4:element.width)*24} heightPx={(JOINED_WALLS.has(element.bloxId)?Math.min(element.width,element.height):element.height)*24} pixelsPerFoot={24} properties={{...element.properties,flipH:false,flipV:false,flipped:false}} rotation={0} selected={false}/></Group>
}
export function PlanNotes({project,legend}:{project:Project;legend:boolean}) {
  const n=planNotesLayout(project,legend),ppf=SCALES[project.scale].pixelsPerFoot
  const step=project.scale==='half'?2:5,total=step*2,unit=project.mode==='detail'?'in':'ft'
  return <Group x={n.x} y={n.y} name="plan-notes">
    <Rect width={n.width} height={n.height} fill="white" stroke="#48515d" strokeWidth={.7}/>
    <Text x={14} y={12} text="DRAWING SCALE" fontSize={10} fontFamily="Arial" fontStyle="bold" fill="#344050"/>
    <Text x={14} y={29} text={`${planScaleLabel(project)} · Print at 100%`} fontSize={11} fontFamily="Arial" fill="#344050"/>
    {[0,1].map(i=><Rect key={i} x={14+i*step*ppf} y={51} width={step*ppf} height={6} fill={i===0?'#344050':'white'} stroke="#344050" strokeWidth={.7}/>)}
    {[0,step,total].map((t,i)=><Text key={t} x={14+t*ppf-(i===2?40:i===1?20:0)} y={61} width={40} align={i===2?'right':i===1?'center':'left'} text={`${t}${i===2?' '+unit:''}`} fontSize={10} fontFamily="Arial" fill="#344050"/>)}
    {legend&&<>
      <Line points={[0,81,n.width,81]} stroke="#b5bdc7" strokeWidth={.6}/>
      <Text x={14} y={90} text="SYMBOL KEY · Typical symbols; sizes vary" fontSize={10} fontFamily="Arial" fontStyle="bold" fill="#344050"/>
      {n.entries.map((e,i)=><Group key={e.id} x={Math.floor(i/n.rows)*304+12} y={110+(i%n.rows)*44}>
        <LegendSymbol element={e.example}/>
        <Text x={60} y={1} width={224} height={28} text={e.name} fontSize={11} fontFamily="Arial" fill="#263343"/>
        <Text x={60} y={29} width={224} text={e.category} fontSize={9} fontFamily="Arial" fill="#667383"/>
      </Group>)}
    </>}
  </Group>
}
export function PlanNotesLayer(props:{project:Project;legend:boolean}) {return <Layer listening={false}><PlanNotes {...props}/></Layer>}
