import React from 'react'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

/** Two restrained diagonal strokes communicate glazing in monochrome output. */
function GlassMarks({x,y,w,h}:{x:number;y:number;w:number;h:number}) {
  if(w<12||h<12)return null
  const span=Math.min(w,h)*.2
  return <Group clipX={x} clipY={y} clipWidth={w} clipHeight={h} listening={false}>
    <Line points={[x+w*.64,y+h*.22,x+w*.64+span,y+h*.22+span]} stroke="#A7BAC7" strokeWidth={.65}/>
    <Line points={[x+w*.64-span*.35,y+h*.22+span*.2,x+w*.64+span*.35,y+h*.22+span*.9]} stroke="#A7BAC7" strokeWidth={.65}/>
  </Group>
}


/** Shared orthographic frame: the exterior footprint stays inside its nominal size. */
function ElevationWindow({widthPx:w,heightPx:h,properties,kind}:RendererProps & {kind:'fixed'|'single'|'double'|'casement'|'pair'}) {
  const f=Math.min(5,w*.065,h*.045),sill=Math.min(5,h*.045),iw=w-2*f,ih=h-2*f-sill
  const glass=typeof properties.glassColor==='string'?properties.glassColor:'#F3F7F9'
  const hung=kind==='single'||kind==='double'
  const mid=f+ih/2,rail=Math.min(f*.65,ih*.05),hingeLeft=properties.hingeLeft!==false
  return <Group>
    <Rect width={w} height={h-sill} fill="#E1E6EA" stroke={STROKE} strokeWidth={1.15}/>
    <Rect x={f} y={f} width={iw} height={ih} fill={glass} stroke="#687985" strokeWidth={.65}/>
    <GlassMarks x={f} y={f} w={iw} h={hung?ih/2:ih}/>
    {hung&&<>
      <Rect x={f} y={mid-rail/2} width={iw} height={rail} fill="#84939D" stroke={STROKE} strokeWidth={.5}/>
      <Line points={[w/2,f,w/2,mid-rail/2]} stroke="#84939D" strokeWidth={.55}/>
      <Line points={[w/2,mid+rail/2,w/2,f+ih]} stroke="#84939D" strokeWidth={.55}/>
      {(kind==='double'?[.25,.75]:[.75]).map((t,i)=>{
        const y=f+ih*t,dir=t<.5?1:-1,a=Math.min(6,iw*.12)
        return <Group key={i}>
          <Line points={[w*.67,y-dir*a,w*.67,y+dir*a]} stroke={STROKE} strokeWidth={.6}/>
          <Line points={[w*.67-a*.4,y+dir*a*.5,w*.67,y+dir*a,w*.67+a*.4,y+dir*a*.5]} stroke={STROKE} strokeWidth={.6}/>
        </Group>
      })}
    </>}
    {kind==='pair'&&<Rect x={w/2-f*.3} y={f} width={f*.6} height={ih} fill="#84939D"/>}
    {kind==='casement'&&<>
      <Line points={[hingeLeft?w-f:f,f,hingeLeft?f:w-f,f+ih/2,hingeLeft?w-f:f,f+ih]} stroke="#687985" strokeWidth={.65} dash={[4,3]}/>
      <Line points={[hingeLeft?w-f*1.6:f*1.6,h*.48,hingeLeft?w-f*1.6:f*1.6,h*.54]} stroke={STROKE} strokeWidth={1.2}/>
    </>}
    <Rect x={0} y={h-sill} width={w} height={sill} fill="#DCE2E6" stroke={STROKE} strokeWidth={.75}/>
  </Group>
}

export function ElevWallFaceRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#E3E6E8'
  const pattern = typeof properties.fillPattern === 'string' ? properties.fillPattern : 'brick'
  return (
    <Group>
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath(); nctx.rect(0, 0, widthPx, heightPx); nctx.clip()
          if (pattern === 'brick') {
            const CH = 10, BL = 28, MW = 0.45
            nctx.fillStyle = '#F2EEEA'; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.fillStyle = fill
            for (let row = -1; row * CH < heightPx + CH; row++) {
              const y = row * CH
              const xOff = (((row % 2) + 2) % 2) * (BL / 2)
              for (let col = -1; col * BL < widthPx + BL * 2; col++)
                nctx.fillRect(col * BL + xOff + MW, y + MW, BL - MW * 2, CH - MW * 2)
            }
            // Subtle tone variation
            // Mortar joints remain visible in grayscale and unfilled prints.
            nctx.strokeStyle = '#A9B2B8'; nctx.lineWidth = 0.45
            for (let row = 0; row * CH < heightPx; row++) {
              const y = row * CH
              nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
              for (let x = (row % 2) * BL / 2; x < widthPx; x += BL) {
                nctx.beginPath(); nctx.moveTo(x, y); nctx.lineTo(x, Math.min(heightPx,y+CH)); nctx.stroke()
              }
            }
            nctx.fillStyle = 'rgba(0,0,0,0.025)'
            for (let row = -1; row * CH < heightPx + CH; row++) {
              const y = row * CH
              const xOff = (((row % 2) + 2) % 2) * (BL / 2)
              for (let col = -1; col * BL < widthPx + BL * 2; col += 3)
                nctx.fillRect(col * BL + xOff + MW, y + MW, BL - MW * 2, CH - MW * 2)
            }
          } else if (pattern === 'stone') {
            const CH = 18
            const blockWidths = [36, 24, 48, 30, 42, 26]
            nctx.fillStyle = fill; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.strokeStyle = '#9E8E78'; nctx.lineWidth = 1
            for (let row = 0; row * CH < heightPx + CH; row++) {
              const y = row * CH
              nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
              const bw = blockWidths[row % blockWidths.length]
              const xStart = (row % 2 === 0) ? 0 : -(bw / 3)
              for (let x = xStart; x < widthPx + bw; x += bw) {
                nctx.beginPath(); nctx.moveTo(x, y); nctx.lineTo(x, Math.min(y + CH, heightPx)); nctx.stroke()
              }
            }
          } else if (pattern === 'board-batten') {
            const boardW = 18
            nctx.fillStyle = fill; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.strokeStyle = 'rgba(0,0,0,0.22)'; nctx.lineWidth = 0.8
            for (let x = boardW; x < widthPx; x += boardW) {
              nctx.beginPath(); nctx.moveTo(x, 0); nctx.lineTo(x, heightPx); nctx.stroke()
              nctx.beginPath(); nctx.moveTo(x+2,0); nctx.lineTo(x+2,heightPx); nctx.stroke()
            }
          } else if (pattern === 'concrete') {
            nctx.fillStyle = fill; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.fillStyle = 'rgba(0,0,0,0.06)'
            const dot = 1.2, sp = 9
            for (let row = 0; row * sp < heightPx; row++)
              for (let col = (row % 2) * sp / 2; col < widthPx; col += sp) {
                nctx.beginPath(); nctx.arc(col, row * sp, dot, 0, Math.PI * 2); nctx.fill()
              }
          } else {
            nctx.fillStyle = fill; nctx.fillRect(0, 0, widthPx, heightPx)
          }
          nctx.restore()
        }}
        listening={false}
      />
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke={STROKE} strokeWidth={STROKE_HEAVY} />
    </Group>
  )
}

