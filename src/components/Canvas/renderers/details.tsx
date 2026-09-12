import React from 'react'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

export function InsulationBattRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const longPx = isVertical ? heightPx : widthPx
  const shortPx = isVertical ? widthPx : heightPx
  const r = shortPx / 2
  const loopCount = Math.max(2, Math.min(120, Math.round(longPx / (r * 1.1))))
  const loopStep = longPx / loopCount

  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="#F5F2E8" stroke="#A79D85" strokeWidth={STROKE_THIN} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = '#776D57'
          nctx.lineWidth = 1
          const mid = shortPx / 2
          nctx.beginPath()
          const point=(a:number,b:number)=>isVertical?[b,a]:[a,b]
          nctx.moveTo(...point(0,mid) as [number,number])
          for(let i=0;i<loopCount;i++){
            const a=i*loopStep,b=(i+1)*loopStep,side=i%2?shortPx*.95:shortPx*.05
            const p=point(a+loopStep*.15,side),q=point(b-loopStep*.15,side),end=point(b,mid)
            nctx.bezierCurveTo(p[0],p[1],q[0],q[1],end[0],end[1])
          }
          nctx.stroke()
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function DrywallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F4F4F0" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.fillStyle = '#555'
          const step = 5
          const dotR = 0.6
          for (let row = 0; row * step < heightPx + step; row++) {
            const xOffset = (row % 2) * (step / 2)
            for (let col = 0; col * step < widthPx + step; col++) {
              const x = col * step + xOffset
              const y = row * step
              nctx.beginPath()
              nctx.arc(x, y, dotR, 0, Math.PI * 2)
              nctx.fill()
            }
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function StudRenderer({ widthPx, heightPx }: RendererProps) {
  const inset=Math.min(widthPx,heightPx)*.055
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* Diagonal X — standard wood-in-section symbol */}
      <Line points={[inset, inset, widthPx-inset, heightPx-inset]} stroke="#867458" strokeWidth={0.85} />
      <Line points={[widthPx-inset, inset, inset, heightPx-inset]} stroke="#867458" strokeWidth={0.85} />
    </Group>
  )
}

/** Edge grain: quiet longitudinal fibers, distinct from face knots and section X. */
export function StudEdgeRenderer({widthPx:w,heightPx:h}:RendererProps){
  const vertical=h>=w,short=Math.min(w,h),long=Math.max(w,h)
  return <Group>
    <Rect width={w} height={h} fill="#EFE6D5" stroke={STROKE} strokeWidth={STROKE_MED}/>
    {[.28,.62].map((t,i)=><Line key={i} points={vertical?[short*t,0,short*(t+.04),long*.45,short*t,long]:[0,short*t,long*.45,short*(t+.04),long,short*t]} stroke="#9A8869" strokeWidth={.65} listening={false}/>)}
  </Group>
}

