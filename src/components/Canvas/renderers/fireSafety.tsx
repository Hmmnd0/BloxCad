import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { equipmentGeometry } from '../../../utils/equipmentGeometry'
import { Group, Text } from 'react-konva'
import { useStore, getPixelsPerFoot } from '../../../store/useStore'
import { SCALES } from '../../../types'
import { RendererProps, RendererComponent, STROKE, STROKE_THIN, STROKE_MED, STROKE_HEAVY, STROKE_CUT, ARC_FONT, Rect, Line, Arc, Ellipse, Circle, Shape } from './shared'

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

export function CoAlarmRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke="#B8860B" strokeWidth={1} />
      <Text text="CO" x={cx - 7} y={cy - 5} fontSize={8} fontStyle="bold"
        fontFamily={ARC_FONT} fill="#B8860B" listening={false} />
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

export const FIRE_SAFETY_RENDERERS: Record<string, RendererComponent> = {
  'fire-extinguisher': refinedFixture('fire-extinguisher',equipmentGeometry),
  'exit-sign': refinedFixture('exit-sign',equipmentGeometry),
  'smoke-detector': refinedFixture('smoke-detector',equipmentGeometry),
  'emergency-light': refinedFixture('emergency-light',equipmentGeometry),
  'co-alarm': refinedFixture('co-alarm',equipmentGeometry),
}
