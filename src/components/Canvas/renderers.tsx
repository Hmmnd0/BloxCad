import React from 'react'
import { Group, Rect, Line, Arc, Ellipse, Circle, Text, Shape } from 'react-konva'

interface RendererProps {
  widthPx: number
  heightPx: number
  selected: boolean
  properties: Record<string, unknown>
}

const STROKE = '#1A1A1A'
const STROKE_THIN = 0.8
const STROKE_MED = 1.5

// ─── WALLS ───────────────────────────────────────────────────────────────────

export function ExteriorWallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect
        width={widthPx} height={heightPx}
        fill="#3C3C3C" stroke={STROKE} strokeWidth={STROKE_THIN}
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
      fill="#5A5A5A" stroke={STROKE} strokeWidth={STROKE_THIN}
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
      <Rect width={widthPx} height={heightPx} fill="#888" stroke={STROKE} strokeWidth={STROKE_THIN} />
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
  const panelW = widthPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(135,206,250,0.18)" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Active panel */}
      <Rect x={0} width={panelW} height={heightPx} fill="rgba(135,206,250,0.3)" stroke={STROKE} strokeWidth={STROKE_MED} />
      {/* Direction arrow */}
      <Line points={[panelW * 0.2, heightPx / 2, panelW * 0.8, heightPx / 2]} stroke={STROKE} strokeWidth={1} />
      <Line points={[panelW * 0.6, heightPx * 0.2, panelW * 0.8, heightPx / 2, panelW * 0.6, heightPx * 0.8]} stroke={STROKE} strokeWidth={1} />
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
  const tankH = heightPx * 0.32
  const bowlStartY = tankH + 2
  const bowlH = heightPx - tankH - 2

  return (
    <Group>
      {/* Tank */}
      <Rect x={widthPx * 0.05} y={0} width={widthPx * 0.9} height={tankH}
        cornerRadius={3} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Bowl */}
      <Ellipse
        x={widthPx / 2} y={bowlStartY + bowlH / 2}
        radiusX={widthPx * 0.45} radiusY={bowlH / 2}
        fill="white" stroke={STROKE} strokeWidth={STROKE_THIN}
      />
      {/* Seat inner */}
      <Ellipse
        x={widthPx / 2} y={bowlStartY + bowlH / 2}
        radiusX={widthPx * 0.32} radiusY={bowlH * 0.38}
        fill="#f0f0f0" stroke="#888" strokeWidth={0.5}
      />
    </Group>
  )
}

export function LavSinkRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        cornerRadius={widthPx * 0.15} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Ellipse
        x={widthPx / 2} y={heightPx * 0.55}
        radiusX={widthPx * 0.32} radiusY={heightPx * 0.3}
        fill="#f5f5f5" stroke="#888" strokeWidth={0.5}
      />
      {/* Faucet */}
      <Circle x={widthPx / 2} y={heightPx * 0.22} radius={widthPx * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function BathtubRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = widthPx * 0.1
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        cornerRadius={widthPx * 0.08} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={pad} y={heightPx * 0.12} width={widthPx - pad * 2} height={heightPx * 0.75}
        cornerRadius={widthPx * 0.06} fill="#f0f8ff" stroke="#aaa" strokeWidth={0.5} />
      {/* Drain */}
      <Circle x={widthPx / 2} y={heightPx * 0.78} radius={widthPx * 0.05} fill="white" stroke="#666" strokeWidth={0.5} />
      {/* Faucet */}
      <Circle x={widthPx / 2} y={heightPx * 0.12} radius={widthPx * 0.07} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
    </Group>
  )
}

export function KitchenSinkRenderer({ widthPx, heightPx }: RendererProps) {
  const basinW = (widthPx - 8) / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_THIN} />
      {/* Left basin */}
      <Rect x={3} y={3} width={basinW} height={heightPx - 6}
        cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      {/* Right basin */}
      <Rect x={basinW + 5} y={3} width={basinW} height={heightPx - 6}
        cornerRadius={3} fill="#f5f5f5" stroke="#888" strokeWidth={0.5} />
      {/* Center faucet */}
      <Circle x={widthPx / 2} y={heightPx / 2} radius={widthPx * 0.05} fill="#aaa" stroke={STROKE} strokeWidth={0.5} />
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
      <Rect width={widthPx} height={heightPx} fill="#404040" stroke={STROKE} strokeWidth={STROKE_THIN} />
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
      <Circle x={widthPx / 2} y={heightPx / 2} radius={r} fill="#404040" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Circle x={widthPx / 2} y={heightPx / 2} radius={r * 0.6} fill="#555" stroke="#666" strokeWidth={0.4} />
    </Group>
  )
}

// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────

export function RoomLabelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const name = (properties.roomName as string) || 'Room'
  const area = (properties.roomArea as string) || ''
  return (
    <Group>
      <Rect
        width={widthPx} height={heightPx}
        fill="rgba(255,255,200,0.08)" stroke="#aaa" strokeWidth={0.5}
        dash={[6, 4]}
      />
      <Text
        text={name}
        x={0} y={heightPx / 2 - (area ? 14 : 7)}
        width={widthPx} align="center"
        fontSize={14} fontFamily="Architects Daughter" fill="#222"
        listening={false}
      />
      {!!area && (
        <Text
          text={area}
          x={0} y={heightPx / 2 + 4}
          width={widthPx} align="center"
          fontSize={10} fontFamily="Architects Daughter" fill="#555"
          listening={false}
        />
      )}
    </Group>
  )
}

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
        fontFamily="sans-serif" fontStyle="bold" fill={STROKE} />
    </Group>
  )
}

export function FireRatingLabelRenderer({ widthPx, heightPx, properties }: RendererProps) {
  const rating = (properties.rating as string) ?? '1-HR'
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(220,30,30,0.08)" stroke="#CC0000" strokeWidth={1.5} cornerRadius={2} />
      <Text
        text={`${rating} RATED ASSEMBLY`}
        x={6} y={0} height={heightPx} verticalAlign="middle"
        fontSize={Math.max(7, heightPx * 18)} fontFamily="sans-serif"
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
      <Circle x={cx} y={cy} radius={r} fill="rgba(220,30,30,0.15)" stroke="#CC0000" strokeWidth={1.2} />
      <Text text="FE" x={cx - 8} y={cy - 6} fontSize={10}
        fontFamily="sans-serif" fontStyle="bold" fill="#CC0000" />
    </Group>
  )
}

export function ExitSignRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx}
        fill="rgba(0,180,0,0.15)" stroke="#006600" strokeWidth={1.2} cornerRadius={1} />
      <Text text="EXIT" x={0} y={0} width={widthPx} height={heightPx}
        align="center" verticalAlign="middle"
        fontSize={Math.max(7, heightPx * 16)} fontFamily="sans-serif"
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
        fontFamily="sans-serif" fill={STROKE} />
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
        <Line points={[cx, 0, cx, heightPx]} stroke={STROKE} strokeWidth={3} lineCap="round" lineJoin="round" />
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
      <Line points={[0, cy, widthPx, cy]} stroke={STROKE} strokeWidth={3} lineCap="round" lineJoin="round" />
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
        fontFamily="sans-serif" fill="#888"
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

// ─── REGISTRY ─────────────────────────────────────────────────────────────────

type RendererComponent = React.FC<RendererProps>

export const RENDERERS: Record<string, RendererComponent> = {
  'wall-exterior': ExteriorWallRenderer,
  'insulation-batt': InsulationBattRenderer,
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
  'stairs-landing': StairLandingRenderer,
  'stairs-elevation': StairsElevationRenderer,
  'shape-rect': ShapeRectRenderer,
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
  'furniture-desk': DeskRenderer,
  'casework-base': BaseCabinetRenderer,
  'casework-upper': UpperCabinetRenderer,
  'casework-island': KitchenIslandRenderer,
  'structural-column-sq': SquareColumnRenderer,
  'structural-column-round': RoundColumnRenderer,
  'room-label': RoomLabelRenderer,
  'north-arrow': NorthArrowRenderer,
  'fire-rating-label': FireRatingLabelRenderer,
  'text-note': TextNoteRenderer,
  'human-scale': HumanScaleRenderer,
  'fire-extinguisher': FireExtinguisherRenderer,
  'exit-sign': ExitSignRenderer,
  'smoke-detector': SmokeDetectorRenderer,
  'emergency-light': EmergencyLightRenderer,
}