export function StudFaceRenderer({ widthPx, heightPx }: RendererProps) {
  // Grain lines run along the long axis; density adapts to short-axis width
  const isVertical = heightPx >= widthPx
  const shortDim = isVertical ? widthPx : heightPx
  const longDim  = isVertical ? heightPx : widthPx
  // One grain line roughly every 5px of short dimension, min 2, max 8
  const numLines = Math.min(5, Math.max(2, Math.floor(shortDim / 12)))
  const lines = Array.from({ length: numLines }, (_, i) => {
    const t = (i + 1) / (numLines + 1)
    // Slight S-curve along the long axis for a natural grain look
    const offset = shortDim * 0.06 * (i % 2 === 0 ? 1 : -1)
    if (isVertical) {
      const x = t * widthPx
      return (
        <Shape key={i}
          sceneFunc={(ctx) => {
            ctx.beginPath()
            ;(ctx as any)._context.moveTo(x, 3)
            ;(ctx as any)._context.bezierCurveTo(
              x + offset, longDim * 0.3,
              x - offset, longDim * 0.7,
              x, longDim - 3
            )
            ;(ctx as any)._context.strokeStyle = '#948263'
            ;(ctx as any)._context.lineWidth = 0.5
            ;(ctx as any)._context.globalAlpha = 0.75
            ;(ctx as any)._context.stroke()
            ;(ctx as any)._context.globalAlpha = 1
          }}
          listening={false}
        />
      )
    } else {
      const y = t * heightPx
      return (
        <Shape key={i}
          sceneFunc={(ctx) => {
            ctx.beginPath()
            ;(ctx as any)._context.moveTo(3, y)
            ;(ctx as any)._context.bezierCurveTo(
              longDim * 0.3, y + offset,
              longDim * 0.7, y - offset,
              longDim - 3, y
            )
            ;(ctx as any)._context.strokeStyle = '#948263'
            ;(ctx as any)._context.lineWidth = 0.5
            ;(ctx as any)._context.globalAlpha = 0.75
            ;(ctx as any)._context.stroke()
            ;(ctx as any)._context.globalAlpha = 1
          }}
          listening={false}
        />
      )
    }
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
      {/* Elongated grain loop distinguishes a face from a cut section. */}
      <Ellipse x={widthPx*.52} y={heightPx*.52} radiusX={isVertical?shortDim*.12:longDim*.10} radiusY={isVertical?longDim*.10:shortDim*.12} stroke="#958064" strokeWidth={.65} listening={false}/>
      <Ellipse x={widthPx*.52} y={heightPx*.52} radiusX={isVertical?shortDim*.055:longDim*.055} radiusY={isVertical?longDim*.055:shortDim*.055} stroke="#AD997B" strokeWidth={.45} listening={false}/>
    </Group>
  )
}

// Parallelogram rafter with built-in plumb cuts at both ends.
// width = horizontal overhang extent, height = total vertical extent (rise + D_vert).
// properties.pitchRise: rise per 12 run (default 4 for 4:12).

export function RafterRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const pitchRise = (properties?.pitchRise as number) ?? 4
  const rise = widthPx * (pitchRise / 12)
  const Dv = heightPx - rise  // vertical depth of plumb cut

  // Parallelogram: left=eave(low), right=wall(high)
  const shape = [0, rise, widthPx, 0, widthPx, Dv, 0, heightPx]

  // Face grain lines parallel to the slope, evenly spaced across D_vert
  const numLines = Math.min(6, Math.max(2, Math.floor(Dv / 12)))
  const grainLines: number[][] = []
  for (let i = 1; i < numLines; i++) {
    const t = i / numLines
    grainLines.push([0, rise + t * Dv, widthPx, t * Dv])
  }

  return (
    <Group>
      <Line points={shape} closed fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      {grainLines.map((pts, i) => (
        <Line key={i} points={pts} stroke="#948263" strokeWidth={0.65} opacity={0.8} listening={false} />
      ))}
    </Group>
  )
}

// Pitched layer (shingles, plywood, felt) with plumb-cut ends.
// Same parallelogram geometry as RafterRenderer but with its own fill/pattern.

export function PitchedLayerRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const pitchRise = (properties?.pitchRise as number) ?? 4
  const layerType = (properties?.layerType as string) ?? 'plywood'
  const rise = widthPx * (pitchRise / 12)
  const Dv = heightPx - rise

  const shape = [0, rise, widthPx, 0, widthPx, Dv, 0, heightPx]

  const fills: Record<string, string> = {
    shingles: '#B7C0C7',
    felt:     '#46505A',
    plywood:  '#EAE1CE',
  }
  const fill = fills[layerType] ?? '#EAE1CE'

  return (
    <Group>
      <Line points={shape} closed fill={fill} stroke={STROKE} strokeWidth={STROKE_MED} />
      {layerType === 'plywood' && (() => {
        // Ply lines parallel to slope
        const numPlies = 5
        return Array.from({ length: numPlies - 1 }, (_, i) => {
          const t = (i + 1) / numPlies
          return <Line key={i} points={[0, rise + t * Dv, widthPx, t * Dv]} stroke="#8A795E" strokeWidth={0.6} listening={false} />
        })
      })()}
      {layerType === 'shingles' && (() => {
        // Course lines parallel to slope
        const courseH = Math.max(4, Dv / 3)
        const lines = []
        for (let y = courseH; y < Dv; y += courseH) {
          lines.push(<Line key={y} points={[0, rise + y, widthPx, y]} stroke="#52616D" strokeWidth={0.8} listening={false} />)
        }
        return lines
      })()}
    </Group>
  )
}

export function PlywoodRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  // Ply layer lines run perpendicular to the long axis (showing edge grain in section)
  const numPlies = 5
  const lines = Array.from({ length: numPlies - 1 }, (_, i) => {
    const t = (i + 1) / numPlies
    return isVertical
      ? <Line key={i} points={[t * widthPx, 1, t * widthPx, heightPx - 1]} stroke="#9A896A" strokeWidth={0.5} opacity={0.65} listening={false} />
      : <Line key={i} points={[1, t * heightPx, widthPx - 1, t * heightPx]} stroke="#9A896A" strokeWidth={0.5} opacity={0.65} listening={false} />
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EAE1CE" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
    </Group>
  )
}