export function ElevCantilevSlabRenderer({widthPx:w,heightPx:h,pixelsPerFoot,properties}:RendererProps) {
 const projectPpf=useStore(getPixelsPerFoot)
 const fill=typeof properties.fillColor==='string'?properties.fillColor:'#E5EAED'
 const taper=typeof properties.taperFt==='number'&&Number.isFinite(properties.taperFt)?properties.taperFt:0
 const inset=Math.max(0,Math.min(w*.5,taper*(pixelsPerFoot??projectPpf))),shadow=Math.min(h*.16,3)
 return <Group>
   <Line points={[0,0,w,0,w-inset,h,0,h]} closed fill={fill} stroke={STROKE} strokeWidth={1.1}/>
   <Line points={[0,h-shadow,w-inset*(h-shadow)/h,h-shadow,w-inset,h,0,h]} closed fill="#87949E"/>
   <Line points={[0,h,w-inset,h]} stroke={STROKE} strokeWidth={.85}/>
 </Group>
}

export function ElevPierRenderer({widthPx:w,heightPx:h}:RendererProps) {
 const inset=w*.14
 return <Group>
   <Rect width={w} height={h} fill="#EEF1F3" stroke={STROKE} strokeWidth={1.15}/>
   <Rect x={w-inset} width={inset} height={h} fill="#D7DEE3"/>
   <Line points={[inset,0,inset,h]} stroke="#AFBBC4" strokeWidth={.55}/>
   <Line points={[w-inset,0,w-inset,h]} stroke="#73818C" strokeWidth={.65}/>
 </Group>
}

export function ElevRibbonWindowRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const FRAME = Math.min(3,widthPx*.04,heightPx*.08)
  const glassColor = typeof properties.glassColor === 'string' ? properties.glassColor : '#EDF3F6'
  const solidColor = typeof properties.solidColor === 'string' ? properties.solidColor : '#D6DFE2'
  const solidBays = Array.isArray(properties.solidBays) ? (properties.solidBays as number[]) : []

  const mullionSpacingPx = Math.max(20, widthPx / Math.max(1, Math.round(widthPx / 48)))
  const bayCount = Math.max(1, Math.round(widthPx / mullionSpacingPx))
  const bayW = widthPx / bayCount

  const elems: React.ReactNode[] = []
  for (let i = 0; i < bayCount; i++) {
    const bx = i * bayW
    elems.push(
      <Rect
        key={`bay-${i}`}
        x={bx + FRAME} y={FRAME}
        width={bayW - FRAME * 2} height={heightPx - FRAME * 2}
        fill={solidBays.includes(i) ? solidColor : glassColor}
        listening={false}
      />
    )
    if(!solidBays.includes(i))elems.push(<GlassMarks key={`glass-${i}`} x={bx+FRAME} y={FRAME} w={bayW-FRAME*2} h={heightPx-FRAME*2}/>)
    if (i > 0) {
      elems.push(
        <Line key={`mul-${i}`} points={[bx, FRAME, bx, heightPx - FRAME]} stroke="#738593" strokeWidth={1} listening={false} />
      )
    }
  }

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#D3DDE3" stroke={STROKE} strokeWidth={STROKE_HEAVY} />
      {elems}
    </Group>
  )
}

export function ElevWindowFaceRenderer(props:RendererProps) { return <ElevationWindow {...props} kind="pair"/> }

export function ElevDoorFaceRenderer({widthPx:w,heightPx:h}:RendererProps) {
 const f=Math.min(w*.075,h*.035,5),gap=w*.11,pw=w-2*(f+gap)
 return <Group>
   <Rect width={w} height={h} fill="#DCE2E6" stroke={STROKE} strokeWidth={1.15}/>
   <Rect x={f} y={f} width={w-f*2} height={h-f*2} fill="#FAFBFC" stroke="#73818D" strokeWidth={.65}/>
   {[ [.09,.49],[.59,.30] ].map(([y,ht],i)=><Rect key={i} x={f+gap} y={h*y} width={pw} height={h*ht} stroke="#84919C" strokeWidth={.65}/>)}
   <Circle x={w*.81} y={h*.55} radius={Math.min(2,w*.028)} fill="#73818D"/>
   <Line points={[w*.7,h*.55,w*.83,h*.55]} stroke={STROKE} strokeWidth={1.2}/>
   <Line points={[0,h-f,w,h-f]} stroke={STROKE} strokeWidth={.85}/>
 </Group>
}

