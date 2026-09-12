import React, { useMemo, useState, useRef, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PlacedElement } from '../../types'
import { reviewStraightStairs } from '../../utils/stairReview'

// ── Types ────────────────────────────────────────────────────────────────────

interface Violation {
  id: string
  severity: 'error' | 'warning'
  message: string
  elementId?: string
  status?: 'unverified' | 'measured'
  referenceUrl?: string
  // Present only for violations with an unambiguous, safe mechanical remedy
  // (placing a missing required element, converting an outlet to GFCI,
  // nudging an obstruction clear of required clearance). Violations that
  // need design judgment (setbacks, room sizing, bath ratio, generic
  // overlaps) intentionally have no fix — there's no single correct
  // automatic answer for those.
  fix?: () => void
}

interface RoomInfo {
  id: string
  name: string
  center: { x: number; y: number }
  bounds: { left: number; top: number; right: number; bottom: number }
  area: number  // sq ft (interior dimensions)
}

// ── Constants ────────────────────────────────────────────────────────────────

const MIN_DOOR_WIDTH_FT    = 2.0    // 24" — practical lower bound (IRC has no interior door minimum for SFR)
const MIN_EGRESS_WIDTH_FT  = 3.0    // 36" — practical egress
const MIN_STAIR_WIDTH_FT   = 3.0    // IRC R311.7
const MIN_HALLWAY_WIDTH_FT = 3.0    // IRC R311.4
const IRC_MIN_ROOM_AREA    = 70     // R304.1 sq ft
const IRC_MIN_ROOM_DIM     = 7      // R304.2 ft
const IRC_EGRESS_WIN_WIDTH = 1.667  // R310 — 20" net clear min width
const MIN_LANDING_DEPTH_FT = 3.0    // IRC R311.7.6 — floor/landing ≥ 36" in direction of travel
// Generic placeholders — Marion Co. setbacks vary by dwelling district (D-1…D-8) and
// by front/side/rear; user should override each per parcel.
const DEFAULT_SETBACKS: { front: number; side: number; rear: number } = { front: 10, side: 10, rear: 10 }

// Room name classifiers
const NON_HABITABLE = /closet|garage|storage|utility|laundry|bath|hall|corridor|foyer|entry|porch|mechanical|pantry|mudroom|attic|vestibule/i
const BEDROOM_PAT   = /\bbed\b|\bbedroom|\bmaster bed|\bsleeping\b/i
const BATHROOM_PAT  = /\bbath\b|\btoilet\b|\bpowder\b|half.bath|\blav\b|\bwc\b/i
const KITCHEN_PAT   = /kitchen/i
const GARAGE_PAT    = /garage/i
const HALLWAY_PAT   = /\bhall\b|corridor/i
// Habitable rooms that additionally need natural light per R303.1 (bedrooms already covered by checkBedroomWindows)
const OTHER_HABITABLE_PAT = /living|family|dining|great\s*room|den|study|office|sunroom/i

// ── Geometry helpers ─────────────────────────────────────────────────────────

function overlaps(a: PlacedElement, b: PlacedElement): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x ||
           a.y + a.height <= b.y || b.y + b.height <= a.y)
}

// Like overlaps but counts edge-touching as overlap — needed for doors that sit
// exactly in the gap between two exterior wall stubs (edges share a coordinate).
function touchesOrOverlaps(a: PlacedElement, b: PlacedElement): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x ||
           a.y + a.height < b.y || b.y + b.height < a.y)
}

function ptInRoom(r: RoomInfo, pt: { x: number; y: number }): boolean {
  return pt.x > r.bounds.left  && pt.x < r.bounds.right &&
         pt.y > r.bounds.top   && pt.y < r.bounds.bottom
}

function elDist(a: PlacedElement, b: PlacedElement): number {
  return Math.hypot(
    (a.x + a.width  / 2) - (b.x + b.width  / 2),
    (a.y + a.height / 2) - (b.y + b.height / 2),
  )
}

// Moves `target` directly away from `blocker` until their centers are
// minDist + 0.5ft apart. Used by clearance-style fixes (electrical panel
// working space, mechanical equipment access) where "away from the thing
// that's too close" is the one unambiguous direction to move — as opposed
// to setback/overlap violations, which have no single correct fix and so
// get no `fix` callback at all.
function nudgeClear(target: PlacedElement, blocker: PlacedElement, minDist: number): void {
  const tcx = target.x + target.width / 2, tcy = target.y + target.height / 2
  const bcx = blocker.x + blocker.width / 2, bcy = blocker.y + blocker.height / 2
  let dx = tcx - bcx, dy = tcy - bcy
  const len = Math.hypot(dx, dy)
  if (len < 0.01) { dx = 1; dy = 0 } else { dx /= len; dy /= len }
  const dist = minDist + 0.5
  const newCx = bcx + dx * dist, newCy = bcy + dy * dist
  useStore.getState().updateElement(target.id, { x: newCx - target.width / 2, y: newCy - target.height / 2 })
}

// ── Room detection ────────────────────────────────────────────────────────────
//
// Strategy: ray-cast N/S/E/W from each room-label's center until we hit the
// nearest wall (or opening that fills a wall gap). Together these elements
// form the complete physical room boundary even after walls are split by doors
// and windows.

