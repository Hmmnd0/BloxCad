import React from 'react'
import { Group, Rect, Line, Arc, Ellipse, Circle, Text, Shape } from 'react-konva'
import { useStore } from '../../store/useStore'
import { SCALES } from '../../types'
import { LINE_WEIGHTS } from '../../utils/lineWeights'

interface RendererProps {
  widthPx: number
  heightPx: number
  selected: boolean
  properties: Record<string, unknown>
}

const STROKE = '#1A1A1A'
const STROKE_THIN = LINE_WEIGHTS.detail
const STROKE_MED = LINE_WEIGHTS.object
const STROKE_HEAVY = LINE_WEIGHTS.heavy
const STROKE_CUT = LINE_WEIGHTS.cut
const ARC_FONT = "Arial, 'Helvetica Neue', sans-serif"

// ─── WALLS ───────────────────────────────────────────────────────────────────

export function ExteriorWallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect
        width={widthPx} height={heightPx}
        fill="#3C3C3C" stroke={STROKE} strokeWidth={STROKE_CUT}
      />
      {/* Cross-hatch lines for exterior wall */}
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = '#888'
          nctx.lineWidth = 0.5
          const thickness = Math.min(widthPx, heightPx)
          const spacing = Math.max(4, thickness / 2)
          const diagonal = Math.max(widthPx, heightPx)
          for (let t = -diagonal; t < widthPx + diagonal; t += spacing * 2) {
            nctx.beginPath()
            nctx.moveTo(t, 0)
            nctx.lineTo(t + diagonal, diagonal)
            nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

export function InteriorWallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Rect
      width={widthPx} height={heightPx}
      fill="#5A5A5A" stroke={STROKE} strokeWidth={STROKE_CUT}
    />
  )
}

export function CMUWallRenderer({ widthPx, heightPx }: RendererProps) {
  const blockW = 16 / 12 * (heightPx / 0.667)  // scale block with wall thickness
  const blockH = heightPx / 2

  const vertLines: number[] = []
  for (let x = blockW; x < widthPx; x += blockW) vertLines.push(x)

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#888" stroke={STROKE} strokeWidth={STROKE_CUT} />
      {/* horizontal mortar line */}
      <Line points={[0, blockH, widthPx, blockH]} stroke="#555" strokeWidth={0.5} />
      {/* vertical mortar lines - top row */}
      {vertLines.map((x, i) => (
        <Line key={`t${i}`} points={[x, 0, x, blockH]} stroke="#555" strokeWidth={0.5} />
      ))}
      {/* vertical mortar lines - bottom row (offset by half) */}
      {vertLines.map((x, i) => (
        <Line key={`b${i}`} points={[x + blockW / 2, blockH, x + blockW / 2, heightPx]} stroke="#555" strokeWidth={0.5} />
      ))}
    </Group>
  )
}

export function InsulationBattRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const longPx = isVertical ? heightPx : widthPx
  const shortPx = isVertical ? widthPx : heightPx
  const r = shortPx / 2
  const loopCount = Math.max(2, Math.round(longPx / (r * 1.6)))
  const loopStep = longPx / loopCount

  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(255,210,40,0.12)" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = '#8B6914'
          nctx.fillStyle = 'rgba(255,200,30,0.25)'
          nctx.lineWidth = 0.8
          const mid = shortPx / 2
          for (let i = 0; i < loopCount; i++) {
            const pos = (i + 0.5) * loopStep
            nctx.beginPath()
            if (isVertical) {
              // bumps alternate left/right along the height
              if (i % 2 === 0) nctx.arc(mid, pos, r, -Math.PI / 2, Math.PI / 2, false)
              else              nctx.arc(mid, pos, r,  Math.PI / 2, -Math.PI / 2, false)
            } else {
              // bumps alternate up/down along the width
              if (i % 2 === 0) nctx.arc(pos, mid, r, Math.PI, 0, false)
              else              nctx.arc(pos, mid, r, 0, Math.PI, false)
            }
            nctx.fill()
            nctx.stroke()
          }
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
      <Rect width={widthPx} height={heightPx} fill="#F5F3EE" stroke={STROKE} strokeWidth={STROKE_THIN} />
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
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* Diagonal X — standard wood-in-section symbol */}
      <Line points={[0, 0, widthPx, heightPx]} stroke="#8B7340" strokeWidth={0.8} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke="#8B7340" strokeWidth={0.8} />
    </Group>
  )
}

export function StudFaceRenderer({ widthPx, heightPx }: RendererProps) {
  // Grain lines run along the long axis; density adapts to short-axis width
  const isVertical = heightPx >= widthPx
  const shortDim = isVertical ? widthPx : heightPx
  const longDim  = isVertical ? heightPx : widthPx
  // One grain line roughly every 5px of short dimension, min 2, max 8
  const numLines = Math.min(8, Math.max(2, Math.floor(shortDim / 5)))
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
            ;(ctx as any)._context.strokeStyle = '#8B7340'
            ;(ctx as any)._context.lineWidth = 0.5
            ;(ctx as any)._context.globalAlpha = 0.45
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
            ;(ctx as any)._context.strokeStyle = '#8B7340'
            ;(ctx as any)._context.lineWidth = 0.5
            ;(ctx as any)._context.globalAlpha = 0.45
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
      <Rect width={widthPx} height={heightPx} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
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
  const numLines = Math.max(2, Math.floor(Dv / 8))
  const grainLines: number[][] = []
  for (let i = 1; i < numLines; i++) {
    const t = i / numLines
    grainLines.push([0, rise + t * Dv, widthPx, t * Dv])
  }

  return (
    <Group>
      <Line points={shape} closed fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      {grainLines.map((pts, i) => (
        <Line key={i} points={pts} stroke="#8B7340" strokeWidth={0.5} opacity={0.45} listening={false} />
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
    shingles: '#3A3A3A',
    felt:     '#3A3A3A',
    plywood:  '#EDE0C0',
  }
  const fill = fills[layerType] ?? '#EDE0C0'

  return (
    <Group>
      <Line points={shape} closed fill={fill} stroke={STROKE} strokeWidth={STROKE_MED} />
      {layerType === 'plywood' && (() => {
        // Ply lines parallel to slope
        const numPlies = 2
        return Array.from({ length: numPlies - 1 }, (_, i) => {
          const t = (i + 1) / numPlies
          return <Line key={i} points={[0, rise + t * Dv, widthPx, t * Dv]} stroke="#7A6330" strokeWidth={0.5} opacity={0.65} listening={false} />
        })
      })()}
      {layerType === 'shingles' && (() => {
        // Course lines parallel to slope
        const courseH = Math.max(4, Dv / 3)
        const lines = []
        for (let y = courseH; y < Dv; y += courseH) {
          lines.push(<Line key={y} points={[0, rise + y, widthPx, y]} stroke="#222" strokeWidth={0.6} opacity={0.5} listening={false} />)
        }
        return lines
      })()}
    </Group>
  )
}

export function PlywoodRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  // Ply layer lines run perpendicular to the long axis (showing edge grain in section)
  const numPlies = 3
  const lines = Array.from({ length: numPlies - 1 }, (_, i) => {
    const t = (i + 1) / numPlies
    return isVertical
      ? <Line key={i} points={[1, t * heightPx, widthPx - 1, t * heightPx]} stroke="#7A6330" strokeWidth={0.5} opacity={0.65} listening={false} />
      : <Line key={i} points={[1, t * heightPx, widthPx - 1, t * heightPx]} stroke="#7A6330" strokeWidth={0.5} opacity={0.65} listening={false} />
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EDE0C0" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
    </Group>
  )
}

export function RigidInsulationRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#DCF0FF" stroke="#5AAAD0" strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(ctx) => {
          const native = (ctx as any)._context as CanvasRenderingContext2D
          const sp = 8
          const d = 2
          native.strokeStyle = '#2A7EA8'
          native.lineWidth = 0.5
          native.globalAlpha = 0.4
          native.beginPath()
          for (let x = sp; x < widthPx; x += sp) {
            for (let y = sp; y < heightPx; y += sp) {
              native.moveTo(x - d, y - d); native.lineTo(x + d, y + d)
              native.moveTo(x + d, y - d); native.lineTo(x - d, y + d)
            }
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
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(200,230,255,0.2)" stroke="#7AAFD4" strokeWidth={STROKE_MED} dash={[4, 3]} />
      <Line points={[2, heightPx / 2, widthPx - 2, heightPx / 2]} stroke="#7AAFD4" strokeWidth={0.4} dash={[6, 4]} listening={false} />
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
      <Rect width={widthPx} height={heightPx} fill="#E8E4DC" stroke={STROKE} strokeWidth={STROKE_MED} />
      {slots}
    </Group>
  )
}

export function ShinglesRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#3A3A3A" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(ctx) => {
          const native = (ctx as any)._context as CanvasRenderingContext2D
          const courseH = Math.max(5, heightPx / 5)
          const tabW = Math.max(8, widthPx / 8)
          native.strokeStyle = '#222'
          native.lineWidth = 0.6
          native.globalAlpha = 0.65
          let y = heightPx
          let course = 0
          while (y > -courseH && course < 30) {
            native.beginPath(); native.moveTo(0, y); native.lineTo(widthPx, y); native.stroke()
            const off = (course % 2) * (tabW * 0.7)
            for (let x = off; x < widthPx; x += tabW) {
              native.beginPath(); native.moveTo(x, y); native.lineTo(x, y - courseH * 0.45); native.stroke()
            }
            y -= courseH * 0.65
            course++
          }
          native.globalAlpha = 1
        }}
        listening={false}
      />
    </Group>
  )
}

export function FlashingRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#A8A8A8" stroke="#555" strokeWidth={STROKE_MED} />
      <Line points={[1, heightPx * 0.3, widthPx - 1, heightPx * 0.3]} stroke="rgba(255,255,255,0.35)" strokeWidth={Math.max(0.3, heightPx * 0.12)} listening={false} />
    </Group>
  )
}

export function GutterRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Shape
        sceneFunc={(_ctx) => {
          const ctx = (_ctx as any)._context as CanvasRenderingContext2D
          const w = widthPx, h = heightPx
          ctx.beginPath()
          ctx.moveTo(w * 0.05, 0)
          ctx.lineTo(w * 0.05, h * 0.72)
          ctx.quadraticCurveTo(w * 0.05, h, w * 0.22, h)
          ctx.lineTo(w * 0.78, h)
          ctx.quadraticCurveTo(w * 0.95, h, w * 0.95, h * 0.72)
          ctx.lineTo(w * 0.95, h * 0.08)
          ctx.lineTo(w * 0.78, 0)
          ctx.closePath()
          ctx.fillStyle = '#C0C0C0'
          ctx.strokeStyle = '#444'
          ctx.lineWidth = 0.8
          ctx.fill()
          ctx.stroke()
          // Hanging strap
          ctx.beginPath()
          ctx.moveTo(w * 0.5, 0)
          ctx.lineTo(w * 0.5, -h * 0.35)
          ctx.strokeStyle = '#888'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }}
        listening={false}
      />
    </Group>
  )
}

export function BrickVeneerRenderer({ widthPx, heightPx }: RendererProps) {
  const courseH = Math.max(3, Math.min(12, heightPx / 7))
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#C47B5A" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape
        sceneFunc={(_ctx) => {
          const ctx = (_ctx as any)._context as CanvasRenderingContext2D
          const courses = Math.ceil(heightPx / courseH)
          const jW = Math.max(6, widthPx * 0.45)
          ctx.strokeStyle = '#7A4A2A'
          ctx.lineWidth = 0.5
          ctx.globalAlpha = 0.55
          for (let i = 1; i < courses; i++) {
            const y = courseH * i
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(widthPx, y); ctx.stroke()
          }
          for (let i = 0; i < courses; i++) {
            const y1 = courseH * i, y2 = Math.min(courseH * (i + 1), heightPx)
            const off = (i % 2) * (jW / 2)
            for (let x = off; x < widthPx; x += jW) {
              ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke()
            }
          }
          ctx.globalAlpha = 1
        }}
        listening={false}
      />
    </Group>
  )
}

export function FeltRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#3A3A3A" stroke="#222" strokeWidth={STROKE_MED} />
      <Line points={[1, heightPx * 0.4, widthPx - 1, heightPx * 0.4]} stroke="rgba(255,255,255,0.15)" strokeWidth={Math.max(0.3, heightPx * 0.15)} listening={false} />
    </Group>
  )
}

// ─── OPENINGS ────────────────────────────────────────────────────────────────

export function CasedOpeningRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  if (isVertical) {
    const tick = Math.max(2, widthPx * 0.35)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" />
        <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, 0, 0, tick]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[widthPx, 0, widthPx, tick]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx, 0, heightPx - tick]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[widthPx, heightPx, widthPx, heightPx - tick]} stroke={STROKE} strokeWidth={STROKE_MED} />
      </Group>
    )
  }
  const tick = Math.max(2, heightPx * 0.35)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" />
      <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, 0, tick, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, heightPx, tick, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx, 0, widthPx - tick, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx, heightPx, widthPx - tick, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
    </Group>
  )
}

export function SingleDoorRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const flipped = properties.flipped === true
  const isVertical = heightPx > widthPx
  const sz = Math.max(widthPx, heightPx)

  if (isVertical) {
    // Door in a vertical wall: leaf runs along Y axis, swing extends in X
    return (
      <Group scaleX={flipped ? -1 : 1} x={flipped ? widthPx : 0}>
        <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Arc x={0} y={0} innerRadius={0} outerRadius={sz} angle={90} rotation={0}
          stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
        <Line points={[0, 0, 0, sz]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
      </Group>
    )
  }

  // Door in a horizontal wall: leaf runs along X axis, swing extends in Y
  return (
    <Group scaleX={flipped ? -1 : 1} x={flipped ? widthPx : 0}>
      <Line points={[0, 0, 0, sz]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Arc x={0} y={0} innerRadius={0} outerRadius={sz} angle={90} rotation={0}
        stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
      <Line points={[0, 0, sz, 0]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
    </Group>
  )
}

export function DoubleDoorRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const isVertical = heightPx > widthPx
  const flipped = properties.flipped === true

  if (isVertical) {
    // Door in a vertical wall: two leaves run along Y, swings extend in X
    const half = heightPx / 2
    return (
      <Group scaleX={flipped ? -1 : 1} x={flipped ? widthPx : 0}>
        <Line points={[0, half, widthPx, half]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Arc x={0} y={half} innerRadius={0} outerRadius={half} angle={90} rotation={270}
          stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
        <Line points={[0, 0, 0, half]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
        <Arc x={0} y={half} innerRadius={0} outerRadius={half} angle={90} rotation={0}
          stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
        <Line points={[0, half, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
      </Group>
    )
  }

  // Door in a horizontal wall: two leaves run along X, swings extend in Y
  const half = widthPx / 2
  return (
    <Group scaleY={flipped ? -1 : 1} y={flipped ? half : 0}>
      <Line points={[half, 0, half, half]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Arc x={half} y={0} innerRadius={0} outerRadius={half} angle={90} rotation={90}
        stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
      <Line points={[0, 0, half, 0]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
      <Arc x={half} y={0} innerRadius={0} outerRadius={half} angle={90} rotation={0}
        stroke={STROKE} strokeWidth={STROKE_THIN} fill="rgba(135, 206, 250, 0.12)" />
      <Line points={[half, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} lineCap="square" />
    </Group>
  )
}

export function SlidingDoorRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const panelW = widthPx / 2
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="rgba(135,206,250,0.18)" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Rect x={0} width={panelW} height={heightPx} fill="rgba(135,206,250,0.3)" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[panelW * 0.2, heightPx / 2, panelW * 0.8, heightPx / 2]} stroke={STROKE} strokeWidth={1} />
        <Line points={[panelW * 0.6, heightPx * 0.2, panelW * 0.8, heightPx / 2, panelW * 0.6, heightPx * 0.8]} stroke={STROKE} strokeWidth={1} />
      </Group>
    )
  }

  // Portrait: panel slides along Y axis
  const panelH = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(135,206,250,0.18)" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect y={0} width={widthPx} height={panelH} fill="rgba(135,206,250,0.3)" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx / 2, panelH * 0.2, widthPx / 2, panelH * 0.8]} stroke={STROKE} strokeWidth={1} />
      <Line points={[widthPx * 0.2, panelH * 0.6, widthPx / 2, panelH * 0.8, widthPx * 0.8, panelH * 0.6]} stroke={STROKE} strokeWidth={1} />
    </Group>
  )
}

export function WindowRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[0, heightPx / 4, widthPx, heightPx / 4]} stroke={STROKE} strokeWidth={0.5} />
        <Line points={[0, heightPx / 2, widthPx, heightPx / 2]} stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[0, heightPx * 3 / 4, widthPx, heightPx * 3 / 4]} stroke={STROKE} strokeWidth={0.5} />
      </Group>
    )
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx / 4, 0, widthPx / 4, heightPx]} stroke={STROKE} strokeWidth={0.5} />
      <Line points={[widthPx / 2, 0, widthPx / 2, heightPx]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx * 3 / 4, 0, widthPx * 3 / 4, heightPx]} stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function DoubleWindowRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const mid = widthPx / 2
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[0, heightPx / 2, mid - 1, heightPx / 2]} stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[mid + 1, heightPx / 2, widthPx, heightPx / 2]} stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Rect x={mid - 2} y={0} width={4} height={heightPx} fill={STROKE} />
        <Line points={[0, heightPx / 4, widthPx, heightPx / 4]} stroke={STROKE} strokeWidth={0.4} />
        <Line points={[0, heightPx * 3 / 4, widthPx, heightPx * 3 / 4]} stroke={STROKE} strokeWidth={0.4} />
      </Group>
    )
  }

  // Portrait (rotated 90°): mullion is horizontal, rails are vertical
  const mid = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx / 2, 0, widthPx / 2, mid - 1]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx / 2, mid + 1, widthPx / 2, heightPx]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={0} y={mid - 2} width={widthPx} height={4} fill={STROKE} />
      <Line points={[widthPx / 4, 0, widthPx / 4, heightPx]} stroke={STROKE} strokeWidth={0.4} />
      <Line points={[widthPx * 3 / 4, 0, widthPx * 3 / 4, heightPx]} stroke={STROKE} strokeWidth={0.4} />
    </Group>
  )
}

