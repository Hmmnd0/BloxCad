import React from 'react'
import { refinedFixture } from './RefinedFixture'
import { electricalGeometry } from '../../../utils/electricalGeometry'
import { equipmentGeometry, REFINED_EQUIPMENT } from '../../../utils/equipmentGeometry'
import { Group, Text } from 'react-konva'
import { STROKE, ARC_FONT, STROKE_THIN, STROKE_MED, RendererProps, RendererComponent, Rect, Line, Circle, Shape } from './shared'

// ── ELECTRICAL ────────────────────────────────────────────────────────────

const ELEC_COLOR = '#B8860B'

// Panelboard: NCS convention is a solid-filled rectangle (not an outlined box
// with a diagonal cross) tagged with the panel designation.
export function ElecPanelRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill={ELEC_COLOR} stroke={STROKE} strokeWidth={STROKE_THIN} />
      <Text text="PNL" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(9, widthPx * 0.16)} fontFamily={ARC_FONT} fill="white" listening={false} />
    </Group>
  )
}

export function ElecMeterRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Text text="M" x={cx - 4} y={cy - 5} fontSize={Math.min(9, r)} fontFamily={ARC_FONT}
        fontStyle="bold" fill={ELEC_COLOR} listening={false} />
    </Group>
  )
}

// Duplex receptacle: two short parallel tick marks (the two slot pairs)
// inside the circle — the actual NCS symbol, not a single bar.
export function ElecOutletRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx - r * 0.35, cy - r * 0.4, cx - r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[cx + r * 0.35, cy - r * 0.4, cx + r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

export function ElecOutletGfciRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx - r * 0.35, cy - r * 0.4, cx - r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[cx + r * 0.35, cy - r * 0.4, cx + r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Text text="GFCI" x={cx - 12} y={cy - r - 10} fontSize={6} fontFamily={ARC_FONT}
        fontStyle="bold" fill={ELEC_COLOR} listening={false} />
    </Group>
  )
}

// Switch: NCS convention is the bare letter at the wall — no circle
// enclosure (the circle is reserved for ceiling/outlet-type devices).
export function ElecSwitchRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Text text="S" x={cx - 4} y={cy - 6} fontSize={12} fontFamily={ARC_FONT}
      fontStyle="bold" fill={ELEC_COLOR} listening={false} />
  )
}

// Ceiling fixture: circle with a plain X — the standard surface/incandescent
// ceiling-light symbol (two crossing diagonals, not a multi-spoke burst).
export function ElecLightCeilingRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      {[45, 135].map(a => {
        const rad = (a * Math.PI) / 180
        return (
          <Line key={a}
            points={[cx - Math.cos(rad) * r, cy - Math.sin(rad) * r, cx + Math.cos(rad) * r, cy + Math.sin(rad) * r]}
            stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
        )
      })}
    </Group>
  )
}

// ── MECHANICAL ────────────────────────────────────────────────────────────

const MECH_COLOR = '#2E7D5B'

export function MechFurnaceRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Text text="FURNACE" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(8, widthPx * 0.14, heightPx * 0.14)} fontFamily={ARC_FONT} fill={MECH_COLOR} listening={false} />
    </Group>
  )
}

export function MechCondenserRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.7} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      {[0, 60, 120].map(a => {
        const rad = (a * Math.PI) / 180
        return (
          <Line key={a}
            points={[cx - Math.cos(rad) * r * 0.7, cy - Math.sin(rad) * r * 0.7, cx + Math.cos(rad) * r * 0.7, cy + Math.sin(rad) * r * 0.7]}
            stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
        )
      })}
    </Group>
  )
}

// Supply diffuser: square with an inscribed X — the standard 4-way-throw
// ceiling/floor diffuser symbol (SMACNA/ASHRAE plan convention).
export function MechRegisterSupplyRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[0, 0, widthPx, heightPx]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// Return grille: parallel louver lines only, no X — distinguishes it from a
// supply diffuser at a glance, per standard HVAC plan convention.
export function MechRegisterReturnRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const lines = 4
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      {Array.from({ length: lines }, (_, i) => {
        const t = ((i + 1) / (lines + 1))
        return isLandscape
          ? <Line key={i} points={[widthPx * t, heightPx * 0.15, widthPx * t, heightPx * 0.85]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
          : <Line key={i} points={[widthPx * 0.15, heightPx * t, widthPx * 0.85, heightPx * t]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      })}
    </Group>
  )
}

