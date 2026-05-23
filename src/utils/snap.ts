import { PlacedElement } from '../types'

interface Point { x: number; y: number }

const WALL_BLOX_IDS = new Set(['wall-exterior', 'wall-interior', 'wall-cmu'])

export interface WallSnapResult {
  x: number
  y: number
  widthOverride: number
  heightOverride: number
  wallId: string
}

/**
 * When placing an opening (window/door), snaps it to the nearest wall's centerline.
 * Returns null if no wall is within threshold.
 * Clamps the opening to stay within the wall's length.
 * For horizontal walls: snaps Y to wall.y, height = wall thickness.
 * For vertical walls: snaps X to wall.x, opening runs along Y.
 */
export function snapOpeningToWall(
  cursorFt: Point,
  elements: PlacedElement[],
  openingDefaultWidth: number,
  thresholdFt: number
): WallSnapResult | null {
  const walls = elements.filter(el => WALL_BLOX_IDS.has(el.bloxId) && el.rotation === 0)

  let best: WallSnapResult | null = null
  let bestDist = thresholdFt

  for (const wall of walls) {
    const isHoriz = wall.width > wall.height

    if (isHoriz) {
      if (openingDefaultWidth >= wall.width) continue
      const wallCenterY = wall.y + wall.height / 2
      const dist = Math.abs(cursorFt.y - wallCenterY)
      if (dist < bestDist && cursorFt.x >= wall.x - 0.1 && cursorFt.x <= wall.x + wall.width + 0.1) {
        bestDist = dist
        const clampedX = Math.max(
          wall.x,
          Math.min(wall.x + wall.width - openingDefaultWidth, cursorFt.x - openingDefaultWidth / 2)
        )
        best = {
          x: clampedX,
          y: wall.y,
          widthOverride: openingDefaultWidth,
          heightOverride: wall.height,
          wallId: wall.id
        }
      }
    } else {
      if (openingDefaultWidth >= wall.height) continue
      const wallCenterX = wall.x + wall.width / 2
      const dist = Math.abs(cursorFt.x - wallCenterX)
      if (dist < bestDist && cursorFt.y >= wall.y && cursorFt.y <= wall.y + wall.height) {
        bestDist = dist
        const clampedY = Math.max(
          wall.y,
          Math.min(wall.y + wall.height - openingDefaultWidth, cursorFt.y - openingDefaultWidth / 2)
        )
        best = {
          x: wall.x,
          y: clampedY,
          widthOverride: wall.width,
          heightOverride: openingDefaultWidth,
          wallId: wall.id
        }
      }
    }
  }

  return best
}

/**
 * Returns all snap points (corners + edge midpoints) for a set of elements.
 * Ignores rotation for simplicity — uses bounding-box edges.
 */
export function getElementSnapPoints(elements: PlacedElement[]): Point[] {
  const pts: Point[] = []
  for (const el of elements) {
    const { x, y, width, height } = el
    const r = x + width
    const b = y + height
    const mx = x + width / 2
    const my = y + height / 2
    pts.push(
      { x, y },           // top-left
      { x: r, y },        // top-right
      { x, y: b },        // bottom-left
      { x: r, y: b },     // bottom-right
      { x: mx, y },       // top-mid
      { x: mx, y: b },    // bottom-mid
      { x, y: my },       // left-mid
      { x: r, y: my }     // right-mid
    )
  }
  return pts
}

/**
 * Given a cursor position in feet and a list of candidate snap points (feet),
 * returns the nearest point within `thresholdFt` feet, or null.
 */
export function nearestSnapPoint(
  cursor: Point,
  snapPoints: Point[],
  thresholdFt: number
): Point | null {
  let best: Point | null = null
  let bestDist = thresholdFt

  for (const pt of snapPoints) {
    const d = Math.hypot(pt.x - cursor.x, pt.y - cursor.y)
    if (d < bestDist) {
      bestDist = d
      best = pt
    }
  }
  return best
}

/**
 * Threshold in feet based on a fixed screen-pixel threshold.
 */
export function edgeSnapThresholdFt(pixelsPerFoot: number, stageScale: number, thresholdPx = 20): number {
  return thresholdPx / (pixelsPerFoot * stageScale)
}

/**
 * Snaps a wall endpoint to nearby element edges on the axis that's moving.
 * Pass the (already orthogonally-constrained) end point. Returns a potentially
 * snapped version of that point.
 */
export function snapWallEndpoint(
  start: Point,
  constrained: Point,
  elements: PlacedElement[],
  thresholdFt: number
): Point {
  const dx = Math.abs(constrained.x - start.x)
  const dy = Math.abs(constrained.y - start.y)
  const isHoriz = dx >= dy

  if (isHoriz) {
    let bestX = constrained.x
    let bestDist = thresholdFt
    for (const el of elements) {
      for (const target of [el.x, el.x + el.width]) {
        const d = Math.abs(constrained.x - target)
        if (d < bestDist) { bestDist = d; bestX = target }
      }
    }
    return { x: bestX, y: constrained.y }
  } else {
    let bestY = constrained.y
    let bestDist = thresholdFt
    for (const el of elements) {
      for (const target of [el.y, el.y + el.height]) {
        const d = Math.abs(constrained.y - target)
        if (d < bestDist) { bestDist = d; bestY = target }
      }
    }
    return { x: constrained.x, y: bestY }
  }
}

export interface EdgeSnapResult {
  x: number          // snapped top-left x in feet
  y: number          // snapped top-left y in feet
  snapX: boolean
  snapY: boolean
  guideX?: number    // feet: draw a vertical guide here when snapX
  guideY?: number    // feet: draw a horizontal guide here when snapY
}

/**
 * Snaps the edges of a dragged element to the edges of other elements.
 * Checks left/right edges on X and top/bottom edges on Y independently.
 * Falls back to the original position on each axis if no snap is within threshold.
 */
export function snapElementEdges(
  el: { x: number; y: number; width: number; height: number },
  others: PlacedElement[],
  thresholdFt: number,
  excludeId?: string
): EdgeSnapResult {
  let bestDX = 0, bestDY = 0
  let bestDistX = thresholdFt, bestDistY = thresholdFt
  let snapX = false, snapY = false
  let guideX: number | undefined, guideY: number | undefined

  const elLeft   = el.x
  const elRight  = el.x + el.width
  const elTop    = el.y
  const elBottom = el.y + el.height

  for (const other of others) {
    if (excludeId && other.id === excludeId) continue

    const oLeft   = other.x
    const oRight  = other.x + other.width
    const oTop    = other.y
    const oBottom = other.y + other.height

    // X-axis: drag element's left or right edge vs other's left or right edge
    for (const elEdge of [elLeft, elRight]) {
      for (const target of [oLeft, oRight]) {
        const d = Math.abs(target - elEdge)
        if (d < bestDistX) {
          bestDistX = d
          bestDX = target - elEdge
          snapX = true
          guideX = target
        }
      }
    }

    // Y-axis: drag element's top or bottom edge vs other's top or bottom edge
    for (const elEdge of [elTop, elBottom]) {
      for (const target of [oTop, oBottom]) {
        const d = Math.abs(target - elEdge)
        if (d < bestDistY) {
          bestDistY = d
          bestDY = target - elEdge
          snapY = true
          guideY = target
        }
      }
    }
  }

  return { x: el.x + bestDX, y: el.y + bestDY, snapX, snapY, guideX, guideY }
}
