import { PlacedElement } from '../types'
import { WALL_BLOX_IDS } from '../blox/definitions'
import { getWallTrim } from './wallGraph'
import { wallFrame } from './hostedOpenings'
import { wallEndpoints } from './wallJunctions'
import { JOINED_WALLS } from './wallUnion'

interface Point { x: number; y: number }

/** Start on a centerline, or intersect it without breaking an orthogonal run. */
export function snapWallCenterline(cursor: Point, elements: PlacedElement[], threshold: number, start?: Point): Point | null {
  let best: Point | null = null, distance = threshold
  for (const wall of elements) {
    if (!WALL_BLOX_IDS.has(wall.bloxId)) continue
    const ends = wallEndpoints(wall)
    const dx = ends.end.x - ends.start.x, dy = ends.end.y - ends.start.y
    const length2 = dx * dx + dy * dy
    if (length2 < 1e-8) continue
    let t: number
    if (start) {
      const horizontal = Math.abs(cursor.x - start.x) >= Math.abs(cursor.y - start.y)
      if (Math.abs(horizontal ? dy : dx) < 1e-8) continue
      t = horizontal ? (cursor.y - ends.start.y) / dy : (cursor.x - ends.start.x) / dx
      if (t < -1e-8 || t > 1 + 1e-8) continue
    } else {
      t = Math.max(0, Math.min(1, ((cursor.x - ends.start.x) * dx + (cursor.y - ends.start.y) * dy) / length2))
    }
    const point = { x: ends.start.x + t * dx, y: ends.start.y + t * dy }
    const d = Math.hypot(cursor.x - point.x, cursor.y - point.y)
    if (d < distance) { best = point; distance = d }
  }
  return best
}

// Walls are stored extended by half their own thickness past both ends
// unconditionally (so corners overlap correctly) — snapping a new element to
// a wall's *raw* stored edge lands it half-a-thickness past where the wall
// actually looks like it ends, which is exactly what makes two blox refuse to
// sit flush against each other. This computes each wall's true (trimmed)
// bounds once per call and is reused by every snap helper below instead of
// each one reading el.x/width directly. Non-wall elements are untouched.
// Only axis-aligned (non-rotated) walls are corrected — same scope as the
// wall-outline rendering fix.
//
// The trim is unconditional (not "only if this end already touches another
// wall") deliberately: while you're drawing a *new* wall to snap against an
// *existing* one, that existing wall isn't connected to anything yet, so a
// connection-gated trim would report zero and snap to the raw padded edge —
// the exact bug this is fixing. See getWallTrim in wallGraph.ts.
export function trueWallBoundsMap(elements: PlacedElement[]): Map<string, { x: number; y: number; width: number; height: number }> {
  const result = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const w of elements) {
    // Continuous wall regions render the complete solid, including end caps.
    // Legacy centerline padding is not an invisible selection-box margin.
    if (JOINED_WALLS.has(w.bloxId)) continue
    if (!WALL_BLOX_IDS.has(w.bloxId) || (w.rotation ?? 0) % 180 !== 0) continue
    const { startTrim, endTrim } = getWallTrim(w)
    if (startTrim === 0 && endTrim === 0) continue
    const isHoriz = w.width >= w.height
    result.set(w.id, isHoriz
      ? { x: w.x + startTrim, y: w.y, width: w.width - startTrim - endTrim, height: w.height }
      : { x: w.x, y: w.y + startTrim, width: w.width, height: w.height - startTrim - endTrim })
  }
  return result
}

export function trueBounds<T extends { id?: string; x: number; y: number; width: number; height: number }>(
  el: T,
  trueWalls: Map<string, { x: number; y: number; width: number; height: number }>
): { x: number; y: number; width: number; height: number } {
  return (el.id && trueWalls.get(el.id)) || el
}

// Doors that actually swing a leaf into the room and need clear floor space
// in front of them. Sliding/pocket/bifold/garage doors don't sweep floor
// area the same way, and cased openings have no leaf at all.
const DOOR_SWING_BLOX_IDS: ReadonlySet<string> = new Set(['door-single', 'door-double'])

export interface ClearanceZone {
  x: number; y: number; width: number; height: number
  openingId: string
}