export function ElevCurtainWallRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const glassColor = typeof properties.glassColor === 'string' ? properties.glassColor : '#EDF3F6'
  const hMullionSpacing = Math.max(20, heightPx / Math.max(1, Math.round(heightPx / 96)))
  const vMullionSpacing = Math.max(20, widthPx / Math.max(1, Math.round(widthPx / 48)))
  const mullions: React.ReactNode[] = []
  for (let x = vMullionSpacing; x < widthPx; x += vMullionSpacing) {
    mullions.push(<Line key={`v${x}`} points={[x, 0, x, heightPx]} stroke="#738593" strokeWidth={0.75} listening={false} />)
  }
  for (let y = hMullionSpacing; y < heightPx; y += hMullionSpacing) {
    mullions.push(<Line key={`h${y}`} points={[0, y, widthPx, y]} stroke="#738593" strokeWidth={1} listening={false} />)
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={glassColor} stroke="#333" strokeWidth={1} />
      <GlassMarks x={0} y={0} w={vMullionSpacing} h={hMullionSpacing}/>
      <Rect x={2} y={2} width={Math.max(0,widthPx-4)} height={Math.max(0,heightPx-4)} stroke="#84939D" strokeWidth={.6}/>
      {mullions}
    </Group>
  )
}

export function ElevGradeLineRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.fillStyle = '#F3F4F5'
          nctx.fillRect(0, 0, widthPx, heightPx)
          nctx.strokeStyle = '#A2ADB5'
          nctx.lineWidth = 0.7
          const spacing = 14
          for (let t = -heightPx; t < widthPx + heightPx; t += spacing) {
            nctx.beginPath()
            nctx.moveTo(t, 0)
            nctx.lineTo(t + heightPx, heightPx)
            nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
      {/* heavy grade line at top */}
      <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_HEAVY} listening={false} />
      <Rect width={widthPx} height={heightPx} fill="transparent" />
    </Group>
  )
}

export function ElevShadowBandRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Rect width={widthPx} height={heightPx} fill="#52616D" stroke="transparent" strokeWidth={0} />
  )
}

export function ElevParapetRenderer({widthPx:w,heightPx:h,properties}:RendererProps) {
 const cap=h*.18
 return <Group>
   <Rect width={w} height={h} fill={typeof properties.fillColor==='string'?properties.fillColor:'#EEF1F3'} stroke={STROKE} strokeWidth={.9}/>
   <Rect width={w} height={cap} fill="#D3DCE2" stroke={STROKE} strokeWidth={1}/>
   <Line points={[0,cap+h*.07,w,cap+h*.07]} stroke="#87949E" strokeWidth={.6}/>
   {Array.from({length:Math.max(0,Math.floor(w/80)-1)},(_,i)=><Line key={i} points={[(i+1)*80,cap,(i+1)*80,h]} stroke="#A7B3BC" strokeWidth={.5}/>)}
 </Group>
}

// ─── LOUVER FINS ─────────────────────────────────────────────────────────────

