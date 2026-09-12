import React from 'react'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Arc, Shape } from './shared'
import { Rect, Line, Ellipse, Circle } from './interiorPrimitives'
import { refinedFurniture } from './RefinedFurniture'

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
        stroke="#bbb" strokeWidth={0.5} cornerRadius={1} />
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
        stroke="#ccc" strokeWidth={0.5} cornerRadius={2} />
    </Group>
  )
}

export function DeskRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f0ece4" stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Rect x={3} y={3} width={widthPx - 6} height={heightPx - 6} stroke="#ccc" strokeWidth={0.5} />
      {isLandscape
        ? <Line points={[widthPx * 0.15, heightPx / 2, widthPx * 0.85, heightPx / 2]} stroke="#bbb" strokeWidth={0.8} />
        : <Line points={[widthPx / 2, heightPx * 0.15, widthPx / 2, heightPx * 0.85]} stroke="#bbb" strokeWidth={0.8} />
      }
    </Group>
  )
}

// ─── CASEWORK ─────────────────────────────────────────────────────────────────

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

export function NightstandRenderer({ widthPx, heightPx }: RendererProps) {
  const pad = Math.min(widthPx, heightPx) * 0.12
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#f5f0e8" stroke={STROKE} strokeWidth={STROKE_THIN} cornerRadius={2} />
      <Rect x={pad} y={pad} width={widthPx - pad * 2} height={heightPx - pad * 2}
        stroke="#ccc" strokeWidth={0.5} cornerRadius={1} />
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

export const FURNITURE_RENDERERS: Record<string, RendererComponent> = {
  'furniture-bed-twin': refinedFurniture('furniture-bed-twin'),
  'furniture-bed-full': refinedFurniture('furniture-bed-full'),
  'furniture-bed-queen': refinedFurniture('furniture-bed-queen'),
  'furniture-bed-king': refinedFurniture('furniture-bed-king'),
  'furniture-sofa': refinedFurniture('furniture-sofa'),
  'furniture-chair': refinedFurniture('furniture-chair'),
  'furniture-dining-table': refinedFurniture('furniture-dining-table'),
  'furniture-coffee-table': refinedFurniture('furniture-coffee-table'),
  'furniture-dresser': refinedFurniture('furniture-dresser'),
  'furniture-desk': refinedFurniture('furniture-desk'),
  'furniture-nightstand': refinedFurniture('furniture-nightstand'),
  'furniture-bookcase': refinedFurniture('furniture-bookcase'),
  'furniture-tv-unit': refinedFurniture('furniture-tv-unit'),
}