function detectRoomBounds(labels: PlacedElement[], elements: PlacedElement[]): RoomInfo[] {
  // Boundary elements = walls + openings (openings fill wall gaps after splitting)
  const boundary = elements.filter(el =>
    el.bloxId.startsWith('wall-') ||
    el.bloxId.startsWith('window-') ||
    el.bloxId.startsWith('door-') ||
    el.bloxId === 'cased-opening',
  )
  const hB = boundary.filter(w => w.width >= w.height)   // horizontal
  const vB = boundary.filter(w => w.height >  w.width)   // vertical

  return labels.map(label => {
    const cx = label.x + label.width  / 2
    const cy = label.y + label.height / 2

    // North: nearest H boundary above, x-span covers cx
    const above  = hB.filter(w => w.y + w.height <= cy + 0.1 && w.x <= cx && w.x + w.width >= cx)
    const topEl  = above.reduce<PlacedElement | null>(
      (best, w) => !best || w.y + w.height > best.y + best.height ? w : best, null)

    // South: nearest H boundary below, x-span covers cx
    const below  = hB.filter(w => w.y >= cy - 0.1 && w.x <= cx && w.x + w.width >= cx)
    const botEl  = below.reduce<PlacedElement | null>(
      (best, w) => !best || w.y < best.y ? w : best, null)

    // West: nearest V boundary left, y-span covers cy
    const leftOf = vB.filter(w => w.x + w.width <= cx + 0.1 && w.y <= cy && w.y + w.height >= cy)
    const leftEl = leftOf.reduce<PlacedElement | null>(
      (best, w) => !best || w.x + w.width > best.x + best.width ? w : best, null)

    // East: nearest V boundary right, y-span covers cy
    const rightOf = vB.filter(w => w.x >= cx - 0.1 && w.y <= cy && w.y + w.height >= cy)
    const rightEl = rightOf.reduce<PlacedElement | null>(
      (best, w) => !best || w.x < best.x ? w : best, null)

    const top    = topEl   ? topEl.y   + topEl.height   : cy - 6
    const bottom = botEl   ? botEl.y                    : cy + 6
    const left   = leftEl  ? leftEl.x  + leftEl.width   : cx - 6
    const right  = rightEl ? rightEl.x                  : cx + 6

    return {
      id:     label.id,
      name:   (label.properties?.roomName as string) || 'Room',
      center: { x: cx, y: cy },
      bounds: { left, top, right, bottom },
      area:   Math.max(0, (right - left) * (bottom - top)),
    }
  })
}

// ── Connectivity graph ────────────────────────────────────────────────────────
//
// For each opening, probe 0.6ft past each face of the opening to find which
// rooms it connects. 0.6ft clears exterior wall thickness (0.5ft) so we land
// cleanly in the interior space on each side.

function buildConnectivityGraph(
  rooms: RoomInfo[],
  openings: PlacedElement[],
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  for (const r of rooms) graph.set(r.id, new Set())

  for (const op of openings) {
    const isH = op.width >= op.height
    const ocx = op.x + op.width  / 2
    const ocy = op.y + op.height / 2
    const gap = 0.6

    // Step past the opening face into the space on each side
    const ptA = isH
      ? { x: ocx,             y: op.y - gap }
      : { x: op.x - gap,      y: ocy }
    const ptB = isH
      ? { x: ocx,             y: op.y + op.height + gap }
      : { x: op.x + op.width + gap, y: ocy }

    // Open-concept rooms (e.g. Kitchen/Dining/Living sharing one unwalled
    // volume) legitimately have identical bounds — every room-tag whose
    // bounds contain the probe point is genuinely reachable through this
    // opening, not just whichever tag happens to sit first in the array.
    const roomsA = rooms.filter(r => ptInRoom(r, ptA))
    const roomsB = rooms.filter(r => ptInRoom(r, ptB))

    for (const rA of roomsA) {
      for (const rB of roomsB) {
        if (rA.id === rB.id) continue
        graph.get(rA.id)!.add(rB.id)
        graph.get(rB.id)!.add(rA.id)
      }
    }
  }

  // Two room-tags whose bounds substantially overlap share the same open
  // floor with no wall between them (open-concept rooms, or a hallway/
  // circulation tag whose ray-cast bounds spill into a neighboring room) —
  // that's trivially connected, no door to probe. Door-probing alone can't
  // see this: it only forms edges at actual opening elements, so two spaces
  // separated by nothing at all (no wall, no door) would otherwise never
  // link up in the graph.
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].bounds, b = rooms[j].bounds
      const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (overlapW > 1 && overlapH > 1) {
        graph.get(rooms[i].id)!.add(rooms[j].id)
        graph.get(rooms[j].id)!.add(rooms[i].id)
      }
    }
  }
  return graph
}

// ── Check functions ───────────────────────────────────────────────────────────

// Every room needs ≥1 door. Every connected room must be reachable from
// the rest of the plan (one connected component).
function checkConnectivity(rooms: RoomInfo[], graph: Map<string, Set<string>>): Violation[] {
  if (rooms.length < 2) return []
  const v: Violation[] = []

  for (const r of rooms) {
    if ((graph.get(r.id)?.size ?? 0) === 0) {
      v.push({
        id: `no-door-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" has no door or opening — room is inaccessible`,
      })
    }
  }

  // BFS from first room that has any connections
  const connected = rooms.filter(r => (graph.get(r.id)?.size ?? 0) > 0)
  if (connected.length < 2) return v

  const visited = new Set([connected[0].id])
  const queue   = [connected[0].id]
  while (queue.length) {
    const cur = queue.shift()!
    for (const nb of graph.get(cur) ?? []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
    }
  }

  for (const r of connected) {
    if (!visited.has(r.id)) {
      v.push({
        id: `isolated-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" is not connected to the rest of the floor plan — check for missing doors`,
      })
    }
  }
  return v
}

// IRC R304: habitable rooms ≥ 70 SF, ≥ 7ft in any dimension
function checkRoomSizes(rooms: RoomInfo[]): Violation[] {
  const v: Violation[] = []
  for (const r of rooms) {
    if (NON_HABITABLE.test(r.name)) continue
    const rw = r.bounds.right - r.bounds.left
    const rh = r.bounds.bottom - r.bounds.top
    const minDim = Math.min(rw, rh)
    if (r.area < IRC_MIN_ROOM_AREA) {
      v.push({
        id: `room-small-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" is ${r.area.toFixed(0)} SF — IRC R304.1 requires ≥ 70 SF for habitable rooms`,
      })
    } else if (minDim < IRC_MIN_ROOM_DIM) {
      v.push({
        id: `room-narrow-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" is ${minDim.toFixed(1)}ft at its narrowest — IRC R304.2 requires ≥ 7ft`,
      })
    }
  }
  return v
}

