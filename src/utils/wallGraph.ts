import { PlacedElement } from '../types'
import { WALL_BLOX_IDS as WALL_IDS } from '../blox/definitions'

// Baseline endpoint-connection distance, sized for thin walls (~0.35ft corner
// overlap on a 0.5-0.667ft wall). Thicker walls (e.g. wall-cmu-footing at
// 1.667ft) legitimately have wider corner-overlap endpoint gaps — see
// connectionThreshold below, which scales this up per wall-pair.
const CONN_THRESHOLD = 0.9

interface Pt { x: number; y: number }

function dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y) }

// A wall's own thickness (its short dimension) sets how far its stored
// endpoint sits from the true corner point once extended for a miter — so
// the connection threshold for a pair must scale with the thicker of the two,
// or wide walls (like a footing band) get flagged as "open" at corners that
// render perfectly joined.
function connectionThreshold(wa: PlacedElement, wb: PlacedElement): number {
  const thicknessA = Math.min(wa.width, wa.height)
  const thicknessB = Math.min(wb.width, wb.height)
  return Math.max(CONN_THRESHOLD, thicknessA * 1.5, thicknessB * 1.5)
}

// Returns whether point p lies on the body of wall w (not just near endpoints).
// tol must comfortably cover w's own half-thickness — a wall butting into a
// thick wall (e.g. a T-junction into a footing band) lands its endpoint up to
// half of w's thickness away from w's centerline, not right on it.
function ptOnWallBody(p: Pt, w: PlacedElement, tol = Math.max(0.6, Math.min(w.width, w.height) / 2 + 0.1)): boolean {
  const isH = w.width >= w.height
  if (isH) {
    return Math.abs(p.y - (w.y + w.height / 2)) < tol &&
           p.x > w.x + tol && p.x < w.x + w.width - tol
  } else {
    return Math.abs(p.x - (w.x + w.width / 2)) < tol &&
           p.y > w.y + tol && p.y < w.y + w.height - tol
  }
}

export interface WallNode {
  id: string
  type: string
  orientation: 'horizontal' | 'vertical'
  start: Pt
  end: Pt
  lengthFt: number
  connections: { start: string[]; end: string[] }
  openEnds: ('start' | 'end')[]
}

export interface WallGap {
  wallId: string
  end: 'start' | 'end'
  point: Pt
  nearestWallId?: string    // closest wall this could connect to
  nearestEndpoint?: Pt      // the endpoint on that wall
  gapFt: number             // distance to nearest candidate (Infinity if none found)
}

export interface WallGraph {
  walls: WallNode[]
  gaps: WallGap[]
  summary: {
    totalWalls: number
    exteriorCount: number
    interiorCount: number
    openEndCount: number
    closedLoops: boolean    // true if every wall endpoint has at least one connection
  }
}

