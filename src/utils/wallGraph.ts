import { PlacedElement } from '../types'

const WALL_IDS = new Set(['wall-exterior', 'wall-interior', 'wall-cmu', 'wall-glazing', 'wall-fire-1hr', 'wall-fire-2hr'])

// Two endpoints are "connected" if within this distance (covers corner overlaps ~0.35ft)
const CONN_THRESHOLD = 0.9

interface Pt { x: number; y: number }

function dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y) }

// Returns whether point p lies on the body of wall w (not just near endpoints)
function ptOnWallBody(p: Pt, w: PlacedElement, tol = 0.6): boolean {
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

      for (const [ea, eb] of pairs) {
        if (dist(a[ea], b[eb]) < CONN_THRESHOLD) {
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