export function RigidInsulationRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EAF0F1" stroke="#607D83" strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(ctx) => {
          const native = (ctx as any)._context as CanvasRenderingContext2D
          const vertical=heightPx>widthPx,short=Math.min(widthPx,heightPx),long=Math.max(widthPx,heightPx)
          const steps=Math.min(200,Math.max(4,Math.ceil(long/Math.max(short*.6,6))))
          native.strokeStyle = '#718D93'
          native.lineWidth = 0.6
          native.beginPath()
          for(let i=0;i<=steps;i++) {
            const a=i*long/steps,b=short*(i%2?.78:.22),x=vertical?b:a,y=vertical?a:b
            if(i===0)native.moveTo(x,y);else native.lineTo(x,y)
          }
          native.stroke()
          native.globalAlpha = 1
        }}
        listening={false}
      />
    </Group>
  )
}

export function VentBaffleRenderer({ widthPx, heightPx }: RendererProps) {
  const vertical=heightPx>widthPx,short=Math.min(widthPx,heightPx),long=Math.max(widthPx,heightPx)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F5F8F9" stroke="#78939A" strokeWidth={STROKE_MED} dash={[4, 3]} />
      {[.22,.78].map(t=><Line key={t} points={vertical?[short*t,0,short*t,long]:[0,short*t,long,short*t]} stroke="#607D88" strokeWidth={.7} listening={false}/>)}
      {[.3,.65].map(t=><Line key={t} points={vertical?[short*.35,long*t-short*.15,short*.5,long*t,short*.65,long*t-short*.15]:[long*t-short*.15,short*.35,long*t,short*.5,long*t-short*.15,short*.65]} stroke="#607D88" strokeWidth={.7} listening={false}/>)}
    </Group>
  )
}

export function SoffitPanelRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const slotCount = isVertical
    ? Math.max(2, Math.round(heightPx / 16))
    : Math.max(2, Math.round(widthPx / 16))
  const slots = Array.from({ length: slotCount }, (_, i) => {
    const t = (i + 1) / (slotCount + 1)
    const hw = 1.5
    return isVertical
      ? [
          <Line key={`a${i}`} points={[widthPx * 0.25, t * heightPx - hw, widthPx * 0.75, t * heightPx - hw]} stroke="#888" strokeWidth={0.8} listening={false} />,
          <Line key={`b${i}`} points={[widthPx * 0.25, t * heightPx + hw, widthPx * 0.75, t * heightPx + hw]} stroke="#888" strokeWidth={0.8} listening={false} />,
        ]
      : [
          <Line key={`a${i}`} points={[t * widthPx - hw, heightPx * 0.25, t * widthPx - hw, heightPx * 0.75]} stroke="#888" strokeWidth={0.8} listening={false} />,
          <Line key={`b${i}`} points={[t * widthPx + hw, heightPx * 0.25, t * widthPx + hw, heightPx * 0.75]} stroke="#888" strokeWidth={0.8} listening={false} />,
        ]
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EDF0EF" stroke={STROKE} strokeWidth={STROKE_MED} />
      {slots}
    </Group>
  )
}

export function ShinglesRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#D8DDE1" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(ctx) => {
          const native = (ctx as any)._context as CanvasRenderingContext2D
          const courseH = Math.max(5, heightPx / 3)
          const tabW = Math.max(8, widthPx / 6)
          native.save()
          native.beginPath()
          native.rect(0, 0, widthPx, heightPx)
          native.clip()
          native.strokeStyle = '#53606B'
          native.lineWidth = 1
          let y = heightPx
          let course = 0
          while (y > -courseH && course < 30) {
            // A shallow overlap shadow separates courses without obscuring tab cuts.
            native.fillStyle = '#B5BEC6'
            native.fillRect(0, y - Math.min(2, courseH * .12), widthPx, Math.min(2, courseH * .12))
            native.beginPath(); native.moveTo(0, y); native.lineTo(widthPx, y); native.stroke()
            const off = (course % 2) * (tabW * 0.5)
            for (let x = off; x < widthPx; x += tabW) {
              native.beginPath(); native.moveTo(x, y); native.lineTo(x, y - courseH * 0.7); native.stroke()
            }
            y -= courseH
            course++
          }
          native.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function FlashingRenderer({ widthPx, heightPx }: RendererProps) {
  const vertical=heightPx>widthPx
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#BCC6CC" stroke="#555" strokeWidth={STROKE_MED} />
      {[.18,.82].map(t=><Line key={t} points={vertical?[widthPx*t,0,widthPx*t,heightPx]:[0,heightPx*t,widthPx,heightPx*t]} stroke="#52636E" strokeWidth={.65} listening={false}/>)}
    </Group>
  )
}

