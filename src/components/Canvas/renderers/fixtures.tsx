import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Arc, Shape } from './shared'
import { Rect, Line, Ellipse, Circle } from './interiorPrimitives'

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

export function ShowerRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx * 0.58
  const dr = Math.min(widthPx, heightPx) * 0.07
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_MED} />
      <Line points={[0, heightPx * 0.06, widthPx, heightPx * 0.06]} stroke={STROKE} strokeWidth={0.5} dash={[5, 3]} listening={false} />
      <Circle x={cx} y={cy} radius={dr} fill="#f0f0f0" stroke="#888" strokeWidth={0.8} />
      <Circle x={cx} y={cy} radius={dr * 0.4} fill="#ddd" stroke="#999" strokeWidth={0.4} listening={false} />
      <Circle x={widthPx * 0.16} y={heightPx * 0.16} radius={dr * 0.65} stroke="#aaa" strokeWidth={0.6} listening={false} />
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

export const FIXTURES_RENDERERS: Record<string, RendererComponent> = {
  'fixture-toilet': refinedFixture('fixture-toilet'),
  'fixture-sink-lav': refinedFixture('fixture-sink-lav'),
  'fixture-bathtub': refinedFixture('fixture-bathtub'),
  'fixture-sink-kitchen': refinedFixture('fixture-sink-kitchen'),
  'fixture-refrigerator': refinedFixture('fixture-refrigerator'),
  'fixture-range': refinedFixture('fixture-range'),
  'fixture-dishwasher': refinedFixture('fixture-dishwasher'),
  'fixture-vanity': refinedFixture('fixture-vanity'),
  'fixture-shower': refinedFixture('fixture-shower'),
  'fixture-washer': refinedFixture('fixture-washer'),
  'fixture-dryer': refinedFixture('fixture-dryer'),
  'fixture-utility-sink': refinedFixture('fixture-utility-sink'),
}