export function MultiWindowRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const paneCount = typeof properties.paneCount === 'number' ? Math.max(1, properties.paneCount) : 2
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const mullionXs: number[] = []
    for (let i = 1; i < paneCount; i++) mullionXs.push((i / paneCount) * widthPx)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[0, heightPx / 2, widthPx, heightPx / 2]} stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Line points={[0, heightPx / 4, widthPx, heightPx / 4]} stroke={STROKE} strokeWidth={0.4} />
        <Line points={[0, heightPx * 3 / 4, widthPx, heightPx * 3 / 4]} stroke={STROKE} strokeWidth={0.4} />
        {mullionXs.map((x, i) => (
          <Rect key={i} x={x - 2} y={0} width={4} height={heightPx} fill={STROKE} />
        ))}
      </Group>
    )
  }

  // Portrait (rotated 90°): horizontal mullions
  const mullionYs: number[] = []
  for (let i = 1; i < paneCount; i++) mullionYs.push((i / paneCount) * heightPx)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx / 2, 0, widthPx / 2, heightPx]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx / 4, 0, widthPx / 4, heightPx]} stroke={STROKE} strokeWidth={0.4} />
      <Line points={[widthPx * 3 / 4, 0, widthPx * 3 / 4, heightPx]} stroke={STROKE} strokeWidth={0.4} />
      {mullionYs.map((y, i) => (
        <Rect key={i} x={0} y={y - 2} width={widthPx} height={4} fill={STROKE} />
      ))}
    </Group>
  )
}

// ─── STAIRS ──────────────────────────────────────────────────────────────────

export function StraightStairsRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const isLandscape = widthPx > heightPx
  const flipH = properties.flipH === true
  const flipV = properties.flipV === true

  if (isLandscape) {
    const riserCount = Math.max(6, Math.round(widthPx / (heightPx * 0.3)))
    const riserSpacing = widthPx / riserCount
    const risers = Array.from({ length: riserCount - 1 }, (_, i) => (i + 1) * riserSpacing)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        {risers.map((x, i) => (
          <Line key={i} points={[x, 0, x, heightPx]} stroke="#555" strokeWidth={0.5} />
        ))}
        <Line points={[widthPx * 0.15, heightPx / 2, widthPx * 0.45, heightPx / 2]} stroke={STROKE} strokeWidth={1} />
        <Line points={[widthPx * 0.35, heightPx * 0.3, widthPx * 0.45, heightPx / 2, widthPx * 0.35, heightPx * 0.7]} stroke={STROKE} strokeWidth={1} />
        <Group x={flipH ? widthPx : 0} scaleX={flipH ? -1 : 1} y={flipV ? heightPx : 0} scaleY={flipV ? -1 : 1}>
          <Text text="UP" x={widthPx * 0.06} y={heightPx / 2 - 6} fontSize={10} fill={STROKE} />
        </Group>
      </Group>
    )
  }

  const riserCount = Math.max(6, Math.round(heightPx / (widthPx * 0.3)))
  const riserSpacing = heightPx / riserCount
  const risers = Array.from({ length: riserCount - 1 }, (_, i) => (i + 1) * riserSpacing)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {risers.map((y, i) => (
        <Line key={i} points={[0, y, widthPx, y]} stroke="#555" strokeWidth={0.5} />
      ))}
      <Line points={[widthPx / 2, heightPx * 0.85, widthPx / 2, heightPx * 0.55]} stroke={STROKE} strokeWidth={1} />
      <Line points={[widthPx * 0.35, heightPx * 0.65, widthPx / 2, heightPx * 0.55, widthPx * 0.65, heightPx * 0.65]} stroke={STROKE} strokeWidth={1} />
      <Group x={flipH ? widthPx : 0} scaleX={flipH ? -1 : 1} y={flipV ? heightPx : 0} scaleY={flipV ? -1 : 1}>
        <Text text="UP" x={widthPx / 2 - 8} y={heightPx * 0.88} fontSize={10} fill={STROKE} />
      </Group>
    </Group>
  )
}

// ─── FIXTURES ────────────────────────────────────────────────────────────────

export function ToiletRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx >= widthPx

  if (isPortrait) {
    const tankH = heightPx * 0.32
    const bowlStartY = tankH + 2
    const bowlH = heightPx - tankH - 2
    return (
      <Group>
        <Rect x={widthPx * 0.05} y={0} width={widthPx * 0.9} height={tankH}
          cornerRadius={3} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Ellipse x={widthPx / 2} y={bowlStartY + bowlH / 2}
          radiusX={widthPx * 0.45} radiusY={bowlH / 2}
          fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Ellipse x={widthPx / 2} y={bowlStartY + bowlH / 2}
          radiusX={widthPx * 0.32} radiusY={bowlH * 0.38}
          fill="#f0f0f0" stroke="#888" strokeWidth={0.5} />
      </Group>
    )
  }

  // Landscape: tank at left
  const tankW = widthPx * 0.32
  const bowlStartX = tankW + 2
  const bowlW = widthPx - tankW - 2
  return (
    <Group>
      <Rect x={0} y={heightPx * 0.05} width={tankW} height={heightPx * 0.9}
        cornerRadius={3} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Ellipse x={bowlStartX + bowlW / 2} y={heightPx / 2}
        radiusX={bowlW / 2} radiusY={heightPx * 0.45}
        fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Ellipse x={bowlStartX + bowlW / 2} y={heightPx / 2}
        radiusX={bowlW * 0.38} radiusY={heightPx * 0.32}
        fill="#f0f0f0" stroke="#888" strokeWidth={0.5} />
    </Group>
  )
}

export function LavSinkRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx >= widthPx
  const cr = Math.min(widthPx, heightPx) * 0.15

  if (isPortrait) {
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} cornerRadius={cr} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Ellipse x={widthPx / 2} y={heightPx * 0.55} radiusX={widthPx * 0.32} radiusY={heightPx * 0.28}
          fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
        <Circle x={widthPx / 2} y={heightPx * 0.22} radius={Math.min(widthPx, heightPx) * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
      </Group>
    )
  }

  // Landscape: faucet at left
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} cornerRadius={cr} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Ellipse x={widthPx * 0.55} y={heightPx / 2} radiusX={widthPx * 0.28} radiusY={heightPx * 0.32}
        fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      <Circle x={widthPx * 0.22} y={heightPx / 2} radius={Math.min(widthPx, heightPx) * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function BathtubRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx >= widthPx

  if (isPortrait) {
    const pad = widthPx * 0.1
    return (
      <Group>
        <Rect width={widthPx} height={heightPx}
          cornerRadius={widthPx * 0.08} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Rect x={pad} y={heightPx * 0.12} width={widthPx - pad * 2} height={heightPx * 0.75}
          cornerRadius={widthPx * 0.06} fill="#f0f8ff" stroke="#aaa" strokeWidth={0.5} />
        <Circle x={widthPx / 2} y={heightPx * 0.78} radius={widthPx * 0.05} fill="white" stroke="#666" strokeWidth={0.5} />
        <Circle x={widthPx / 2} y={heightPx * 0.12} radius={widthPx * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
      </Group>
    )
  }

  // Landscape: faucet at left, drain at right
  const pad = heightPx * 0.1
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        cornerRadius={heightPx * 0.08} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={widthPx * 0.12} y={pad} width={widthPx * 0.75} height={heightPx - pad * 2}
        cornerRadius={heightPx * 0.06} fill="#f0f8ff" stroke="#aaa" strokeWidth={0.5} />
      <Circle x={widthPx * 0.78} y={heightPx / 2} radius={heightPx * 0.05} fill="white" stroke="#666" strokeWidth={0.5} />
      <Circle x={widthPx * 0.12} y={heightPx / 2} radius={heightPx * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function KitchenSinkRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const basinW = (widthPx - 8) / 2
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Rect x={3} y={3} width={basinW} height={heightPx - 6}
          cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
        <Rect x={basinW + 5} y={3} width={basinW} height={heightPx - 6}
          cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
        <Circle x={widthPx / 2} y={heightPx / 2} radius={Math.min(widthPx, heightPx) * 0.08} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
      </Group>
    )
  }

  // Portrait: basins stacked vertically
  const basinH = (heightPx - 8) / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={3} y={3} width={widthPx - 6} height={basinH}
        cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      <Rect x={3} y={basinH + 5} width={widthPx - 6} height={basinH}
        cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      <Circle x={widthPx / 2} y={heightPx / 2} radius={Math.min(widthPx, heightPx) * 0.08} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function RefrigeratorRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[0, 0, widthPx, heightPx]} stroke="#ccc" strokeWidth={0.5} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke="#ccc" strokeWidth={0.5} />
      <Text text="REF" x={widthPx / 2 - 12} y={heightPx / 2 - 6} fontSize={10} fill="#888" />
    </Group>
  )
}

export function RangeRenderer({ widthPx, heightPx }: RendererProps) {
  const burnerR = widthPx * 0.12
  const positions = [
    { x: widthPx * 0.28, y: heightPx * 0.3 },
    { x: widthPx * 0.72, y: heightPx * 0.3 },
    { x: widthPx * 0.28, y: heightPx * 0.7 },
    { x: widthPx * 0.72, y: heightPx * 0.7 }
  ]
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {positions.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={burnerR} fill="#ddd" stroke="#888" strokeWidth={0.8} />
      ))}
    </Group>
  )
}

export function DishwasherRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={4} y={4} width={widthPx - 8} height={heightPx - 8}
        cornerRadius={2} fill="#f5f5f5" stroke="#bbb" strokeWidth={0.5} />
      <Text text="DW" x={widthPx / 2 - 10} y={heightPx / 2 - 6} fontSize={10} fill="#888" />
    </Group>
  )
}

// ─── STRUCTURAL ───────────────────────────────────────────────────────────────

export function SquareColumnRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#404040" stroke={STROKE} strokeWidth={STROKE_CUT} />
      {/* Diagonal cross for solid fill indication */}
      <Line points={[0, 0, widthPx, heightPx]} stroke="#666" strokeWidth={0.5} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke="#666" strokeWidth={0.5} />
    </Group>
  )
}

export function RoundColumnRenderer({ widthPx, heightPx }: RendererProps) {
  const r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={widthPx / 2} y={heightPx / 2} radius={r} fill="#404040" stroke={STROKE} strokeWidth={STROKE_CUT} />
      <Circle x={widthPx / 2} y={heightPx / 2} radius={r * 0.6} fill="#555" stroke="#666" strokeWidth={0.4} />
    </Group>
  )
}

// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────


// ─── ANNOTATIONS ────────────────────────────────────────────────────────────

export function NorthArrowRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  const r = Math.min(widthPx, heightPx) / 2 - 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={STROKE_THIN} fill="white" />
      {/* North-pointing filled half */}
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nctx.save()
        nctx.beginPath()
        nctx.moveTo(cx, cy - r)
        nctx.lineTo(cx + r * 0.3, cy)
        nctx.lineTo(cx, cy + r * 0.15)
        nctx.lineTo(cx - r * 0.3, cy)
        nctx.closePath()
        nctx.fillStyle = '#1A1A1A'
        nctx.fill()
        nctx.restore()
      }} listening={false} />
      {/* South half outline */}
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nctx.save()
        nctx.beginPath()
        nctx.moveTo(cx, cy - r)
        nctx.lineTo(cx - r * 0.3, cy)
        nctx.lineTo(cx, cy + r * 0.15)
        nctx.lineTo(cx + r * 0.3, cy)
        nctx.closePath()
        nctx.strokeStyle = '#1A1A1A'
        nctx.lineWidth = 0.8
        nctx.stroke()
        nctx.restore()
      }} listening={false} />
      <Text text="N" x={cx - 5} y={cy - r - 14} fontSize={12}
        fontFamily={ARC_FONT} fontStyle="bold" fill={STROKE} />
    </Group>
  )
}

export function FireRatingLabelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const rating = (properties.rating as string) ?? '1-HR'
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(220,30,30,0.08)" stroke="#CC0000" strokeWidth={0.75} cornerRadius={2} />
      <Text
        text={`${rating} RATED ASSEMBLY`}
        x={6} y={0} height={heightPx} verticalAlign="middle"
        fontSize={Math.max(7, heightPx * 18)} fontFamily={ARC_FONT}
        fontStyle="bold" fill="#CC0000" listening={false}
      />
    </Group>
  )
}

export function TextNoteRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const text = (properties.text as string) ?? 'Note'
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(255,255,255,0.0)" stroke="#888" strokeWidth={0.6}
        dash={[4, 3]} />
      <Text
        text={text}
        x={4} y={4} width={widthPx - 8} height={heightPx - 8}
        fontSize={11} fontFamily="Architects Daughter" fill="#222"
        wrap="word" listening={false}
      />
    </Group>
  )
}

// ─── FIRE/SAFETY ─────────────────────────────────────────────────────────────

export function FireExtinguisherRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="rgba(220,30,30,0.15)" stroke="#CC0000" strokeWidth={0.6} />
      <Text text="FE" x={cx - 8} y={cy - 6} fontSize={10}
        fontFamily={ARC_FONT} fontStyle="bold" fill="#CC0000" />
    </Group>
  )
}

export function ExitSignRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(0,180,0,0.15)" stroke="#006600" strokeWidth={0.6} cornerRadius={1} />
      <Text text="EXIT" x={0} y={0} width={widthPx} height={heightPx}
        align="center" verticalAlign="middle"
        fontSize={Math.max(7, heightPx * 16)} fontFamily={ARC_FONT}
        fontStyle="bold" fill="#006600" listening={false} />
    </Group>
  )
}

export function SmokeDetectorRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={STROKE} strokeWidth={1} />
      <Circle x={cx} y={cy} radius={r * 0.45} fill={STROKE} />
      <Text text="SD" x={cx - 6} y={heightPx + 1} fontSize={7}
        fontFamily={ARC_FONT} fill={STROKE} />
    </Group>
  )
}

export function EmergencyLightRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(255,200,0,0.2)" stroke="#996600" strokeWidth={1} cornerRadius={2} />
      {/* Lightning bolt */}
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nctx.save()
        nctx.beginPath()
        nctx.moveTo(cx + 3, 3)
        nctx.lineTo(cx - 3, cy)
        nctx.lineTo(cx + 1, cy)
        nctx.lineTo(cx - 3, heightPx - 3)
        nctx.lineTo(cx + 3, cy)
        nctx.lineTo(cx - 1, cy)
        nctx.closePath()
        nctx.fillStyle = '#996600'
        nctx.fill()
        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── HANDRAIL ────────────────────────────────────────────────────────────────

export function HandrailRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const len = isVertical ? heightPx : widthPx
  const postCount = Math.max(2, Math.round(len / 36))

  if (isVertical) {
    const cx = widthPx / 2
    const posts = Array.from({ length: postCount }, (_, i) => ((i + 1) / (postCount + 1)) * heightPx)
    return (
      <Group>
        <Line points={[cx, 0, cx, heightPx]} stroke={STROKE} strokeWidth={0.75} lineCap="round" lineJoin="round" />
        {posts.map((y, i) => (
          <Line key={i} points={[0, y, widthPx, y]} stroke={STROKE} strokeWidth={1} />
        ))}
      </Group>
    )
  }

  const cy = heightPx / 2
  const posts = Array.from({ length: postCount }, (_, i) => ((i + 1) / (postCount + 1)) * widthPx)
  return (
    <Group>
      <Line points={[0, cy, widthPx, cy]} stroke={STROKE} strokeWidth={0.75} lineCap="round" lineJoin="round" />
      {posts.map((x, i) => (
        <Line key={i} points={[x, 0, x, heightPx]} stroke={STROKE} strokeWidth={1} />
      ))}
    </Group>
  )
}

// ─── STAIR LANDING ───────────────────────────────────────────────────────────

export function StairLandingRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, 0, widthPx, heightPx]} stroke="#ccc" strokeWidth={0.6} listening={false} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke="#ccc" strokeWidth={0.6} listening={false} />
      <Text
        text="LDG"
        x={0} y={heightPx / 2 - 6}
        width={widthPx} align="center"
        fontSize={Math.min(11, widthPx * 0.18, heightPx * 0.18)}
        fontFamily={ARC_FONT} fill="#888"
        listening={false}
      />
    </Group>
  )
}

// ─── SHAPE RECT ──────────────────────────────────────────────────────────────

export function ShapeRectRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Rect
      width={widthPx} height={heightPx}
      fill="rgba(255,255,255,0.6)" stroke={STROKE} strokeWidth={STROKE_THIN}
    />
  )
}

// ─── STAIR ELEVATION ─────────────────────────────────────────────────────────

