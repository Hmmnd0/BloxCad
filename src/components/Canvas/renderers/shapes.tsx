import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { structuralGeometry } from '../../../utils/structuralGeometry'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

export function ShapeRectRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Rect
      width={widthPx} height={heightPx}
      fill="rgba(255,255,255,0.6)" stroke={STROKE} strokeWidth={STROKE_THIN}
    />
  )
}

// ─── STAIR ELEVATION ─────────────────────────────────────────────────────────

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

export const SHAPES_RENDERERS: Record<string, RendererComponent> = {
  'shape-rect': refinedFixture('shape-rect',structuralGeometry),
  'shape-polygon': PolygonRenderer,
}