export function ElevLouverFinsRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const angleDeg = typeof properties.angleDeg === 'number' ? properties.angleDeg : 0
  const finColor = typeof properties.fillColor === 'string' ? properties.fillColor : '#A5B8B2'
  const bgColor = typeof properties.bgColor === 'string' ? properties.bgColor : '#D9DFE1'

  if (angleDeg === 0) {
    // Horizontal stacked fins — venetian-blind appearance for plan-view louver banks
    const finCount = typeof properties.finCount === 'number'
      ? Math.max(1, Math.min(200, Math.round(Number.isFinite(properties.finCount) ? properties.finCount : 8)))
      : Math.max(3, Math.round(heightPx / 5))
    const finSpacing = heightPx / finCount
    const finH = finSpacing * 0.45
    const shadowH = Math.max(0.5, finH * 0.25)

    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill={bgColor} stroke="#444" strokeWidth={1} listening={false} />
        {Array.from({ length: finCount }, (_, i) => {
          const y = i * finSpacing
          return (
            <Group key={i}>
              <Rect x={0} y={y} width={widthPx} height={finH} fill={finColor} listening={false} />
              <Rect x={0} y={y + finH} width={widthPx} height={shadowH} fill="rgba(0,0,0,0.25)" listening={false} />
            </Group>
          )
        })}
      </Group>
    )
  }

  // Vertical fins (angleDeg === 90) — side-lit copper fin screen
  if (Math.abs(angleDeg - 90) < 1) {
    const finCount = typeof properties.finCount === 'number'
      ? Math.max(1, Math.min(200, Math.round(Number.isFinite(properties.finCount) ? properties.finCount : 8)))
      : Math.max(3, Math.round(widthPx / 8))
    const finSpacing = widthPx / finCount
    const finW = finSpacing * 0.3
    const shadowW = Math.max(0.5, finW * 0.25)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill={bgColor} stroke="#444" strokeWidth={1} listening={false} />
        {Array.from({ length: finCount }, (_, i) => {
          const x = i * finSpacing
          return (
            <Group key={i}>
              <Rect x={x} y={0} width={finW} height={heightPx} fill={finColor} listening={false} />
              <Rect x={x + finW} y={0} width={shadowW} height={heightPx} fill="rgba(0,0,0,0.25)" listening={false} />
            </Group>
          )
        })}
      </Group>
    )
  }

  // Diagonal angled fins — for pivoting / angled louver systems
  // Clamp angle to avoid tan(90°) = Infinity
  const clampedAngle = Math.max(-89, Math.min(89, angleDeg))
  const finCount = typeof properties.finCount === 'number'
    ? Math.max(1, Math.min(200, Math.round(Number.isFinite(properties.finCount) ? properties.finCount : 8)))
    : Math.max(2, Math.round(heightPx / 12))
  const finSpacing = heightPx / finCount
  const finThick = Math.max(1.5, finSpacing * 0.3)
  const tanA = Math.tan((clampedAngle * Math.PI) / 180)
  const yShift = widthPx * tanA

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(200,195,185,0.15)" stroke="#555" strokeWidth={1} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = finColor
          nctx.lineWidth = finThick
          nctx.lineCap = 'round'
          const loopEnd = heightPx + Math.abs(yShift) + finSpacing
          for (let y0 = -Math.abs(yShift); y0 < loopEnd; y0 += finSpacing) {
            nctx.beginPath()
            nctx.moveTo(0, y0)
            nctx.lineTo(widthPx, y0 - yShift)
            nctx.stroke()
            nctx.strokeStyle = 'rgba(0,0,0,0.18)'
            nctx.lineWidth = finThick * 0.5
            nctx.beginPath()
            nctx.moveTo(0, y0 + finThick * 0.8)
            nctx.lineTo(widthPx, y0 - yShift + finThick * 0.8)
            nctx.stroke()
            nctx.strokeStyle = finColor
            nctx.lineWidth = finThick
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

// ─── SPIRE / FINIAL ──────────────────────────────────────────────────────────

export function ElevSpireRenderer({widthPx:w,heightPx:h,properties}:RendererProps) {
 const fill=typeof properties.fillColor==='string'?properties.fillColor:'#D8E1DF'
 return <Group>
   <Line points={[w*.5,0,w*.72,h*.73,w,h,0,h,w*.28,h*.73]} closed fill={fill} stroke={STROKE} strokeWidth={1}/>
   <Line points={[w*.5,0,w*.5,h]} stroke="#81938F" strokeWidth={.6}/>
   <Line points={[w*.12,h*.91,w*.88,h*.91]} stroke={STROKE} strokeWidth={.65}/>
 </Group>
}

// ─── SPANDREL PANEL ──────────────────────────────────────────────────────────

export function ElevSpandrelPanelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#E0E7EB'
  const pattern = typeof properties.fillPattern === 'string' ? properties.fillPattern : 'dots'

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={fill} stroke="#333" strokeWidth={0.75} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          const step = Math.max(8, Math.min(16, widthPx / 12))

          if (pattern === 'triangles') {
            nctx.strokeStyle = 'rgba(0,0,0,0.18)'
            nctx.fillStyle = 'rgba(0,0,0,0.1)'
            nctx.lineWidth = 0.7
            for (let row = 0; row * step < heightPx + step; row++) {
              for (let col = 0; col * step < widthPx + step; col++) {
                const x = col * step, y = row * step
                nctx.beginPath()
                if ((row + col) % 2 === 0) {
                  nctx.moveTo(x, y + step); nctx.lineTo(x + step / 2, y); nctx.lineTo(x + step, y + step)
                } else {
                  nctx.moveTo(x, y); nctx.lineTo(x + step, y); nctx.lineTo(x + step / 2, y + step)
                }
                nctx.closePath()
                nctx.fill()
                nctx.stroke()
              }
            }
          } else if (pattern === 'grooves') {
            nctx.strokeStyle = 'rgba(0,0,0,0.22)'
            nctx.lineWidth = 0.8
            for (let x = step; x < widthPx; x += step) {
              nctx.beginPath(); nctx.moveTo(x, 0); nctx.lineTo(x, heightPx); nctx.stroke()
            }
            for (let y = step; y < heightPx; y += step) {
              nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
            }
            // highlight along top-left of each groove
            nctx.strokeStyle = 'rgba(255,255,255,0.18)'
            nctx.lineWidth = 0.5
            for (let x = step; x < widthPx; x += step) {
              nctx.beginPath(); nctx.moveTo(x - 1, 0); nctx.lineTo(x - 1, heightPx); nctx.stroke()
            }
          } else if (pattern === 'stone') {
            // Rusticated limestone / ashlar coursing
            const CH = Math.max(10, Math.min(22, heightPx / Math.max(2, Math.round(heightPx / 16))))
            const blockWidths = [38, 26, 44, 30, 22, 48, 34]
            nctx.strokeStyle = 'rgba(0,0,0,0.3)'; nctx.lineWidth = 0.6
            for (let row = 0; row * CH < heightPx + CH; row++) {
              const y = row * CH
              nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
              const bw = blockWidths[row % blockWidths.length]
              const xStart = (row % 2 === 0) ? 0 : -(bw / 2)
              for (let x = xStart; x < widthPx + bw; x += bw) {
                nctx.beginPath(); nctx.moveTo(x, y); nctx.lineTo(x, Math.min(y + CH, heightPx)); nctx.stroke()
              }
              // Rustication shadow at bottom of each course
              nctx.fillStyle = 'rgba(0,0,0,0.08)'
              nctx.fillRect(0, Math.min(y + CH - 2, heightPx - 2), widthPx, 2)
            }
          } else if (pattern === 'brick') {
            const CH = 6, BL = 16, MW = 0.8
            nctx.strokeStyle = fill; nctx.fillStyle = 'rgba(0,0,0,0.12)'
            for (let row = -1; row * CH < heightPx + CH; row++) {
              const y = row * CH
              const xOff = (((row % 2) + 2) % 2) * (BL / 2)
              for (let col = -1; col * BL < widthPx + BL * 2; col++) {
                nctx.beginPath()
                nctx.rect(col * BL + xOff + MW, y + MW, BL - MW * 2, CH - MW * 2)
                nctx.stroke()
              }
            }
          } else {
            // dots (default)
            nctx.fillStyle = 'rgba(0,0,0,0.12)'
            for (let row = 0; row * step < heightPx; row++) {
              const xOff = (row % 2) * step / 2
              for (let col = 0; col * step < widthPx + step; col++) {
                nctx.beginPath()
                nctx.arc(col * step + xOff, (row + 0.5) * step, 1.2, 0, Math.PI * 2)
                nctx.fill()
              }
            }
            nctx.fillStyle = 'rgba(255,255,255,0.18)'
            for (let row = 0; row * step < heightPx; row++) {
              const xOff = (row % 2) * step / 2
              for (let col = 0; col * step < widthPx + step; col++) {
                nctx.beginPath()
                nctx.arc(col * step + xOff - 0.6, (row + 0.5) * step - 0.6, 0.8, 0, Math.PI * 2)
                nctx.fill()
              }
            }
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

// ─── FLOOR LEVEL MARKER ───────────────────────────────────────────────────────

export function ElevFloorLevelMarkerRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.floorLabel === 'string' ? properties.floorLabel : 'FL'
  const fontSize = typeof properties.fontSize === 'number' && Number.isFinite(properties.fontSize)
    ? Math.max(8, Math.min(48, properties.fontSize))
    : Math.max(13, Math.min(32, heightPx * 1.25))
  const marker = fontSize * .32

  return (
    <Group>
      {/* Invisible background hit area */}
      <Rect width={widthPx} height={heightPx} fill="transparent" />
      {/* Datum line at top of element */}
      <Line points={[0, 1, widthPx, 1]} stroke="#334155" strokeWidth={0.75} listening={false} />
      {/* Small tick at left edge */}
      <Line points={[0,1,marker*1.7,1-marker,marker*1.7,1+marker]} closed fill="#334155" listening={false}/>
      {/* Label */}
      <Text
        text={label}
        x={marker * 1.7 + 6} y={-fontSize - 5}
        width={Math.max(widthPx - marker - 10,label.length*fontSize*.75)}
        fontSize={fontSize}
        fontFamily={ARC_FONT}
        fontStyle="bold"
        fill="#334155"
        listening={false}
      />
    </Group>
  )
}

// ─── MATERIAL CALLOUT ─────────────────────────────────────────────────────────

export function ElevMaterialCalloutRenderer({widthPx:w,heightPx:h,properties}:RendererProps) {
 const label=String(properties.material??'MATERIAL').toUpperCase(),elbow=w*.25,y=h*.55
 const size=Math.max(1,Math.min(11,h*.33,(w-elbow-5)/Math.max(1,label.length)/.72))
 return <Group>
   <Circle x={2} y={h*.88} radius={1.8} fill={STROKE}/>
   <Line points={[2,h*.88,elbow,y,w,y]} stroke={STROKE} strokeWidth={.7}/>
   <Text x={elbow+4} y={0} width={w-elbow-4} height={y-2} text={label} fontSize={size} fontFamily={ARC_FONT} fill={STROKE} verticalAlign="middle" wrap="none"/>
 </Group>
}

// ─── ANGLED PANEL ─────────────────────────────────────────────────────────────

export function ElevAngledPanelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const STROKE = '#334155'
  const angleDeg = typeof properties.angleDeg === 'number' ? properties.angleDeg : 30
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#EEF2F4'
  const skewPx = heightPx * Math.tan((Math.max(-80,Math.min(80,Number.isFinite(angleDeg)?angleDeg:30)) * Math.PI) / 180)

  // Parallelogram vertices: top-left, top-right, bottom-right, bottom-left
  // Skewed so top edge is shifted right by skewPx relative to bottom edge
  const pts = [skewPx, 0, skewPx + widthPx, 0, widthPx, heightPx, 0, heightPx]

  return (
    <Group>
      <Line
        points={pts}
        closed
        fill={fill}
        stroke={STROKE}
        strokeWidth={1}
        listening={false}
      />
    </Group>
  )
}

