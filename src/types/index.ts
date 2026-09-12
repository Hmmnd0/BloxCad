export type Scale = 'eighth' | 'quarter' | 'half'

export interface ScaleConfig {
  label: string
  pixelsPerFoot: number
  snapFeet: number
}

export const SCALES: Record<Scale, ScaleConfig> = {
  eighth: { label: '1/8" = 1\'', pixelsPerFoot: 12, snapFeet: 1.0 },
  quarter: { label: '1/4" = 1\'', pixelsPerFoot: 24, snapFeet: 0.5 },
  half: { label: '1/2" = 1\'', pixelsPerFoot: 48, snapFeet: 0.25 }
}

export type DrawingMode = 'floorplan' | 'elevation' | 'detail'

export type Tool = 'select' | 'hand' | 'dimension' | 'wall' | 'rect' | 'diagonal-wall' | 'polygon' | 'arc-wall' | 'conduit' | 'circuit-wire'
export type WallType = 'wall-exterior' | 'wall-interior' | 'wall-cmu'

export interface WallFaceReference {
  wallId: string
  side: 'left' | 'right' | 'top' | 'bottom'
  inset: number // fraction of the wall's short dimension (0.3 for a footing stem)
}
export interface DimensionAnchor {
  regionKey: string
  faces: [WallFaceReference, WallFaceReference]
}
export interface DimensionLine {
  id: string
  x1: number  // start measured point, feet
  y1: number
  x2: number  // end measured point, feet
  y2: number
  offset: number  // feet from reference edge to dim line (positive = above/left)
  measurement?: 'horizontal' | 'vertical' | 'aligned'
  anchor1?: DimensionAnchor
  anchor2?: DimensionAnchor
  needsReview?: boolean
  overall?: { wallIds: string[]; direction: 'up' | 'down' | 'left' | 'right' }
}

export type BloxCategory =
  | 'Demolition'
  | 'Walls'
  | 'Openings'
  | 'Stairs'
  | 'Fixtures'
  | 'Furniture'
  | 'Casework'
  | 'Structural'
  | 'Details'
  | 'Annotations'
  | 'Fire/Safety'
  | 'Elevation'
  | 'Site'
  | 'Electrical'
  | 'Mechanical'
  | 'Plumbing'
  | 'LowVoltage'

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
}

export interface ElementGroup {
  id: string
  name: string
}

export interface BloxPlacement {
  /** Which edge of the blox (at rotation=0) butts against the wall face */
  wallFaceEdge?: 'top' | 'bottom' | 'left' | 'right'
  /** Feet the blox extends from the wall face into the room */
  intoRoom?: number
  /** When true, height automatically matches wall thickness (windows, doors, openings) */
  fillsWallThickness?: boolean
  /** Minimum clear floor space required in front (ft) — ADA / code */
  clearanceFront?: number
  /** Minimum clear space on each side (ft) */
  clearanceSide?: number
  /** Allowed rotation increments in degrees. Omit = free rotation. */
  validRotations?: number[]
  /** Room types this blox typically appears in */
  typicalRooms?: string[]
  /** Doors: swing arc extends into the room (away from wallFaceEdge) */
  swingIntoRoom?: boolean
  /** Doors: which end has the hinge at rotation=0 */
  hingeEdge?: 'left' | 'right'
}

export interface BloxDefinition {
  id: string
  name: string
  category: BloxCategory
  description: string
  defaultWidth: number  // feet
  defaultHeight: number // feet
  isResizable: boolean
  resizeAxis: 'none' | 'x' | 'y' | 'both'
  minWidth?: number
  minHeight?: number
  widthPresets?: number[]  // common widths in feet shown as quick-pick chips
  placementNote?: string   // freeform AI placement note (legacy — prefer placement block)
  placement?: BloxPlacement
}

export interface PlacedElement {
  id: string
  bloxId: string
  x: number      // feet from origin
  y: number      // feet from origin
  width: number  // feet
  height: number // feet
  rotation: number // degrees
  properties: Record<string, unknown>
  locked: boolean
  layerId?: string
  groupId?: string
  /** Opening center distance from its host wall's start, in model units. */
  wallHost?: { wallId: string; offset: number }
  /** Stored extension beyond each editable wall centerline endpoint. */
  wallEndPadding?: number
}

export interface ArcWall {
  id: string
  cx: number
  cy: number
  radius: number
  startAngle: number
  endAngle: number
  thickness: number
  layerId?: string
  locked?: boolean
}

export interface TitleBlock {
  address: string
  drawingTitle: string
  drawnBy: string
  checkedBy: string
  projectDate: string
  sheetNumber: string
  jobNumber: string
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  category: string
}

export type UnderlayCalibration =
  | { method: 'simple'; realWidthFt: number }
  | { method: 'two-point'; p1px: { x: number; y: number }; p2px: { x: number; y: number }; realDistFt: number }
  | { method: 'multi-point'; pairs: Array<{ p1px:{x:number;y:number}; p2px:{x:number;y:number}; realDistFt:number }>; pixelsPerFoot:number; residualFt:number }

export interface Underlay {
  imageData: string        // base64 data URI
  naturalWidth: number
  naturalHeight: number
  opacity: number          // 0.1–1.0
  visible: boolean
  calibration: UnderlayCalibration | null
  /** Similarity transform from image pixels into canvas feet. */
  registration?: { scaleFtPerPx: number; rotationDeg: number; originPx: {x:number;y:number}; originFt: {x:number;y:number} }
  description?: string     // user-written note about what's in the image (helps AI interpretation)
}

export interface Project {
  permitData?: import('../utils/permitSheet').PermitData
  id: string
  name: string
  scale: Scale
  mode?: DrawingMode
  elements: PlacedElement[]
  dimensions: DimensionLine[]
  detailElements?: PlacedElement[]
  detailDimensions?: DimensionLine[]
  titleBlock?: TitleBlock
  checklist?: ChecklistItem[]
  layers?: Layer[]
  groups?: ElementGroup[]
  underlay?: Underlay
  arcWalls?: ArcWall[]
  /** Named elevation datums used by MCP and elevation annotations. */
  elevationDatums?: Record<string, number>
  /** Minimum building-to-property-line setback for DRC zoning check, per property-line role.
   *  Property-line elements are tagged via properties.lineType ('front'|'side'|'rear'); untagged
   *  lines default to 'side'. Legacy projects may still carry the old single zoningSetbackFt. */
  zoningSetbacks?: { front: number; side: number; rear: number }
  /** @deprecated superseded by zoningSetbacks — read as a fallback for projects saved before the split */
  zoningSetbackFt?: number
}