export function MechThermostatRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Text text="T" x={cx - 3} y={cy - 5} fontSize={Math.min(8, r * 1.3)} fontFamily={ARC_FONT}
        fontStyle="bold" fill={MECH_COLOR} listening={false} />
    </Group>
  )
}

// ── PLUMBING ──────────────────────────────────────────────────────────────

const PLUMB_COLOR = '#2A5FA5'

export function PlumbWaterHeaterRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Text text="WH" x={cx - 8} y={cy - 5} fontSize={Math.min(9, r * 0.9)} fontFamily={ARC_FONT}
        fontStyle="bold" fill={PLUMB_COLOR} listening={false} />
    </Group>
  )
}

export function PlumbCleanoutRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.4} fill={PLUMB_COLOR} />
      <Text text="CO" x={cx - 8} y={cy + r + 1} fontSize={6} fontFamily={ARC_FONT} fill={PLUMB_COLOR} listening={false} />
    </Group>
  )
}

export function PlumbGasMeterRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Text text="GAS" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(8, widthPx * 0.16, heightPx * 0.3)} fontFamily={ARC_FONT}
        fontStyle="bold" fill={PLUMB_COLOR} listening={false} />
    </Group>
  )
}

export function PlumbHoseBibbRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx, cy - r, cx, cy + r]} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// ── MECHANICAL (additional) ────────────────────────────────────────────────

export function BathExhaustFanRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.6} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      {[0, 90, 180, 270].map(a => {
        const rad = (a * Math.PI) / 180
        return <Line key={a} points={[cx, cy, cx + Math.cos(rad) * r * 0.6, cy + Math.sin(rad) * r * 0.6]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      })}
    </Group>
  )
}

export function RangeHoodRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} dash={[5, 3]} />
      <Text text="HOOD" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(8, widthPx * 0.12, heightPx * 0.3)} fontFamily={ARC_FONT} fill={MECH_COLOR} listening={false} />
    </Group>
  )
}

// Supply duct: solid outline, centerline arrow showing airflow direction —
// the standard single-line supply-duct convention.
export function DuctSupplyRenderer({ widthPx, heightPx }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(46,125,91,0.08)" stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      {isLandscape ? (
        <>
          <Line points={[widthPx * 0.1, cy, widthPx * 0.85, cy]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
          <Line points={[widthPx * 0.7, cy - heightPx * 0.15, widthPx * 0.85, cy, widthPx * 0.7, cy + heightPx * 0.15]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
        </>
      ) : (
        <>
          <Line points={[cx, heightPx * 0.1, cx, heightPx * 0.85]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
          <Line points={[cx - widthPx * 0.15, heightPx * 0.7, cx, heightPx * 0.85, cx + widthPx * 0.15, heightPx * 0.7]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
        </>
      )}
    </Group>
  )
}

// Return duct: dashed outline distinguishes it from supply at a glance, per
// standard HVAC single-line plan convention (solid = supply, dashed = return).
export function DuctReturnRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="rgba(46,125,91,0.15)" stroke={MECH_COLOR} strokeWidth={STROKE_MED} dash={[6, 3]} />
      <Line points={[0, 0, widthPx, heightPx]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[widthPx, 0, 0, heightPx]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

export function MinisplitRenderer({ widthPx, heightPx }: RendererProps) {
  const lines = 3
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      {Array.from({ length: lines }, (_, i) => {
        const y = heightPx * ((i + 1) / (lines + 1))
        return <Line key={i} points={[widthPx * 0.1, y, widthPx * 0.9, y]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
      })}
    </Group>
  )
}

export function ErvRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Text text="ERV" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(9, widthPx * 0.18, heightPx * 0.18)} fontFamily={ARC_FONT} fill={MECH_COLOR} listening={false} />
    </Group>
  )
}