// ─── ELEVATION WINDOW TYPES ──────────────────────────────────────────────────

function _windowSill(widthPx: number, sillY: number, nctx: CanvasRenderingContext2D) {
  const proj = Math.max(3, widthPx * 0.07)
  nctx.fillStyle = '#D2D9DD'
  nctx.beginPath()
  nctx.moveTo(-proj, sillY)
  nctx.lineTo(widthPx + proj, sillY)
  nctx.lineTo(widthPx + proj * 0.6, sillY + 5)
  nctx.lineTo(-proj * 0.6, sillY + 5)
  nctx.closePath()
  nctx.fill()
  nctx.strokeStyle = '#888'; nctx.lineWidth = 0.8; nctx.stroke()
}

export function ElevWindowDoubleHungRenderer(props:RendererProps) { return <ElevationWindow {...props} kind="double"/> }

export function ElevWindowSingleHungRenderer(props:RendererProps) { return <ElevationWindow {...props} kind="single"/> }

export function ElevWindowCasementRenderer(props:RendererProps) { return <ElevationWindow {...props} kind="casement"/> }

export function ElevWindowFixedRenderer(props:RendererProps) { return <ElevationWindow {...props} kind="fixed"/> }

export function ElevWindowArchedRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(4, Math.min(7, widthPx * 0.1))
  const sillH = Math.max(5, heightPx * 0.08)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : '#EDF3F6'
  const midX = widthPx / 2
  const archR = midX  // semicircle radius = half width
  const springY = archR  // spring line at top — arch height = radius
  const rectH = heightPx - springY - sillH
  const innerW = widthPx - F * 2
  const keystoneW = Math.max(F * 1.2, 6)

  return (
    <Group>
      {/* Arch-shaped outer frame */}
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save()
        // Frame fill
        nctx.beginPath()
        nctx.moveTo(0, heightPx - sillH)
        nctx.lineTo(0, springY)
        nctx.arc(midX, springY, midX, Math.PI, 0)
        nctx.lineTo(widthPx, heightPx - sillH)
        nctx.closePath()
        nctx.fillStyle = '#ADB8BF'; nctx.fill()
        nctx.strokeStyle = '#2A2A2A'; nctx.lineWidth = 0.75; nctx.stroke()

        // Arch glass pane (inner arch)
        nctx.beginPath()
        nctx.moveTo(F, springY)
        nctx.arc(midX, springY, midX - F, Math.PI, 0)
        nctx.lineTo(F + innerW, springY)
        nctx.closePath()
        nctx.fillStyle = glass; nctx.fill()
        nctx.strokeStyle = '#72818D'; nctx.lineWidth = 0.8; nctx.stroke()

        // Radiating muntins
        const munCount = 5
        nctx.strokeStyle = '#7B8C99'; nctx.lineWidth = 0.6
        for (let i = 1; i < munCount; i++) {
          const angle = Math.PI - (i / munCount) * Math.PI
          const x1 = midX + (midX - F) * Math.cos(angle)
          const y1 = springY - (midX - F) * Math.sin(angle)
          nctx.beginPath(); nctx.moveTo(midX, springY); nctx.lineTo(x1, y1); nctx.stroke()
        }
        // Keystone
        const kx = midX - keystoneW / 2
        nctx.fillStyle = '#8A7A60'
        nctx.beginPath()
        nctx.moveTo(kx, F * 0.5)
        nctx.lineTo(kx + keystoneW, F * 0.5)
        nctx.lineTo(kx + keystoneW * 0.72, F*1.25)
        nctx.lineTo(kx + keystoneW * 0.28, F*1.25)
        nctx.closePath()
        nctx.fill(); nctx.strokeStyle = '#5A4A38'; nctx.lineWidth = 0.8; nctx.stroke()

        // Rectangular lower sash (below spring line)
        if (rectH > 8) {
          nctx.fillStyle = glass
          nctx.fillRect(F, springY, innerW, rectH)
          nctx.strokeStyle = '#72818D'; nctx.lineWidth = 0.8
          nctx.strokeRect(F, springY, innerW, rectH)
          nctx.strokeStyle = '#7B8C99'; nctx.lineWidth = 0.75
          nctx.beginPath(); nctx.moveTo(midX, springY); nctx.lineTo(midX, springY + rectH); nctx.stroke()
          // Meeting rail if tall enough
          if (rectH > 20) {
            const mY = springY + rectH / 2
            nctx.fillStyle = '#7B8C99'; nctx.fillRect(F, mY - 1.5, innerW, 3)
          }
        }
        _windowSill(widthPx, heightPx - sillH, nctx)
        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── WINDOW SURROUND (brownstone architrave molding) ─────────────────────────

export function ElevWindowSurroundRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const isArched = !!properties.arch
  const jamb = Math.max(5, Math.min(12, widthPx * 0.12))
  const bead = Math.max(2, jamb * 0.4)
  const fill1 = '#E0E2E1'
  const fill2 = '#F1F2F0'
  const shadow = 'rgba(0,0,0,0.22)'
  const highlight = 'rgba(255,255,255,0.18)'

  if (isArched) {
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="transparent" />
        <Shape sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
          nctx.save()
          const bandW = jamb + bead
          const innerR = widthPx / 2 - bandW
          const outerR = innerR + bandW
          const cx = widthPx / 2
          // Spring line sits so the arch crown lands near the top of the element
          const springY = Math.min(heightPx * 0.55, outerR + 2)
          const keystoneW = Math.max(bandW * 1.4, 10)

          // Arch voussoir band (semicircle from spring line upward)
          nctx.beginPath()
          nctx.arc(cx, springY, outerR, Math.PI, 0, false)
          nctx.arc(cx, springY, innerR, 0, Math.PI, true)
          nctx.closePath()
          nctx.fillStyle = fill1; nctx.fill()
          nctx.strokeStyle = '#7A6A58'; nctx.lineWidth = 0.8; nctx.stroke()

          // Inner bead arc
          nctx.beginPath()
          nctx.arc(cx, springY, innerR + bead, Math.PI, 0, false)
          nctx.arc(cx, springY, innerR, 0, Math.PI, true)
          nctx.closePath()
          nctx.fillStyle = fill2; nctx.fill()
          nctx.strokeStyle = '#8A7A68'; nctx.lineWidth = 0.7; nctx.stroke()

          // Voussoir joint lines radiating from center
          const numV = 9
          for (let i = 1; i < numV; i++) {
            if (i === Math.floor(numV / 2)) continue // skip center = keystone slot
            const angle = Math.PI - (i / numV) * Math.PI
            nctx.beginPath()
            nctx.moveTo(cx + innerR * Math.cos(angle), springY + innerR * Math.sin(angle))
            nctx.lineTo(cx + outerR * Math.cos(angle), springY + outerR * Math.sin(angle))
            nctx.strokeStyle = 'rgba(90,75,60,0.55)'; nctx.lineWidth = 0.7; nctx.stroke()
          }

          // Keystone (trapezoid at crown)
          const ky1 = springY - outerR
          const ky2 = springY - innerR + bead
          nctx.beginPath()
          nctx.moveTo(cx - keystoneW * 0.22, ky2)
          nctx.lineTo(cx + keystoneW * 0.22, ky2)
          nctx.lineTo(cx + keystoneW * 0.16, ky1 + 1)
          nctx.lineTo(cx - keystoneW * 0.16, ky1 + 1)
          nctx.closePath()
          nctx.fillStyle = '#A89070'; nctx.fill()
          nctx.strokeStyle = '#7A6050'; nctx.lineWidth = 0.8; nctx.stroke()
          nctx.beginPath(); nctx.moveTo(cx, ky1 + 3); nctx.lineTo(cx, ky2 - 2)
          nctx.strokeStyle = 'rgba(0,0,0,0.2)'; nctx.lineWidth = 0.6; nctx.stroke()

          // Left jamb below spring line
          nctx.fillStyle = fill1
          nctx.fillRect(0, springY, bandW, heightPx - springY)
          nctx.strokeStyle = '#7A6A58'; nctx.lineWidth = 0.8
          nctx.strokeRect(0, springY, bandW, heightPx - springY)
          nctx.fillStyle = fill2
          nctx.fillRect(bandW - bead, springY, bead, heightPx - springY)
          nctx.strokeStyle = '#8A7A68'; nctx.strokeRect(bandW - bead, springY, bead, heightPx - springY)

          // Right jamb below spring line
          nctx.fillStyle = fill1
          nctx.fillRect(widthPx - bandW, springY, bandW, heightPx - springY)
          nctx.strokeStyle = '#7A6A58'; nctx.strokeRect(widthPx - bandW, springY, bandW, heightPx - springY)
          nctx.fillStyle = fill2
          nctx.fillRect(widthPx - bandW, springY, bead, heightPx - springY)
          nctx.strokeStyle = '#8A7A68'; nctx.strokeRect(widthPx - bandW, springY, bead, heightPx - springY)

          // Depth shadows + highlights on jambs
          nctx.fillStyle = shadow
          nctx.fillRect(bandW - bead - 1, springY, 1, heightPx - springY)
          nctx.fillRect(widthPx - bandW + bead, springY, 1, heightPx - springY)
          nctx.fillStyle = highlight
          nctx.fillRect(1, springY, 1, heightPx - springY)
          nctx.fillRect(widthPx - 2, springY, 1, heightPx - springY)

          nctx.restore()
        }} listening={false} />
      </Group>
    )
  }

  // ── Flat lintel version (original) ─────────────────────────────────────────
  const lintelH = Math.max(6, jamb * 1.4)
  const keystoneW = Math.max(jamb * 1.6, 10)
  const keystoneH = lintelH + 4

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="transparent" />
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save()

        function drawBand(x: number, y: number, w: number, h: number, side: 'top' | 'left' | 'right') {
          nctx.fillStyle = fill1; nctx.fillRect(x, y, w, h)
          nctx.strokeStyle = '#7A6A58'; nctx.lineWidth = 0.8; nctx.strokeRect(x, y, w, h)
          if (side === 'left')  { nctx.fillStyle = fill2; nctx.fillRect(x + jamb, y, bead, h); nctx.strokeStyle = '#8A7A68'; nctx.strokeRect(x + jamb, y, bead, h) }
          if (side === 'right') { nctx.fillStyle = fill2; nctx.fillRect(x + w - jamb - bead, y, bead, h); nctx.strokeStyle = '#8A7A68'; nctx.strokeRect(x + w - jamb - bead, y, bead, h) }
          if (side === 'top')   { nctx.fillStyle = fill2; nctx.fillRect(x, y + lintelH, w, bead); nctx.strokeStyle = '#8A7A68'; nctx.strokeRect(x, y + lintelH, w, bead) }
          if (side === 'left')  { nctx.fillStyle = shadow; nctx.fillRect(x + jamb + bead, y, 1, h); nctx.fillStyle = highlight; nctx.fillRect(x + 1, y, 1, h) }
          if (side === 'right') { nctx.fillStyle = shadow; nctx.fillRect(x + w - jamb - bead - 1, y, 1, h); nctx.fillStyle = highlight; nctx.fillRect(x + w - 2, y, 1, h) }
          if (side === 'top')   { nctx.fillStyle = shadow; nctx.fillRect(x, y + lintelH + bead, w, 1); nctx.fillStyle = highlight; nctx.fillRect(x, y + 1, w, 1) }
        }

        drawBand(0, 0, jamb + bead, heightPx, 'left')
        drawBand(widthPx - jamb - bead, 0, jamb + bead, heightPx, 'right')
        drawBand(0, 0, widthPx, lintelH + bead, 'top')
        const kx = widthPx / 2 - keystoneW / 2
        nctx.fillStyle = '#A89070'
        nctx.beginPath()
        nctx.moveTo(kx, 0); nctx.lineTo(kx + keystoneW, 0)
        nctx.lineTo(kx + keystoneW * 0.78, keystoneH); nctx.lineTo(kx + keystoneW * 0.22, keystoneH)
        nctx.closePath(); nctx.fill()
        nctx.strokeStyle = '#7A6050'; nctx.lineWidth = 0.8; nctx.stroke()
        nctx.strokeStyle = 'rgba(0,0,0,0.2)'; nctx.lineWidth = 0.6
        nctx.beginPath(); nctx.moveTo(widthPx/2, 2); nctx.lineTo(widthPx/2, keystoneH - 2); nctx.stroke()
        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── STAIR FRONT VIEW (front-facing perspective of stoop steps) ───────────────