// IRC R310: every sleeping room needs an operable egress window
// (min 20" net clear width — full egress check needs elevation data)
function checkBedroomWindows(rooms: RoomInfo[], windows: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const r of rooms.filter(r => BEDROOM_PAT.test(r.name))) {
    // Expand bounds by wall thickness so windows sitting ON the boundary wall
    // are detected (their centers fall just outside the strict interior bounds).
    const WALL = 0.6
    const roomWins = windows.filter(w => {
      const wx = w.x + w.width  / 2
      const wy = w.y + w.height / 2
      return wx > r.bounds.left  - WALL && wx < r.bounds.right  + WALL &&
             wy > r.bounds.top   - WALL && wy < r.bounds.bottom + WALL
    })
    if (roomWins.length === 0) {
      v.push({
        id: `bed-no-win-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" has no window — IRC R310 requires emergency egress opening in all sleeping rooms`,
      })
    } else if (!roomWins.some(w => Math.max(w.width, w.height) >= IRC_EGRESS_WIN_WIDTH)) {
      v.push({
        id: `bed-small-win-${r.id}`, severity: 'warning', elementId: r.id,
        message: `"${r.name}" window may be too small — IRC R310 requires ≥ 20" wide, ≥ 24" tall, ≥ 5.7 SF net clear`,
      })
    }
  }
  return v
}

// IRC R303.1: habitable rooms other than bedrooms (living, dining, family, den, office)
// need a window for natural light too — bedrooms are covered separately by checkBedroomWindows
// with the stricter R310 egress requirement.
function checkHabitableLight(rooms: RoomInfo[], windows: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const r of rooms.filter(r => OTHER_HABITABLE_PAT.test(r.name))) {
    const WALL = 0.6
    const roomWins = windows.filter(w => {
      const wx = w.x + w.width  / 2
      const wy = w.y + w.height / 2
      return wx > r.bounds.left  - WALL && wx < r.bounds.right  + WALL &&
             wy > r.bounds.top   - WALL && wy < r.bounds.bottom + WALL
    })
    if (roomWins.length === 0) {
      v.push({
        id: `light-no-win-${r.id}`, severity: 'warning', elementId: r.id,
        message: `"${r.name}" has no window — IRC R303.1 requires natural light ≥ 8% of floor area in habitable rooms`,
      })
    }
  }
  return v
}

// IRC R311.2: at least one egress door on an exterior wall
function checkEgressDoor(allDoors: PlacedElement[], walls: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  const extWalls = walls.filter(w => w.bloxId === 'wall-exterior')

  if (allDoors.length === 0 && walls.length > 0) {
    v.push({ id: 'no-egress', severity: 'error', message: 'No doors placed — egress path required' })
    return v
  }
  if (extWalls.length > 0 && !allDoors.some(d => extWalls.some(w => touchesOrOverlaps(d, w)))) {
    v.push({
      id: 'no-ext-door', severity: 'error',
      message: 'No door on an exterior wall — IRC R311.2 requires at least one egress door to the exterior',
    })
  }
  if (allDoors.length > 0 && !allDoors.some(d => Math.max(d.width, d.height) >= MIN_EGRESS_WIDTH_FT)) {
    v.push({
      id: 'no-egress-width', severity: 'error',
      message: `No egress-width door — at least one door must be ≥ 36" (IRC R311.2)`,
    })
  }
  for (const door of allDoors.filter(d => d.bloxId === 'door-single')) {
    if (Math.max(door.width, door.height) < MIN_DOOR_WIDTH_FT) {
      v.push({
        id: `door-narrow-${door.id}`, severity: 'warning', elementId: door.id,
        message: `Door is ${(Math.max(door.width, door.height) * 12).toFixed(0)}" — unusually narrow (IRC has no minimum for interior doors in SFR)`,
      })
    }
  }
  return v
}

// IRC R311.4: hallways ≥ 3ft wide
function checkHallwayWidth(rooms: RoomInfo[]): Violation[] {
  const v: Violation[] = []
  for (const r of rooms.filter(r => HALLWAY_PAT.test(r.name))) {
    const rw = r.bounds.right - r.bounds.left
    const rh = r.bounds.bottom - r.bounds.top
    if (Math.min(rw, rh) < MIN_HALLWAY_WIDTH_FT) {
      v.push({
        id: `hall-narrow-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" is ${Math.min(rw, rh).toFixed(1)}ft wide — IRC R311.4 requires ≥ 3ft`,
      })
    }
  }
  return v
}

// IRC R302.5: door between garage and living space must be 20-min fire-rated
function checkGarageFireSep(rooms: RoomInfo[], graph: Map<string, Set<string>>): Violation[] {
  const v: Violation[] = []
  for (const r of rooms.filter(r => GARAGE_PAT.test(r.name))) {
    if ((graph.get(r.id)?.size ?? 0) > 0) {
      v.push({
        id: `garage-fire-${r.id}`, severity: 'warning', elementId: r.id,
        message: `"${r.name}" connects to living space — IRC R302.5 requires a 20-min fire-rated, self-closing door`,
      })
    }
  }
  return v
}

// IRC R311: bedroom egress path must not pass through another bedroom.
// Check: each bedroom must have at least one direct door to a non-bedroom room.
function checkBedroomPassthrough(rooms: RoomInfo[], graph: Map<string, Set<string>>): Violation[] {
  const v: Violation[] = []
  const bedrooms = rooms.filter(r => BEDROOM_PAT.test(r.name))
  if (bedrooms.length < 2) return v
  const bedIds = new Set(bedrooms.map(r => r.id))

  for (const bed of bedrooms) {
    const nbIds = graph.get(bed.id) ?? new Set()
    if (nbIds.size === 0) continue  // already flagged as no-door
    if (!Array.from(nbIds).some(id => !bedIds.has(id))) {
      v.push({
        id: `bed-thru-${bed.id}`, severity: 'error', elementId: bed.id,
        message: `"${bed.name}" can only be reached through another bedroom — IRC R311 requires an independent egress path`,
      })
    }
  }
  return v
}

// Per-bathroom fixture completeness
function checkBathroomFixtures(
  rooms: RoomInfo[],
  toilets: PlacedElement[],
  lavSinks: PlacedElement[],
): Violation[] {
  const v: Violation[] = []
  const baths = rooms.filter(r => BATHROOM_PAT.test(r.name))
  if (baths.length === 0) {
    // Fall back to global check when no room-labels exist
    if (toilets.length > 0 && lavSinks.length === 0)
      v.push({ id: 'toilet-no-lav', severity: 'warning', message: 'Toilet placed but no lavatory sink — each bathroom requires hand-washing' })
    if (lavSinks.length > 0 && toilets.length === 0)
      v.push({ id: 'lav-no-toilet', severity: 'warning', message: 'Lavatory sink placed but no toilet found' })
    return v
  }
  for (const r of baths) {
    const inR = (el: PlacedElement) => ptInRoom(r, { x: el.x + el.width / 2, y: el.y + el.height / 2 })
    if (!toilets.some(inR))  v.push({ id: `bath-no-toilet-${r.id}`, severity: 'warning', elementId: r.id, message: `"${r.name}" has no toilet placed` })
    if (!lavSinks.some(inR)) v.push({ id: `bath-no-sink-${r.id}`,   severity: 'warning', elementId: r.id, message: `"${r.name}" has no lavatory sink placed` })
  }
  return v
}