export function DryerVentCapRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={MECH_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx - r * 0.6, cy, cx + r * 0.6, cy]} stroke={MECH_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// ── PLUMBING (additional) ───────────────────────────────────────────────────

export function PlumbRoofVentRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.4} fill={PLUMB_COLOR} />
    </Group>
  )
}

export function PlumbFloorDrainRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx - r * 0.5, cy, cx + r * 0.5, cy]} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[cx, cy - r * 0.5, cx, cy + r * 0.5]} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

export function PlumbSumpPumpRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Text text="SP" x={cx - 7} y={cy - 5} fontSize={Math.min(9, r * 0.9)} fontFamily={ARC_FONT}
        fontStyle="bold" fill={PLUMB_COLOR} listening={false} />
    </Group>
  )
}

export function PlumbWaterSoftenerRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Text text="WS" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(9, widthPx * 0.18, heightPx * 0.18)} fontFamily={ARC_FONT} fill={PLUMB_COLOR} listening={false} />
    </Group>
  )
}

// Gate valve: the standard plumbing/piping valve symbol is a bowtie — two
// triangles meeting point-to-point on the pipe centerline — not a diamond.
export function PlumbShutoffValveRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  const rx = widthPx / 2, ry = heightPx / 2
  return (
    <Group>
      <Line points={[cx - rx, cy - ry, cx, cy, cx - rx, cy + ry, cx - rx, cy - ry]} stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} closed fill="white" />
      <Line points={[cx + rx, cy - ry, cx, cy, cx + rx, cy + ry, cx + rx, cy - ry]} stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} closed fill="white" />
    </Group>
  )
}

export function PlumbWasherBoxRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={PLUMB_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx - widthPx * 0.2} y={heightPx * 0.3} radius={widthPx * 0.1} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
      <Circle x={cx + widthPx * 0.2} y={heightPx * 0.3} radius={widthPx * 0.1} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
      <Circle x={cx} y={heightPx * 0.7} radius={widthPx * 0.12} stroke={PLUMB_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// ── ELECTRICAL (additional) ─────────────────────────────────────────────────

export function ElecLightRecessedRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Circle x={cx} y={cy} radius={r * 0.4} fill={ELEC_COLOR} />
    </Group>
  )
}

export function ElecLightExteriorRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      {[45, 135, 225, 315].map(a => {
        const rad = (a * Math.PI) / 180
        return <Line key={a} points={[cx + Math.cos(rad) * r * 0.5, cy + Math.sin(rad) * r * 0.5, cx + Math.cos(rad) * r * 1.3, cy + Math.sin(rad) * r * 1.3]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      })}
    </Group>
  )
}

export function ElecCeilingFanRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2 - 1
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      {[0, 90, 180, 270].map(a => {
        const rad = (a * Math.PI) / 180
        return <Line key={a} points={[cx, cy, cx + Math.cos(rad) * r * 0.9, cy + Math.sin(rad) * r * 0.9]} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      })}
      <Circle x={cx} y={cy} radius={r * 0.15} fill={ELEC_COLOR} />
    </Group>
  )
}

// There's no single universal glyph for a 240V receptacle — real practice
// draws the standard outlet symbol with an explicit voltage/amperage text
// callout (the actual NEMA configuration varies: 14-30 dryer vs. 14-50
// range), so this does the same rather than inventing a one-off icon.
export function ElecOutlet240vRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r} fill="white" stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[cx - r * 0.35, cy - r * 0.4, cx - r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[cx + r * 0.35, cy - r * 0.4, cx + r * 0.35, cy + r * 0.4]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Text text="240V" x={cx - 13} y={cy + r + 2} fontSize={6} fontFamily={ARC_FONT}
        fontStyle="bold" fill={ELEC_COLOR} listening={false} />
    </Group>
  )
}

export function ElecDisconnectRenderer({ widthPx, heightPx }: RendererProps) {
  return (
    <Group>
      <Rect width={widthPx} height={heightPx} fill="white" stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Text text="DISC" x={0} y={heightPx / 2 - 5} width={widthPx} align="center"
        fontSize={Math.min(7, widthPx * 0.16, heightPx * 0.16)} fontFamily={ARC_FONT} fill={ELEC_COLOR} listening={false} />
    </Group>
  )
}