export function ElevStairFrontRenderer({widthPx:w,heightPx:h,properties}:RendererProps) {
 const count=Math.max(2,Math.min(100,Math.round(typeof properties.stepCount==='number'&&Number.isFinite(properties.stepCount)?properties.stepCount:h/10)))
 const rise=h/count
 return <Group>
   <Rect width={w} height={h} fill="#F1F3F5" stroke={STROKE} strokeWidth={1.1}/>
   {Array.from({length:count},(_,i)=><Group key={i}>
     <Line points={[0,i*rise,w,i*rise]} stroke={STROKE} strokeWidth={.85}/>
     <Line points={[0,i*rise+Math.min(2,rise*.14),w,i*rise+Math.min(2,rise*.14)]} stroke="#B8C2C9" strokeWidth={.5}/>
   </Group>)}
 </Group>
}

// ─── ANNOTATION SYMBOLS ──────────────────────────────────────────────────────

export function ElevBayWindowRenderer({widthPx:w,heightPx:h,properties,pixelsPerFoot,rotation,selected}:RendererProps) {
 const cap=h*.055,base=h*.07,side=w*.19,body=h-cap-base
 return <Group>
   <Rect width={w} height={h} fill="#EDF0F2" stroke={STROKE} strokeWidth={1.15}/>
   {[0,w-side].map(x=><Rect key={x} x={x} y={cap} width={side} height={body} fill="#DCE3E7"/>)}
   {[side,w-side].map(x=><Line key={x} points={[x,cap,x,h-base]} stroke={STROKE} strokeWidth={.85}/>)}
   {[[side+w*.045,w-side*2-w*.09],[w*.035,side-w*.07],[w-side+w*.035,side-w*.07]].map(([x,ww],i)=><Group key={i} x={x} y={cap+body*.08}>
     <ElevationWindow widthPx={ww} heightPx={body*.77} properties={properties} pixelsPerFoot={pixelsPerFoot} rotation={rotation} selected={selected} kind="double"/>
   </Group>)}
   <Rect width={w} height={cap} fill="#D3DDE2" stroke={STROKE} strokeWidth={.85}/>
   <Rect y={h-base} width={w} height={base} fill="#D3DDE2" stroke={STROKE} strokeWidth={.85}/>
   <Line points={[0,cap+2,w,cap+2]} stroke="#84939D" strokeWidth={.6}/>
 </Group>
}