// NKBA kitchen work triangle: range + refrigerator + sink, total ≤ 26ft
function checkKitchenTriangle(
  rooms: RoomInfo[],
  ranges: PlacedElement[],
  fridges: PlacedElement[],
  kSinks: PlacedElement[],
): Violation[] {
  const v: Violation[] = []
  for (const r of rooms.filter(r => KITCHEN_PAT.test(r.name))) {
    const inR  = (el: PlacedElement) => ptInRoom(r, { x: el.x + el.width / 2, y: el.y + el.height / 2 })
    const rng  = ranges.find(inR)
    const frdg = fridges.find(inR)
    const sink = kSinks.find(inR)
    const count = [rng, frdg, sink].filter(Boolean).length
    if (count < 2) continue

    if (rng && frdg && sink) {
      const perim = elDist(rng, frdg) + elDist(frdg, sink) + elDist(rng, sink)
      if (perim > 26) {
        v.push({
          id: `kitchen-tri-${r.id}`, severity: 'warning', elementId: r.id,
          message: `Kitchen work triangle is ${perim.toFixed(1)}ft — NKBA recommends ≤ 26ft total`,
        })
      }
    } else {
      const missing = !rng ? 'range' : !frdg ? 'refrigerator' : 'kitchen sink'
      v.push({
        id: `kitchen-miss-${r.id}`, severity: 'warning', elementId: r.id,
        message: `Kitchen is missing a ${missing} — place range, refrigerator, and sink to check the work triangle`,
      })
    }
  }
  return v
}

// Bathroom-to-bedroom ratio (design quality)
function checkBathRatio(rooms: RoomInfo[]): Violation[] {
  const beds  = rooms.filter(r => BEDROOM_PAT.test(r.name)).length
  const baths = rooms.filter(r => BATHROOM_PAT.test(r.name)).length
  if (beds >= 3 && baths > 0 && baths < Math.ceil(beds / 2)) {
    return [{
      id: 'bath-ratio', severity: 'warning',
      message: `${beds} bedrooms, ${baths} bathroom${baths !== 1 ? 's' : ''} — consider adding bathrooms (1 per 2 bedrooms is standard)`,
    }]
  }
  return []
}

// IRC R314: smoke alarms in each sleeping room and outside each sleeping area
function checkSmokeDetectors(rooms: RoomInfo[], detectors: PlacedElement[]): Violation[] {
  const bedrooms = rooms.filter(r => BEDROOM_PAT.test(r.name))
  if (rooms.length < 2) return []

  if (detectors.length === 0) {
    return [{
      id: 'no-smoke-det', severity: 'warning',
      message: 'No smoke detectors placed — IRC R314 requires detectors in each bedroom and outside each sleeping area',
    }]
  }

  const v: Violation[] = []
  for (const r of bedrooms) {
    if (!detectors.some(d => ptInRoom(r, { x: d.x + d.width / 2, y: d.y + d.height / 2 }))) {
      v.push({
        id: `no-smoke-${r.id}`, severity: 'warning', elementId: r.id,
        message: `No smoke detector in "${r.name}" — IRC R314.3 requires an alarm in each sleeping room`,
        fix: () => useStore.getState().placeElement('smoke-detector', r.center.x - 0.25, r.center.y - 0.25, 0.5, 0.5),
      })
    }
  }
  return v
}

// Stair checks (carried forward)
// Note: illuminated exit signage (IBC Ch. 10 / NFPA 101) is a commercial and
// multi-family life-safety requirement, not an IRC provision — one- and
// two-family dwellings aren't required to have Exit Sign blox at stairs.
// There used to be a check for that here; it was wrong for this file's scope
// (residential IRC, per indianapolisResidentialCode.ts) and has been removed.
function checkStairs(stairs: PlacedElement[], handrails: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const stair of stairs) {
    const w = Math.min(stair.width, stair.height)
    if (w < MIN_STAIR_WIDTH_FT) {
      v.push({ id: `stair-narrow-${stair.id}`, severity: 'warning', elementId: stair.id,
        message: `Stair is ${(w * 12).toFixed(0)}" wide — IRC R311.7.1 requires ≥ 36"` })
    }
    if (handrails.length === 0)
      v.push({
        id: `stair-no-rail-${stair.id}`, severity: 'error', elementId: stair.id,
        message: 'Stairs present but no handrail — IRC R311.7.8 requires handrail on all stairways',
        fix: () => useStore.getState().placeElement('handrail', stair.x, stair.y, stair.width, stair.height),
      })
  }
  return v
}

// IRC R311.7.6: a floor or landing at least as wide as the stairway and ≥ 36"
// in the direction of travel is required at the top and bottom of each run.
function checkStairLanding(stairs: PlacedElement[], landings: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const stair of stairs) {
    const isVertRun = stair.height >= stair.width   // run travels N-S
    const ends = isVertRun
      ? [{ x: stair.x + stair.width / 2, y: stair.y },
         { x: stair.x + stair.width / 2, y: stair.y + stair.height }]
      : [{ x: stair.x,                y: stair.y + stair.height / 2 },
         { x: stair.x + stair.width,  y: stair.y + stair.height / 2 }]

    const hasLandingNear = (pt: { x: number; y: number }) =>
      landings.some(l => {
        const lcx = l.x + l.width / 2, lcy = l.y + l.height / 2
        return Math.hypot(lcx - pt.x, lcy - pt.y) < Math.max(stair.width, stair.height, MIN_LANDING_DEPTH_FT)
          && Math.min(l.width, l.height) >= MIN_LANDING_DEPTH_FT
      })

    const missingEnds = ends.filter(pt => !hasLandingNear(pt))
    if (missingEnds.length > 0) {
      v.push({
        id: `stair-no-landing-${stair.id}`, severity: 'warning', elementId: stair.id,
        message: 'Stair run has no landing placed at top/bottom — IRC R311.7.6 requires a floor or landing ≥ 36" deep at each end, at least as wide as the stair',
        fix: () => {
          // Landing must be ≥ MIN_LANDING_DEPTH_FT in the direction of travel,
          // and at least as wide as the stair run across it.
          const w = isVertRun ? stair.width : MIN_LANDING_DEPTH_FT
          const h = isVertRun ? MIN_LANDING_DEPTH_FT : stair.height
          for (const pt of missingEnds) {
            useStore.getState().placeElement('stairs-landing', pt.x - w / 2, pt.y - h / 2, w, h)
          }
        },
      })
    }
  }
  return v
}