export function ElecDoorbellRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2, r = Math.min(widthPx, heightPx) / 2
  return <Circle x={cx} y={cy} radius={r} fill={ELEC_COLOR} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
}

// Conduit run: two closely-spaced parallel lines along the run — the
// standard raceway symbol on electrical plans — with an optional size/type
// tag (properties.conduitLabel, e.g. `3/4"C`) at the midpoint.
export function ElecConduitRenderer({ widthPx, heightPx, properties, rotation }: RendererProps) {
  const isLandscape = widthPx >= heightPx
  const label = typeof properties.conduitLabel === 'string' ? properties.conduitLabel : ''
  const fontSize = Math.min(8, isLandscape ? heightPx * 3 : widthPx * 3, 9)
  if (isLandscape) {
    const y1 = heightPx * 0.3, y2 = heightPx * 0.7
    // Flip the label 180° (not counter-rotate to 0) when the run's absolute
    // angle would otherwise read upside-down — keeps the size/type callout
    // running parallel to the conduit, the normal drafting convention, while
    // never actually inverting it.
    const norm = ((rotation ?? 0) % 360 + 360) % 360
    const labelFlip = norm > 90 && norm < 270 ? 180 : 0
    return (
      <Group>
        <Line points={[0, y1, widthPx, y1]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
        <Line points={[0, y2, widthPx, y2]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
        {label && (
          <Text text={label} x={widthPx / 2} y={heightPx / 2} width={widthPx} offsetX={widthPx / 2} offsetY={heightPx / 2}
            rotation={labelFlip} align="center"
            fontSize={fontSize} fontFamily={ARC_FONT} fill={ELEC_COLOR} listening={false} />
        )}
      </Group>
    )
  }
  const x1 = widthPx * 0.3, x2 = widthPx * 0.7
  return (
    <Group>
      <Line points={[x1, 0, x1, heightPx]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[x2, 0, x2, heightPx]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
    </Group>
  )
}

// Switch-to-fixture control relationship (not a physical raceway) — drawn as
// a dashed curve per standard residential electrical plan convention, so it
// reads as distinct from a straight conduit/duct run at a glance.
export function ElecCircuitWireRenderer({ widthPx, heightPx }: RendererProps) {
  const y0 = heightPx * 0.85
  const yc = heightPx * 0.05
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.moveTo(0, y0)
        ctx.quadraticCurveTo(widthPx / 2, yc, widthPx, y0)
        ctx.strokeShape(shape)
      }}
      stroke={ELEC_COLOR}
      strokeWidth={STROKE_THIN}
      dash={[6, 4]}
    />
  )
}

// Home run: a broken line terminating in an arrow (the wire continues off to
// the panel beyond the drawing), tagged with the circuit designation.
export function ElecHomerunRenderer({ widthPx, heightPx, properties, rotation }: RendererProps) {
  const label = typeof properties.circuitLabel === 'string' ? properties.circuitLabel : ''
  const cy = heightPx * 0.6
  const breakX = widthPx * 0.4
  const ah = Math.min(heightPx * 0.35, 7)
  const labelX = widthPx / 2, labelY = cy - ah * 0.65 - 11
  return (
    <Group>
      <Line points={[0, cy, breakX, cy]} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[breakX - 3, cy + 5, breakX + 3, cy - 5]} stroke={ELEC_COLOR} strokeWidth={STROKE_THIN} />
      <Line points={[breakX + 3, cy, widthPx - ah, cy]} stroke={ELEC_COLOR} strokeWidth={STROKE_MED} />
      <Line points={[widthPx - ah * 2, cy - ah * 0.65, widthPx, cy, widthPx - ah * 2, cy + ah * 0.65]}
        closed fill={ELEC_COLOR} stroke={ELEC_COLOR} strokeWidth={0.4} />
      {label && (
        // Counter-rotate so the circuit tag stays upright and readable no
        // matter which way the home run itself points.
        <Text text={label} x={labelX} y={labelY} width={80} offsetX={40} align="center"
          rotation={-(rotation ?? 0)}
          fontSize={9} fontStyle="bold" fill={ELEC_COLOR} fontFamily={ARC_FONT} listening={false} />
      )}
    </Group>
  )
}