export function StairsElevationRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const stepCount = typeof properties.stepCount === 'number'
    ? Math.max(2, Math.min(30, properties.stepCount))
    : Math.max(3, Math.min(24, Math.round(widthPx / 22)))
  const treadW = widthPx / stepCount
  const riserH = heightPx / stepCount

  // Build stair profile: start bottom-left, step up-right for each tread
  const pts: number[] = [0, heightPx]
  for (let i = 0; i < stepCount; i++) {
    pts.push(i * treadW, heightPx - (i + 1) * riserH)   // top of riser
    pts.push((i + 1) * treadW, heightPx - (i + 1) * riserH) // end of tread
  }
  pts.push(widthPx, heightPx) // bottom-right

  return (
    <Group>
      <Line points={pts} closed fill="#f0f0f0" stroke={STROKE} strokeWidth={STROKE_THIN} lineJoin="miter" />
      {/* Ground line */}
      <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* UP label */}
      <Text text="UP" x={widthPx * 0.05} y={heightPx * 0.06} fontSize={Math.min(11, widthPx * 0.08)} fill={STROKE} />
    </Group>
  )
}

// ─── FURNITURE ────────────────────────────────────────────────────────────────

export function BedRenderer({ widthPx, heightPx }: RendererProps) {
  // Portrait = headboard at top; landscape = headboard at left (after 90° rotation/W-H swap)
  const isPortrait = heightPx >= widthPx

  if (isPortrait) {
    const headH = heightPx * 0.14
    const pillowY = headH + heightPx * 0.04
    const pillowH = heightPx * 0.14
    const pillowGap = widthPx * 0.06
    const pillowW = (widthPx - pillowGap * 3) / 2
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
        <Rect x={0} y={0} width={widthPx} height={headH} fill="#d0c8bc" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
        <Rect x={pillowGap} y={pillowY} width={pillowW} height={pillowH} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} cornerRadius={3} />
        <Rect x={pillowGap * 2 + pillowW} y={pillowY} width={pillowW} height={pillowH} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} cornerRadius={3} />
        <Line points={[widthPx * 0.05, pillowY + pillowH + heightPx * 0.06, widthPx * 0.95, pillowY + pillowH + heightPx * 0.06]} stroke="#ccc" strokeWidth={0.8} />
      </Group>
    )
  }

  // Landscape: headboard at left
  const headW = widthPx * 0.14
  const pillowX = headW + heightPx * 0.04
  const pillowW2 = widthPx * 0.14
  const pillowGap = heightPx * 0.06
  const pillowH2 = (heightPx - pillowGap * 3) / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Rect x={0} y={0} width={headW} height={heightPx} fill="#d0c8bc" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Rect x={pillowX} y={pillowGap} width={pillowW2} height={pillowH2} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} cornerRadius={3} />
      <Rect x={pillowX} y={pillowGap * 2 + pillowH2} width={pillowW2} height={pillowH2} fill="#f5f5f0" stroke="#aaa" strokeWidth={0.6} cornerRadius={3} />
      <Line points={[pillowX + pillowW2 + widthPx * 0.06, heightPx * 0.05, pillowX + pillowW2 + widthPx * 0.06, heightPx * 0.95]} stroke="#ccc" strokeWidth={0.8} />
    </Group>
  )
}

export function SofaRenderer({ widthPx, heightPx }: RendererProps) {
  // Landscape = back at top (natural); portrait = back at left (after 90° rotation/W-H swap)
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const backH = heightPx * 0.28
    const armW = widthPx * 0.1
    const seatY = backH
    const seatH = heightPx - backH
    const cushionCount = Math.max(2, Math.round(widthPx / 60))
    const innerW = widthPx - armW * 2
    const cushionW = innerW / cushionCount
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="#e8e0d4" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={3} />
        <Rect x={armW} y={0} width={innerW} height={backH} fill="#d4ccc0" stroke="#aaa" strokeWidth={0.6} cornerRadius={2} />
        <Rect x={armW} y={seatY} width={innerW} height={seatH} fill="#ece6dc" stroke="#aaa" strokeWidth={0.5} />
        {Array.from({ length: cushionCount - 1 }, (_, i) => (
          <Line key={i} points={[armW + (i + 1) * cushionW, seatY, armW + (i + 1) * cushionW, seatY + seatH]} stroke="#bbb" strokeWidth={0.8} />
        ))}
      </Group>
    )
  }

  // Portrait: back at left
  const backW = widthPx * 0.28
  const armH = heightPx * 0.1
  const seatX = backW
  const seatW = widthPx - backW
  const cushionCount = Math.max(2, Math.round(heightPx / 60))
  const innerH = heightPx - armH * 2
  const cushionH = innerH / cushionCount
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#e8e0d4" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={3} />
      <Rect x={0} y={armH} width={backW} height={innerH} fill="#d4ccc0" stroke="#aaa" strokeWidth={0.6} cornerRadius={2} />
      <Rect x={seatX} y={armH} width={seatW} height={innerH} fill="#ece6dc" stroke="#aaa" strokeWidth={0.5} />
      {Array.from({ length: cushionCount - 1 }, (_, i) => (
        <Line key={i} points={[seatX, armH + (i + 1) * cushionH, seatX + seatW, armH + (i + 1) * cushionH]} stroke="#bbb" strokeWidth={0.8} />
      ))}
    </Group>
  )
}

export function ChairRenderer({ widthPx, heightPx }: RendererProps) {
  const backH = heightPx * 0.28
  const armW = widthPx * 0.12
  const seatY = backH

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#e8e0d4" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={3} />
      {/* Back */}
      <Rect x={armW} y={0} width={widthPx - armW * 2} height={backH}
        fill="#d4ccc0" stroke="#aaa" strokeWidth={0.6} cornerRadius={2} />
      {/* Seat */}
      <Rect x={armW} y={seatY} width={widthPx - armW * 2} height={heightPx - backH}
        fill="#ece6dc" stroke="#aaa" strokeWidth={0.5} cornerRadius={2} />
    </Group>
  )
}

export function DiningTableRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = Math.min(widthPx, heightPx) * 0.06
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="#f5f0e8" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        fill="none" stroke="#bbb" strokeWidth={0.5} cornerRadius={1} />
    </Group>
  )
}

export function CoffeeTableRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = Math.min(widthPx, heightPx) * 0.1
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="#f0ece4" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={3} />
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        fill="none" stroke="#ccc" strokeWidth={0.5} cornerRadius={2} />
    </Group>
  )
}

export function DeskRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f0ece4" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={3} y={3} width={widthPx - 6} height={heightPx - 6} fill="none" stroke="#ccc" strokeWidth={0.5} />
      {isLandscape
        ? <Line points={[widthPx * 0.15, heightPx / 2, widthPx * 0.85, heightPx / 2]} stroke="#bbb" strokeWidth={0.8} />
        : <Line points={[widthPx / 2, heightPx * 0.15, widthPx / 2, heightPx * 0.85]} stroke="#bbb" strokeWidth={0.8} />
      }
    </Group>
  )
}

// ─── CASEWORK ─────────────────────────────────────────────────────────────────

export function BaseCabinetRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    const edge = heightPx * 0.15
    const doorCount = Math.max(1, Math.round(widthPx / 30))
    const dividers = Array.from({ length: doorCount - 1 }, (_, i) => (i + 1) * widthPx / doorCount)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx - edge, widthPx, heightPx - edge]} stroke={STROKE} strokeWidth={0.8} />
        {dividers.map((x, i) => (
          <Line key={i} points={[x, 2, x, heightPx - edge - 2]} stroke="#aaa" strokeWidth={0.6} />
        ))}
      </Group>
    )
  }

  // Portrait (rotated): counter edge at right, door lines are horizontal
  const edge = widthPx * 0.15
  const doorCount = Math.max(1, Math.round(heightPx / 30))
  const dividers = Array.from({ length: doorCount - 1 }, (_, i) => (i + 1) * heightPx / doorCount)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx - edge, 0, widthPx - edge, heightPx]} stroke={STROKE} strokeWidth={0.8} />
      {dividers.map((y, i) => (
        <Line key={i} points={[2, y, widthPx - edge - 2, y]} stroke="#aaa" strokeWidth={0.6} />
      ))}
    </Group>
  )
}

export function UpperCabinetRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      {/* Dashed outline — convention for overhead elements in plan view */}
      <Rect width={widthPx} height={heightPx}
        fill="rgba(200,200,200,0.1)" stroke={STROKE} strokeWidth={0.8}
        dash={[5, 3]} />
      {/* X cross inside */}
      <Line points={[0, 0, widthPx, heightPx]} stroke="#ccc" strokeWidth={0.5} listening={false} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke="#ccc" strokeWidth={0.5} listening={false} />
    </Group>
  )
}

export function KitchenIslandRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = 3
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* Inner counter surface */}
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        fill="none" stroke="#aaa" strokeWidth={0.5} />
    </Group>
  )
}

// ─── ANNOTATIONS: HUMAN SCALE ────────────────────────────────────────────────

export function HumanScaleRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2
  const headR = Math.min(widthPx * 0.28, heightPx * 0.1)
  const headCy = headR + 1
  const neckY  = headCy + headR
  const shoulderY = neckY + heightPx * 0.08
  const waistY    = neckY + heightPx * 0.35
  const hipY      = neckY + heightPx * 0.42
  const bodyBot   = heightPx - 1

  return (
    <Group>
      {/* Head */}
      <Circle x={cx} y={headCy} radius={headR}
        fill="none" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Torso */}
      <Line points={[cx, neckY, cx, hipY]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Arms */}
      <Line points={[cx - widthPx * 0.45, shoulderY + heightPx * 0.08, cx, shoulderY, cx + widthPx * 0.45, shoulderY + heightPx * 0.08]}
        stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Legs */}
      <Line points={[cx, hipY, cx - widthPx * 0.3, bodyBot]} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Line points={[cx, hipY, cx + widthPx * 0.3, bodyBot]} stroke={STROKE} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// ─── DRESSER ──────────────────────────────────────────────────────────────────

export function DresserRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    // Back panel at top, drawers below
    const backH = heightPx * 0.18
    const frontH = heightPx - backH
    const drawerCount = Math.max(2, Math.round(widthPx / 36))
    const drawerW = widthPx / drawerCount
    const handleW = Math.min(drawerW * 0.35, 18)
    const handleH = 4
    const drawerMidY = backH + frontH / 2
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={0} y={0} width={widthPx} height={backH} fill="#d8d4cf" stroke={STROKE} strokeWidth={0.5} />
        {Array.from({ length: drawerCount - 1 }, (_, i) => (
          <Line key={i} points={[(i + 1) * drawerW, backH, (i + 1) * drawerW, heightPx]} stroke="#aaa" strokeWidth={0.6} />
        ))}
        {Array.from({ length: drawerCount }, (_, i) => (
          <Rect
            key={i}
            x={i * drawerW + (drawerW - handleW) / 2}
            y={drawerMidY - handleH / 2}
            width={handleW} height={handleH}
            fill="#bbb" stroke="#999" strokeWidth={0.5} cornerRadius={2}
          />
        ))}
      </Group>
    )
  }

  // Portrait: back at left
  const backW = widthPx * 0.18
  const frontW = widthPx - backW
  const drawerCount = Math.max(2, Math.round(heightPx / 36))
  const drawerH = heightPx / drawerCount
  const handleH = Math.min(drawerH * 0.35, 18)
  const handleW = 4
  const drawerMidX = backW + frontW / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={0} y={0} width={backW} height={heightPx} fill="#d8d4cf" stroke={STROKE} strokeWidth={0.5} />
      {Array.from({ length: drawerCount - 1 }, (_, i) => (
        <Line key={i} points={[backW, (i + 1) * drawerH, widthPx, (i + 1) * drawerH]} stroke="#aaa" strokeWidth={0.6} />
      ))}
      {Array.from({ length: drawerCount }, (_, i) => (
        <Rect
          key={i}
          x={drawerMidX - handleW / 2}
          y={i * drawerH + (drawerH - handleH) / 2}
          width={handleW} height={handleH}
          fill="#bbb" stroke="#999" strokeWidth={0.5} cornerRadius={2}
        />
      ))}
    </Group>
  )
}

// ─── BATHROOM VANITY ──────────────────────────────────────────────────────────

export function VanityRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  if (isLandscape) {
    // Wall/back at top, front (user side) at bottom
    const edgeH = heightPx * 0.14
    const basinCx = widthPx / 2
    const basinCy = heightPx * 0.62
    const basinRx = Math.min(widthPx * 0.22, heightPx * 0.28)
    const basinRy = heightPx * 0.25
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, edgeH, widthPx, edgeH]} stroke={STROKE} strokeWidth={0.8} />
        <Ellipse x={basinCx} y={basinCy} radiusX={basinRx} radiusY={basinRy}
          fill="#f0f8ff" stroke="#888" strokeWidth={0.7} />
        <Circle x={basinCx} y={edgeH + (basinCy - edgeH) * 0.45} radius={Math.min(widthPx * 0.04, 5)}
          fill="#bbb" stroke={STROKE} strokeWidth={0.5} />
      </Group>
    )
  }

  // Portrait: wall/back at left
  const edgeW = widthPx * 0.14
  const basinCx = widthPx * 0.62
  const basinCy = heightPx / 2
  const basinRx = widthPx * 0.25
  const basinRy = Math.min(heightPx * 0.22, widthPx * 0.28)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[edgeW, 0, edgeW, heightPx]} stroke={STROKE} strokeWidth={0.8} />
      <Ellipse x={basinCx} y={basinCy} radiusX={basinRx} radiusY={basinRy}
        fill="#f0f8ff" stroke="#888" strokeWidth={0.7} />
      <Circle x={edgeW + (basinCx - edgeW) * 0.45} y={basinCy} radius={Math.min(heightPx * 0.04, 5)}
        fill="#bbb" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

// ─── BATH STORAGE CABINET ────────────────────────────────────────────────────

export function BathStorageCabinetRenderer({ widthPx, heightPx }: RendererProps) {
  const shelfCount = Math.max(1, Math.round(heightPx / 24) - 1)
  const isLandscape = widthPx >= heightPx
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(200,200,200,0.08)" stroke={STROKE} strokeWidth={0.8} dash={[5, 3]} />
      {isLandscape
        ? Array.from({ length: shelfCount }, (_, i) => (
            <Line key={i}
              points={[3, ((i + 1) / (shelfCount + 1)) * heightPx, widthPx - 3, ((i + 1) / (shelfCount + 1)) * heightPx]}
              stroke="#bbb" strokeWidth={0.6} />
          ))
        : Array.from({ length: shelfCount }, (_, i) => (
            <Line key={i}
              points={[3, ((i + 1) / (shelfCount + 1)) * heightPx, widthPx - 3, ((i + 1) / (shelfCount + 1)) * heightPx]}
              stroke="#bbb" strokeWidth={0.6} />
          ))
      }
    </Group>
  )
}

// ─── GLAZING WALL ────────────────────────────────────────────────────────────

export function GlazingWallRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const len = isLandscape ? widthPx : heightPx
  const mullionSpacing = 40
  const mullionCount = Math.max(0, Math.floor(len / mullionSpacing) - 1)

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#C8E0F0" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {Array.from({ length: mullionCount }, (_, i) => {
        const pos = ((i + 1) / (mullionCount + 1)) * len
        return isLandscape
          ? <Rect key={i} x={pos - 1} y={0} width={2} height={heightPx} fill="#4A6A80" />
          : <Rect key={i} x={0} y={pos - 1} width={widthPx} height={2} fill="#4A6A80" />
      })}
    </Group>
  )
}

// ─── FIREPLACE / HEARTH ───────────────────────────────────────────────────────

export function FireplaceRenderer({ widthPx, heightPx }: RendererProps) {
  const boxW = widthPx * 0.55
  const boxH = heightPx * 0.5
  const boxX = (widthPx - boxW) / 2
  const boxY = (heightPx - boxH) / 2

  return (
    <Group>
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.fillStyle = '#7A756A'
          nctx.fillRect(0, 0, widthPx, heightPx)
          nctx.strokeStyle = '#4A4540'
          nctx.lineWidth = 1
          const courseH = Math.max(7, Math.min(18, heightPx / 5))
          const jointW = Math.max(14, Math.min(36, widthPx / 5))
          for (let row = 0, y = 0; y < heightPx; row++, y += courseH) {
            nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
            const offset = (row % 2) * jointW * 0.5
            for (let x = offset; x < widthPx; x += jointW) {
              nctx.beginPath(); nctx.moveTo(x, y); nctx.lineTo(x, Math.min(y + courseH, heightPx)); nctx.stroke()
            }
          }
          nctx.restore()
        }}
        listening={false}
      />
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={boxX} y={boxY} width={boxW} height={boxH} fill="#111" stroke={STROKE} strokeWidth={STROKE_MED} />
    </Group>
  )
}

// ─── MASONRY MASS ─────────────────────────────────────────────────────────────

export function MasonryMassRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.fillStyle = '#8A8278'
          nctx.fillRect(0, 0, widthPx, heightPx)
          nctx.strokeStyle = '#55504A'
          nctx.lineWidth = 1
          const courseH = Math.max(8, Math.min(22, heightPx / 6))
          const jointW = Math.max(16, Math.min(42, widthPx / 5))
          for (let row = 0, y = 0; y < heightPx; row++, y += courseH) {
            nctx.beginPath(); nctx.moveTo(0, y); nctx.lineTo(widthPx, y); nctx.stroke()
            const offset = (row % 2) * jointW * 0.5
            for (let x = offset; x < widthPx; x += jointW) {
              nctx.beginPath(); nctx.moveTo(x, y); nctx.lineTo(x, Math.min(y + courseH, heightPx)); nctx.stroke()
            }
          }
          nctx.restore()
        }}
        listening={false}
      />
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke={STROKE} strokeWidth={STROKE_MED} />
    </Group>
  )
}

// ─── HATCH STAIR ──────────────────────────────────────────────────────────────

