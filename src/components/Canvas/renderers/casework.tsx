import React from 'react'
import { refinedCasework } from './RefinedCasework'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Arc, Shape } from './shared'
import { Rect, Line, Ellipse, Circle } from './interiorPrimitives'

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
        stroke="#aaa" strokeWidth={0.5} />
    </Group>
  )
}

// ─── ANNOTATIONS: HUMAN SCALE ────────────────────────────────────────────────

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

export const CASEWORK_RENDERERS: Record<string, RendererComponent> = {
  'casework-bath-storage': refinedCasework('casework-bath-storage'),
  'casework-base': refinedCasework('casework-base'),
  'casework-upper': refinedCasework('casework-upper'),
  'casework-island': refinedCasework('casework-island'),
  'casework-pantry': refinedCasework('casework-pantry'),
  'casework-closet-rod': refinedCasework('casework-closet-rod'),
}
