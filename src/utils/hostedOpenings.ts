import type { PlacedElement } from '../types'
import { WALL_BLOX_IDS, OPENING_BLOX_IDS } from '../blox/definitions'

// The stored rectangle remains the editable wall. Only derived display geometry
// is split, so removing an opening restores its host without reconstructing it.
export function wallFrame(wall: PlacedElement) {
  const vertical = wall.height > wall.width
  const length = vertical ? wall.height : wall.width
  const thickness = vertical ? wall.width : wall.height
  const angle = ((wall.rotation ?? 0) + (vertical ? 90 : 0)) * Math.PI / 180
  return { vertical, length, thickness, ux: Math.cos(angle), uy: Math.sin(angle),
    cx: wall.x + wall.width / 2, cy: wall.y + wall.height / 2 }
}

export function hostOpening(opening: PlacedElement, wall: PlacedElement): PlacedElement {
  if (!OPENING_BLOX_IDS.has(opening.bloxId) || !WALL_BLOX_IDS.has(wall.bloxId)) return opening
  const f = wallFrame(wall)
  const dx = opening.x + opening.width / 2 - f.cx
  const dy = opening.y + opening.height / 2 - f.cy
  return positionOpening({ ...opening, wallHost: {
    wallId: wall.id, offset: dx * f.ux + dy * f.uy + f.length / 2,
  } }, wall)
}

export function positionOpening(opening: PlacedElement, wall: PlacedElement): PlacedElement {
  const f = wallFrame(wall)
  const span = Math.max(opening.width, opening.height)
  // Do not silently resize a doorway to make an invalid host edit fit.
  if (span > f.length + 1e-8) throw new Error('Opening is wider than its host wall.')
  const offset = Math.max(span / 2, Math.min(f.length - span / 2, opening.wallHost!.offset))
  const cx = f.cx + (offset - f.length / 2) * f.ux
  const cy = f.cy + (offset - f.length / 2) * f.uy
  const width = f.vertical ? f.thickness : span
  const height = f.vertical ? span : f.thickness
  return { ...opening, x: cx - width / 2, y: cy - height / 2,
    width, height, rotation: wall.rotation,
    wallHost: { wallId: wall.id, offset } }
}

/** Reconcile every mutation, including nudges, alignment, and group transforms. */
export function reconcileOpenings(previous: PlacedElement[], next: PlacedElement[]): PlacedElement[] {
  const old = new Map(previous.map(el => [el.id, el]))
  const walls = new Map(next.filter(el => WALL_BLOX_IDS.has(el.bloxId)).map(el => [el.id, el]))
  return next.map(el => {
    if (!el.wallHost) return el
    const wall = walls.get(el.wallHost.wallId)
    // Deleting a host also deletes its hosted openings as part of the same edit.
    if (!wall) return null
    const before = old.get(el.id)
    const oldWall = old.get(wall.id)
    const wallMoved = oldWall && (oldWall.x !== wall.x || oldWall.y !== wall.y ||
      oldWall.width !== wall.width || oldWall.height !== wall.height || oldWall.rotation !== wall.rotation)
    const openingMoved = before && (before.x !== el.x || before.y !== el.y)
    return openingMoved && !wallMoved ? hostOpening(el, wall) : positionOpening(el, wall)
  }).filter((el): el is PlacedElement => el !== null)
}

/** Local rectangles, before the wall's own rotation and translation. Union the
 * cuts before subtracting: overlapping openings must never refill a wall. */
export function wallSolidRects(wall: PlacedElement, elements: PlacedElement[]) {
  const f = wallFrame(wall)
  const cuts = elements.filter(el => el.wallHost?.wallId === wall.id).map(el => {
    const half = Math.max(el.width, el.height) / 2
    return [Math.max(0, el.wallHost!.offset - half), Math.min(f.length, el.wallHost!.offset + half)]
  }).sort((a, b) => a[0] - b[0])
  const intervals: number[][] = []
  let cursor = 0
  for (const [start, end] of cuts) {
    if (start > cursor) intervals.push([cursor, start])
    cursor = Math.max(cursor, end)
  }
  if (cursor < f.length) intervals.push([cursor, f.length])
  return intervals.map(([start, end]) => f.vertical
    ? { x: 0, y: start, width: f.thickness, height: end - start }
    : { x: start, y: 0, width: end - start, height: f.thickness })
}

/** World-space pieces for exports and outline generation; never persisted. */
export function wallDisplayPieces(wall: PlacedElement, elements: PlacedElement[]): PlacedElement[] {
  const angle = wall.rotation * Math.PI / 180
  return wallSolidRects(wall, elements).map((r, i) => {
    const dx = r.x + r.width / 2 - wall.width / 2
    const dy = r.y + r.height / 2 - wall.height / 2
    return { ...wall, id: `${wall.id}:solid:${i}`,
      x: wall.x + wall.width / 2 + dx * Math.cos(angle) - dy * Math.sin(angle) - r.width / 2,
      y: wall.y + wall.height / 2 + dx * Math.sin(angle) + dy * Math.cos(angle) - r.height / 2,
      width: r.width, height: r.height }
  })
}
