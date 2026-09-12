import React from 'react'
import {
  Line as KLine, Rect as KRect, Circle as KCircle,
  Arc as KArc, Ellipse as KEllipse, Shape as KShape
} from 'react-konva'
import { LINE_WEIGHTS } from '../../../utils/lineWeights'

export interface RendererProps {
  widthPx: number
  heightPx: number
  /** Explicit drawing scale for physical pattern spacing in exports/previews. */
  pixelsPerFoot?: number
  selected: boolean
  properties: Record<string, unknown>
  /** The element's own rotation in degrees, as placed on the canvas. Optional
   *  and unused by most renderers — only needed when a renderer draws a text
   *  label that must stay upright regardless of the element's rotation (e.g.
   *  counter-rotating a home-run circuit tag so it never reads upside-down). */
  rotation?: number
}

export type RendererComponent = React.FC<RendererProps>

export const STROKE = '#1A1A1A'
export const ARC_FONT = "Arial, 'Helvetica Neue', sans-serif"
export const STROKE_THIN = LINE_WEIGHTS.detail
export const STROKE_MED = LINE_WEIGHTS.object
export const STROKE_HEAVY = LINE_WEIGHTS.heavy
export const STROKE_CUT = LINE_WEIGHTS.cut

// Drop-in replacements for react-konva's Line/Rect/Circle/Arc/Ellipse/Shape that
// default strokeScaleEnabled to false: line weight renders at a constant screen
// pixel width regardless of canvas zoom (the architectural "pen weight"
// convention), instead of fading to a sub-pixel hairline when zoomed out to see
// a whole plan. This is a native Konva feature — it's resolved at draw time from
// the live canvas transform, so it costs nothing and never lags behind the
// zoom the way a React-state-driven recompute would. An explicit
// strokeScaleEnabled on a call site still wins (spread after the default).
type LineProps = React.ComponentProps<typeof KLine>
type RectProps = React.ComponentProps<typeof KRect>
type CircleProps = React.ComponentProps<typeof KCircle>
type ArcProps = React.ComponentProps<typeof KArc>
type EllipseProps = React.ComponentProps<typeof KEllipse>
type ShapeProps = React.ComponentProps<typeof KShape>

export function Line(props: LineProps) { return <KLine strokeScaleEnabled={false} {...props} /> }
export function Rect(props: RectProps) { return <KRect strokeScaleEnabled={false} {...props} /> }
export function Circle(props: CircleProps) { return <KCircle strokeScaleEnabled={false} {...props} /> }
export function Arc(props: ArcProps) { return <KArc strokeScaleEnabled={false} {...props} /> }
export function Ellipse(props: EllipseProps) { return <KEllipse strokeScaleEnabled={false} {...props} /> }
export function Shape(props: ShapeProps) { return <KShape strokeScaleEnabled={false} {...props} /> }