// Switches: bare letter tag at the wall, same NCS convention as the
// single-pole switch — no circle enclosure.
export function ElecSwitch3WayRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Text text="S3" x={cx - 9} y={cy - 6} fontSize={12} fontFamily={ARC_FONT}
      fontStyle="bold" fill={ELEC_COLOR} listening={false} />
  )
}

export function ElecSwitchDimmerRenderer({ widthPx, heightPx }: RendererProps) {
  const cx = widthPx / 2, cy = heightPx / 2
  return (
    <Text text="SD" x={cx - 9} y={cy - 6} fontSize={12} fontFamily={ARC_FONT}
      fontStyle="bold" fill={ELEC_COLOR} listening={false} />
  )
}

export const MEP_RENDERERS: Record<string, RendererComponent> = {
  'elec-panel': refinedFixture('elec-panel',electricalGeometry),
  'elec-meter': refinedFixture('elec-meter',electricalGeometry),
  'elec-outlet': refinedFixture('elec-outlet',electricalGeometry),
  'elec-outlet-gfci': refinedFixture('elec-outlet-gfci',electricalGeometry),
  'elec-switch': refinedFixture('elec-switch',electricalGeometry),
  'elec-light-ceiling': refinedFixture('elec-light-ceiling',electricalGeometry),
  'elec-light-recessed': refinedFixture('elec-light-recessed',electricalGeometry),
  'elec-light-exterior': refinedFixture('elec-light-exterior',electricalGeometry),
  'elec-ceiling-fan': refinedFixture('elec-ceiling-fan',electricalGeometry),
  'elec-outlet-240v': refinedFixture('elec-outlet-240v',electricalGeometry),
  'elec-disconnect': refinedFixture('elec-disconnect',electricalGeometry),
  'elec-doorbell': refinedFixture('elec-doorbell',electricalGeometry),
  'elec-conduit': ElecConduitRenderer,
  'elec-circuit-wire': ElecCircuitWireRenderer,
  'elec-homerun': ElecHomerunRenderer,
  'elec-switch-3way': refinedFixture('elec-switch-3way',electricalGeometry),
  'elec-switch-dimmer': refinedFixture('elec-switch-dimmer',electricalGeometry),
  'mech-furnace': MechFurnaceRenderer,
  'mech-condenser': MechCondenserRenderer,
  'mech-register-supply': MechRegisterSupplyRenderer,
  'mech-register-return': MechRegisterReturnRenderer,
  'mech-thermostat': MechThermostatRenderer,
  'mech-exhaust-fan-bath': BathExhaustFanRenderer,
  'mech-range-hood': RangeHoodRenderer,
  'mech-duct-supply': DuctSupplyRenderer,
  'mech-duct-return': DuctReturnRenderer,
  'mech-minisplit': MinisplitRenderer,
  'mech-erv': ErvRenderer,
  'mech-dryer-vent-cap': DryerVentCapRenderer,
  'plumb-water-heater': PlumbWaterHeaterRenderer,
  'plumb-cleanout': PlumbCleanoutRenderer,
  'plumb-gas-meter': PlumbGasMeterRenderer,
  'plumb-hose-bibb': PlumbHoseBibbRenderer,
  'plumb-roof-vent': PlumbRoofVentRenderer,
  'plumb-floor-drain': PlumbFloorDrainRenderer,
  'plumb-sump-pump': PlumbSumpPumpRenderer,
  'plumb-water-softener': PlumbWaterSoftenerRenderer,
  'plumb-shutoff-valve': PlumbShutoffValveRenderer,
  'plumb-washer-box': PlumbWasherBoxRenderer,
  ...Object.fromEntries([...REFINED_EQUIPMENT].filter(id=>id.startsWith('mech-')||id.startsWith('plumb-')).map(id=>[id,refinedFixture(id,equipmentGeometry)])),
}
