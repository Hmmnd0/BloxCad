import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { structuralGeometry } from '../../../utils/structuralGeometry'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

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

export function StructuralPlumbingChaseRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={STROKE} strokeWidth={STROKE_CUT} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath()
          nctx.rect(0, 0, widthPx, heightPx)
          nctx.clip()
          nctx.strokeStyle = '#888'
          nctx.lineWidth = 0.5
          const spacing = 6
          const diagonal = widthPx + heightPx
          for (let t = -diagonal; t < diagonal; t += spacing) {
            nctx.beginPath()
            nctx.moveTo(t, 0)
            nctx.lineTo(t + heightPx, heightPx)
            nctx.stroke()
            nctx.beginPath()
            nctx.moveTo(t + heightPx, 0)
            nctx.lineTo(t, heightPx)
            nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

// ─── SITE / LANDSCAPE ────────────────────────────────────────────────────────

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

export function FoundationWallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#9A9A9A" stroke={STROKE} strokeWidth={STROKE_CUT} />
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
          nctx.save()
          nctx.beginPath(); nctx.rect(0, 0, widthPx, heightPx); nctx.clip()
          nctx.strokeStyle = 'rgba(0,0,0,0.2)'; nctx.lineWidth = 0.4
          const diagonal = Math.max(widthPx, heightPx)
          const step = Math.max(4, Math.min(widthPx, heightPx) / 1.5)
          for (let t = -diagonal; t < widthPx + diagonal; t += step) {
            nctx.beginPath(); nctx.moveTo(t, 0); nctx.lineTo(t + diagonal, diagonal); nctx.stroke()
          }
          nctx.restore()
        }}
        listening={false}
      />
    </Group>
  )
}

// ─── NEW ELEVATION ────────────────────────────────────────────────────────────

export const STRUCTURAL_RENDERERS: Record<string, RendererComponent> = {
  'structural-fireplace': refinedFixture('structural-fireplace',structuralGeometry),
  'structural-masonry-mass': refinedFixture('structural-masonry-mass',structuralGeometry),
  'structural-column-sq': refinedFixture('structural-column-sq',structuralGeometry),
  'structural-column-round': refinedFixture('structural-column-round',structuralGeometry),
  'structural-plumbing-chase': refinedFixture('structural-plumbing-chase',structuralGeometry),
  'structural-beam': refinedFixture('structural-beam',structuralGeometry),
  'structural-footing': refinedFixture('structural-footing',structuralGeometry),
  'structural-foundation-wall': refinedFixture('structural-foundation-wall',structuralGeometry),
  'shape-rect': refinedFixture('shape-rect',structuralGeometry),
}