export function GutterRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Shape
        width={widthPx} height={heightPx}
        sceneFunc={(_ctx) => {
          const ctx = (_ctx as any)._context as CanvasRenderingContext2D
          const w = widthPx, h = heightPx
          ctx.beginPath()
          // Open formed-metal K profile: back, bottom, ogee and rolled lip.
          ctx.moveTo(w*.04,h*.03);ctx.lineTo(w*.04,h*.94);ctx.lineTo(w*.66,h*.94)
          ctx.bezierCurveTo(w*.66,h*.60,w*.91,h*.64,w*.91,h*.28)
          ctx.lineTo(w*.97,h*.20);ctx.lineTo(w*.97,h*.08);ctx.lineTo(w*.78,h*.08)
          ctx.strokeStyle = '#52616B'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }}
        listening={false}
      />
      {/* A native node contributes the strap's true extents to preview/export bounds. */}
      <Line points={[widthPx*.04,heightPx*.25,widthPx*.04,-heightPx*.18,widthPx*.5,-heightPx*.35,widthPx*.82,heightPx*.08]} stroke="#667680" strokeWidth={.85} listening={false}/>
    </Group>
  )
}

export function CmuBlockRenderer({ widthPx, heightPx }: RendererProps) {
  const courseH = Math.max(8, widthPx)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#E5E7E6" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(_ctx) => {
          const ctx = (_ctx as any)._context as CanvasRenderingContext2D
          ctx.save()
          ctx.beginPath(); ctx.rect(0, 0, widthPx, heightPx); ctx.clip()
          const courses = Math.ceil(heightPx / courseH)
          // horizontal mortar bed joints between courses
          ctx.strokeStyle = '#6E6E6E'
          ctx.lineWidth = 0.6
          for (let i = 1; i < courses; i++) {
            const y = courseH * i
            ctx.fillStyle = 'white'; ctx.fillRect(0,y-1,widthPx,2)
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(widthPx, y); ctx.stroke()
          }
          // sparse diagonal hatch — concrete block core texture
          ctx.strokeStyle = '#8A8A8A'
          ctx.lineWidth = 0.4
          ctx.globalAlpha = 0.6
          const sp = Math.max(6, widthPx * 0.3)
          const diag = Math.max(widthPx, heightPx)
          for (let t = -diag; t < widthPx + diag; t += sp) {
            ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t + diag, diag); ctx.stroke()
          }
          ctx.globalAlpha = 1
          ctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function BrickVeneerRenderer({ widthPx, heightPx }: RendererProps) {
  const courseH = Math.max(3, widthPx * .7)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#D9C4B6" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(_ctx) => {
          const ctx = (_ctx as any)._context as CanvasRenderingContext2D
          const courses = Math.ceil(heightPx / courseH)
          ctx.save()
          ctx.beginPath();ctx.rect(0,0,widthPx,heightPx);ctx.clip()
          const jW = widthPx * 2.25
          ctx.strokeStyle = '#8C7767'
          ctx.lineWidth = 0.9
          ctx.globalAlpha = 1
          for (let i = 1; i < courses; i++) {
            const y = courseH * i
            ctx.fillStyle='white';ctx.fillRect(0,y-1,widthPx,2)
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(widthPx, y); ctx.stroke()
          }
          for (let i = 0; i < courses; i++) {
            const y1 = courseH * i, y2 = Math.min(courseH * (i + 1), heightPx)
            const off = (i % 2) * (jW / 2)
            for (let x = off; x < widthPx; x += jW) {
              ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke()
            }
          }
          ctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function FeltRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#46505A" stroke="#222" strokeWidth={STROKE_MED} />
      <Line points={[1, heightPx * 0.4, widthPx - 1, heightPx * 0.4]} stroke="rgba(255,255,255,0.15)" strokeWidth={Math.max(0.3, heightPx * 0.15)} listening={false} />
    </Group>
  )
}

// ─── OPENINGS ────────────────────────────────────────────────────────────────

export function LvlBeamRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const shortD = isVertical ? widthPx : heightPx
  const lamCount = Math.min(12,Math.max(3, Math.round(shortD / 8)))
  const lines = Array.from({ length: lamCount - 1 }, (_, i) => {
    const t = (i + 1) / lamCount
    return isVertical
      ? <Line key={i} points={[t * widthPx, 0, t * widthPx, heightPx]} stroke="#8B7759" strokeWidth={0.7} listening={false} />
      : <Line key={i} points={[0, t * heightPx, widthPx, t * heightPx]} stroke="#8B7759" strokeWidth={0.7} listening={false} />
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
    </Group>
  )
}