// ─── INTERIOR ELEVATION TARGET ───────────────────────────────────────────────

export function ElevRailingRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#788892'
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    const railH = Math.max(2, heightPx * 0.08)
    const balusterCount = Math.max(2, Math.round(widthPx / 14))
    return (
      <Group>
        <Rect x={0} y={0} width={widthPx} height={railH} fill={fill} stroke={STROKE} strokeWidth={0.5} />
        <Line points={[0, railH, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
        <Line points={[widthPx, railH, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
        {Array.from({ length: balusterCount - 1 }, (_, i) => {
          const x = ((i + 1) / balusterCount) * widthPx
          return <Line key={i} points={[x, railH, x, heightPx]} stroke="#666" strokeWidth={0.5} listening={false} />
        })}
        <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.5} listening={false} />
      </Group>
    )
  }
  const railW = Math.max(2, widthPx * 0.08)
  const balusterCount = Math.max(2, Math.round(heightPx / 14))
  return (
    <Group>
      <Rect x={0} y={0} width={railW} height={heightPx} fill={fill} stroke={STROKE} strokeWidth={0.5} />
      <Line points={[railW, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
      <Line points={[railW, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
      {Array.from({ length: balusterCount - 1 }, (_, i) => {
        const y = ((i + 1) / balusterCount) * heightPx
        return <Line key={i} points={[railW, y, widthPx, y]} stroke="#666" strokeWidth={0.5} listening={false} />
      })}
      <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.5} listening={false} />
    </Group>
  )
}

export function ElevSidingRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#EEF1F2'
  const courseH = Math.max(5, Math.min(18, heightPx / Math.max(4, Math.round(heightPx / 8))))
  const courses = Math.ceil(heightPx / courseH)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={fill} stroke="#333" strokeWidth={0.75} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as any)._context as CanvasRenderingContext2D
        nc.save()
        nc.beginPath(); nc.rect(0, 0, widthPx, heightPx); nc.clip()
        for (let i = 1; i < courses; i++) {
          const y = i * courseH
          nc.strokeStyle = 'rgba(0,0,0,0.28)'; nc.lineWidth = 0.8
          nc.beginPath(); nc.moveTo(0, y); nc.lineTo(widthPx, y); nc.stroke()
          nc.strokeStyle = 'rgba(0,0,0,0.07)'; nc.lineWidth = 1.5
          nc.beginPath(); nc.moveTo(0, y + 1); nc.lineTo(widthPx, y + 1); nc.stroke()
        }
        nc.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── NEW DETAILS ──────────────────────────────────────────────────────────────

export const ELEVATION_RENDERERS: Record<string, RendererComponent> = {
  'elev-wall-face': ElevWallFaceRenderer,
  'elev-cantilever-slab': ElevCantilevSlabRenderer,
  'elev-pier': ElevPierRenderer,
  'elev-ribbon-window': ElevRibbonWindowRenderer,
  'elev-window-face': ElevWindowFaceRenderer,
  'elev-window-double-hung': ElevWindowDoubleHungRenderer,
  'elev-window-single-hung': ElevWindowSingleHungRenderer,
  'elev-window-casement': ElevWindowCasementRenderer,
  'elev-window-fixed': ElevWindowFixedRenderer,
  'elev-window-arched': ElevWindowArchedRenderer,
  'elev-window-surround': ElevWindowSurroundRenderer,
  'elev-stair-front': ElevStairFrontRenderer,
  'elev-door-face': ElevDoorFaceRenderer,
  'elev-curtain-wall': ElevCurtainWallRenderer,
  'elev-grade-line': ElevGradeLineRenderer,
  'elev-shadow-band': ElevShadowBandRenderer,
  'elev-parapet': ElevParapetRenderer,
  'elev-louver-fins': ElevLouverFinsRenderer,
  'elev-spire': ElevSpireRenderer,
  'elev-spandrel-panel': ElevSpandrelPanelRenderer,
  'elev-floor-level-marker': ElevFloorLevelMarkerRenderer,
  'elev-material-callout': ElevMaterialCalloutRenderer,
  'elev-angled-panel': ElevAngledPanelRenderer,
  'elev-bay-window': ElevBayWindowRenderer,
  'elev-railing': ElevRailingRenderer,
  'elev-siding': ElevSidingRenderer,
}