// IRC R315: carbon monoxide alarms required outside each sleeping area in
// dwellings with fuel-burning appliances or an attached garage. Furnace/
// water-heater blox count as fuel-burning-appliance triggers same as a
// garage — most residential furnaces and tank water heaters are gas-fired,
// and this check has no way to distinguish gas from electric equipment, so it
// errs toward flagging (consistent with the rest of this file's "verify"
// posture on anything it can't determine for certain).
function checkCOAlarm(
  rooms: RoomInfo[], graph: Map<string, Set<string>>, detectors: PlacedElement[],
  fuelAppliances: PlacedElement[], coAlarms: PlacedElement[],
): Violation[] {
  const hasGarage = rooms.some(r => GARAGE_PAT.test(r.name) && (graph.get(r.id)?.size ?? 0) > 0)
  const hasFuelAppliance = fuelAppliances.length > 0
  if (!hasGarage && !hasFuelAppliance) return []
  const source = hasGarage && hasFuelAppliance ? 'Attached garage and furnace/water-heater'
    : hasGarage ? 'Attached garage' : 'Furnace/water-heater'
  if (coAlarms.length > 0) return []  // dedicated CO alarm blox present — satisfied
  if (detectors.length === 0) return []  // no detectors of any kind — already flagged by checkSmokeDetectors
  return [{
    id: 'co-alarm-note', severity: 'warning',
    message: `${source} detected but no dedicated CO Alarm placed — IRC R315 requires carbon monoxide alarms outside each sleeping area (a combo smoke/CO unit also satisfies this; smoke detectors alone don't)`,
  }]
}

// NEC 110.26: panels need dedicated working space — 30" wide × 36" deep
// clear floor space centered on the panel, unobstructed floor-to-ceiling.
// Checked as a simple proximity test against every other physical element
// rather than true swing-direction geometry, matching this file's existing
// "coarse guardrail, not an exhaustive geometric proof" pattern elsewhere
// (see checkBathRatio, checkStairLanding).
const PANEL_CLEARANCE_DEPTH_FT = 3.0
function checkPanelClearance(panels: PlacedElement[], elements: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const panel of panels) {
    const pcx = panel.x + panel.width / 2, pcy = panel.y + panel.height / 2
    const blocking = elements.find(el => {
      if (el.id === panel.id || el.bloxId.startsWith('wall-')) return false
      const ecx = el.x + el.width / 2, ecy = el.y + el.height / 2
      return Math.hypot(ecx - pcx, ecy - pcy) < PANEL_CLEARANCE_DEPTH_FT
    })
    if (blocking) {
      v.push({
        id: `panel-clearance-${panel.id}`, severity: 'error', elementId: panel.id,
        message: `Electrical panel has an obstruction within ${PANEL_CLEARANCE_DEPTH_FT}ft — NEC 110.26 requires a clear 30"×36" working space in front of service equipment`,
        fix: () => nudgeClear(panel, blocking, PANEL_CLEARANCE_DEPTH_FT),
      })
    }
  }
  return v
}

// IRC M1305: clear, unobstructed access passageway (≥24" wide, ≥30"×30" work
// platform) to mechanical/water-heating equipment for service.
const APPLIANCE_ACCESS_FT = 2.0
function checkApplianceAccess(equipment: PlacedElement[], elements: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const eq of equipment) {
    const ecx = eq.x + eq.width / 2, ecy = eq.y + eq.height / 2
    const blocking = elements.find(el => {
      if (el.id === eq.id || el.bloxId.startsWith('wall-') || equipment.some(e => e.id === el.id)) return false
      const ocx = el.x + el.width / 2, ocy = el.y + el.height / 2
      return Math.hypot(ocx - ecx, ocy - ecy) < APPLIANCE_ACCESS_FT
    })
    if (blocking) {
      const label = eq.bloxId === 'mech-furnace' ? 'Furnace' : 'Water heater'
      v.push({
        id: `appliance-access-${eq.id}`, severity: 'warning', elementId: eq.id,
        message: `${label} has an obstruction within ${APPLIANCE_ACCESS_FT}ft — IRC M1305 requires clear service access to mechanical equipment`,
        fix: () => nudgeClear(eq, blocking, APPLIANCE_ACCESS_FT),
      })
    }
  }
  return v
}

// IRC E3901: coarse per-room coverage check — every habitable room should
// have at least one receptacle. Not a true "6ft from any wall point" spacing
// check (that needs wall-segment geometry this file doesn't track per-room),
// but catches the common miss of a room with zero outlets placed at all.
function checkOutletCoverage(rooms: RoomInfo[], outlets: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const r of rooms) {
    if (NON_HABITABLE.test(r.name)) continue
    const hasOutlet = outlets.some(o => ptInRoom(r, { x: o.x + o.width / 2, y: o.y + o.height / 2 }))
    if (!hasOutlet) {
      v.push({
        id: `no-outlet-${r.id}`, severity: 'warning', elementId: r.id,
        message: `No outlet placed in "${r.name}" — IRC E3901 requires receptacles so no point along a wall is more than 6ft from one`,
        fix: () => useStore.getState().placeElement('elec-outlet', r.center.x - 0.2, r.center.y - 0.2, 0.4, 0.4),
      })
    }
  }
  return v
}