export function buildWallGraph(elements: PlacedElement[]): WallGraph {
  const walls = elements.filter(el => WALL_IDS.has(el.bloxId))

  // 1. Compute endpoints for each wall
  const nodes: WallNode[] = walls.map(w => {
    const isH = w.width >= w.height
    const start: Pt = isH
      ? { x: w.x,           y: w.y + w.height / 2 }
      : { x: w.x + w.width / 2, y: w.y }
    const end: Pt = isH
      ? { x: w.x + w.width, y: w.y + w.height / 2 }
      : { x: w.x + w.width / 2, y: w.y + w.height }
    return {
      id: w.id,
      type: w.bloxId,
      orientation: isH ? 'horizontal' : 'vertical',
      start,
      end,
      lengthFt: Math.round((isH ? w.width : w.height) * 10) / 10,
      connections: { start: [], end: [] },
      openEnds: [],
    }
  })

  // 2. Build connections: endpoint–endpoint and T-junction
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const wa = walls[i], wb = walls[j]

      const pairs: Array<['start' | 'end', 'start' | 'end']> = [
        ['start', 'start'], ['start', 'end'],
        ['end',   'start'], ['end',   'end'],
      ]

      const threshold = connectionThreshold(wa, wb)
      for (const [ea, eb] of pairs) {
        if (dist(a[ea], b[eb]) < threshold) {
          if (!a.connections[ea].includes(b.id)) a.connections[ea].push(b.id)
          if (!b.connections[eb].includes(a.id)) b.connections[eb].push(a.id)
        }
      }

      // T-junction: endpoint of A on body of B
      for (const ea of ['start', 'end'] as const) {
        if (ptOnWallBody(a[ea], wb)) {
          if (!a.connections[ea].includes(b.id)) a.connections[ea].push(b.id)
          if (!b.connections.start.includes(a.id) && !b.connections.end.includes(a.id)) {
            // Attach to the nearer endpoint of B for bookkeeping
            const toStart = dist(a[ea], b.start)
            const toEnd   = dist(a[ea], b.end)
            const side = toStart < toEnd ? 'start' : 'end'
            b.connections[side].push(a.id)
          }
        }
        if (ptOnWallBody(b[ea], wa)) {
          if (!b.connections[ea].includes(a.id)) b.connections[ea].push(a.id)
          if (!a.connections.start.includes(b.id) && !a.connections.end.includes(b.id)) {
            const toStart = dist(b[ea], a.start)
            const toEnd   = dist(b[ea], a.end)
            const side = toStart < toEnd ? 'start' : 'end'
            a.connections[side].push(b.id)
          }
        }
      }
    }
  }

  // 3. Determine open ends
  for (const n of nodes) {
    if (n.connections.start.length === 0) n.openEnds.push('start')
    if (n.connections.end.length   === 0) n.openEnds.push('end')
  }

  // 4. Build gap list with nearest candidate
  const gaps: WallGap[] = []
  for (const n of nodes) {
    for (const openEnd of n.openEnds) {
      const gapPt = n[openEnd]
      let bestDist = Infinity
      let bestWallId: string | undefined
      let bestPt: Pt | undefined

      for (const other of nodes) {
        if (other.id === n.id) continue
        for (const ep of ['start', 'end'] as const) {
          if (!other.openEnds.includes(ep)) continue  // only suggest connecting to another open end
          const d = dist(gapPt, other[ep])
          if (d < bestDist) {
            bestDist = d
            bestWallId = other.id
            bestPt = other[ep]
          }
        }
      }

      gaps.push({
        wallId: n.id,
        end: openEnd,
        point: gapPt,
        ...(bestWallId ? { nearestWallId: bestWallId, nearestEndpoint: bestPt, gapFt: Math.round(bestDist * 10) / 10 } : { gapFt: Infinity }),
      })
    }
  }

  const openEndCount = nodes.reduce((s, n) => s + n.openEnds.length, 0)

  return {
    walls: nodes,
    gaps,
    summary: {
      totalWalls: nodes.length,
      exteriorCount: nodes.filter(n => n.type === 'wall-exterior').length,
      interiorCount: nodes.filter(n => n.type === 'wall-interior').length,
      openEndCount,
      closedLoops: openEndCount === 0,
    },
  }
}

// A wall is stored extended by half its own thickness past *both* endpoints,
// unconditionally, at the moment it's placed (see place_wall / the wall tool
// in DrawingCanvas.tsx) — regardless of whether that end happens to touch
// another wall yet. That's what lets two perpendicular walls overlap
// correctly at a corner. It also means the raw stored width/height is always
// longer than the wall's true drawn length by half-thickness per end.
//
// An earlier version of this only trimmed an end back when it could detect a
// real connection there via the wall graph — which sounds more conservative,
// but is wrong for the case that actually matters: while you're drawing a
// *new* wall to snap against an *existing* one, that existing wall isn't
// connected to anything yet, so the conditional version reported zero trim
// and snapping targeted the raw padded edge (the "snaps to the selection box,
// not the wall" bug). Since the padding is unconditional at draw time, the
// un-padding has to be unconditional too — no wall-graph lookup needed.
export function getWallTrim(wall: PlacedElement): { startTrim: number; endTrim: number } {
  const halfThickness = wall.wallEndPadding ?? Math.min(wall.width, wall.height) / 2
  return { startTrim: halfThickness, endTrim: halfThickness }
}
