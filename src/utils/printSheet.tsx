import React from 'react'
import { DEMOLITION_IDS } from './demolitionGeometry'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import Konva from 'konva'
import { Stage, Layer, Group, Path, Rect, Text, Shape, Image as CanvasImage } from 'react-konva'
import type { Project } from '../types'
import { SCALES } from '../types'
import { RENDERERS } from '../components/Canvas/renderers'
import { DimensionLayer } from '../components/Canvas/DimensionLayer'
import { PlanNotes } from '../components/Canvas/PlanNotesLayer'
import { buildWallRegions, wallRegionPath, JOINED_WALLS, isFoundation } from './wallUnion'
import { wallSolidRects } from './hostedOpenings'
import { visiblePlanElements,planDimensions,sheetSize,planScaleLabel,EXPORT_PIXEL_RATIO } from './planSheet'
import { computeRenderSize } from '../components/Canvas/UnderlayLayer'
import { elementSVG,dimensionSVG } from './svgExport'
import { REFINED_CIRCULATION } from './circulationGeometry'
import { REFINED_FURNITURE } from './furnitureGeometry'
import { REFINED_CASEWORK } from './caseworkGeometry'
import { REFINED_FIXTURES } from './fixtureGeometry'
import { REFINED_STRUCTURAL } from './structuralGeometry'
import { REFINED_ELECTRICAL } from './electricalGeometry'
import { REFINED_EQUIPMENT } from './equipmentGeometry'
import { REFINED_SITE } from './siteGeometry'
import { pngWithResolution } from './pngResolution'

/** Dedicated print scene. Never resize/move the interactive stage or export
 * its selection, snap guides, grid, preview objects or transformer handles. */
