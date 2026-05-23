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

export type Tool = 'select' | 'hand' | 'dimension' | 'wall' | 'rect'
export type WallType = 'wall-exterior' | 'wall-interior' | 'wall-cmu'

export interface DimensionLine {
  id: string
  x1: number  // start measured point, feet
  y1: number
  x2: number  // end measured point, feet
  y2: number
  offset: number  // feet from reference edge to dim line (positive = above/left)
}

export type BloxCategory =
  | 'Walls'
  | 'Openings'
  | 'Stairs'
  | 'Fixtures'
  | 'Furniture'
  | 'Casework'
  | 'Structural'
  | 'Annotations'
  | 'Fire/Safety'

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
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

export interface Project {
  id: string
  name: string
  scale: Scale
  elements: PlacedElement[]
  dimensions: DimensionLine[]
  titleBlock?: TitleBlock
  checklist?: ChecklistItem[]
  layers?: Layer[]
}