export function TjiJoistRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx > widthPx
  if (isPortrait) {
    const flangeH = Math.min(heightPx*.25,Math.max(1, heightPx * 0.1))
    const webW = Math.min(widthPx*.5,Math.max(1, widthPx * 0.28))
    const webX = (widthPx - webW) / 2
    const webH = heightPx - flangeH * 2
    return (
      <Group>
        <Rect x={0} y={0} width={widthPx} height={flangeH} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={0} y={heightPx - flangeH} width={widthPx} height={flangeH} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={webX} y={flangeH} width={webW} height={webH} fill="#DAD0BB" stroke={STROKE} strokeWidth={0.5} />
        {[1, 2,3,4,5,6].map(i => (
          <Line key={i} points={[webX+webW*.15,flangeH+(i/7)*webH-webH*.025,webX+webW*.85,flangeH+(i/7)*webH+webH*.025]}
            stroke="#8C7C61" strokeWidth={0.55} listening={false} />
        ))}
        {[flangeH*.5,heightPx-flangeH*.5].map(y=><Line key={y} points={[widthPx*.08,y,widthPx*.92,y]} stroke="#A18D6E" strokeWidth={.55} listening={false}/>)}
      </Group>
    )
  }
  const flangeW = Math.min(widthPx*.25,Math.max(1, widthPx * 0.1))
  const webH = Math.min(heightPx*.5,Math.max(1, heightPx * 0.28))
  const webY = (heightPx - webH) / 2
  const webW = widthPx - flangeW * 2
  return (
    <Group>
      <Rect x={0} y={0} width={flangeW} height={heightPx} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={widthPx - flangeW} y={0} width={flangeW} height={heightPx} fill="#F0E9DA" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={flangeW} y={webY} width={webW} height={webH} fill="#DAD0BB" stroke={STROKE} strokeWidth={0.5} />
      {[1,2,3,4,5,6].map(i => (
        <Line key={i} points={[flangeW+(i/7)*webW-webW*.025,webY+webH*.15,flangeW+(i/7)*webW+webW*.025,webY+webH*.85]}
          stroke="#8C7C61" strokeWidth={0.55} listening={false} />
      ))}
      {[flangeW*.5,widthPx-flangeW*.5].map(x=><Line key={x} points={[x,heightPx*.08,x,heightPx*.92]} stroke="#A18D6E" strokeWidth={.55} listening={false}/>)}
    </Group>
  )
}

export const DETAILS_RENDERERS: Record<string, RendererComponent> = {
  'insulation-batt': InsulationBattRenderer,
  'detail-drywall': DrywallRenderer,
  'detail-stud-2x4': StudRenderer,
  'detail-stud-2x6': StudRenderer,
  'detail-stud-2x8': StudRenderer,
  'detail-stud-2x10': StudRenderer,
  'detail-stud-2x12': StudRenderer,
  'detail-post-4x4': StudRenderer,
  'detail-stud-2x4-face': StudFaceRenderer,
  'detail-stud-2x6-face': StudFaceRenderer,
  'detail-stud-2x8-face': StudFaceRenderer,
  'detail-stud-2x10-face': StudFaceRenderer,
  'detail-stud-2x12-face': StudFaceRenderer,
  'detail-post-4x4-face': StudFaceRenderer,
  'detail-1x-face': StudFaceRenderer,
  'detail-stud-2x4-edge': StudEdgeRenderer,
  'detail-stud-2x6-edge': StudEdgeRenderer,
  'detail-stud-2x8-edge': StudEdgeRenderer,
  'detail-stud-2x10-edge': StudEdgeRenderer,
  'detail-stud-2x12-edge': StudEdgeRenderer,
  'detail-rafter': RafterRenderer,
  'detail-pitched-layer': PitchedLayerRenderer,
  'detail-plywood': PlywoodRenderer,
  'detail-rigid-insulation': RigidInsulationRenderer,
  'detail-vent-baffle': VentBaffleRenderer,
  'detail-soffit-panel': SoffitPanelRenderer,
  'detail-shingles': ShinglesRenderer,
  'detail-flashing': FlashingRenderer,
  'detail-gutter': GutterRenderer,
  'detail-brick-veneer': BrickVeneerRenderer,
  'detail-cmu-block': CmuBlockRenderer,
  'detail-felt': FeltRenderer,
  'detail-lvl-beam': LvlBeamRenderer,
  'detail-tji-joist': TjiJoistRenderer,
}