export function HatchStairRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  // run = long dimension, stairW = short dimension (stair width)
  const runPx   = isLandscape ? widthPx  : heightPx
  const stairW  = isLandscape ? heightPx : widthPx
  const treadCount = Math.max(3, Math.round(runPx / 10))
  const treadSpacing = runPx / treadCount
  const arrowSize = Math.min(10, stairW * 0.2)

  return (
    <Group>
      {/* Diagonal hatch fill */}
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath(); nctx.rect(0, 0, widthPx, heightPx); nctx.clip()
          nctx.fillStyle = '#E8E4DC'
          nctx.fillRect(0, 0, widthPx, heightPx)
          nctx.strokeStyle = '#AAA49C'
          nctx.lineWidth = 0.8
          const spacing = 9
          const diag = Math.max(widthPx, heightPx)
          for (let t = -diag; t < widthPx + diag; t += spacing) {
            nctx.beginPath(); nctx.moveTo(t, 0); nctx.lineTo(t + heightPx, heightPx); nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
      {/* Tread lines — perpendicular to run direction */}
      {Array.from({ length: treadCount - 1 }, (_, i) => {
        const pos = (i + 1) * treadSpacing
        return isLandscape
          ? <Line key={i} points={[pos, 0, pos, heightPx]} stroke={STROKE} strokeWidth={1} />
          : <Line key={i} points={[0, pos, widthPx, pos]} stroke={STROKE} strokeWidth={1} />
      })}
      {/* Direction arrow along run */}
      {isLandscape
        ? <>
            <Line points={[runPx * 0.2, stairW / 2, runPx * 0.8, stairW / 2]} stroke="#444" strokeWidth={0.75} />
            <Line points={[runPx * 0.8 - arrowSize, stairW / 2 - arrowSize, runPx * 0.8, stairW / 2, runPx * 0.8 - arrowSize, stairW / 2 + arrowSize]} stroke="#444" strokeWidth={0.75} />
          </>
        : <>
            <Line points={[stairW / 2, runPx * 0.2, stairW / 2, runPx * 0.8]} stroke="#444" strokeWidth={0.75} />
            <Line points={[stairW / 2 - arrowSize, runPx * 0.8 - arrowSize, stairW / 2, runPx * 0.8, stairW / 2 + arrowSize, runPx * 0.8 - arrowSize]} stroke="#444" strokeWidth={0.75} />
          </>
      }
      {/* Border */}
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke={STROKE} strokeWidth={STROKE_MED} />
    </Group>
  )
}

// ─── TERRACE EDGE ─────────────────────────────────────────────────────────────

export function TerraceEdgeRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#F0EDE8" stroke="transparent" />
      {isLandscape ? (
        <>
          <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={1.25} />
          <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.75} dash={[8, 5]} />
          <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={1} />
          <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={1} />
        </>
      ) : (
        <>
          <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={1.25} />
          <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={0.75} dash={[8, 5]} />
          <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={1} />
          <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={1} />
        </>
      )}
    </Group>
  )
}

// ─── POLYGON ─────────────────────────────────────────────────────────────────

export function PolygonRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const pts = (properties.points as { x: number; y: number }[] | undefined) ?? []
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : 'rgba(255,255,255,0.05)'
  const stroke = typeof properties.strokeColor === 'string' ? properties.strokeColor : STROKE
  if (pts.length < 3) {
    return <Rect width={widthPx} height={heightPx} stroke={stroke} strokeWidth={1} fill={fill} />
  }
  const flat = pts.flatMap(p => [p.x * widthPx, p.y * heightPx])
  return (
    <Line
      points={flat}
      closed
      fill={fill}
      stroke={stroke}
      strokeWidth={0.75}
    />
  )
}

// ─── REGISTRY ─────────────────────────────────────────────────────────────────

type RendererComponent = React.FC<RendererProps>

// ─── ELEVATION ───────────────────────────────────────────────────────────────

export function ElevWallFaceRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#C8966C'
  const pattern = typeof properties.fillPattern === 'string' ? properties.fillPattern : 'brick'
  return (
    <Group>
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath(); nctx.rect(0, 0, widthPx, heightPx); nctx.clip()
          if (pattern === 'brick') {
            const CH = 6, BL = 16, MW = 0.8
            nctx.fillStyle = '#D0C4AE'; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.fillStyle = fill
            for (let row = -1; row * CH < heightPx + CH; row++) {
              const y = row * CH
              const xOff = (((row % 2) + 2) % 2) * (BL / 2)
              for (let col = -1; col * BL < widthPx + BL * 2; col++)
                nctx.fillRect(col * BL + xOff + MW, y + MW, BL - MW * 2, CH - MW * 2)
            }
            // Subtle tone variation
            nctx.fillStyle = 'rgba(0,0,0,0.07)'
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
            const boardW = 10
            nctx.fillStyle = fill; nctx.fillRect(0, 0, widthPx, heightPx)
            nctx.strokeStyle = 'rgba(0,0,0,0.22)'; nctx.lineWidth = 0.8
            for (let x = boardW; x < widthPx; x += boardW) {
              nctx.beginPath(); nctx.moveTo(x, 0); nctx.lineTo(x, heightPx); nctx.stroke()
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

export function ElevCantilevSlabRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#A0A0A0'
  const shadowH = Math.min(heightPx * 0.35, 6)
  const taperPx = typeof properties.taperFt === 'number' ? properties.taperFt * (heightPx / 1) : 0

  if (taperPx !== 0) {
    // Trapezoid: left edge full-width, right edge inset by taperPx
    const inset = Math.min(taperPx, widthPx * 0.5)
    const pts = [0, 0, widthPx, 0, widthPx - inset, heightPx, 0, heightPx]
    return (
      <Group>
        <Shape
          sceneFunc={(ctx) => {
            const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
            nctx.save()
            nctx.beginPath()
            nctx.moveTo(pts[0], pts[1])
            nctx.lineTo(pts[2], pts[3])
            nctx.lineTo(pts[4], pts[5])
            nctx.lineTo(pts[6], pts[7])
            nctx.closePath()
            nctx.fillStyle = fill
            nctx.fill()
            nctx.strokeStyle = '#222'
            nctx.lineWidth = 1
            nctx.stroke()
            // shadow on bottom edge
            nctx.beginPath()
            nctx.moveTo(0, heightPx)
            nctx.lineTo(widthPx - inset, heightPx)
            nctx.lineWidth = shadowH
            nctx.strokeStyle = '#1C1C1C'
            nctx.stroke()
            nctx.restore()
          }}
          listening={false}
        />
      </Group>
    )
  }

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={fill} stroke={STROKE} strokeWidth={STROKE_HEAVY} />
      <Rect x={0} y={heightPx - shadowH} width={widthPx} height={shadowH} fill="#1C1C1C" listening={false} />
      <Line points={[widthPx - 2, 0, widthPx - 2, heightPx]} stroke="#555" strokeWidth={0.5} listening={false} />
    </Group>
  )
}

export function ElevPierRenderer({ widthPx, heightPx }: RendererProps) {
  const lineCount = Math.max(2, Math.floor(widthPx / 8))
  const pLines: React.ReactNode[] = []
  for (let i = 1; i < lineCount; i++) {
    const x = (i / lineCount) * widthPx
    pLines.push(<Line key={i} points={[x, 0, x, heightPx]} stroke="#777" strokeWidth={0.5} listening={false} />)
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#909090" stroke={STROKE} strokeWidth={STROKE_HEAVY} />
      {pLines}
    </Group>
  )
}

export function ElevRibbonWindowRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const FRAME = 3
  const glassColor = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'
  const solidColor = typeof properties.solidColor === 'string' ? properties.solidColor : '#B87333'
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
    if (i > 0) {
      elems.push(
        <Line key={`mul-${i}`} points={[bx, FRAME, bx, heightPx - FRAME]} stroke="#4A6E7E" strokeWidth={1} listening={false} />
      )
    }
  }

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#4A6E7E" stroke={STROKE} strokeWidth={STROKE_HEAVY} />
      {elems}
    </Group>
  )
}

export function ElevWindowFaceRenderer({ widthPx, heightPx }: RendererProps) {
  const FRAME = 4
  const sillH = Math.max(3, heightPx * 0.08)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#4A6E7E" stroke="#333" strokeWidth={1} />
      <Rect x={FRAME} y={FRAME} width={widthPx - FRAME * 2} height={heightPx - FRAME * 2 - sillH} fill="rgba(176,210,228,0.55)" stroke="#4A6E7E" strokeWidth={0.5} />
      {/* sill */}
      <Rect x={0} y={heightPx - sillH} width={widthPx} height={sillH} fill="#ADADAD" stroke="#555" strokeWidth={0.5} />
      {/* center glazing bar */}
      <Line points={[widthPx / 2, FRAME, widthPx / 2, heightPx - FRAME - sillH]} stroke="#4A6E7E" strokeWidth={1} listening={false} />
    </Group>
  )
}

export function ElevDoorFaceRenderer({ widthPx, heightPx }: RendererProps) {
  const FRAME = 4
  const threshH = Math.max(3, heightPx * 0.04)
  const panelW = widthPx - FRAME * 2
  const panelH = heightPx - FRAME * 2 - threshH
  const railY1 = FRAME + panelH * 0.35
  const railY2 = FRAME + panelH * 0.65
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#B0B0B0" stroke="#222" strokeWidth={1} />
      {/* door panel */}
      <Rect x={FRAME} y={FRAME} width={panelW} height={panelH} fill="#D4D4D4" stroke="#555" strokeWidth={0.5} />
      {/* panel rails */}
      <Line points={[FRAME, railY1, FRAME + panelW, railY1]} stroke="#888" strokeWidth={0.8} listening={false} />
      <Line points={[FRAME, railY2, FRAME + panelW, railY2]} stroke="#888" strokeWidth={0.8} listening={false} />
      {/* threshold */}
      <Rect x={0} y={heightPx - threshH} width={widthPx} height={threshH} fill="#888" stroke="#555" strokeWidth={0.5} />
    </Group>
  )
}

export function ElevCurtainWallRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const glassColor = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.5)'
  const hMullionSpacing = Math.max(20, heightPx / Math.max(1, Math.round(heightPx / 96)))
  const vMullionSpacing = Math.max(20, widthPx / Math.max(1, Math.round(widthPx / 48)))
  const mullions: React.ReactNode[] = []
  for (let x = vMullionSpacing; x < widthPx; x += vMullionSpacing) {
    mullions.push(<Line key={`v${x}`} points={[x, 0, x, heightPx]} stroke="#4A6E7E" strokeWidth={0.75} listening={false} />)
  }
  for (let y = hMullionSpacing; y < heightPx; y += hMullionSpacing) {
    mullions.push(<Line key={`h${y}`} points={[0, y, widthPx, y]} stroke="#4A6E7E" strokeWidth={1} listening={false} />)
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={glassColor} stroke="#333" strokeWidth={1} />
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
          nctx.fillStyle = '#C8B98A'
          nctx.fillRect(0, 0, widthPx, heightPx)
          nctx.strokeStyle = '#8B7355'
          nctx.lineWidth = 0.7
          const spacing = 10
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
      <Line points={[0, 0, widthPx, 0]} stroke="#333" strokeWidth={0.75} listening={false} />
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke="#555" strokeWidth={0.5} />
    </Group>
  )
}

export function ElevShadowBandRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Rect width={widthPx} height={heightPx} fill="#1A1A1A" stroke="transparent" strokeWidth={0} />
  )
}

export function ElevParapetRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#ADADAD'
  const copingH = Math.max(3, heightPx * 0.2)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={fill} stroke="#333" strokeWidth={0.75} />
      <Rect x={0} y={0} width={widthPx} height={copingH} fill="#888" stroke="#333" strokeWidth={0.5} />
    </Group>
  )
}

// ─── LOUVER FINS ─────────────────────────────────────────────────────────────

export function ElevLouverFinsRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const angleDeg = typeof properties.angleDeg === 'number' ? properties.angleDeg : 0
  const finColor = typeof properties.fillColor === 'string' ? properties.fillColor : '#5B8B6E'
  const bgColor = typeof properties.bgColor === 'string' ? properties.bgColor : '#A8A8A8'

  if (angleDeg === 0) {
    // Horizontal stacked fins — venetian-blind appearance for plan-view louver banks
    const finCount = typeof properties.finCount === 'number'
      ? Math.max(1, properties.finCount)
      : Math.max(3, Math.round(heightPx / 5))
    const finSpacing = heightPx / finCount
    const finH = Math.max(1, finSpacing * 0.5)
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
      ? Math.max(1, properties.finCount)
      : Math.max(3, Math.round(widthPx / 8))
    const finSpacing = widthPx / finCount
    const finW = Math.max(1.5, finSpacing * 0.35)
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
    ? Math.max(1, properties.finCount)
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

export function ElevSpireRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#B87333'
  const finialR = Math.max(3, Math.min(widthPx * 0.18, 8))
  const shaftH = heightPx - finialR * 2

  return (
    <Group>
      {/* Tapered shaft: trapezoid from full width at bottom to near-zero at top */}
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.moveTo(widthPx / 2, finialR * 2)          // apex
          nctx.lineTo(widthPx * 0.85, shaftH * 0.6)      // upper taper
          nctx.lineTo(widthPx, shaftH + finialR * 2)      // bottom-right
          nctx.lineTo(0, shaftH + finialR * 2)            // bottom-left
          nctx.lineTo(widthPx * 0.15, shaftH * 0.6)      // upper taper left
          nctx.closePath()
          nctx.fillStyle = fill
          nctx.fill()
          nctx.strokeStyle = '#333'
          nctx.lineWidth = 0.75
          nctx.stroke()
          nctx.restore()
        }}
        listening={false}
      />
      {/* Finial cap */}
      <Circle x={widthPx / 2} y={finialR} radius={finialR} fill={fill} stroke="#333" strokeWidth={0.75} />
    </Group>
  )
}

// ─── SPANDREL PANEL ──────────────────────────────────────────────────────────

export function ElevSpandrelPanelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#9CA3AF'
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
  const fontSize = Math.max(8, Math.min(13, heightPx * 10))

  return (
    <Group>
      {/* Invisible background hit area */}
      <Rect width={widthPx} height={heightPx} fill="transparent" />
      {/* Datum line at top of element */}
      <Line points={[0, 1, widthPx, 1]} stroke="#1A1A1A" strokeWidth={0.75} listening={false} />
      {/* Small tick at left edge */}
      <Line points={[0, 1, 0, heightPx * 0.55]} stroke="#1A1A1A" strokeWidth={0.75} listening={false} />
      {/* Label */}
      <Text
        text={label}
        x={4} y={4}
        width={widthPx - 8}
        fontSize={fontSize}
        fontFamily={ARC_FONT}
        fill="#1A1A1A"
        listening={false}
      />
    </Group>
  )
}

// ─── MATERIAL CALLOUT ─────────────────────────────────────────────────────────

export function ElevMaterialCalloutRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = (typeof properties.material === 'string' ? properties.material : 'MATERIAL').toUpperCase()
  const cy = heightPx / 2
  const dotX = 4
  const lineEndX = Math.min(18, widthPx * 0.15)
  const fontSize = Math.max(7, Math.min(10, heightPx * 0.44))

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="transparent" />
      {/* Small filled dot at pointer tip */}
      <Circle x={dotX} y={cy} radius={2} fill="#1A1A1A" listening={false} />
      {/* Short leader line */}
      <Line points={[dotX + 2, cy, lineEndX, cy]} stroke="#1A1A1A" strokeWidth={0.6} listening={false} />
      {/* Uppercase plain text — no bubble */}
      <Text
        text={label}
        x={lineEndX + 4} y={cy - fontSize * 0.58}
        width={widthPx - lineEndX - 6}
        fontSize={fontSize}
        fontFamily={ARC_FONT}
        fontStyle="bold"
        fill="#1A1A1A"
        letterSpacing={0.5}
        wrap="word"
        listening={false}
      />
    </Group>
  )
}

// ─── ANGLED PANEL ─────────────────────────────────────────────────────────────

export function ElevAngledPanelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const STROKE = '#1A1A1A'
  const angleDeg = typeof properties.angleDeg === 'number' ? properties.angleDeg : 30
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : 'rgba(255,255,255,0.08)'
  const skewPx = heightPx * Math.tan((angleDeg * Math.PI) / 180)

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
  nctx.fillStyle = '#C0C0C0'
  nctx.beginPath()
  nctx.moveTo(-proj, sillY)
  nctx.lineTo(widthPx + proj, sillY)
  nctx.lineTo(widthPx + proj * 0.6, sillY + 5)
  nctx.lineTo(-proj * 0.6, sillY + 5)
  nctx.closePath()
  nctx.fill()
  nctx.strokeStyle = '#888'; nctx.lineWidth = 0.8; nctx.stroke()
}

export function ElevWindowDoubleHungRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(3, Math.min(6, widthPx * 0.09))
  const sillH = Math.max(5, heightPx * 0.09)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'
  const innerW = widthPx - F * 2
  const innerH = heightPx - F * 2 - sillH
  const meetY = F + innerH / 2
  const meetH = Math.max(2.5, F * 0.65)
  const midX = widthPx / 2
  const thirdH = (innerH / 2 - meetH / 2) / 3

  return (
    <Group>
      <Rect width={widthPx} height={heightPx - sillH} fill="#5C5040" stroke="#2A2A2A" strokeWidth={0.75} />
      {/* Upper sash */}
      <Rect x={F} y={F} width={innerW} height={innerH/2 - meetH/2} fill={glass} stroke="#3A4E60" strokeWidth={0.5} />
      <Line points={[midX, F, midX, meetY - meetH/2]} stroke="#4A6070" strokeWidth={0.75} listening={false} />
      <Line points={[F, F + thirdH, F+innerW, F + thirdH]} stroke="#4A6070" strokeWidth={0.5} listening={false} />
      <Line points={[F, F + thirdH*2, F+innerW, F + thirdH*2]} stroke="#4A6070" strokeWidth={0.5} listening={false} />
      {/* Meeting rail */}
      <Rect x={F} y={meetY - meetH/2} width={innerW} height={meetH} fill="#4A6070" stroke="#2A4050" strokeWidth={0.4} />
      {/* Lower sash */}
      <Rect x={F} y={meetY + meetH/2} width={innerW} height={innerH/2 - meetH/2} fill={glass} stroke="#3A4E60" strokeWidth={0.5} />
      <Line points={[midX, meetY+meetH/2, midX, F+innerH]} stroke="#4A6070" strokeWidth={0.75} listening={false} />
      <Line points={[F, meetY+meetH/2+thirdH, F+innerW, meetY+meetH/2+thirdH]} stroke="#4A6070" strokeWidth={0.5} listening={false} />
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save(); _windowSill(widthPx, heightPx - sillH, nctx); nctx.restore()
      }} listening={false} />
    </Group>
  )
}

