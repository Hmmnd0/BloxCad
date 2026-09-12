import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { equipmentGeometry } from '../../../utils/equipmentGeometry'
import { Group, Text } from 'react-konva'
import { RendererProps, RendererComponent, ARC_FONT, STROKE_THIN, STROKE_MED, Rect, Line, Circle } from './shared'

const LV_COLOR = '#6B4FA0'

// Telecom/data outlet: a triangle (point down) is the conventional symbol in
// low-voltage/AV plan sets — not a circled letter, which reads as an
// electrical device instead.
export function LvDataJackRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, top = heightPx * 0.15, bot = heightPx * 0.85
  const halfW = widthPx * 0.4
  return (
    <Group>
      <Line points={[cx - halfW, top, cx + halfW, top, cx, bot, cx - halfW, top]}
        stroke={LV_COLOR} strokeWidth={STROKE_MED} closed fill="white" />
      <Text text="D" x={cx - 3} y={top + 2} fontSize={7} fontFamily={ARC_FONT}
        fontStyle="bold" fill={LV_COLOR} listening={false} />
    </Group>
  )
}

export function LvCoaxJackRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, top = heightPx * 0.15, bot = heightPx * 0.85
  const halfW = widthPx * 0.4
  return (
    <Group>
      <Line points={[cx - halfW, top, cx + halfW, top, cx, bot, cx - halfW, top]}
        stroke={LV_COLOR} strokeWidth={STROKE_MED} closed fill="white" />
      <Text text="C" x={cx - 3} y={top + 2} fontSize={7} fontFamily={ARC_FONT}
        fontStyle="bold" fill={LV_COLOR} listening={false} />
    </Group>
  )
}

export function LvPanelRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={LV_COLOR} strokeWidth={STROKE_MED} />
      <Text text="LV" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(9, widthPx * 0.16)} fontFamily={ARC_FONT} fill={LV_COLOR} listening={false} />
    </Group>
  )
}

export function LvSecurityKeypadRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={LV_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[widthPx * 0.2, heightPx * 0.35, widthPx * 0.8, heightPx * 0.35]} stroke={LV_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx * 0.2, heightPx * 0.6, widthPx * 0.8, heightPx * 0.6]} stroke={LV_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

export function LvCameraRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={LV_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.45} fill={LV_COLOR} />
    </Group>
  )
}

export const LOW_VOLTAGE_RENDERERS: Record<string, RendererComponent> = {
  'lv-data-jack': refinedFixture('lv-data-jack',equipmentGeometry),
  'lv-coax-jack': refinedFixture('lv-coax-jack',equipmentGeometry),
  'lv-panel': refinedFixture('lv-panel',equipmentGeometry),
  'lv-security-keypad': refinedFixture('lv-security-keypad',equipmentGeometry),
  'lv-camera': refinedFixture('lv-camera',equipmentGeometry),
}