/**
 * Computes a swing-clearance rectangle for every swinging door in the given
 * elements. The data model doesn't track which side of the wall a door
 * swings toward, so the zone is symmetric — it extends onto both faces of
 * the wall by the opening's clear width (the standard rule-of-thumb swing
 * radius). That over-covers real clearance requirements slightly but never
 * under-covers, which is the right bias for a "don't block this door" check.
 */
export function getDoorClearanceZones(elements: PlacedElement[]): ClearanceZone[] {
  const zones: ClearanceZone[] = []
  for (const el of elements) {
    if (!DOOR_SWING_BLOX_IDS.has(el.bloxId)) continue
    const isHoriz = el.width > el.height
    const swing = isHoriz ? el.width : el.height
    zones.push(
      isHoriz
        ? { x: el.x, y: el.y - swing, width: el.width, height: el.height + swing * 2, openingId: el.id }
        : { x: el.x - swing, y: el.y, width: el.width + swing * 2, height: el.height, openingId: el.id }
    )
  }
  return zones
}

/**
 * If el's box intersects any clearance zone, returns a new position pushed
 * the minimum distance out of that zone (the standard AABB minimum-
 * translation resolution: try left/right/up/down, take whichever is
 * cheapest). Runs the zones sequentially, so a position freed from one zone
 * is then checked against the rest. Returns the original position and no
 * `blockedBy` if nothing intersects.
 */
export function pushOutOfClearanceZones(
  el: { x: number; y: number; width: number; height: number },
  zones: ClearanceZone[]
): { x: number; y: number; blockedBy: string[] } {
  let x = el.x, y = el.y
  const blockedBy: string[] = []

  for (const zone of zones) {
    const elLeft = x, elRight = x + el.width, elTop = y, elBottom = y + el.height
    const zLeft = zone.x, zRight = zone.x + zone.width, zTop = zone.y, zBottom = zone.y + zone.height

    const overlapsX = elLeft < zRight && elRight > zLeft
    const overlapsY = elTop < zBottom && elBottom > zTop
    if (!overlapsX || !overlapsY) continue

    const moveLeft = elRight - zLeft
    const moveRight = zRight - elLeft
    const moveUp = elBottom - zTop
    const moveDown = zBottom - elTop
    const minMove = Math.min(moveLeft, moveRight, moveUp, moveDown)

    if (minMove === moveLeft) x -= moveLeft
    else if (minMove === moveRight) x += moveRight
    else if (minMove === moveUp) y -= moveUp
    else y += moveDown

    blockedBy.push(zone.openingId)
  }

  return { x, y, blockedBy }
}

/**
 * True axis-aligned bounding box of an element in feet, accounting for rotation.
 * Elements store their unrotated width/height plus a rotation in degrees — only
 * "linear" blox (walls, some details) bake 90°/270° rotation into swapped w/h
 * and reset rotation to 0 (see rotateSelected in useStore.ts). Everything else
 * (furniture, fixtures, most annotations) keeps its stored width/height and
 * rotates visually via Konva, so its true screen footprint differs from
 * el.width/el.height whenever rotation isn't a multiple of 360.
 */
export function getElementAABB(
  el: { x: number; y: number; width: number; height: number; rotation?: number }
): { x: number; y: number; width: number; height: number } {
  const rotation = el.rotation ?? 0
  if (rotation % 180 === 0) return { x: el.x, y: el.y, width: el.width, height: el.height }
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const rad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const aabbW = el.width * cos + el.height * sin
  const aabbH = el.width * sin + el.height * cos
  return { x: cx - aabbW / 2, y: cy - aabbH / 2, width: aabbW, height: aabbH }
}


export interface WallSnapResult {
  rotation?: number
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
  const walls = elements.filter(el => WALL_BLOX_IDS.has(el.bloxId) && !el.locked)

  let best: WallSnapResult | null = null
  let bestDist = thresholdFt