export function ElevWindowSingleHungRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(3, Math.min(6, widthPx * 0.09))
  const sillH = Math.max(5, heightPx * 0.09)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'
  const innerW = widthPx - F * 2
  const innerH = heightPx - F * 2 - sillH
  const meetY = F + innerH / 2
  const meetH = Math.max(2.5, F * 0.65)
  const midX = widthPx / 2
  const upperH = innerH / 2 - meetH / 2

  return (
    <Group>
      <Rect width={widthPx} height={heightPx - sillH} fill="#5C5040" stroke="#2A2A2A" strokeWidth={0.75} />
      {/* Upper sash — fixed, 2×2 divided light */}
      <Rect x={F} y={F} width={innerW} height={upperH} fill={glass} stroke="#3A4E60" strokeWidth={0.8} />
      <Line points={[midX, F, midX, meetY - meetH/2]} stroke="#4A6070" strokeWidth={0.75} listening={false} />
      <Line points={[F, F + upperH/2, F+innerW, F + upperH/2]} stroke="#4A6070" strokeWidth={0.6} listening={false} />
      {/* Meeting rail */}
      <Rect x={F} y={meetY - meetH/2} width={innerW} height={meetH} fill="#4A6070" stroke="#2A4050" strokeWidth={0.5} />
      {/* Lower sash — operable, plain */}
      <Rect x={F} y={meetY + meetH/2} width={innerW} height={innerH/2 - meetH/2} fill={glass} stroke="#3A4E60" strokeWidth={0.8} />
      <Line points={[midX, meetY+meetH/2, midX, F+innerH]} stroke="#4A6070" strokeWidth={0.75} listening={false} />
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save(); _windowSill(widthPx, heightPx - sillH, nctx); nctx.restore()
      }} listening={false} />
    </Group>
  )
}

export function ElevWindowCasementRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(3, Math.min(6, widthPx * 0.09))
  const sillH = Math.max(5, heightPx * 0.09)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'
  const hingeLeft = properties.hingeLeft !== false
  const innerW = widthPx - F * 2
  const innerH = heightPx - F * 2 - sillH
  const hingeX = hingeLeft ? F : F + innerW
  const handleX = hingeLeft ? F + innerW - 3 : F + 3

  return (
    <Group>
      <Rect width={widthPx} height={heightPx - sillH} fill="#5C5040" stroke="#2A2A2A" strokeWidth={0.75} />
      <Rect x={F} y={F} width={innerW} height={innerH} fill={glass} stroke="#3A4E60" strokeWidth={0.8} />
      {/* Swing arc */}
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save()
        nctx.strokeStyle = 'rgba(74,96,112,0.5)'; nctx.lineWidth = 0.9
        nctx.setLineDash([4, 3])
        const r = Math.min(innerW * 0.7, innerH * 0.4)
        const cy = F + innerH * 0.45
        nctx.beginPath()
        if (hingeLeft) nctx.arc(hingeX, cy, r, -Math.PI / 3, Math.PI / 3)
        else nctx.arc(hingeX, cy, r, Math.PI * 2 / 3, Math.PI * 4 / 3)
        nctx.stroke()
        nctx.setLineDash([])
        // Handle
        nctx.fillStyle = '#999'
        nctx.beginPath(); nctx.arc(handleX, cy, 2.5, 0, Math.PI * 2); nctx.fill()
        nctx.strokeStyle = '#666'; nctx.lineWidth = 0.8; nctx.stroke()
        _windowSill(widthPx, heightPx - sillH, nctx)
        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

export function ElevWindowFixedRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(3, Math.min(5, widthPx * 0.07))
  const sillH = Math.max(5, heightPx * 0.09)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.6)'
  const innerW = widthPx - F * 2
  const innerH = heightPx - F * 2 - sillH

  return (
    <Group>
      <Rect width={widthPx} height={heightPx - sillH} fill="#5C5040" stroke="#2A2A2A" strokeWidth={0.75} />
      <Rect x={F} y={F} width={innerW} height={innerH} fill={glass} stroke="#3A4E60" strokeWidth={0.8} />
      {/* Subtle glare highlight */}
      <Line points={[F+2, F+2, F+innerW*0.3, F+2]} stroke="rgba(255,255,255,0.35)" strokeWidth={0.6} listening={false} />
      <Line points={[F+2, F+2, F+2, F+innerH*0.25]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} listening={false} />
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save(); _windowSill(widthPx, heightPx - sillH, nctx); nctx.restore()
      }} listening={false} />
    </Group>
  )
}

export function ElevWindowArchedRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const F = Math.max(4, Math.min(7, widthPx * 0.1))
  const sillH = Math.max(5, heightPx * 0.08)
  const glass = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'
  const midX = widthPx / 2
  const archR = midX  // semicircle radius = half width
  const springY = archR  // spring line at top — arch height = radius
  const rectH = heightPx - springY - sillH
  const innerW = widthPx - F * 2
  const keystoneW = Math.max(F * 1.8, 8)

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
        nctx.fillStyle = '#5C5040'; nctx.fill()
        nctx.strokeStyle = '#2A2A2A'; nctx.lineWidth = 0.75; nctx.stroke()

        // Arch glass pane (inner arch)
        nctx.beginPath()
        nctx.moveTo(F, springY)
        nctx.arc(midX, springY, midX - F, Math.PI, 0)
        nctx.lineTo(F + innerW, springY)
        nctx.closePath()
        nctx.fillStyle = glass; nctx.fill()
        nctx.strokeStyle = '#3A4E60'; nctx.lineWidth = 0.8; nctx.stroke()

        // Radiating muntins
        const munCount = 5
        nctx.strokeStyle = '#4A6070'; nctx.lineWidth = 0.6
        for (let i = 1; i < munCount; i++) {
          const angle = Math.PI - (i / munCount) * Math.PI
          const x1 = midX + (midX - F) * Math.cos(angle)
          const y1 = springY + (midX - F) * Math.sin(angle)
          nctx.beginPath(); nctx.moveTo(midX, springY); nctx.lineTo(x1, y1); nctx.stroke()
        }
        // Keystone
        const kx = midX - keystoneW / 2
        nctx.fillStyle = '#8A7A60'
        nctx.beginPath()
        nctx.moveTo(kx, F * 0.5)
        nctx.lineTo(kx + keystoneW, F * 0.5)
        nctx.lineTo(kx + keystoneW * 0.72, springY)
        nctx.lineTo(kx + keystoneW * 0.28, springY)
        nctx.closePath()
        nctx.fill(); nctx.strokeStyle = '#5A4A38'; nctx.lineWidth = 0.8; nctx.stroke()

        // Rectangular lower sash (below spring line)
        if (rectH > 8) {
          nctx.fillStyle = glass
          nctx.fillRect(F, springY, innerW, rectH)
          nctx.strokeStyle = '#3A4E60'; nctx.lineWidth = 0.8
          nctx.strokeRect(F, springY, innerW, rectH)
          nctx.strokeStyle = '#4A6070'; nctx.lineWidth = 0.75
          nctx.beginPath(); nctx.moveTo(midX, springY); nctx.lineTo(midX, springY + rectH); nctx.stroke()
          // Meeting rail if tall enough
          if (rectH > 20) {
            const mY = springY + rectH / 2
            nctx.fillStyle = '#4A6070'; nctx.fillRect(F, mY - 1.5, innerW, 3)
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
  const fill1 = '#C2B09A'
  const fill2 = '#D4C4B0'
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

export function ElevStairFrontRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const stepCount = typeof properties.stepCount === 'number'
    ? Math.max(2, properties.stepCount)
    : Math.max(2, Math.round(heightPx / 10))
  const riserColor = '#D0CCCC'
  const treadColor = '#B8B4B0'
  const strokeC = '#7A7470'

  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as {_context: CanvasRenderingContext2D})._context
        nctx.save()
        const riserH = heightPx / stepCount
        const perspective = widthPx * 0.06  // narrowing per step

        for (let i = 0; i < stepCount; i++) {
          const step = stepCount - 1 - i  // draw back-to-front
          const inset = step * perspective / stepCount
          const w = widthPx - inset * 2
          const y = i * riserH
          const treadH = riserH * 0.18

          // Riser face
          nctx.fillStyle = riserColor
          nctx.fillRect(inset, y + treadH, w, riserH - treadH)
          nctx.strokeStyle = strokeC; nctx.lineWidth = 0.8
          nctx.strokeRect(inset, y + treadH, w, riserH - treadH)

          // Tread top (perspective trapezoid)
          const nextInset = (step - 1) * perspective / stepCount
          const nextW = widthPx - nextInset * 2
          nctx.fillStyle = treadColor
          nctx.beginPath()
          nctx.moveTo(inset, y + treadH)
          nctx.lineTo(inset + w, y + treadH)
          nctx.lineTo((widthPx - nextW) / 2 + nextW, y)
          nctx.lineTo((widthPx - nextW) / 2, y)
          nctx.closePath(); nctx.fill()
          nctx.strokeStyle = strokeC; nctx.lineWidth = 0.8; nctx.stroke()
        }
        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── ANNOTATION SYMBOLS ──────────────────────────────────────────────────────

export function AnnotationLeaderRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = (typeof properties.label === 'string' ? properties.label : 'Label').toUpperCase()
  const cy = heightPx / 2
  const arrowW = Math.min(12, heightPx * 0.5)  // arrowhead body width
  const arrowH = Math.min(5,  heightPx * 0.3)  // arrowhead half-height
  const tipX  = 3
  const baseX = tipX + arrowW
  // Short tail line between arrowhead base and text — 6px gap max
  const tailX = baseX + Math.min(6, widthPx * 0.06)
  const fontSize = Math.max(8, Math.min(12, heightPx * 0.48))
  return (
    <Group>
      {/* Short tail from arrowhead base — does NOT extend under the text */}
      <Line points={[baseX, cy, tailX, cy]} stroke="#1A1A1A" strokeWidth={0.75} listening={false} />
      {/* Arrowhead: tip at left, base at right */}
      <Line
        points={[tipX, cy, baseX, cy - arrowH, baseX, cy + arrowH, tipX, cy]}
        stroke="#1A1A1A" strokeWidth={0.8} fill="#1A1A1A" closed listening={false}
      />
      {/* Label starts after the tail, vertically centred */}
      <Text
        x={tailX + 3} y={cy - fontSize * 0.62}
        width={widthPx - tailX - 6}
        text={label}
        fontSize={fontSize}
        fill="#1A1A1A" fontFamily={ARC_FONT}
        letterSpacing={0.4}
        listening={false}
      />
    </Group>
  )
}

