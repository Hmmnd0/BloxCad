import type { PlacedElement, Layer } from '../types'
import { WALL_BLOX_IDS } from '../blox/definitions'
import { wallFrame, reconcileOpenings } from './hostedOpenings'

export interface WallPoint { x: number; y: number }
export type WallEnd = 'start' | 'end'
const END_TOLERANCE = 1e-5
export function wallEndpoints(wall: PlacedElement) {
  const f = wallFrame(wall)
  // Legacy orthogonal tool pads its ends; the diagonal tool does not.
  const padding = wall.wallEndPadding ?? (wall.rotation === 0 ? f.thickness / 2 : 0)
  const half = Math.max(0, f.length / 2 - padding)
  return { start: { x: f.cx - half * f.ux, y: f.cy - half * f.uy },
    end: { x: f.cx + half * f.ux, y: f.cy + half * f.uy }, padding }
}

function wallFromEndpoints(wall: PlacedElement, start: WallPoint, end: WallPoint): PlacedElement {
  const { padding } = wallEndpoints(wall)
  const dx = end.x - start.x, dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < 0.25) throw new Error('A connected wall would be shorter than 3 inches.')
  const width = length + padding * 2, height = wallFrame(wall).thickness
  if (width <= height) throw new Error('A connected wall would be shorter than its thickness.')
  return { ...wall, x: (start.x + end.x - width) / 2, y: (start.y + end.y - height) / 2,
    width, height, rotation: Math.atan2(dy, dx) * 180 / Math.PI, wallEndPadding: padding }
}

/** Propagate exact endpoint-to-body contacts through a directed dependency graph.
 * Each attachment retains its fraction along the host, not a world coordinate.
 * Ambiguous/cyclic constraints are rejected instead of choosing a host by order. */
export function followTJunctions(previous: PlacedElement[], next: PlacedElement[], layers: Layer[]): PlacedElement[] {
  const walls = previous.filter(w => WALL_BLOX_IDS.has(w.bloxId))
  const result = new Map(next.map(w => [w.id, w]))
  const attachments = new Map<string, { end: WallEnd; host: string; fraction: number }[]>()
  for (const branch of walls) {
    const ends = wallEndpoints(branch)
    for (const end of ['start', 'end'] as const) {
      for (const host of walls) {
        if (host.id === branch.id) continue
        const h = wallEndpoints(host)
        const dx = h.end.x - h.start.x, dy = h.end.y - h.start.y
        const length2 = dx * dx + dy * dy
        if (length2 < 1e-8) continue
        const fraction = ((ends[end].x - h.start.x) * dx + (ends[end].y - h.start.y) * dy) / length2
        if (fraction <= END_TOLERANCE || fraction >= 1 - END_TOLERANCE) continue
        if (Math.hypot(ends[end].x - h.start.x - fraction * dx, ends[end].y - h.start.y - fraction * dy) > END_TOLERANCE) continue
        const list = attachments.get(branch.id) ?? []
        list.push({ end, host: host.id, fraction })
        attachments.set(branch.id, list)
      }
    }
  }
  const done = new Set<string>(), visiting = new Set<string>()
  const affected = new Set(walls.filter(w => {
    const n = result.get(w.id)
    return n && (n.x !== w.x || n.y !== w.y || n.width !== w.width || n.height !== w.height || n.rotation !== w.rotation)
  }).map(w => w.id))
  for (let grew = true; grew;) {
    grew = false
    for (const [id, links] of attachments) {
      if (!affected.has(id) && links.some(link => affected.has(link.host))) { affected.add(id); grew = true }
    }
  }
  const resolve = (id: string) => {
    if (done.has(id) || !affected.has(id)) return
    if (visiting.has(id)) throw new Error('This wall junction has cyclic attachments; separate the junction before editing.')
    visiting.add(id)
    const current = result.get(id)
    if (!current) { visiting.delete(id); done.add(id); return }
    const ends = wallEndpoints(current)
    const targets = new Map<WallEnd, WallPoint>()
    for (const attachment of attachments.get(id) ?? []) {
      resolve(attachment.host)
      const host = result.get(attachment.host)
      if (!host) continue
      const h = wallEndpoints(host)
      const target = { x: h.start.x + attachment.fraction * (h.end.x - h.start.x),
        y: h.start.y + attachment.fraction * (h.end.y - h.start.y) }
      if (!affected.has(attachment.host) && Math.hypot(target.x - ends[attachment.end].x, target.y - ends[attachment.end].y) > END_TOLERANCE) {
        throw new Error('This endpoint is attached to a host wall. Edit the host corner instead.')
      }
      const existing = targets.get(attachment.end)
      if (existing && Math.hypot(existing.x - target.x, existing.y - target.y) > END_TOLERANCE) {
        throw new Error('This partition is attached to conflicting host walls.')
      }
      targets.set(attachment.end, target)
    }
    const start = targets.get('start') ?? ends.start, end = targets.get('end') ?? ends.end
    if (Math.hypot(start.x - ends.start.x, start.y - ends.start.y) > END_TOLERANCE ||
        Math.hypot(end.x - ends.end.x, end.y - ends.end.y) > END_TOLERANCE) {
      const locked = (w: PlacedElement) => w.locked || layers.some(l => l.id === w.layerId && l.locked)
      if (locked(current) || previous.some(w => w.wallHost?.wallId === id && locked(w))) {
        throw new Error('Unlock attached partitions and their openings before moving this wall.')
      }
      result.set(id, wallFromEndpoints(current, start, end))
    }
    visiting.delete(id); done.add(id)
  }
  for (const wall of walls) resolve(wall.id)
  return next.map(w => result.get(w.id)!)
}