  for (const wall of walls) {
    if (wall.rotation) {
      const f = wallFrame(wall)
      if (openingDefaultWidth > f.length) continue
      const dx = cursorFt.x - f.cx, dy = cursorFt.y - f.cy
      const along = dx * f.ux + dy * f.uy
      const dist = Math.abs(dx * f.uy - dy * f.ux)
      if (dist >= bestDist || Math.abs(along) > f.length / 2 + 0.1) continue
      const t = Math.max(-(f.length - openingDefaultWidth) / 2, Math.min((f.length - openingDefaultWidth) / 2, along))
      const width = f.vertical ? f.thickness : openingDefaultWidth
      const height = f.vertical ? openingDefaultWidth : f.thickness
      bestDist = dist
      best = { x: f.cx + t * f.ux - width / 2, y: f.cy + t * f.uy - height / 2,
        widthOverride: width, heightOverride: height, wallId: wall.id, rotation: wall.rotation }
      continue
    }
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
 * Rotates actual corners and midpoints, never the enclosing selection box.
 */
export function getElementSnapPoints(elements: PlacedElement[]): Point[] {
  const trueWalls = trueWallBoundsMap(elements)
  const pts: Point[] = []
  for (const el of elements) {
    const trimmed = trueBounds(el, trueWalls)
    const { x, y, width, height } = trimmed
    const r = x + width
    const b = y + height
    const mx = x + width / 2
    const my = y + height / 2
    const local = [
      { x, y },           // top-left
      { x: r, y },        // top-right
      { x, y: b },        // bottom-left
      { x: r, y: b },     // bottom-right
      { x: mx, y },       // top-mid
      { x: mx, y: b },    // bottom-mid
      { x, y: my },       // left-mid
      { x: r, y: my }     // right-mid
    ]
    const angle = (el.rotation ?? 0) * Math.PI / 180
    pts.push(...local.map(p => ({
      x: mx + (p.x - mx) * Math.cos(angle) - (p.y - my) * Math.sin(angle),
      y: my + (p.x - mx) * Math.sin(angle) + (p.y - my) * Math.cos(angle),
    })))
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
  const trueWalls = trueWallBoundsMap(elements)

  if (isHoriz) {
    let bestX = constrained.x
    let bestDist = thresholdFt
    for (const el of elements) {
      const b = trueBounds(el, trueWalls)
      for (const target of [b.x, b.x + b.width]) {
        const d = Math.abs(constrained.x - target)
        if (d < bestDist) { bestDist = d; bestX = target }
      }
    }
    return { x: bestX, y: constrained.y }
  } else {
    let bestY = constrained.y
    let bestDist = thresholdFt
    for (const el of elements) {
      const b = trueBounds(el, trueWalls)
      for (const target of [b.y, b.y + b.height]) {
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
  el: { id?: string; bloxId?: string; rotation?: number; x: number; y: number; width: number; height: number },
  others: PlacedElement[],
  thresholdFt: number,
  excludeId?: string
): EdgeSnapResult {
  let bestDX = 0, bestDY = 0
  let bestDistX = thresholdFt, bestDistY = thresholdFt
  let snapX = false, snapY = false
  let guideX: number | undefined, guideY: number | undefined

  const asElement = { ...el, id: el.id ?? '', bloxId: el.bloxId ?? '', rotation: el.rotation ?? 0, properties: {}, locked: false }
  const moving = getElementSnapPoints([asElement])
  // Only real horizontal/vertical faces participate in axis edge alignment.
  // Oblique geometry remains available through point snapping, not phantom
  // edges of its axis-aligned selection envelope.
  if (Math.abs((el.rotation ?? 0) % 90) > 1e-8) {
    let distance = thresholdFt
    let match: { dx: number; dy: number; target: Point } | undefined
    for (const target of getElementSnapPoints(others.filter(o => o.id !== excludeId))) {
      for (const point of moving) {
        const dx = target.x - point.x, dy = target.y - point.y
        const d = Math.hypot(dx, dy)
        if (d < distance) { distance = d; match = { dx, dy, target } }
      }
    }
    return match ? { x: el.x + match.dx, y: el.y + match.dy, snapX: true, snapY: true,
      guideX: match.target.x, guideY: match.target.y }
      : { x: el.x, y: el.y, snapX: false, snapY: false }
  }
  const elLeft = Math.min(...moving.map(p => p.x)), elRight = Math.max(...moving.map(p => p.x))
  const elTop = Math.min(...moving.map(p => p.y)), elBottom = Math.max(...moving.map(p => p.y))

  for (const other of others) {
    if (excludeId && other.id === excludeId) continue
    if (Math.abs((other.rotation ?? 0) % 90) > 1e-8) continue
    const points = getElementSnapPoints([other])
    const oLeft = Math.min(...points.map(p => p.x)), oRight = Math.max(...points.map(p => p.x))
    const oTop = Math.min(...points.map(p => p.y)), oBottom = Math.max(...points.map(p => p.y))

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