export function AnnotationSectionCutRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : 'A'
  const cy = heightPx * 0.5
  const bubbleR = Math.min(heightPx * 0.45, 14)
  return (
    <Group>
      {/* Cut line — thick dashed */}
      <Line points={[bubbleR * 2 + 2, cy, widthPx - bubbleR * 2 - 2, cy]}
        stroke="#1A1A1A" strokeWidth={1} dash={[8, 4]} />
      {/* Left bubble */}
      <Circle x={bubbleR} y={cy} radius={bubbleR} stroke="#1A1A1A" strokeWidth={0.6} fill="white" />
      <Text x={0} y={cy - bubbleR * 0.6} width={bubbleR * 2} text={label}
        fontSize={Math.max(8, bubbleR * 0.9)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" />
      {/* Right bubble */}
      <Circle x={widthPx - bubbleR} y={cy} radius={bubbleR} stroke="#1A1A1A" strokeWidth={0.6} fill="white" />
      <Text x={widthPx - bubbleR * 2} y={cy - bubbleR * 0.6} width={bubbleR * 2} text={label}
        fontSize={Math.max(8, bubbleR * 0.9)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

export function AnnotationGridBubbleRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : 'A'
  const cx = widthPx * 0.5
  const bubbleR = Math.min(widthPx * 0.45, 16)
  return (
    <Group>
      {/* Grid line */}
      <Line points={[cx, bubbleR * 2 + 2, cx, heightPx + 99999]} stroke="#555" strokeWidth={1} dash={[6, 4]} listening={false} />
      {/* Bubble at top */}
      <Circle x={cx} y={bubbleR} radius={bubbleR} stroke="#1A1A1A" strokeWidth={0.6} fill="white" />
      <Text x={cx - bubbleR} y={bubbleR - bubbleR * 0.6} width={bubbleR * 2} text={label}
        fontSize={Math.max(8, bubbleR * 0.9)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

export function AnnotationBreakLineRenderer({ widthPx, heightPx }: RendererProps) {
  const cy = heightPx * 0.5
  const seg = widthPx / 5
  const amp = Math.min(heightPx * 0.4, 8)
  return (
    <Group>
      <Line
        points={[
          0, cy,
          seg, cy,
          seg * 1.5, cy - amp,
          seg * 2, cy + amp,
          seg * 2.5, cy - amp,
          seg * 3, cy,
          seg * 4, cy,
          widthPx, cy,
        ]}
        stroke="#1A1A1A" strokeWidth={0.6}
      />
    </Group>
  )
}

export function AnnotationElevationMarkerRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : '1'
  const cx = widthPx * 0.5
  const cy = heightPx * 0.5
  const r = Math.min(cx, cy) - 1
  const arrowDir = typeof properties.direction === 'string' ? properties.direction : 'right'
  const arrowAngles: Record<string, number> = { right: 0, up: -90, left: 180, down: 90 }
  const angleDeg = arrowAngles[arrowDir] ?? 0
  const angleRad = (angleDeg * Math.PI) / 180
  const ax = cx + Math.cos(angleRad) * r * 0.95
  const ay = cy + Math.sin(angleRad) * r * 0.95
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke="#1A1A1A" strokeWidth={0.6} fill="white" />
      {/* Arrow inside circle */}
      <Line points={[cx, cy, ax, ay]} stroke="#1A1A1A" strokeWidth={0.75} />
      <Text x={cx - r} y={cy - r * 0.55} width={r * 2} text={label}
        fontSize={Math.max(8, r * 0.75)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

export function AnnotationDetailBubbleRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const detailNum = typeof properties.detailNum === 'string' ? properties.detailNum : '1'
  const sheetRef = typeof properties.sheetRef === 'string' ? properties.sheetRef : 'A-1'
  const cx = widthPx * 0.5
  const cy = heightPx * 0.5
  const r = Math.min(cx, cy) - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke="#1A1A1A" strokeWidth={0.6} fill="white" />
      {/* Horizontal divider */}
      <Line points={[cx - r + 2, cy, cx + r - 2, cy]} stroke="#1A1A1A" strokeWidth={0.8} />
      {/* Detail number (top) */}
      <Text x={cx - r} y={cy - r + 2} width={r * 2} text={detailNum}
        fontSize={Math.max(7, r * 0.65)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" fontStyle="bold" />
      {/* Sheet ref (bottom) */}
      <Text x={cx - r} y={cy + 2} width={r * 2} text={sheetRef}
        fontSize={Math.max(6, r * 0.55)} fill="#1A1A1A" fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

export function AnnotationRevisionCloudRenderer({ widthPx, heightPx }: RendererProps) {
  const arcR = Math.min(widthPx, heightPx) * 0.1
  const segments = 16
  const points: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * 2 * Math.PI
    const baseX = widthPx * 0.5 + (widthPx * 0.47) * Math.cos(angle - Math.PI / 2)
    const baseY = heightPx * 0.5 + (heightPx * 0.47) * Math.sin(angle - Math.PI / 2)
    const bumpAngle = angle + Math.PI
    const bx = baseX + arcR * Math.cos(bumpAngle)
    const by = baseY + arcR * Math.sin(bumpAngle)
    points.push(bx, by)
  }
  return (
    <Group>
      <Line points={points} stroke="#1A1A1A" strokeWidth={0.6} closed tension={0.4} />
    </Group>
  )
}

// ─── BAY WINDOW ──────────────────────────────────────────────────────────────

export function ElevBayWindowRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const glassColor = typeof properties.glassColor === 'string' ? properties.glassColor : 'rgba(176,210,228,0.55)'

  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nctx.save()

        const brickFront   = '#C8966C'
        const mortarFront  = '#D0C4AE'
        const brickReturn  = '#9A6A44'  // darker — recessed face
        const mortarReturn = '#B08060'
        const frameC = '#5C5040'

        const crownH = Math.max(6, heightPx * 0.055)
        const baseH  = Math.max(5, heightPx * 0.04)
        const bodyY  = crownH
        const bodyH  = heightPx - crownH - baseH

        // Orthographic: returns are flat rectangles (~18% each), depth shown by value
        const returnW = widthPx * 0.18
        const centerX = returnW
        const centerW = widthPx - returnW * 2
        const rightX  = centerX + centerW

        // Fill brick inside a rectangular clip region
        function fillBrick(bx: number, by: number, bw: number, bh: number, bc: string, mc: string) {
          nctx.save()
          nctx.beginPath()
          nctx.rect(bx, by, bw, bh)
          nctx.clip()
          const CH = 6, BL = 16, MW = 0.8
          nctx.fillStyle = mc
          nctx.fillRect(bx - BL, by - CH, bw + BL * 2, bh + CH * 2)
          nctx.fillStyle = bc
          for (let row = Math.floor(by / CH) - 1; row * CH < by + bh + CH; row++) {
            const ry = row * CH
            const xOff = (((row % 2) + 2) % 2) * (BL / 2)
            for (let col = Math.floor(bx / BL) - 1; col * BL < bx + bw + BL * 2; col++)
              nctx.fillRect(col * BL + xOff + MW, ry + MW, BL - MW * 2, CH - MW * 2)
          }
          nctx.fillStyle = 'rgba(0,0,0,0.07)'
          for (let row = Math.floor(by / CH) - 1; row * CH < by + bh + CH; row++) {
            const ry = row * CH
            const xOff = (((row % 2) + 2) % 2) * (BL / 2)
            for (let col = Math.floor(bx / BL) - 1; col * BL < bx + bw + BL * 2; col += 3)
              nctx.fillRect(col * BL + xOff + MW, ry + MW, BL - MW * 2, CH - MW * 2)
          }
          nctx.restore()
        }

        // Double-hung window
        function drawWin(wx: number, wy: number, ww: number, wh: number) {
          const F = Math.max(2, Math.min(5, ww * 0.09))
          const sillH = Math.max(4, wh * 0.09)
          const innerW = ww - F * 2
          const innerH = wh - F * 2 - sillH
          const meetY  = wy + F + innerH / 2
          const meetH  = Math.max(2, F * 0.65)
          const midX   = wx + ww / 2
          const thirdH = (innerH / 2 - meetH / 2) / 3

          nctx.fillStyle = frameC
          nctx.fillRect(wx, wy, ww, wh - sillH)
          nctx.strokeStyle = '#2A2A2A'; nctx.lineWidth = 0.6
          nctx.strokeRect(wx, wy, ww, wh - sillH)

          nctx.fillStyle = glassColor
          nctx.fillRect(wx + F, wy + F, innerW, innerH / 2 - meetH / 2)
          nctx.strokeStyle = '#3A4E60'; nctx.lineWidth = 0.4
          nctx.strokeRect(wx + F, wy + F, innerW, innerH / 2 - meetH / 2)
          nctx.strokeStyle = '#4A6070'; nctx.lineWidth = 0.6
          nctx.beginPath(); nctx.moveTo(midX, wy + F); nctx.lineTo(midX, meetY - meetH / 2); nctx.stroke()
          nctx.lineWidth = 0.5
          nctx.beginPath(); nctx.moveTo(wx + F, wy + F + thirdH); nctx.lineTo(wx + F + innerW, wy + F + thirdH); nctx.stroke()

          nctx.fillStyle = '#4A6070'
          nctx.fillRect(wx + F, meetY - meetH / 2, innerW, meetH)

          nctx.fillStyle = glassColor
          nctx.fillRect(wx + F, meetY + meetH / 2, innerW, innerH / 2 - meetH / 2)
          nctx.strokeStyle = '#3A4E60'; nctx.lineWidth = 0.4
          nctx.strokeRect(wx + F, meetY + meetH / 2, innerW, innerH / 2 - meetH / 2)
          nctx.strokeStyle = '#4A6070'; nctx.lineWidth = 0.6
          nctx.beginPath(); nctx.moveTo(midX, meetY + meetH / 2); nctx.lineTo(midX, wy + F + innerH); nctx.stroke()
          nctx.lineWidth = 0.5
          nctx.beginPath()
          nctx.moveTo(wx + F, meetY + meetH / 2 + thirdH)
          nctx.lineTo(wx + F + innerW, meetY + meetH / 2 + thirdH)
          nctx.stroke()

          const proj = Math.max(2, ww * 0.07)
          nctx.fillStyle = '#C0C0C0'
          nctx.beginPath()
          nctx.moveTo(wx - proj, wy + wh - sillH)
          nctx.lineTo(wx + ww + proj, wy + wh - sillH)
          nctx.lineTo(wx + ww + proj * 0.6, wy + wh)
          nctx.lineTo(wx - proj * 0.6, wy + wh)
          nctx.closePath(); nctx.fill()
          nctx.strokeStyle = '#888'; nctx.lineWidth = 0.4; nctx.stroke()
        }

        // ── Left return face (orthographic rectangle) ──────────
        fillBrick(0, bodyY, returnW, bodyH, brickReturn, mortarReturn)
        // Shadow overlay: return is recessed, so darker than front face
        nctx.fillStyle = 'rgba(0,0,0,0.18)'
        nctx.fillRect(0, bodyY, returnW, bodyH)

        if (returnW > 18) {
          const rWinW = returnW * 0.58
          const rWinH = bodyH * 0.55
          drawWin((returnW - rWinW) / 2, bodyY + (bodyH - rWinH) / 2, rWinW, rWinH)
        }

        // ── Center face ──────────────────────────────────────
        fillBrick(centerX, bodyY, centerW, bodyH, brickFront, mortarFront)

        const cWinW = centerW * 0.62
        const cWinH = bodyH  * 0.60
        drawWin(centerX + (centerW - cWinW) / 2, bodyY + (bodyH - cWinH) / 2, cWinW, cWinH)

        // ── Right return face (orthographic rectangle) ─────────
        fillBrick(rightX, bodyY, returnW, bodyH, brickReturn, mortarReturn)
        nctx.fillStyle = 'rgba(0,0,0,0.18)'
        nctx.fillRect(rightX, bodyY, returnW, bodyH)

        if (returnW > 18) {
          const rWinW = returnW * 0.58
          const rWinH = bodyH * 0.55
          drawWin(rightX + (returnW - rWinW) / 2, bodyY + (bodyH - rWinH) / 2, rWinW, rWinH)
        }

        // ── Line weights: heavy at front-plane corners, medium at wall junctions ──
        // Front-plane corners (centerX and rightX) — closest to viewer, heaviest line
        nctx.strokeStyle = '#1A1A1A'; nctx.lineWidth = 0.75
        nctx.beginPath(); nctx.moveTo(centerX, bodyY); nctx.lineTo(centerX, bodyY + bodyH); nctx.stroke()
        nctx.beginPath(); nctx.moveTo(rightX,  bodyY); nctx.lineTo(rightX,  bodyY + bodyH); nctx.stroke()
        // Outer wall-junction edges — receding plane, medium weight
        nctx.lineWidth = 0.75
        nctx.beginPath(); nctx.moveTo(0,        bodyY); nctx.lineTo(0,        bodyY + bodyH); nctx.stroke()
        nctx.beginPath(); nctx.moveTo(widthPx,  bodyY); nctx.lineTo(widthPx,  bodyY + bodyH); nctx.stroke()
        // Top and bottom edges of body
        nctx.beginPath(); nctx.moveTo(0, bodyY);        nctx.lineTo(widthPx, bodyY);        nctx.stroke()
        nctx.beginPath(); nctx.moveTo(0, bodyY + bodyH); nctx.lineTo(widthPx, bodyY + bodyH); nctx.stroke()
        // Center face outline
        nctx.lineWidth = 0.5
        nctx.strokeStyle = '#2A2A2A'
        nctx.strokeRect(centerX, bodyY, centerW, bodyH)

        // ── Crown / cornice band ──────────────────────────────
        nctx.fillStyle = '#B8B0A0'
        nctx.fillRect(0, 0, widthPx, crownH)
        nctx.strokeStyle = '#2A2A2A'; nctx.lineWidth = 0.75
        nctx.strokeRect(0, 0, widthPx, crownH)
        nctx.fillStyle = 'rgba(0,0,0,0.14)'
        nctx.fillRect(0, crownH, widthPx, 2)

        // ── Base band ─────────────────────────────────────────
        nctx.fillStyle = '#B8B0A0'
        nctx.fillRect(0, heightPx - baseH, widthPx, baseH)
        nctx.strokeStyle = '#2A2A2A'; nctx.lineWidth = 0.75
        nctx.strokeRect(0, heightPx - baseH, widthPx, baseH)

        nctx.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── INTERIOR ELEVATION TARGET ───────────────────────────────────────────────
export function AnnotationElevationTargetRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const viewNum  = typeof properties.viewNum  === 'string' ? properties.viewNum  : '1'
  const sheetRef = typeof properties.sheetRef === 'string' ? properties.sheetRef : 'A-3'
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  const arrowAngles: Record<string, number> = { right: 0, left: 180, up: -90, down: 90, ne: -45, nw: -135, se: 45, sw: 135 }
  const dir = typeof properties.direction === 'string' ? properties.direction : 'right'
  const angleDeg = typeof properties.angleDeg === 'number' ? properties.angleDeg : (arrowAngles[dir] ?? 0)
  const a   = (angleDeg * Math.PI) / 180
  const tipX  = cx + Math.cos(a) * r
  const tipY  = cy + Math.sin(a) * r
  const bX = cx + Math.cos(a) * r * 0.65
  const bY = cy + Math.sin(a) * r * 0.65
  const pw = r * 0.32
  const pX = -Math.sin(a) * pw
  const pY =  Math.cos(a) * pw
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={0.8} fill="white" />
      <Line points={[cx - r + 1, cy, cx + r - 1, cy]} stroke={STROKE} strokeWidth={0.8} />
      <Text x={cx - r} y={cy - r + 1} width={r * 2} height={r - 2}
        text={viewNum} fontSize={Math.max(7, r * 0.65)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
      <Text x={cx - r} y={cy + 2} width={r * 2} height={r - 2}
        text={sheetRef} fontSize={Math.max(6, r * 0.5)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath()
        nc.moveTo(tipX, tipY)
        nc.lineTo(bX + pX, bY + pY)
        nc.lineTo(bX - pX, bY - pY)
        nc.closePath()
        nc.fillStyle = STROKE; nc.fill()
        nc.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── ROOM TAG ─────────────────────────────────────────────────────────────────
export function AnnotationRoomTagRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const roomName = typeof properties.roomName === 'string' ? properties.roomName : 'ROOM NAME'
  const roomArea = typeof properties.roomArea === 'string' ? properties.roomArea : ''
  const roomNum  = typeof properties.roomNum  === 'string' ? properties.roomNum  : ''
  const hasBottom = roomArea || roomNum
  const divY = hasBottom ? heightPx * 0.55 : heightPx
  const pad  = Math.min(widthPx * 0.04, 6)
  const bottomH = heightPx - divY
  return (
    <Group>
      <Rect x={0} y={0} width={widthPx} height={heightPx}
        fill="white" stroke={STROKE} strokeWidth={0.8} />
      {hasBottom && <Line points={[0, divY, widthPx, divY]} stroke={STROKE} strokeWidth={0.5} />}
      <Text x={pad} y={0} width={widthPx - pad * 2} height={divY}
        text={roomName} fontSize={Math.max(7, divY * 0.52)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
      {roomArea && !roomNum && (
        <Text x={pad} y={divY} width={widthPx - pad * 2} height={bottomH}
          text={roomArea} fontSize={Math.max(6, bottomH * 0.52)} fill={STROKE}
          fontFamily={ARC_FONT} align="center" verticalAlign="middle" />
      )}
      {roomNum && !roomArea && (
        <Text x={pad} y={divY} width={widthPx - pad * 2} height={bottomH}
          text={roomNum} fontSize={Math.max(6, bottomH * 0.52)} fill={STROKE}
          fontFamily={ARC_FONT} align="center" verticalAlign="middle" />
      )}
      {roomArea && roomNum && (
        <>
          <Text x={pad} y={divY} width={widthPx / 2 - pad} height={bottomH}
            text={roomNum} fontSize={Math.max(6, bottomH * 0.48)} fill={STROKE}
            fontFamily={ARC_FONT} align="center" verticalAlign="middle" />
          <Text x={widthPx / 2} y={divY} width={widthPx / 2 - pad} height={bottomH}
            text={roomArea} fontSize={Math.max(6, bottomH * 0.48)} fill="#555"
            fontFamily={ARC_FONT} align="center" verticalAlign="middle" />
        </>
      )}
    </Group>
  )
}

// ─── DOOR TAG ─────────────────────────────────────────────────────────────────
export function AnnotationDoorTagRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : '1'
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath()
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3 - Math.PI / 2
          const x = cx + r * Math.cos(ang)
          const y = cy + r * Math.sin(ang)
          if (i === 0) nc.moveTo(x, y); else nc.lineTo(x, y)
        }
        nc.closePath()
        nc.fillStyle = 'white'; nc.fill()
        nc.strokeStyle = STROKE; nc.lineWidth = 0.8; nc.stroke()
        nc.restore()
      }} listening={false} />
      <Text x={cx - r} y={cy - r * 0.55} width={r * 2} height={r * 1.1}
        text={label} fontSize={Math.max(7, r * 0.75)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
    </Group>
  )
}

// ─── SECTION REFERENCE BUBBLE ────────────────────────────────────────────────
export function AnnotationSectionRefRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const secNum   = typeof properties.secNum   === 'string' ? properties.secNum   : 'A'
  const sheetRef = typeof properties.sheetRef === 'string' ? properties.sheetRef : 'A-2'
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={0.8} fill="white" />
      <Line points={[cx - r + 2, cy, cx + r - 2, cy]} stroke={STROKE} strokeWidth={0.8} />
      <Text x={cx - r} y={cy - r + 1} width={r * 2} height={r - 2}
        text={secNum} fontSize={Math.max(8, r * 0.72)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
      <Text x={cx - r} y={cy + 2} width={r * 2} height={r - 2}
        text={sheetRef} fontSize={Math.max(6, r * 0.52)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

// ─── COLUMN GRID (HORIZONTAL) ────────────────────────────────────────────────
export function AnnotationColumnGridHRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label   = typeof properties.label === 'string' ? properties.label : 'A'
  const cy      = heightPx * 0.5
  const bubbleR = Math.min(heightPx * 0.45, 16)
  const lineEnd = widthPx - bubbleR * 2 - 2
  return (
    <Group>
      <Line points={[0, cy, lineEnd, cy]} stroke="#555" strokeWidth={1} dash={[6, 4]} />
      <Circle x={widthPx - bubbleR} y={cy} radius={bubbleR} stroke={STROKE} strokeWidth={0.6} fill="white" />
      <Text x={widthPx - bubbleR * 2} y={cy - bubbleR * 0.6} width={bubbleR * 2}
        text={label} fontSize={Math.max(8, bubbleR * 0.9)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" />
    </Group>
  )
}

// ─── DRAWING TITLE ────────────────────────────────────────────────────────────
export function AnnotationDrawingTitleRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const project    = useStore(s => s.project)
  const tb         = project?.titleBlock
  const title      = ((properties.title      as string | undefined) ?? tb?.drawingTitle ?? project?.name ?? 'DRAWING TITLE').toUpperCase()
  const drawingNum = (properties.drawingNum as string | undefined) ?? tb?.sheetNumber  ?? 'A-1'
  const scale      = (properties.scale      as string | undefined) ?? (project ? SCALES[project.scale]?.label : "1/4\" = 1'-0\"")

  const lineY       = heightPx * 0.60        // underline position
  const bubbleR     = Math.min(lineY * 0.40, widthPx * 0.055, 14)
  const textStart   = bubbleR * 2 + 7        // text starts after circle
  const titleFontSz = Math.max(9, lineY * 0.56)
  const infoFontSz  = Math.max(6, (heightPx - lineY - 2) * 0.62)

  return (
    <Group>
      {/* Reference circle — empty, holds a detail/sheet ref number */}
      <Circle x={bubbleR} y={lineY / 2} radius={bubbleR}
        stroke={STROKE} strokeWidth={0.7} fill="white" listening={false} />
      {/* Bold uppercase title */}
      <Text
        x={textStart} y={0} width={widthPx - textStart} height={lineY}
        text={title}
        fontSize={titleFontSz}
        fontFamily={ARC_FONT} fontStyle="bold"
        fill={STROKE} verticalAlign="middle"
        letterSpacing={0.8}
        listening={false}
      />
      {/* Single hairline underline extending full width */}
      <Line points={[textStart, lineY, widthPx, lineY]} stroke={STROKE} strokeWidth={1.0} listening={false} />
      {/* Drawing number + scale below the line */}
      <Text
        x={textStart} y={lineY + 3}
        width={(widthPx - textStart) * 0.38} height={heightPx - lineY - 3}
        text={drawingNum}
        fontSize={infoFontSz}
        fontFamily={ARC_FONT} fontStyle="bold"
        fill={STROKE} verticalAlign="middle"
        listening={false}
      />
      <Text
        x={textStart + (widthPx - textStart) * 0.38} y={lineY + 3}
        width={(widthPx - textStart) * 0.62} height={heightPx - lineY - 3}
        text={`SCALE: ${scale}`}
        fontSize={infoFontSz}
        fontFamily={ARC_FONT}
        fill={STROKE} verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}

// ─── BACK REFERENCE TARGET ────────────────────────────────────────────────────
export function AnnotationBackReferenceRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const refNum   = typeof properties.refNum   === 'string' ? properties.refNum   : '1'
  const sheetRef = typeof properties.sheetRef === 'string' ? properties.sheetRef : 'A-2'
  const ptW  = heightPx * 0.42   // width of the pointing tip
  const bodyX = ptW
  const bodyW = widthPx - ptW
  const divY  = heightPx * 0.5
  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath()
        nc.moveTo(0, heightPx / 2)            // left point
        nc.lineTo(bodyX, 0)                    // top-left corner
        nc.lineTo(widthPx, 0)                  // top-right
        nc.lineTo(widthPx, heightPx)           // bottom-right
        nc.lineTo(bodyX, heightPx)             // bottom-left corner
        nc.closePath()
        nc.fillStyle = 'white'; nc.fill()
        nc.strokeStyle = STROKE; nc.lineWidth = 0.8; nc.stroke()
        // divider
        nc.beginPath()
        nc.moveTo(bodyX, divY); nc.lineTo(widthPx, divY)
        nc.stroke()
        nc.restore()
      }} listening={false} />
      <Text x={bodyX + 2} y={0} width={bodyW - 4} height={divY}
        text={refNum} fontSize={Math.max(7, divY * 0.62)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
      <Text x={bodyX + 2} y={divY} width={bodyW - 4} height={heightPx - divY}
        text={sheetRef} fontSize={Math.max(6, (heightPx - divY) * 0.55)} fill={STROKE}
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" />
    </Group>
  )
}

// ─── FLOOR ELEVATION MARKER ───────────────────────────────────────────────────
export function AnnotationFloorElevationRenderer({ widthPx, heightPx, properties }: RendererProps) {
  // Elevation datum line — label on left, hairline spanning right, crosshair tick at right end.
  // Matches the "+24'-8" / 3 btm. joist ─────────────┤" convention used on elevation drawings.
  const elevation   = typeof properties.elevation   === 'string' ? properties.elevation   : "± 0'-0\""
  const description = typeof properties.description === 'string' ? properties.description : ''
  const cy          = heightPx / 2
  const labelW      = Math.min(widthPx * 0.44, 90)
  const lineStartX  = labelW + 5
  const crossH      = Math.min(9, heightPx * 0.65)
  const elevFontSz  = Math.max(7, heightPx * 0.40)
  const descFontSz  = Math.max(6, heightPx * 0.32)

  return (
    <Group>
      {/* Elevation value — bold, right-aligned to the label column */}
      <Text
        x={0} y={cy - elevFontSz - 1}
        width={labelW} text={elevation}
        fontSize={elevFontSz} fontFamily={ARC_FONT} fontStyle="bold"
        fill={STROKE} align="right" listening={false}
      />
      {/* Floor description below — optional */}
      {description ? (
        <Text
          x={0} y={cy + 2}
          width={labelW} text={description}
          fontSize={descFontSz} fontFamily={ARC_FONT}
          fill={STROKE} align="right" listening={false}
        />
      ) : null}
      {/* Hairline datum extending from label to right edge */}
      <Line points={[lineStartX, cy, widthPx - 4, cy]}
        stroke={STROKE} strokeWidth={0.4} listening={false} />
      {/* Crosshair tick at the right end — vertical through horizontal */}
      <Line points={[widthPx - 4, cy - crossH / 2, widthPx - 4, cy + crossH / 2]}
        stroke={STROKE} strokeWidth={0.9} listening={false} />
      <Line points={[widthPx - 7, cy, widthPx - 1, cy]}
        stroke={STROKE} strokeWidth={0.9} listening={false} />
    </Group>
  )
}

// ─── WORK POINT TARGET ────────────────────────────────────────────────────────
export function AnnotationWorkPointRenderer({ widthPx, heightPx }: RendererProps) {
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  const cs = r * 0.62
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={0.8} fill="white" />
      <Line points={[cx - cs, cy - cs, cx + cs, cy + cs]} stroke={STROKE} strokeWidth={0.75} />
      <Line points={[cx + cs, cy - cs, cx - cs, cy + cs]} stroke={STROKE} strokeWidth={0.75} />
    </Group>
  )
}

// ─── REVISION DELTA ───────────────────────────────────────────────────────────
export function AnnotationRevisionDeltaRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const label = typeof properties.label === 'string' ? properties.label : '1'
  const s  = Math.min(widthPx, heightPx)
  const cx = widthPx  / 2
  const cy = heightPx / 2
  const r  = s / 2 - 1
  // Equilateral triangle: height = r * sqrt(3), inscribed in bounding circle
  const tipY  = cy - r
  const baseY = cy + r * 0.5
  const baseHW = r * 0.866
  return (
    <Group>
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath()
        nc.moveTo(cx, tipY)
        nc.lineTo(cx + baseHW, baseY)
        nc.lineTo(cx - baseHW, baseY)
        nc.closePath()
        nc.fillStyle = STROKE; nc.fill()
        nc.restore()
      }} listening={false} />
      <Text x={cx - r} y={tipY + (baseY - tipY) * 0.22}
        width={r * 2} height={(baseY - tipY) * 0.65}
        text={label} fontSize={Math.max(6, r * 0.58)} fill="white"
        fontFamily={ARC_FONT} align="center" verticalAlign="middle" fontStyle="bold" />
    </Group>
  )
}

