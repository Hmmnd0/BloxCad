import React from 'react'
import { refinedWall } from './RefinedWall'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

export function ExteriorWallRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect
        width={widthPx} height={heightPx}
        fill="#3C3C3C"
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
      fill="#5A5A5A"
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
      <Rect width={widthPx} height={heightPx} fill="#888" />
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

// CMU foundation wall shown with its continuous strip footing in plan — footing
// band (dashed outline, hatched — below grade, hidden) wider than the wall,
// wall (solid coursed block) centered on top. Footing:wall ratio fixed at 20":8"
// to match the typical spread-footing-under-stem-wall detail.
export function WallCmuFootingRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const lengthPx = isLandscape ? widthPx : heightPx
  const footingPx = isLandscape ? heightPx : widthPx
  const wallPx = footingPx * (8 / 20)
  const wallOffset = (footingPx - wallPx) / 2

  const footingHatch = (w: number, h: number) => (
    <Shape
      sceneFunc={(ctx) => {
        const nctx = (ctx as unknown as { _context: CanvasRenderingContext2D })._context
        nctx.save()
        nctx.beginPath(); nctx.rect(0, 0, w, h); nctx.clip()
        nctx.strokeStyle = '#AAAAAA'
        nctx.lineWidth = 0.4
        const sp = 5, diag = Math.max(w, h)
        for (let t = -diag; t < w + diag; t += sp) {
          nctx.beginPath(); nctx.moveTo(t, 0); nctx.lineTo(t + diag, diag); nctx.stroke()
        }
        nctx.restore()
      }}
      listening={false}
    />
  )

  const cmuCoursing = (w: number, h: number) => {
    const blockW = 16 / 12 * (h / 0.667)
    const blockH = h / 2
    const vertLines: number[] = []
    for (let x = blockW; x < w; x += blockW) vertLines.push(x)
    return (
      <>
        <Rect width={w} height={h} fill="#888" stroke={STROKE} strokeWidth={STROKE_CUT} />
        <Line points={[0, blockH, w, blockH]} stroke="#555" strokeWidth={0.5} />
        {vertLines.map((x, i) => <Line key={`t${i}`} points={[x, 0, x, blockH]} stroke="#555" strokeWidth={0.5} />)}
        {vertLines.map((x, i) => <Line key={`b${i}`} points={[x + blockW / 2, blockH, x + blockW / 2, h]} stroke="#555" strokeWidth={0.5} />)}
      </>
    )
  }

  // Coursing is always drawn in "landscape" local space (length along x,
  // thickness along y) then rotated into place for vertical wall runs —
  // the mortar-joint pattern isn't symmetric under a naive w/h swap.
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#E4E4E4" stroke="#999" strokeWidth={0.6} dash={[5, 3]} />
      {footingHatch(widthPx, heightPx)}
      {isLandscape ? (
        <Group x={0} y={wallOffset}>
          {cmuCoursing(lengthPx, wallPx)}
        </Group>
      ) : (
        <Group x={wallOffset + wallPx} y={0} rotation={90}>
          {cmuCoursing(lengthPx, wallPx)}
        </Group>
      )}
    </Group>
  )
}

export function GlazingWallRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const len = isLandscape ? widthPx : heightPx
  const mullionSpacing = 40
  const mullionCount = Math.max(0, Math.floor(len / mullionSpacing) - 1)

  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#C8E0F0" />
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

export function FireWall1HrRenderer({ widthPx, heightPx }: RendererProps) {
  const labelSpacing = Math.max(40, widthPx / 3)
  const labels: number[] = []
  for (let x = labelSpacing / 2; x < widthPx; x += labelSpacing) labels.push(x)
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="#6A4A4A" />
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
      <Rect width={widthPx} height={heightPx} fill="#5A2A2A" />
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

export const WALLS_RENDERERS: Record<string, RendererComponent> = {
  'wall-exterior': refinedWall('wall-exterior'),
  'wall-glazing': refinedWall('wall-glazing'),
  'wall-interior': refinedWall('wall-interior'),
  'wall-cmu': refinedWall('wall-cmu'),
  'wall-cmu-footing': refinedWall('wall-cmu-footing'),
  'wall-fire-1hr': refinedWall('wall-fire-1hr'),
  'wall-fire-2hr': refinedWall('wall-fire-2hr'),
}
