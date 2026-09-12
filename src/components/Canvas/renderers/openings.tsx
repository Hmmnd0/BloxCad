import React from 'react'
import { refinedCirculation } from './RefinedCirculation'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

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

export const OPENINGS_RENDERERS: Record<string, RendererComponent> = {
  'cased-opening': refinedCirculation('cased-opening'),
  'door-single': refinedCirculation('door-single'),
  'door-double': refinedCirculation('door-double'),
  'door-sliding': refinedCirculation('door-sliding'),
  'window-single': refinedCirculation('window-single'),
  'window-double': refinedCirculation('window-double'),
  'window-multi': refinedCirculation('window-multi'),
  'door-pocket': refinedCirculation('door-pocket'),
  'door-bifold': refinedCirculation('door-bifold'),
  'door-garage': refinedCirculation('door-garage'),
}