// ─── 1-HR FIRE RATED WALL ────────────────────────────────────────────────────
export function FireWall1HrRenderer({ widthPx, heightPx }: RendererProps) {
  const labelSpacing = Math.max(40, widthPx / 3)
  const labels: number[] = []
  for (let x = labelSpacing / 2; x < widthPx; x += labelSpacing) labels.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#6A4A4A" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath(); nc.rect(0, 0, widthPx, heightPx); nc.clip()
        nc.strokeStyle = '#C45050'; nc.lineWidth = 0.6
        const sp = Math.max(4, heightPx * 0.8)
        for (let t = -heightPx; t < widthPx + heightPx; t += sp * 2) {
          nc.beginPath(); nc.moveTo(t, 0); nc.lineTo(t + heightPx, heightPx); nc.stroke()
        }
        nc.restore()
        // "1HR" labels
        nc.save()
        nc.font = `bold ${Math.max(5, heightPx * 0.6)}px sans-serif`
        nc.fillStyle = '#FFDDDD'
        nc.textAlign = 'center'; nc.textBaseline = 'middle'
        for (const lx of labels) nc.fillText('1HR', lx, heightPx / 2)
        nc.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── 2-HR FIRE RATED WALL ────────────────────────────────────────────────────
export function FireWall2HrRenderer({ widthPx, heightPx }: RendererProps) {
  const labelSpacing = Math.max(48, widthPx / 3)
  const labels: number[] = []
  for (let x = labelSpacing / 2; x < widthPx; x += labelSpacing) labels.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#5A2A2A" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nc.save()
        nc.beginPath(); nc.rect(0, 0, widthPx, heightPx); nc.clip()
        nc.strokeStyle = '#DD3333'; nc.lineWidth = 0.6
        const sp = Math.max(4, heightPx * 0.8)
        for (let t = -heightPx; t < widthPx + heightPx; t += sp * 2) {
          nc.beginPath(); nc.moveTo(t, 0); nc.lineTo(t + heightPx, heightPx); nc.stroke()
          nc.beginPath(); nc.moveTo(t + heightPx, 0); nc.lineTo(t, heightPx); nc.stroke()
        }
        nc.restore()
        nc.save()
        nc.font = `bold ${Math.max(5, heightPx * 0.6)}px sans-serif`
        nc.fillStyle = '#FFCCCC'
        nc.textAlign = 'center'; nc.textBaseline = 'middle'
        for (const lx of labels) nc.fillText('2HR', lx, heightPx / 2)
        nc.restore()
      }} listening={false} />
    </Group>
  )
}

// ─── ELEVATOR + RAMP ─────────────────────────────────────────────────────────

export function ElevatorRenderer({ widthPx, heightPx }: RendererProps) {
  // Door on the shorter face, defaulting to bottom
  const isPortrait = heightPx >= widthPx
  const doorW = (isPortrait ? widthPx : heightPx) * 0.55
  const pad = 0
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* X diagonals */}
      <Line points={[pad, pad, widthPx - pad, heightPx - pad]} stroke="#bbb" strokeWidth={0.6} listening={false} />
      <Line points={[widthPx - pad, pad, pad, heightPx - pad]} stroke="#bbb" strokeWidth={0.6} listening={false} />
      {/* Door gap on the "front" face */}
      {isPortrait ? (
        <>
          <Line points={[0, heightPx, (widthPx - doorW) / 2, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
          <Line points={[(widthPx + doorW) / 2, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
          <Line points={[(widthPx - doorW) / 2, heightPx - 2, (widthPx - doorW) / 2, heightPx + 2]} stroke={STROKE} strokeWidth={0.8} listening={false} />
          <Line points={[(widthPx + doorW) / 2, heightPx - 2, (widthPx + doorW) / 2, heightPx + 2]} stroke={STROKE} strokeWidth={0.8} listening={false} />
        </>
      ) : (
        <>
          <Line points={[widthPx, 0, widthPx, (heightPx - doorW) / 2]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
          <Line points={[widthPx, (heightPx + doorW) / 2, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} listening={false} />
          <Line points={[widthPx - 2, (heightPx - doorW) / 2, widthPx + 2, (heightPx - doorW) / 2]} stroke={STROKE} strokeWidth={0.8} listening={false} />
          <Line points={[widthPx - 2, (heightPx + doorW) / 2, widthPx + 2, (heightPx + doorW) / 2]} stroke={STROKE} strokeWidth={0.8} listening={false} />
        </>
      )}
    </Group>
  )
}

export function RampRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx >= widthPx
  // Arrow goes from low end (top/left) to high end (bottom/right)
  const cx = widthPx / 2, cy = heightPx / 2
  const arrowLen = Math.min(widthPx, heightPx) * 0.35
  const arrowHead = Math.min(10, arrowLen * 0.3)
  // Arrow direction: along long axis, from start to end
  const ax1 = isPortrait ? cx : cx - arrowLen
  const ay1 = isPortrait ? cy - arrowLen : cy
  const ax2 = isPortrait ? cx : cx + arrowLen
  const ay2 = isPortrait ? cy + arrowLen : cy
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* Slope lines (horizontal bars across short dimension) */}
      {Array.from({ length: 5 }, (_, i) => {
        const t = (i + 1) / 6
        return isPortrait
          ? <Line key={i} points={[3, t * heightPx, widthPx - 3, t * heightPx]} stroke="#ddd" strokeWidth={0.5} listening={false} />
          : <Line key={i} points={[t * widthPx, 3, t * widthPx, heightPx - 3]} stroke="#ddd" strokeWidth={0.5} listening={false} />
      })}
      {/* Direction arrow */}
      <Line points={[ax1, ay1, ax2, ay2]} stroke="#555" strokeWidth={1} listening={false} />
      {isPortrait ? (
        <>
          <Line points={[ax2 - arrowHead, ay2 - arrowHead, ax2, ay2]} stroke="#555" strokeWidth={1} listening={false} />
          <Line points={[ax2 + arrowHead, ay2 - arrowHead, ax2, ay2]} stroke="#555" strokeWidth={1} listening={false} />
        </>
      ) : (
        <>
          <Line points={[ax2 - arrowHead, ay2 - arrowHead, ax2, ay2]} stroke="#555" strokeWidth={1} listening={false} />
          <Line points={[ax2 - arrowHead, ay2 + arrowHead, ax2, ay2]} stroke="#555" strokeWidth={1} listening={false} />
        </>
      )}
      {/* UP label near arrow tip */}
      <Text text="UP" x={isPortrait ? cx - 6 : ax2 - 14} y={isPortrait ? ay2 - 14 : cy - 7}
        fontSize={8} fill="#555" fontFamily="'SF Mono', monospace" listening={false} />
    </Group>
  )
}

// ─── NEW FIXTURES ────────────────────────────────────────────────────────────

export function ShowerRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx * 0.58
  const dr = Math.min(widthPx, heightPx) * 0.07
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, heightPx * 0.06, widthPx, heightPx * 0.06]} stroke={STROKE} strokeWidth={0.5} dash={[5, 3]} listening={false} />
      <Circle x={cx} y={cy} radius={dr} fill="#f0f0f0" stroke="#888" strokeWidth={0.8} />
      <Circle x={cx} y={cy} radius={dr * 0.4} fill="#ddd" stroke="#999" strokeWidth={0.4} listening={false} />
      <Circle x={widthPx * 0.16} y={heightPx * 0.16} radius={dr * 0.65} fill="none" stroke="#aaa" strokeWidth={0.6} listening={false} />
    </Group>
  )
}

export function WasherRenderer({ widthPx, heightPx }: RendererProps) {
  const r = Math.min(widthPx, heightPx) * 0.38
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Circle x={cx} y={cy} radius={r} fill="#f5f5f5" stroke="#888" strokeWidth={1} />
      <Circle x={cx} y={cy} radius={r * 0.42} fill="white" stroke="#bbb" strokeWidth={0.7} />
      <Text text="W" x={cx - 4} y={cy - 5} fontSize={8} fill="#888" listening={false} />
    </Group>
  )
}

export function DryerRenderer({ widthPx, heightPx }: RendererProps) {
  const r = Math.min(widthPx, heightPx) * 0.38
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Circle x={cx} y={cy} radius={r} fill="#f5f5f5" stroke="#888" strokeWidth={1} />
      <Circle x={cx} y={cy} radius={r * 0.42} fill="white" stroke="#bbb" strokeWidth={0.7} />
      <Text text="D" x={cx - 4} y={cy - 5} fontSize={8} fill="#888" listening={false} />
    </Group>
  )
}

export function WaterHeaterRenderer({ widthPx, heightPx }: RendererProps) {
  const r = Math.min(widthPx, heightPx) / 2 - 1
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.55} fill="#f5f5f5" stroke="#bbb" strokeWidth={0.5} />
      <Text text="WH" x={cx - 8} y={cy - 5} fontSize={8} fill="#888" listening={false} />
    </Group>
  )
}

export function UtilitySinkRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = 3
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      <Circle x={widthPx / 2} y={heightPx / 2} radius={Math.min(widthPx, heightPx) * 0.08}
        fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

// ─── NEW OPENINGS ─────────────────────────────────────────────────────────────

export function PocketDoorRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  if (isVertical) {
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" />
        <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={1} y={heightPx * 0.04} width={widthPx - 2} height={heightPx * 0.46}
          fill="rgba(135,206,250,0.15)" stroke={STROKE} strokeWidth={0.5} dash={[4, 3]} />
        <Line points={[widthPx / 2, heightPx * 0.15, widthPx / 2, heightPx * 0.78]} stroke={STROKE} strokeWidth={0.7} listening={false} />
        <Line points={[widthPx * 0.25, heightPx * 0.68, widthPx / 2, heightPx * 0.78, widthPx * 0.75, heightPx * 0.68]} stroke={STROKE} strokeWidth={0.7} listening={false} />
      </Group>
    )
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" />
      <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={widthPx * 0.04} y={1} width={widthPx * 0.46} height={heightPx - 2}
        fill="rgba(135,206,250,0.15)" stroke={STROKE} strokeWidth={0.5} dash={[4, 3]} />
      <Line points={[widthPx * 0.15, heightPx / 2, widthPx * 0.78, heightPx / 2]} stroke={STROKE} strokeWidth={0.7} listening={false} />
      <Line points={[widthPx * 0.68, heightPx * 0.25, widthPx * 0.78, heightPx / 2, widthPx * 0.68, heightPx * 0.75]} stroke={STROKE} strokeWidth={0.7} listening={false} />
    </Group>
  )
}

export function BifoldDoorRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  if (isVertical) {
    const half = heightPx / 2
    const foldX = widthPx * 0.5
    return (
      <Group>
        <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Shape sceneFunc={(ctx) => {
          const nc = (ctx as any)._context as CanvasRenderingContext2D
          nc.save()
          nc.beginPath(); nc.moveTo(0, 0); nc.lineTo(foldX, widthPx * 0.4); nc.lineTo(0, half)
          nc.fillStyle = 'rgba(135,206,250,0.12)'; nc.fill()
          nc.strokeStyle = STROKE; nc.lineWidth = STROKE_MED; nc.stroke()
          nc.beginPath(); nc.moveTo(0, half); nc.lineTo(foldX, half + widthPx * 0.4); nc.lineTo(0, heightPx)
          nc.fill(); nc.stroke()
          nc.restore()
        }} listening={false} />
      </Group>
    )
  }
  const half = widthPx / 2
  const foldY = heightPx * 0.5
  return (
    <Group>
      <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as any)._context as CanvasRenderingContext2D
        nc.save()
        nc.beginPath(); nc.moveTo(0, 0); nc.lineTo(half * 0.5, foldY); nc.lineTo(half, 0)
        nc.fillStyle = 'rgba(135,206,250,0.12)'; nc.fill()
        nc.strokeStyle = STROKE; nc.lineWidth = STROKE_MED; nc.stroke()
        nc.beginPath(); nc.moveTo(half, 0); nc.lineTo(half + half * 0.5, foldY); nc.lineTo(widthPx, 0)
        nc.fill(); nc.stroke()
        nc.restore()
      }} listening={false} />
    </Group>
  )
}

export function GarageDoorRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    const panelH = Math.max(widthPx * 0.22, heightPx * 2)
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" />
        <Line points={[0, 0, 0, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[widthPx, 0, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={0} y={heightPx} width={widthPx} height={panelH}
          fill="rgba(200,200,200,0.08)" stroke="#888" strokeWidth={0.6} dash={[5, 3]} />
        {[0.33, 0.67].map(t => (
          <Line key={t} points={[0, heightPx + panelH * t, widthPx, heightPx + panelH * t]}
            stroke="#aaa" strokeWidth={0.4} dash={[4, 3]} listening={false} />
        ))}
      </Group>
    )
  }
  const panelW = Math.max(heightPx * 0.22, widthPx * 2)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" />
      <Line points={[0, 0, widthPx, 0]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, heightPx, widthPx, heightPx]} stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={widthPx} y={0} width={panelW} height={heightPx}
        fill="rgba(200,200,200,0.08)" stroke="#888" strokeWidth={0.6} dash={[5, 3]} />
      {[0.33, 0.67].map(t => (
        <Line key={t} points={[widthPx + panelW * t, 0, widthPx + panelW * t, heightPx]}
          stroke="#aaa" strokeWidth={0.4} dash={[4, 3]} listening={false} />
      ))}
    </Group>
  )
}

