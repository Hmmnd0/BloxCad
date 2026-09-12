import React from 'react'
import { refinedCirculation } from './RefinedCirculation'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

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

export const STAIRS_RENDERERS: Record<string, RendererComponent> = {
  'stairs-straight': refinedCirculation('stairs-straight'),
  'stairs-hatch': refinedCirculation('stairs-hatch'),
  'stairs-landing': refinedCirculation('stairs-landing'),
  'stairs-elevation': refinedCirculation('stairs-elevation'),
  'handrail': refinedCirculation('handrail'),
  'fixture-elevator': refinedCirculation('fixture-elevator'),
  'fixture-ramp': refinedCirculation('fixture-ramp'),
}
