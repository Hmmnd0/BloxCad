import React, { useLayoutEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Stage, Layer, Group, Rect } from 'react-konva'
import { RENDERERS } from '../Canvas/renderers'
import { getBloxById } from '../../blox/definitions'
import { useStore } from '../../store/useStore'

export const DRAWING_PREVIEW_CATEGORIES=new Set(['Details','Annotations','Elevation'])
const cache=new Map<string,string>()
/** Render once from the real drawing component; retain its materials, proportions and default properties. */
export function CanvasBloxPreview({id}:{id:string}) {
  const scale=useStore(s=>s.project?.scale??'quarter'),key=`${id}:${scale}`
  const [rendered,setRendered]=useState<{key:string;url:string}|null>(null)
  const stage=useRef<Konva.Stage>(null),group=useRef<Konva.Group>(null)
  const def=getBloxById(id),Renderer=RENDERERS[id]
  const url=cache.get(key)??(rendered?.key===key?rendered.url:undefined)
  useLayoutEffect(()=>{
    if(url||!stage.current||!group.current)return
    const g=group.current,b=g.getClientRect({skipTransform:true}),fit=Math.min(88/Math.max(b.width,1),48/Math.max(b.height,1))
    g.scale({x:fit,y:fit});g.position({x:48-(b.x+b.width/2)*fit,y:28-(b.y+b.height/2)*fit})
    // Keep slender material edges visible at icon size. This affects only the
    // disposable preview stage, never the placed symbol or exported drawing.
    g.find((n:Konva.Node)=>n instanceof Konva.Shape).forEach(n=>{
      if(n instanceof Konva.Shape){
        n.strokeScaleEnabled(true)
        if(n.stroke())n.strokeWidth(Math.min(1.2/fit,Math.max(n.strokeWidth(),.65/fit)))
      }
    })
    stage.current.draw()
    const data=stage.current.toDataURL({pixelRatio:3})
    cache.set(key,data);setRendered({key,url:data})
  },[key,url])
  if(!def||!Renderer)return null
  if(url)return <img src={url} alt="" title={def.category==='Details'?'Material sample — placed dimensions remain unchanged':undefined} width={96} height={56} style={{maxWidth:'100%',objectFit:'contain'}}/>
  let w=def.defaultWidth*24,h=def.defaultHeight*24
  // A short specimen exposes the material rather than reducing a full-length
  // board to a hairline. Both axes retain the same physical scale.
  const sampleIds=new Set(['detail-drywall','detail-plywood','detail-rigid-insulation','detail-soffit-panel','detail-flashing','detail-felt','detail-brick-veneer','detail-cmu-block'])
  if(def.category==='Details'&&(sampleIds.has(id)||id.endsWith('-face')||id.endsWith('-edge'))){
    const short=Math.min(w,h)
    if(w>h)w=Math.min(w,short*3);else h=Math.min(h,short*3)
    const specimenScale=24/short
    w*=specimenScale;h*=specimenScale
  }
  return <Stage ref={stage} width={96} height={56} listening={false}><Layer><Group ref={group}>
    <Rect width={w} height={h} fill="transparent" listening={false}/>
    <Renderer widthPx={w} heightPx={h} pixelsPerFoot={24} properties={id==='annotation-drawing-title'?{title:'FLOOR PLAN',drawingNum:'1',scale:'1/4" = 1\u2032–0"'}:{}} rotation={0} selected={false}/>
  </Group></Layer></Stage>
}