// ─── NEW FURNITURE ────────────────────────────────────────────────────────────

export function NightstandRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = Math.min(widthPx, heightPx) * 0.12
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f5f0e8" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        fill="none" stroke="#ccc" strokeWidth={0.5} cornerRadius={1} />
      <Circle x={widthPx / 2} y={heightPx / 2} radius={Math.min(widthPx, heightPx) * 0.08}
        fill="#ddd" stroke="#aaa" strokeWidth={0.5} />
    </Group>
  )
}

export function BookcaseRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const shelfCount = isLandscape
    ? Math.max(2, Math.round(heightPx / 12) + 1)
    : Math.max(2, Math.round(widthPx / 12) + 1)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f5f0e8" stroke={STROKE} strokeWidth={STROKE_MED} />
      {isLandscape
        ? Array.from({ length: shelfCount - 1 }, (_, i) => (
            <Line key={i} points={[2, ((i + 1) / shelfCount) * heightPx, widthPx - 2, ((i + 1) / shelfCount) * heightPx]}
              stroke="#bbb" strokeWidth={0.6} listening={false} />
          ))
        : Array.from({ length: shelfCount - 1 }, (_, i) => (
            <Line key={i} points={[((i + 1) / shelfCount) * widthPx, 2, ((i + 1) / shelfCount) * widthPx, heightPx - 2]}
              stroke="#bbb" strokeWidth={0.6} listening={false} />
          ))
      }
    </Group>
  )
}

export function TvUnitRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="#f0ece4" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={widthPx * 0.05} y={2} width={widthPx * 0.9} height={heightPx * 0.48}
          fill="#1a1a2e" stroke="#333" strokeWidth={0.5} cornerRadius={1} />
        <Line points={[2, heightPx * 0.65, widthPx - 2, heightPx * 0.65]} stroke="#ccc" strokeWidth={0.5} listening={false} />
      </Group>
    )
  }
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f0ece4" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={2} y={heightPx * 0.05} width={widthPx * 0.48} height={heightPx * 0.9}
        fill="#1a1a2e" stroke="#333" strokeWidth={0.5} cornerRadius={1} />
      <Line points={[widthPx * 0.65, 2, widthPx * 0.65, heightPx - 2]} stroke="#ccc" strokeWidth={0.5} listening={false} />
    </Group>
  )
}

// ─── NEW CASEWORK ─────────────────────────────────────────────────────────────

export function PantryCabinetRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    const edge = heightPx * 0.15
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Line points={[0, heightPx - edge, widthPx, heightPx - edge]} stroke={STROKE} strokeWidth={0.8} listening={false} />
        {[1, 2].map(i => (
          <Line key={i} points={[2, (heightPx - edge) * (i / 3), widthPx - 2, (heightPx - edge) * (i / 3)]}
            stroke="#bbb" strokeWidth={0.5} listening={false} />
        ))}
      </Group>
    )
  }
  const edge = widthPx * 0.15
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[widthPx - edge, 0, widthPx - edge, heightPx]} stroke={STROKE} strokeWidth={0.8} listening={false} />
      {[1, 2].map(i => (
        <Line key={i} points={[(widthPx - edge) * (i / 3), 2, (widthPx - edge) * (i / 3), heightPx - 2]}
          stroke="#bbb" strokeWidth={0.5} listening={false} />
      ))}
    </Group>
  )
}

export function ClosetRodRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    const shelfH = heightPx * 0.28
    const rodY = heightPx * 0.62
    return (
      <Group>
        <Rect width={widthPx} height={heightPx} fill="rgba(245,240,232,0.5)" stroke={STROKE} strokeWidth={STROKE_THIN} />
        <Rect x={0} y={0} width={widthPx} height={shelfH} fill="#e8e4dc" stroke="#aaa" strokeWidth={0.5} />
        <Line points={[4, rodY, widthPx - 4, rodY]} stroke="#888" strokeWidth={2} lineCap="round" />
        {[0.25, 0.75].map(t => (
          <Circle key={t} x={t * widthPx} y={rodY} radius={2} fill="#999" stroke="#666" strokeWidth={0.5} />
        ))}
      </Group>
    )
  }
  const shelfW = widthPx * 0.28
  const rodX = widthPx * 0.62
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(245,240,232,0.5)" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={0} y={0} width={shelfW} height={heightPx} fill="#e8e4dc" stroke="#aaa" strokeWidth={0.5} />
      <Line points={[rodX, 4, rodX, heightPx - 4]} stroke="#888" strokeWidth={2} lineCap="round" />
      {[0.25, 0.75].map(t => (
        <Circle key={t} x={rodX} y={t * heightPx} radius={2} fill="#999" stroke="#666" strokeWidth={0.5} />
      ))}
    </Group>
  )
}

// ─── NEW STRUCTURAL ───────────────────────────────────────────────────────────

export function StructuralBeamRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#d8d8d8" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as any)._context as CanvasRenderingContext2D
        nc.save()
        nc.beginPath(); nc.rect(0, 0, widthPx, heightPx); nc.clip()
        nc.strokeStyle = '#bbb'; nc.lineWidth = 0.5
        const sp = 6
        const diag = Math.max(widthPx, heightPx)
        for (let t = -diag; t < (isLandscape ? widthPx : heightPx) + diag; t += sp) {
          nc.beginPath()
          if (isLandscape) { nc.moveTo(t, 0); nc.lineTo(t + heightPx, heightPx) }
          else { nc.moveTo(0, t); nc.lineTo(widthPx, t + widthPx) }
          nc.stroke()
        }
        nc.restore()
      }} listening={false} />
      {isLandscape ? (
        <>
          <Line points={[0, heightPx * 0.2, widthPx, heightPx * 0.2]} stroke="#555" strokeWidth={0.6} listening={false} />
          <Line points={[0, heightPx * 0.8, widthPx, heightPx * 0.8]} stroke="#555" strokeWidth={0.6} listening={false} />
        </>
      ) : (
        <>
          <Line points={[widthPx * 0.2, 0, widthPx * 0.2, heightPx]} stroke="#555" strokeWidth={0.6} listening={false} />
          <Line points={[widthPx * 0.8, 0, widthPx * 0.8, heightPx]} stroke="#555" strokeWidth={0.6} listening={false} />
        </>
      )}
    </Group>
  )
}

export function FootingRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#c8c8c8" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Shape sceneFunc={(ctx) => {
        const nc = (ctx as any)._context as CanvasRenderingContext2D
        nc.save()
        nc.beginPath(); nc.rect(0, 0, widthPx, heightPx); nc.clip()
        nc.strokeStyle = '#999'; nc.lineWidth = 0.5
        const sp = 8, diag = Math.max(widthPx, heightPx)
        for (let t = -diag; t < widthPx + diag; t += sp) {
          nc.beginPath(); nc.moveTo(t, 0); nc.lineTo(t + diag, diag); nc.stroke()
          nc.beginPath(); nc.moveTo(t + diag, 0); nc.lineTo(t, diag); nc.stroke()
        }
        nc.restore()
      }} listening={false} />
      <Rect width={widthPx} height={heightPx} fill="transparent" stroke={STROKE} strokeWidth={STROKE_MED} />
    </Group>
  )
}

// ─── NEW ELEVATION ────────────────────────────────────────────────────────────

export function ElevRailingRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#888888'
  const isLandscape = widthPx >= heightPx
  if (isLandscape) {
    const railH = Math.max(2, heightPx * 0.08)
    const balusterCount = Math.max(2, Math.round(widthPx / 10))
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
  const balusterCount = Math.max(2, Math.round(heightPx / 10))
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
  const fill = typeof properties.fillColor === 'string' ? properties.fillColor : '#C8B090'
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

export function LvlBeamRenderer({ widthPx, heightPx }: RendererProps) {
  const isVertical = heightPx > widthPx
  const shortD = isVertical ? widthPx : heightPx
  const lamCount = Math.max(3, Math.round(shortD / 5))
  const lines = Array.from({ length: lamCount - 1 }, (_, i) => {
    const t = (i + 1) / lamCount
    return isVertical
      ? <Line key={i} points={[t * widthPx, 2, t * widthPx, heightPx - 2]} stroke="#8B7340" strokeWidth={0.5} opacity={0.7} listening={false} />
      : <Line key={i} points={[2, t * heightPx, widthPx - 2, t * heightPx]} stroke="#8B7340" strokeWidth={0.5} opacity={0.7} listening={false} />
  })
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      {lines}
    </Group>
  )
}

export function TjiJoistRenderer({ widthPx, heightPx }: RendererProps) {
  const isPortrait = heightPx > widthPx
  if (isPortrait) {
    const flangeH = Math.max(4, heightPx * 0.1)
    const webW = Math.max(3, widthPx * 0.28)
    const webX = (widthPx - webW) / 2
    const webH = heightPx - flangeH * 2
    return (
      <Group>
        <Rect x={0} y={0} width={widthPx} height={flangeH} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={0} y={heightPx - flangeH} width={widthPx} height={flangeH} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
        <Rect x={webX} y={flangeH} width={webW} height={webH} fill="#D4C4A0" stroke={STROKE} strokeWidth={0.5} />
        {[1, 2].map(i => (
          <Line key={i} points={[webX + 2, flangeH + (i / 3) * webH, webX + webW - 2, flangeH + (i / 3) * webH]}
            stroke="#AA9070" strokeWidth={0.4} opacity={0.6} listening={false} />
        ))}
      </Group>
    )
  }
  const flangeW = Math.max(4, widthPx * 0.1)
  const webH = Math.max(3, heightPx * 0.28)
  const webY = (heightPx - webH) / 2
  const webW = widthPx - flangeW * 2
  return (
    <Group>
      <Rect x={0} y={0} width={flangeW} height={heightPx} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={widthPx - flangeW} y={0} width={flangeW} height={heightPx} fill="#EDE5C8" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Rect x={flangeW} y={webY} width={webW} height={webH} fill="#D4C4A0" stroke={STROKE} strokeWidth={0.5} />
      {[1, 2].map(i => (
        <Line key={i} points={[flangeW + (i / 3) * webW, webY + 2, flangeW + (i / 3) * webW, webY + webH - 2]}
          stroke="#AA9070" strokeWidth={0.4} opacity={0.6} listening={false} />
      ))}
    </Group>
  )
}

export const RENDERERS: Record<string, RendererComponent> = {
  'wall-exterior': ExteriorWallRenderer,
  'wall-glazing': GlazingWallRenderer,
  'insulation-batt': InsulationBattRenderer,
  'detail-drywall': DrywallRenderer,
  'detail-stud-2x4':          StudRenderer,
  'detail-stud-2x6':          StudRenderer,
  'detail-stud-2x8':          StudRenderer,
  'detail-stud-2x10':         StudRenderer,
  'detail-stud-2x12':         StudRenderer,
  'detail-post-4x4':          StudRenderer,
  'detail-stud-2x4-face':     StudFaceRenderer,
  'detail-stud-2x6-face':     StudFaceRenderer,
  'detail-stud-2x8-face':     StudFaceRenderer,
  'detail-stud-2x10-face':    StudFaceRenderer,
  'detail-stud-2x12-face':    StudFaceRenderer,
  'detail-post-4x4-face':     StudFaceRenderer,
  'detail-1x-face':           StudFaceRenderer,
  'detail-stud-2x4-edge':     StudFaceRenderer,
  'detail-stud-2x6-edge':     StudFaceRenderer,
  'detail-stud-2x8-edge':     StudFaceRenderer,
  'detail-stud-2x10-edge':    StudFaceRenderer,
  'detail-stud-2x12-edge':    StudFaceRenderer,
  'detail-rafter':            RafterRenderer,
  'detail-pitched-layer':     PitchedLayerRenderer,
  'detail-plywood':           PlywoodRenderer,
  'detail-rigid-insulation':  RigidInsulationRenderer,
  'detail-vent-baffle':       VentBaffleRenderer,
  'detail-soffit-panel':      SoffitPanelRenderer,
  'detail-shingles':          ShinglesRenderer,
  'detail-flashing':          FlashingRenderer,
  'detail-gutter':            GutterRenderer,
  'detail-brick-veneer':      BrickVeneerRenderer,
  'detail-felt':              FeltRenderer,
  'wall-interior': InteriorWallRenderer,
  'wall-cmu': CMUWallRenderer,
  'cased-opening': CasedOpeningRenderer,
  'door-single': SingleDoorRenderer,
  'door-double': DoubleDoorRenderer,
  'door-sliding': SlidingDoorRenderer,
  'window-single': WindowRenderer,
  'window-double': DoubleWindowRenderer,
  'window-multi': MultiWindowRenderer,
  'stairs-straight': StraightStairsRenderer,
  'stairs-hatch': HatchStairRenderer,
  'stairs-landing': StairLandingRenderer,
  'stairs-elevation': StairsElevationRenderer,
  'shape-rect': ShapeRectRenderer,
  'shape-polygon': PolygonRenderer,
  'handrail': HandrailRenderer,
  'fixture-toilet': ToiletRenderer,
  'fixture-sink-lav': LavSinkRenderer,
  'fixture-bathtub': BathtubRenderer,
  'fixture-sink-kitchen': KitchenSinkRenderer,
  'fixture-refrigerator': RefrigeratorRenderer,
  'fixture-range': RangeRenderer,
  'fixture-dishwasher': DishwasherRenderer,
  'furniture-bed-twin': BedRenderer,
  'furniture-bed-full': BedRenderer,
  'furniture-bed-queen': BedRenderer,
  'furniture-bed-king': BedRenderer,
  'furniture-sofa': SofaRenderer,
  'furniture-chair': ChairRenderer,
  'furniture-dining-table': DiningTableRenderer,
  'furniture-coffee-table': CoffeeTableRenderer,
  'furniture-dresser': DresserRenderer,
  'furniture-desk': DeskRenderer,
  'fixture-vanity': VanityRenderer,
  'casework-bath-storage': BathStorageCabinetRenderer,
  'casework-base': BaseCabinetRenderer,
  'casework-upper': UpperCabinetRenderer,
  'casework-island': KitchenIslandRenderer,
  'structural-fireplace': FireplaceRenderer,
  'structural-masonry-mass': MasonryMassRenderer,
  'structural-column-sq': SquareColumnRenderer,
  'structural-column-round': RoundColumnRenderer,
  'terrace-edge': TerraceEdgeRenderer,
  'north-arrow': NorthArrowRenderer,
  'fire-rating-label': FireRatingLabelRenderer,
  'text-note': TextNoteRenderer,
  'human-scale': HumanScaleRenderer,
  'annotation-leader': AnnotationLeaderRenderer,
  'annotation-section-cut': AnnotationSectionCutRenderer,
  'annotation-grid-bubble': AnnotationGridBubbleRenderer,
  'annotation-break-line': AnnotationBreakLineRenderer,
  'annotation-elevation-marker': AnnotationElevationMarkerRenderer,
  'annotation-detail-bubble': AnnotationDetailBubbleRenderer,
  'annotation-revision-cloud': AnnotationRevisionCloudRenderer,
  'annotation-elevation-target': AnnotationElevationTargetRenderer,
  'annotation-room-tag': AnnotationRoomTagRenderer,
  'annotation-door-tag': AnnotationDoorTagRenderer,
  'annotation-section-ref': AnnotationSectionRefRenderer,
  'annotation-column-grid-h': AnnotationColumnGridHRenderer,
  'annotation-drawing-title': AnnotationDrawingTitleRenderer,
  'annotation-back-reference': AnnotationBackReferenceRenderer,
  'annotation-floor-elevation': AnnotationFloorElevationRenderer,
  'annotation-work-point': AnnotationWorkPointRenderer,
  'annotation-revision-delta': AnnotationRevisionDeltaRenderer,
  'wall-fire-1hr': FireWall1HrRenderer,
  'wall-fire-2hr': FireWall2HrRenderer,
  'fire-extinguisher': FireExtinguisherRenderer,
  'exit-sign': ExitSignRenderer,
  'smoke-detector': SmokeDetectorRenderer,
  'emergency-light': EmergencyLightRenderer,
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
  // Elevator + ramp
  'fixture-elevator': ElevatorRenderer,
  'fixture-ramp': RampRenderer,
  // New fixtures
  'fixture-shower': ShowerRenderer,
  'fixture-washer': WasherRenderer,
  'fixture-dryer': DryerRenderer,
  'fixture-water-heater': WaterHeaterRenderer,
  'fixture-utility-sink': UtilitySinkRenderer,
  // New openings
  'door-pocket': PocketDoorRenderer,
  'door-bifold': BifoldDoorRenderer,
  'door-garage': GarageDoorRenderer,
  // New furniture
  'furniture-nightstand': NightstandRenderer,
  'furniture-bookcase': BookcaseRenderer,
  'furniture-tv-unit': TvUnitRenderer,
  // New casework
  'casework-pantry': PantryCabinetRenderer,
  'casework-closet-rod': ClosetRodRenderer,
  // New structural
  'structural-beam': StructuralBeamRenderer,
  'structural-footing': FootingRenderer,
  // New elevation
  'elev-railing': ElevRailingRenderer,
  'elev-siding': ElevSidingRenderer,
  // New details
  'detail-lvl-beam': LvlBeamRenderer,
  'detail-tji-joist': TjiJoistRenderer,
}