export async function buildPrintSheet(project:Project,legend:boolean,titleBlock:boolean,mimeType:'image/png'|'image/jpeg',includeSVG=false) {
  const container=document.createElement('div');container.style.cssText='position:fixed;left:-100000px;top:0;pointer-events:none'
  document.body.append(container)
  const root=createRoot(container),ref=React.createRef<Konva.Stage>(),p=SCALES[project.scale].pixelsPerFoot
  const elements=visiblePlanElements(project),regions=buildWallRegions(elements)
  let underlay:HTMLImageElement|undefined
  try {
    if(project.underlay?.visible) {
      underlay=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new window.Image();if(!/^(data:|file:)/.test(project.underlay!.imageData))img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Underlay could not be loaded for export'));img.src=project.underlay!.imageData})
    }
    await document.fonts.ready
    flushSync(()=>root.render(<Stage ref={ref} width={1} height={1}>
      <Layer listening={false} name="print-content">
        {underlay&&project.underlay&&(()=>{const size=computeRenderSize(project.underlay,p);return <CanvasImage image={underlay} width={size.w} height={size.h} opacity={project.underlay.opacity}/>})()}
        {project.mode!=='elevation'&&(project.arcWalls??[]).filter(a=>!project.layers?.some(l=>l.id===a.layerId&&!l.visible)).map(a=><Shape name="print-arc" key={a.id} x={(a.cx-a.radius-a.thickness/2)*p} y={(a.cy-a.radius-a.thickness/2)*p} width={(a.radius+a.thickness/2)*2*p} height={(a.radius+a.thickness/2)*2*p}
          sceneFunc={(ctx,shape)=>{const r=(a.radius+a.thickness/2)*p;ctx.beginPath();ctx.arc(r,r,r,a.startAngle,a.endAngle,false);ctx.arc(r,r,Math.max(0,a.radius-a.thickness/2)*p,a.endAngle,a.startAngle,true);ctx.closePath();ctx.fillStrokeShape(shape)}} fill="#3c3c3c" stroke="#222" strokeWidth={1.2}/>)}
        {regions.map(r=><Path key={r.key} data={wallRegionPath(r.polygons,p)} fill={r.fill} fillRule="evenodd" stroke="#1a1a1a" strokeWidth={1} dash={r.footing?[5,3]:undefined}/>)}
        {elements.filter(e=>JOINED_WALLS.has(e.bloxId)&&!isFoundation(e.bloxId)).map(e=>{
          const Renderer=RENDERERS[e.bloxId],w=e.width*p,h=e.height*p
          if(!Renderer)return null
          return <Group name="print-wall-art" key={e.id} x={(e.x+e.width/2)*p} y={(e.y+e.height/2)*p} rotation={e.rotation} offsetX={w/2} offsetY={h/2}
            clipFunc={ctx=>{for(const r of wallSolidRects(e,elements))ctx.rect(r.x*p,r.y*p,r.width*p,r.height*p)}}>
            <Renderer widthPx={w} heightPx={h} properties={e.properties} rotation={e.rotation} selected={false}/>
          </Group>
        })}
        {regions.map(r=><Path key={'outline-'+r.key} data={wallRegionPath(r.polygons,p)} stroke="#1a1a1a" strokeWidth={1} dash={r.footing?[5,3]:undefined}/>)}
        {elements.filter(e=>!JOINED_WALLS.has(e.bloxId)).map(e=>{
          const Renderer=RENDERERS[e.bloxId];if(!Renderer)throw new Error(`No renderer for ${e.bloxId}`)
          const w=e.width*p,h=e.height*p
          return <Group key={e.id} id={e.id} name="print-element" x={(e.x+e.width/2)*p} y={(e.y+e.height/2)*p} rotation={e.rotation} offsetX={w/2} offsetY={h/2}>
            <Group x={e.properties.flipH?w:0} y={e.properties.flipV?h:0} scaleX={e.properties.flipH?-1:1} scaleY={e.properties.flipV?-1:1}>
              <Renderer widthPx={w} heightPx={h} pixelsPerFoot={p} properties={e.properties} rotation={e.rotation} selected={false}/>
            </Group>
          </Group>
        })}
      </Layer>
      <DimensionLayer dimensions={planDimensions(project)} selectedDimIds={[]} pixelsPerFoot={p} mode={project.mode} onSelect={()=>{}} onOffsetDrag={()=>{}}/>
      <Layer listening={false}><PlanNotes project={project} legend={legend}/></Layer>
    </Stage>))
    const stage=ref.current!
    stage.find('.print-content').forEach(layer=>{if(layer instanceof Konva.Container)layer.find('Text').forEach(node=>{if(node instanceof Konva.Text&&node.fontSize()<12){node.fontSize(12);node.height(Math.max(node.height(),15))}})})
    // Long leader labels need a new layout after the print font minimum is
    // applied. Keep the landing and arrow fixed; grow the note upward from it.
    for(const element of elements.filter(e=>e.bloxId==='annotation-leader')) {
      const group=stage.findOne((node:Konva.Node)=>node.id()===element.id)
      if(!(group instanceof Konva.Container))continue
      for(const node of group.find('Text'))if(node instanceof Konva.Text) {
        node.setAttrs({fontSize:Math.max(12,node.fontSize()),wrap:'word',height:'auto',verticalAlign:'top',align:'left'})
        node.y(element.height*p*.53-node.height()-3)
      }
    }
    const rects=stage.getLayers().map(l=>l.getClientRect({skipTransform:true})).filter(b=>b.width&&b.height)
    let x=Math.min(...rects.map(b=>b.x)),y=Math.min(...rects.map(b=>b.y)),right=Math.max(...rects.map(b=>b.x+b.width)),bottom=Math.max(...rects.map(b=>b.y+b.height))
    // Custom canvas arc bounds are not provided by Konva's sceneFunc.
    if(project.mode!=='elevation') for(const a of project.arcWalls??[]) {if(project.layers?.some(l=>l.id===a.layerId&&!l.visible))continue;const r=(a.radius+a.thickness/2)*p;x=Math.min(x,a.cx*p-r);y=Math.min(y,a.cy*p-r);right=Math.max(right,a.cx*p+r);bottom=Math.max(bottom,a.cy*p+r)}
    const footer=titleBlock?100:38,contentW=right-x,contentH=bottom-y
    const page=sheetSize(contentW,contentH+footer)
    if(page.width*page.height*EXPORT_PIXEL_RATIO**2>60_000_000) throw new Error('Sheet exceeds the safe export size. Use a smaller drawing scale or hide outlying layers; no automatic scale reduction was applied.')
    stage.size({width:page.width,height:page.height})
    const ox=(page.width-contentW)/2-x,oy=(page.height-footer-contentH)/2-y
    stage.getLayers().forEach(l=>l.position({x:ox,y:oy}))
    const background=new Konva.Layer();background.add(new Konva.Rect({width:page.width,height:page.height,fill:'white'}));stage.add(background);background.moveToBottom()
    const meta=new Konva.Layer();stage.add(meta)
    meta.add(new Konva.Rect({x:24,y:24,width:page.width-48,height:page.height-48,stroke:'#48515d',strokeWidth:.6}))
    meta.add(new Konva.Text({x:48,y:page.height-footer-15,width:page.width-96,text:`${project.titleBlock?.drawingTitle||project.name}  |  ${planScaleLabel(project)}  |  ${page.widthIn} × ${page.heightIn} in sheet · Print at 100%, not Fit`,fontFamily:'Arial',fontSize:11,fill:'#344050'}))
    if(titleBlock) {
      const tb=project.titleBlock
      meta.add(new Konva.Line({points:[48,page.height-100,page.width-48,page.height-100],stroke:'#48515d',strokeWidth:.7}))
      meta.add(new Konva.Text({x:48,y:page.height-88,width:page.width-300,text:project.name,fontSize:20,fontFamily:'Arial',fontStyle:'bold',fill:'#263343',wrap:'none',ellipsis:true}))
      meta.add(new Konva.Text({x:page.width-230,y:page.height-88,width:182,text:tb?.sheetNumber??'',fontSize:24,fontFamily:'Arial',fontStyle:'bold',align:'right',fill:'#263343',wrap:'none',ellipsis:true}))
      meta.add(new Konva.Text({x:48,y:page.height-58,width:page.width-96,text:[tb?.address,tb?.projectDate,tb?.drawnBy&&`Drawn: ${tb.drawnBy}`,tb?.checkedBy&&`Checked: ${tb.checkedBy}`,tb?.jobNumber&&`Job: ${tb.jobNumber}`].filter(Boolean).join('  |  '),fontSize:12,fontFamily:'Arial',fill:'#344050',wrap:'none',ellipsis:true}))
    }
    stage.draw()
    let svg=''
    if(includeSVG) {
      const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')
      const textSVG=(node:Konva.Text)=>{
        const fs=node.fontSize(),lh=node.lineHeight()*fs,pad=node.padding(),lines=node.textArr
        const extra=node.height()-lines.length*lh-2*pad
        const dy=node.verticalAlign()==='middle'?extra/2:node.verticalAlign()==='bottom'?extra:0
        return `<g transform="matrix(${node.getAbsoluteTransform().getMatrix().join(' ')})">`+lines.map((line,i)=>{
          const dx=node.align()==='center'?(node.width()-2*pad-line.width)/2:node.align()==='right'?node.width()-2*pad-line.width:0
          return `<text x="${pad+dx}" y="${pad+dy+lh/2+i*lh}" dominant-baseline="central" font-size="${fs}" font-family="${esc(node.fontFamily())}" font-weight="${node.fontStyle().includes('bold')?'bold':'normal'}" fill="${esc(String(node.fill()))}">${esc(line.text)}</text>`
        }).join('')+'</g>'
      }
      const raster=(node:Konva.Node)=>{const b=node.getClientRect();return `<image x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" href="${node.toDataURL({pixelRatio:EXPORT_PIXEL_RATIO})}"/>`}
      const native=new Set([...DEMOLITION_IDS,...REFINED_SITE,...REFINED_EQUIPMENT,...REFINED_ELECTRICAL,...REFINED_STRUCTURAL,...REFINED_CIRCULATION,...REFINED_FURNITURE,...REFINED_CASEWORK,...REFINED_FIXTURES,'text-note','annotation-room-tag'])
      const vectors=regions.map(r=>`<path d="${wallRegionPath(r.polygons,p)}" fill="${r.fill}" fill-rule="evenodd" stroke="#1a1a1a" stroke-width="1"${r.footing?' stroke-dasharray="5,3"':''}/>`)
      const images=stage.find('.print-element').map(node=>{
        const e=elements.find(e=>e.id===node.id())!
        if(e.bloxId==='text-note'&&node instanceof Konva.Container)return node.find('Text').map(text=>textSVG(text as Konva.Text)).join('')
        return native.has(e.bloxId)?`<g transform="translate(${ox},${oy})">${elementSVG(e,p).replace(/font-size="([\d.]+)"/g,(_,n)=>`font-size="${Math.max(12,Number(n))}"`)}</g>`:raster(node)
      })
      images.push(`<g transform="translate(${ox},${oy})">${planDimensions(project).map(d=>dimensionSVG(d,p,project.mode==='detail')).join('')}</g>`)
      // Native shared symbols stay vector. Custom canvas-only artwork is
      // embedded at print resolution, never replaced by a labeled rectangle.
      const notes=stage.findOne('.plan-notes');if(notes)images.push(raster(notes))
      if(underlay&&project.underlay){const size=computeRenderSize(project.underlay,p);vectors.unshift(`<image x="0" y="0" width="${size.w}" height="${size.h}" opacity="${project.underlay.opacity}" href="${esc(project.underlay.imageData)}"/>`)}
      stage.find('.print-arc').forEach(node=>images.unshift(raster(node)))
      stage.find('.print-wall-art').forEach(node=>images.unshift(raster(node)))
      const metadata=meta.getChildren().map(node=>{
        if(node instanceof Konva.Text)return textSVG(node)
        if(node instanceof Konva.Rect)return `<rect x="${node.x()}" y="${node.y()}" width="${node.width()}" height="${node.height()}" fill="none" stroke="#48515d" stroke-width="0.6"/>`
        if(node instanceof Konva.Line)return `<polyline points="${node.points().join(' ')}" fill="none" stroke="#48515d" stroke-width="0.7"/>`
        return ''
      }).join('')
      svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${page.widthIn}in" height="${page.heightIn}in" viewBox="0 0 ${page.width} ${page.height}"><title>${esc(project.name)}</title><desc>Scaled sheet. Shared symbols, walls and dimensions are vector; canvas-only symbols and the key use embedded print-resolution artwork.</desc><rect width="100%" height="100%" fill="white"/><g transform="translate(${ox},${oy})">${vectors.join('')}</g>${images.join('')}${metadata}</svg>`
    }
    const raw=stage.toDataURL({pixelRatio:EXPORT_PIXEL_RATIO,mimeType,quality:1})
    return {dataUrl:mimeType==='image/png'?pngWithResolution(raw,96*EXPORT_PIXEL_RATIO):raw,width:page.width*EXPORT_PIXEL_RATIO,height:page.height*EXPORT_PIXEL_RATIO,page,svg}
  } finally {root.unmount();container.remove()}
}