// IRC E3902: kitchen/bath/garage rooms need GFCI-protected receptacles, not
// standard duplex outlets.
function checkGFCILocations(rooms: RoomInfo[], plainOutlets: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  const gfciRooms = rooms.filter(r => KITCHEN_PAT.test(r.name) || BATHROOM_PAT.test(r.name) || GARAGE_PAT.test(r.name))
  for (const r of gfciRooms) {
    const offenders = plainOutlets.filter(o => ptInRoom(r, { x: o.x + o.width / 2, y: o.y + o.height / 2 }))
    if (offenders.length > 0) {
      v.push({
        id: `gfci-missing-${r.id}`, severity: 'error', elementId: r.id,
        message: `"${r.name}" has a standard duplex outlet — IRC E3902 requires GFCI protection in kitchens, bathrooms, and garages`,
        fix: () => {
          const store = useStore.getState()
          for (const o of offenders) {
            store.selectMany([o.id], [])
            store.deleteSelectedElements()
            store.placeElement('elec-outlet-gfci', o.x, o.y, o.width, o.height)
          }
        },
      })
    }
  }
  return v
}

type ZoningSetbacks = { front: number; side: number; rear: number }

// Marion County zoning: minimum building setback from property lines. Actual
// required setbacks vary by dwelling district (D-1…D-8, D-A) and are set by
// the Indianapolis-Marion County zoning ordinance, not the IRC — this check
// uses project-configurable minimums (default 10ft each) as a rough guardrail.
// Front/side/rear setbacks are almost never equal in real zoning, so each
// property-line element is tagged via properties.lineType; untagged lines
// (including every property line placed before this distinction existed)
// default to 'side', the most common and typically the smallest of the three,
// which errs toward flagging rather than silently passing an unmarked line.
function checkSetbacks(walls: PlacedElement[], propertyLines: PlacedElement[], setbacks: ZoningSetbacks): Violation[] {
  if (walls.length === 0 || propertyLines.length === 0) return []
  const v: Violation[] = []
  const extWalls = walls.filter(w => w.bloxId === 'wall-exterior')
  if (extWalls.length === 0) return []

  const bbox = extWalls.reduce((b, w) => ({
    left:   Math.min(b.left,   w.x),
    top:    Math.min(b.top,    w.y),
    right:  Math.max(b.right,  w.x + w.width),
    bottom: Math.max(b.bottom, w.y + w.height),
  }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

  for (const pl of propertyLines) {
    const isH = pl.width >= pl.height
    const plMid = isH ? pl.y + pl.height / 2 : pl.x + pl.width / 2
    // Only consider property lines whose span overlaps the building's footprint —
    // an unrelated line far off to the side isn't this building's boundary.
    const spans = isH
      ? pl.x < bbox.right && pl.x + pl.width > bbox.left
      : pl.y < bbox.bottom && pl.y + pl.height > bbox.top
    if (!spans) continue

    const dist = isH
      ? Math.min(Math.abs(bbox.top - plMid), Math.abs(bbox.bottom - plMid))
      : Math.min(Math.abs(bbox.left - plMid), Math.abs(bbox.right - plMid))

    const lineType = (pl.properties?.lineType as 'front' | 'side' | 'rear' | undefined) ?? 'side'
    const minSetbackFt = setbacks[lineType]

    if (dist < minSetbackFt) {
      v.push({
        id: `setback-${pl.id}`, severity: 'warning', elementId: pl.id,
        message: `Building is ${dist.toFixed(1)}ft from ${lineType} property line — closer than the ${minSetbackFt}ft ${lineType} minimum set in Design Review. Confirm actual required setback for this parcel's zoning district with Indy DMD.`,
      })
    }
  }
  return v
}

// Overlapping non-wall elements
function checkOverlaps(elements: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  const check = elements.filter(el =>
    !el.bloxId.startsWith('wall-') && !el.bloxId.startsWith('window-') &&
    !el.bloxId.startsWith('door-') && el.bloxId !== 'cased-opening' &&
    !el.bloxId.startsWith('room-label') && !el.bloxId.startsWith('annotation-'),
  )
  for (let i = 0; i < check.length; i++) {
    for (let j = i + 1; j < check.length; j++) {
      if (overlaps(check[i], check[j])) {
        v.push({ id: `overlap-${check[i].id}`, severity: 'warning', elementId: check[i].id,
          message: `Overlapping elements — check placement` })
        break
      }
    }
    if (v.some(x => x.id === `overlap-${check[i].id}`)) break
  }
  return v
}

// ── Structural span checks (detail mode) ─────────────────────────────────────

// Simplified IRC R602.7 max spans for doubled headers, roof load only (in inches)
const HEADER_MAX_SPAN_IN: Record<string, number> = {
  'detail-stud-2x4-face': 42,   // 3'-6"
  'detail-stud-2x6-face': 66,   // 5'-6"
  'detail-stud-2x8-face': 84,   // 7'-0"
  'detail-stud-2x10-face': 102, // 8'-6"
  'detail-stud-2x12-face': 120, // 10'-0"
}

function checkStructural(elements: PlacedElement[]): Violation[] {
  const v: Violation[] = []
  for (const el of elements) {
    // Horizontal face-view members wider than tall → treated as headers/beams
    if (el.width > el.height * 2 && HEADER_MAX_SPAN_IN[el.bloxId]) {
      const maxSpan = HEADER_MAX_SPAN_IN[el.bloxId]
      const spanIn = el.width  // detail mode: 1 unit = 1 inch
      if (spanIn > maxSpan) {
        const sizeName = el.bloxId.replace('detail-stud-', '').replace('-face', '').toUpperCase()
        v.push({
          id: `span-${el.id}`, severity: 'error', elementId: el.id,
          message: `${sizeName} header spans ${spanIn.toFixed(1)}" — exceeds IRC R602.7 prescriptive max of ${maxSpan}" for this size. Upsize to a larger member or consult a structural engineer.`
        })
      } else if (spanIn > maxSpan * 0.85) {
        const sizeName = el.bloxId.replace('detail-stud-', '').replace('-face', '').toUpperCase()
        v.push({
          id: `span-warn-${el.id}`, severity: 'warning', elementId: el.id,
          message: `${sizeName} header spans ${spanIn.toFixed(1)}" — within 15% of IRC R602.7 prescriptive limit of ${maxSpan}". Verify loads.`
        })
      }
    }
  }
  return v
}

// ── Main DRC runner ───────────────────────────────────────────────────────────

function runDRC(elements: PlacedElement[], zoningSetbacks: ZoningSetbacks): Violation[] {
  const walls        = elements.filter(el => el.bloxId.startsWith('wall-'))
  const allDoors     = elements.filter(el => el.bloxId === 'door-single' || el.bloxId === 'door-double' || el.bloxId === 'door-sliding')
  // All door types provide passage for connectivity purposes — door-pocket
  // and door-garage were missing here, which is why a room behind a pocket
  // door (e.g. a tight bathroom) registered as having "no door or opening"
  // even with one correctly placed and rendered.
  const openings     = elements.filter(el => ['door-single','door-double','door-sliding','door-pocket','door-bifold','door-garage','cased-opening'].includes(el.bloxId))
  const windows      = elements.filter(el => el.bloxId.startsWith('window-'))
  const toilets      = elements.filter(el => el.bloxId === 'fixture-toilet')
  const lavSinks     = elements.filter(el => el.bloxId === 'fixture-sink-lav')
  const kSinks       = elements.filter(el => el.bloxId === 'fixture-sink-kitchen')
  const ranges       = elements.filter(el => el.bloxId === 'fixture-range')
  const fridges      = elements.filter(el => el.bloxId === 'fixture-refrigerator')
  const stairs       = elements.filter(el => el.bloxId === 'stairs-straight')
  const landings     = elements.filter(el => el.bloxId === 'stairs-landing')
  const handrails    = elements.filter(el => el.bloxId === 'handrail')
  const detectors    = elements.filter(el => el.bloxId === 'smoke-detector')
  const coAlarms     = elements.filter(el => el.bloxId === 'co-alarm')
  const roomLabels   = elements.filter(el => el.bloxId === 'annotation-room-tag')
  const fixtures     = elements.filter(el => el.bloxId.startsWith('fixture-'))
  const propertyLines = elements.filter(el => el.bloxId === 'site-property-line')
  const elecPanels   = elements.filter(el => el.bloxId === 'elec-panel')
  const plainOutlets = elements.filter(el => el.bloxId === 'elec-outlet')
  const allOutlets   = elements.filter(el => el.bloxId === 'elec-outlet' || el.bloxId === 'elec-outlet-gfci')
  const fuelAppliances = elements.filter(el => el.bloxId === 'mech-furnace' || el.bloxId === 'plumb-water-heater')

  if (elements.length === 0) return []

  // Spatial analysis (only when room-labels exist)
  const rooms = roomLabels.length > 0 ? detectRoomBounds(roomLabels, elements) : []
  const graph = rooms.length > 0 ? buildConnectivityGraph(rooms, openings) : new Map<string, Set<string>>()

  return [
    // ── Spatial (room-label dependent) ──────────────────────────────────────
    ...checkConnectivity(rooms, graph),
    ...checkRoomSizes(rooms),
    ...checkBedroomWindows(rooms, windows),
    ...checkHabitableLight(rooms, windows),
    ...checkHallwayWidth(rooms),
    ...checkGarageFireSep(rooms, graph),
    ...checkBedroomPassthrough(rooms, graph),
    ...checkKitchenTriangle(rooms, ranges, fridges, kSinks),
    ...checkBathRatio(rooms),
    ...checkBathroomFixtures(rooms, toilets, lavSinks),
    ...checkSmokeDetectors(rooms, detectors),
    ...checkCOAlarm(rooms, graph, detectors, fuelAppliances, coAlarms),
    ...checkOutletCoverage(rooms, allOutlets),
    ...checkGFCILocations(rooms, plainOutlets),

    // ── Code checks (element-level) ──────────────────────────────────────────
    ...checkEgressDoor(allDoors, walls),
    ...reviewStraightStairs(elements),
    ...checkPanelClearance(elecPanels, elements),
    ...checkApplianceAccess(fuelAppliances, elements),

    // ── Zoning (site-level) ───────────────────────────────────────────────────
    ...checkSetbacks(walls, propertyLines, zoningSetbacks),

    // ── General ─────────────────────────────────────────────────────────────
    ...(fixtures.length > 0 && walls.length === 0
      ? [{ id: 'fixtures-no-walls', severity: 'warning' as const, message: 'Fixtures placed without walls — add exterior walls to define the floor plan' }]
      : []),
    ...checkOverlaps(elements),
  ]
}

function runDetailDRC(elements: PlacedElement[]): Violation[] {
  if (elements.length === 0) return []
  return checkStructural(elements)
}

// ── Panel UI (unchanged) ─────────────────────────────────────────────────────

const CHECKLIST_CATEGORIES = ['Pre-Design', 'Design', 'Documents', 'Code']

export function DRCPanel() {
  const { project, setShowDRCPanel, selectElement, toggleChecklistItem, addChecklistItem, removeChecklistItem, setZoningSetback } = useStore()
  const [tab, setTab] = useState<'checks' | 'checklist'>('checks')
  const [newItemText, setNewItemText] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('Design')
  const inputRef = useRef<HTMLInputElement>(null)
  // Violations are already live (recomputed whenever `project` changes) —
  // this exists as an explicit, honest "force recompute" for the Refresh
  // button rather than a no-op: bumping it re-runs the useMemo below even in
  // the (currently theoretical) case some future check reads external state
  // the memo doesn't depend on.
  const [refreshKey, setRefreshKey] = useState(0)
  const setbacks: ZoningSetbacks = project?.zoningSetbacks ?? (
    project?.zoningSetbackFt !== undefined
      ? { front: project.zoningSetbackFt, side: project.zoningSetbackFt, rear: project.zoningSetbackFt }
      : DEFAULT_SETBACKS
  )

  const violations = useMemo(() => {
    if (!project) return []
    if (project.mode === 'detail') return runDetailDRC(project.detailElements ?? [])
    return runDRC(project.elements, setbacks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, setbacks, refreshKey])

  const fixableCount = violations.filter(v => v.fix).length
  const fixAll = () => {
    for (const v of violations) v.fix?.()
  }

  // Auto-compute roomArea from wall geometry and write it back to each room-tag.
  // Guard: only write when computed area differs from stored by > 1 SF to avoid loops.
  useEffect(() => {
    if (!project) return
    const els = project.elements
    const tags = els.filter(el => el.bloxId === 'annotation-room-tag')
    if (tags.length === 0) return
    const rooms = detectRoomBounds(tags, els)
    for (const room of rooms) {
      const tag = tags.find(t => t.id === room.id)
      if (!tag) continue
      const computed = Math.round(room.area)
      const stored = parseFloat((tag.properties?.roomArea as string) ?? '')
      if (isNaN(stored) || Math.abs(computed - stored) > 1) {
        useStore.getState().updateElement(tag.id, {
          properties: { ...tag.properties, roomArea: `${computed} SF` },
        } as any)
      }
    }
  }, [project?.elements])

  if (!project) return null

  const errors   = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')
  const checklist = project.checklist ?? []
  const doneCount = checklist.filter(i => i.checked).length

  return (
    <div className="review-panel utility-panel w-72 bg-sidebar border-l border-gray-700 flex flex-col shrink-0 text-xs" aria-label="Design Review">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="font-semibold text-gray-200">
          Design Review
          {tab === 'checks' && violations.length > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${errors.length > 0 ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {violations.length}
            </span>
          )}
          {tab === 'checklist' && checklist.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-700 text-gray-400">
              {doneCount}/{checklist.length}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {tab === 'checks' && (
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              title="Re-run all automated checks"
              aria-label="Refresh design review"
              className="text-gray-500 hover:text-gray-300"
            ><RefreshCw size={15} strokeWidth={1.6} /></button>
          )}
          <button onClick={() => setShowDRCPanel(false)} aria-label="Close design review" title="Close design review" className="text-gray-500 hover:text-gray-300"><X size={16} strokeWidth={1.6} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setTab('checks')}
          className={`flex-1 py-1.5 text-[11px] transition-colors ${tab === 'checks' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Automated Checks
          {errors.length > 0 && <span className="ml-1 text-red-400">({errors.length})</span>}
        </button>
        <button
          onClick={() => setTab('checklist')}
          className={`flex-1 py-1.5 text-[11px] transition-colors ${tab === 'checklist' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Checklist
          {doneCount === checklist.length && checklist.length > 0
            ? <span className="ml-1 text-green-400">✓</span>
            : checklist.length > 0
            ? <span className="ml-1 text-gray-600">({doneCount}/{checklist.length})</span>
            : null}
        </button>
      </div>

      {/* Automated checks tab */}
      {tab === 'checks' && (
        <>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 text-gray-500"
            title="Marion Co. setbacks vary by dwelling district (D-1…D-8) and by front/side/rear — set the actual minimums for your parcel. Applies per property line based on its Type (Front/Side/Rear); untagged lines are treated as Side.">
            <span>Min. setback</span>
            <div className="flex items-center gap-2">
              {(['front', 'side', 'rear'] as const).map(which => (
                <label key={which} className="flex items-center gap-1">
                  <span className="text-[10px] uppercase">{which[0]}</span>
                  <input
                    type="number"
                    min={0}
                    value={setbacks[which]}
                    onChange={e => setZoningSetback(which, Math.max(0, Number(e.target.value) || 0))}
                    className="w-10 bg-gray-800 text-gray-300 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-right"
                  />
                </label>
              ))}
              <span className="text-[10px]">ft</span>
            </div>
          </div>
          {fixableCount > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700">
              <span className="text-gray-500">{fixableCount} fixable automatically</span>
              <button
                onClick={fixAll}
                className="bg-blue-900 hover:bg-blue-800 text-blue-200 rounded px-2 py-0.5 text-[10px] font-medium"
              >
                Fix All
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="text-2xl mb-2">✓</div>
                <div>No findings in the implemented checks</div>
                <div className="text-[10px] mt-2">Not a complete code or architectural review.</div>
              </div>
            ) : (
              violations.map(v => (
                <div
                  key={v.id}
                  onClick={() => v.elementId && selectElement(v.elementId)}
                  className={`review-card p-2 rounded border text-[11px] leading-tight ${v.elementId ? 'cursor-pointer' : ''} ${v.severity === 'error' ? 'review-error' : 'review-warning'}`}
                >
                  <div className="review-severity">{v.status==='unverified'?'● Unverified':v.status==='measured'?'● Measurement conflict':v.severity === 'error' ? '● Needs attention' : '● Check recommended'}</div>
                  {v.message}
                  {v.referenceUrl&&<a className="block underline mt-1" href={v.referenceUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>Selected reference · 2021 IRC</a>}
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] opacity-60">{v.elementId ? 'Click to select' : ''}</span>
                    {v.fix && (
                      <button
                        onClick={(e) => { e.stopPropagation(); v.fix!() }}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/40"
                      >
                        Fix
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-gray-700 text-[10px] text-gray-600">
            {errors.length} error{errors.length !== 1 ? 's' : ''} · {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* Checklist tab */}
      {tab === 'checklist' && (
        <>
          <div className="flex-1 overflow-y-auto">
            {CHECKLIST_CATEGORIES.map(cat => {
              const items = checklist.filter(i => i.category === cat)
              return (
                <div key={cat}>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{cat}</div>
                  {items.length === 0 && (
                    <div className="px-3 pb-2 text-[10px] text-gray-600 italic">No items</div>
                  )}
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-800 group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="mt-0.5 accent-blue-500 shrink-0"
                      />
                      <span className={`flex-1 leading-tight ${item.checked ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 text-[10px] shrink-0"
                        title="Remove"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )
            })}

            {checklist.filter(i => !CHECKLIST_CATEGORIES.includes(i.category)).length > 0 && (
              <div>
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Other</div>
                {checklist.filter(i => !CHECKLIST_CATEGORIES.includes(i.category)).map(item => (
                  <div key={item.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-800 group">
                    <input type="checkbox" checked={item.checked} onChange={() => toggleChecklistItem(item.id)} className="mt-0.5 accent-blue-500 shrink-0" />
                    <span className={`flex-1 leading-tight ${item.checked ? 'line-through text-gray-600' : 'text-gray-300'}`}>{item.text}</span>
                    <button onClick={() => removeChecklistItem(item.id)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 text-[10px] shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add item */}
          <div className="border-t border-gray-700 p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-1 py-0.5 text-[10px]"
              >
                {CHECKLIST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newItemText.trim()) {
                    addChecklistItem(newItemText.trim(), newItemCategory)
                    setNewItemText('')
                  }
                }}
                placeholder="Add checklist item…"
                className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-1.5 py-0.5 text-[10px] placeholder-gray-600"
              />
              <button
                onClick={() => {
                  if (newItemText.trim()) {
                    addChecklistItem(newItemText.trim(), newItemCategory)
                    setNewItemText('')
                    inputRef.current?.focus()
                  }
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 text-[10px]"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