/** Exact junction edits, not the generous proximity heuristic used by DRC. */
export function moveWallJunction(elements: PlacedElement[], layers: Layer[], wallId: string, end: WallEnd, target: WallPoint): PlacedElement[] {
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) throw new Error('Invalid corner position.')
  const source = elements.find(e => e.id === wallId && WALL_BLOX_IDS.has(e.bloxId))
  if (!source) throw new Error('Wall not found.')
  const origin = wallEndpoints(source)[end]
  if (Math.hypot(target.x - origin.x, target.y - origin.y) < 1e-8) return elements
  const locked = (el: PlacedElement) => el.locked || layers.some(l => l.id === el.layerId && l.locked)
  const next = elements.map(wall => {
    if (!WALL_BLOX_IDS.has(wall.bloxId)) return wall
    const ends = wallEndpoints(wall)
    const matches = (p: WallPoint) => Math.hypot(p.x - origin.x, p.y - origin.y) < 1e-5
    const startMatch = matches(ends.start), endMatch = matches(ends.end)
    if (!startMatch && !endMatch) return wall
    if (locked(wall) || elements.some(e => e.wallHost?.wallId === wall.id && locked(e))) {
      throw new Error('Unlock connected walls and their openings before moving this corner.')
    }
    const start = startMatch ? target : ends.start, finish = endMatch ? target : ends.end
    const dx = finish.x - start.x, dy = finish.y - start.y
    const length = Math.hypot(dx, dy)
    if (length < 0.25) throw new Error('A connected wall would be shorter than 3 inches.')
    const f = wallFrame(wall)
    const width = length + ends.padding * 2, height = f.thickness
    if (width <= height) throw new Error('A connected wall would be shorter than its thickness.')
    return { ...wall, x: (start.x + finish.x - width) / 2, y: (start.y + finish.y - height) / 2,
      width, height, rotation: Math.atan2(dy, dx) * 180 / Math.PI, wallEndPadding: ends.padding }
  })
  return reconcileOpenings(elements, followTJunctions(elements, next, layers))
}
