import { useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useStore, getActiveElements, getActiveDimensions } from '../store/useStore'
import { BLOX_DEFINITIONS } from '../blox/definitions'
import { snapOpeningToWall } from '../utils/snap'
import { detectRooms } from '../utils/roomDetect'
import { buildWallGraph } from '../utils/wallGraph'
import type { PlacedElement } from '../types'

const OPENING_BLOX_IDS = new Set([
  'cased-opening', 'door-single', 'door-double', 'door-sliding',
  'window-single', 'window-double', 'window-multi', 'insulation-batt'
])

const WALL_BLOX_IDS = new Set(['wall-exterior', 'wall-interior', 'wall-cmu', 'wall-glazing', 'wall-fire-1hr', 'wall-fire-2hr'])

function getAnchorOffset(anchor: string, w: number, h: number): [number, number] {
  // Returns [dx, dy] to ADD to the anchor coordinates to get the top-left corner
  switch (anchor) {
    case 'center':        return [-w / 2, -h / 2]
    case 'top-right':     return [-w,     0]
    case 'bottom-left':   return [0,      -h]
    case 'bottom-right':  return [-w,     -h]
    case 'top-center':    return [-w / 2, 0]
    case 'bottom-center': return [-w / 2, -h]
    case 'center-left':   return [0,      -h / 2]
    case 'center-right':  return [-w,     -h / 2]
    default:              return [0,      0]
  }
}

function getElementAnchorPoint(el: { x: number; y: number; width: number; height: number }, anchor: string): { x: number; y: number } {
  const [ox, oy] = getAnchorOffset(anchor, el.width, el.height)
  return { x: el.x - ox, y: el.y - oy }
}

const WALL_THICKNESS: Record<string, number> = {
  'wall-exterior': 0.5,
  'wall-interior': 0.375,
  'wall-cmu': 0.667,
  'wall-glazing': 0.375,
}

// Elevation canvas is 300ft tall. y=0 = top (300ft elevation), y=300 = ground.
// All MCP elevation y-values use elevation-from-ground (0 = ground, 300 = top).
// The bridge converts to/from canvas y internally.
const ELEV_CANVAS_H = 300

type ActionResult = Record<string, unknown>

function r(n: number) { return Math.round(n * 100) / 100 }

function elementSummary(
  el: { id: string; bloxId: string; x: number; y: number; width: number; height: number; rotation?: number },
  mode = 'floorplan'
) {
  if (mode === 'elevation') {
    // Return y as elevation-from-ground of bottom edge; bottom = elevation of top edge.
    const elevBot = r(ELEV_CANVAS_H - el.y - el.height)
    const elevTop = r(ELEV_CANVAS_H - el.y)
    return {
      id: el.id, bloxId: el.bloxId,
      x: r(el.x), y: elevBot,
      width: r(el.width), height: r(el.height),
      rotation: el.rotation ?? 0,
      right: r(el.x + el.width),
      bottom: elevTop,
      centerX: r(el.x + el.width / 2),
      centerY: r(elevBot + el.height / 2),
    }
  }
  return {
    id: el.id, bloxId: el.bloxId,
    x: r(el.x), y: r(el.y),
    width: r(el.width), height: r(el.height),
    rotation: el.rotation ?? 0,
    right: r(el.x + el.width),
    bottom: r(el.y + el.height),
    centerX: r(el.x + el.width / 2),
    centerY: r(el.y + el.height / 2),
  }
}

// Convert MCP elevation-y (from ground) + anchor oy → canvas y (from top).
// Formula: canvas_y = ELEV_CANVAS_H - elevY + oy
// Works for all anchors because oy is negative for bottom/center references.
function elevToCanvasY(elevY: number, oy: number): number {
  return ELEV_CANVAS_H - elevY + oy
}

// Convert canvas y + height → MCP elevation-y (bottom of element from ground).
function canvasToElevY(canvasY: number, h: number): number {
  return ELEV_CANVAS_H - canvasY - h
}

// Return the value of a named edge in MCP coordinates (elevation mode: elevation from ground; floor plan: canvas feet).
// 'top'/'bottom' in elevation mode return elevation-from-ground of that edge.
function getEdgeValue(el: PlacedElement, edge: string, mode: string): number {
  if (mode === 'elevation') {
    switch (edge) {
      case 'left':     return el.x
      case 'right':    return el.x + el.width
      case 'top':      return ELEV_CANVAS_H - el.y             // higher elevation = top in real life
      case 'bottom':   return ELEV_CANVAS_H - el.y - el.height // lower elevation = sill
      default:         return 0
    }
  }
  switch (edge) {
    case 'left':   return el.x
    case 'right':  return el.x + el.width
    case 'top':    return el.y
    case 'bottom': return el.y + el.height
    default:       return 0
  }
}

// Given a target edge value in MCP coords, compute the canvas y for the element's top-left.
function targetToCanvasY(target: number, axis: string, elHeight: number, mode: string): number {
  if (mode === 'elevation') {
    switch (axis) {
      case 'top':      return ELEV_CANVAS_H - target            // target = top elevation
      case 'bottom':   return ELEV_CANVAS_H - target - elHeight // target = bottom (sill) elevation
      case 'center-y': return ELEV_CANVAS_H - target - elHeight / 2
      default:         return 0
    }
  }
  switch (axis) {
    case 'top':      return target
    case 'bottom':   return target - elHeight
    case 'center-y': return target - elHeight / 2
    default:         return 0
  }
}

const OPENING_BLOX = new Set([
  'cased-opening', 'door-single', 'door-double', 'door-sliding',
  'window-single', 'window-double', 'window-multi',
])

// Returns the anchor point of an element in elevation coordinates (y = elevation from ground).
function getElementAnchorPointElev(
  el: { x: number; y: number; width: number; height: number },
  anchor: string
): { x: number; y: number } {
  // Anchor point in canvas coords:
  const [ox, oy] = getAnchorOffset(anchor, el.width, el.height)
  const canvasAnchorY = el.y - oy  // oy is the offset from anchor to top-left, so top-left + (-oy) = anchor
  // Convert canvas anchor y to elevation:
  const elevAnchorY = ELEV_CANVAS_H - canvasAnchorY
  return { x: el.x - ox, y: elevAnchorY }
}

async function autoFitView() {
  const { fitView } = await import('../utils/exportManager')
  await fitView()
}

async function handleMcpAction(action: string, payload: Record<string, unknown>): Promise<ActionResult> {
  const store = useStore.getState()

  switch (action) {

    case 'list_blox': {
      return {
        coordinateSystem: 'All coordinates in feet. Origin (0,0) is top-left. x increases right, y increases down. IMPORTANT: The canvas is large — before placing anything call get_viewport to get the current view center, then anchor your layout there. Wall thickness: exterior=0.5ft, interior=0.375ft, CMU=0.667ft, glazing=0.375ft.',
        smartPlacement: 'Use place_on_wall to place fixtures, openings, and furniture against walls. It auto-computes position, rotation, and wall splitting — no coordinate math needed. Signature: { bloxId, wallId, face?: "north"|"south"|"east"|"west", offsetFromStart?: ft, centerAt?: ft, width?: ft }. face defaults to "south" for H walls, "east" for V walls. Openings automatically split the wall. fit_view is now explicit — individual place actions no longer auto-fit. Use pick_point (no payload) to ask the user to click a point on the canvas — returns { x, y } in feet. Room labels: use annotation-room-tag (not room-label, which no longer exists). Set properties { roomName, roomNum } when placing — roomArea is auto-computed from wall geometry by the DRC and does not need to be set manually.',
        blox: BLOX_DEFINITIONS.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          description: d.description,
          defaultWidth: d.defaultWidth,
          defaultHeight: d.defaultHeight,
          ...(d.placementNote ? { placementNote: d.placementNote } : {}),
          ...(d.placement ? { placement: d.placement } : {}),
        }))
      }
    }

    case 'create_project': {
      const { name = 'Untitled', scale = 'quarter', mode = 'floorplan' } = payload as { name?: string; scale?: string; mode?: string }
      store.createProject(name, scale as Parameters<typeof store.createProject>[1], mode as Parameters<typeof store.createProject>[2])
      return { success: true, name, scale, mode }
    }

    case 'get_project': {
      const { project } = store
      if (!project) return { project: null }

      const WALL_IDS = new Set(['wall-exterior', 'wall-interior', 'wall-cmu'])
      const els = getActiveElements(store)
      const overlaps: Array<{ a: string; b: string }> = []
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i], b = els[j]
          if (WALL_IDS.has(a.bloxId) && WALL_IDS.has(b.bloxId)) continue
          if (
            a.x < b.x + b.width && a.x + a.width > b.x &&
            a.y < b.y + b.height && a.y + a.height > b.y
          ) {
            overlaps.push({ a: a.id, b: b.id })
          }
        }
      }

      const isElevMode = (project.mode ?? 'floorplan') === 'elevation'
      const isFloorplan = (project.mode ?? 'floorplan') === 'floorplan'
      const rooms = isFloorplan ? detectRooms(els) : []
      return {
        project: {
          name: project.name,
          scale: project.scale,
          mode: project.mode ?? 'floorplan',
          ...(isElevMode ? { elevationNote: 'y = elevation from ground of bottom edge (ft). bottom = elevation of top edge. Use these y values when calling place_element or update_element.' } : {}),
          elements: els.map(el => {
            const s = elementSummary(el, project.mode ?? 'floorplan')
            return { ...s, rotation: el.rotation, locked: el.locked }
          }),
          dimensions: getActiveDimensions(store).map(d => {
            const len = Math.sqrt((d.x2 - d.x1) ** 2 + (d.y2 - d.y1) ** 2)
            const ft = Math.floor(len)
            const inches = Math.round((len - ft) * 12)
            return {
              id: d.id,
              x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2, offset: d.offset,
              lengthFt: Math.round(len * 100) / 100,
              measureText: inches === 0 ? `${ft}'-0"` : `${ft}'-${inches}"`,
            }
          }),
          overlaps,
          ...(rooms.length > 0 ? { rooms } : {}),
        }
      }
    }

    case 'place_element': {
      const { bloxId, x, y, width, height, anchor = 'top-left', relativeToId, relativeAnchor = 'top-left', properties: customProps } = payload as {
        bloxId: string; x: number; y: number; width?: number; height?: number; anchor?: string
        relativeToId?: string; relativeAnchor?: string; properties?: Record<string, unknown>
      }
      const def = BLOX_DEFINITIONS.find(d => d.id === bloxId)
      if (!def) return { error: `Unknown blox id: "${bloxId}". Use list_blox to see valid ids.` }
      const w = width ?? def.defaultWidth
      const h = height ?? def.defaultHeight
      const isElevation = (store.project?.mode ?? 'floorplan') === 'elevation'

      // Resolve base position: relative to another element's anchor, or absolute
      let baseX = x, baseY = y
      if (relativeToId) {
        const refEl = getActiveElements(store).find(el => el.id === relativeToId)
        if (refEl) {
          if (isElevation) {
            const pt = getElementAnchorPointElev(refEl, relativeAnchor)
            baseX = pt.x + x
            baseY = pt.y + y  // both in elevation coords
          } else {
            const pt = getElementAnchorPoint(refEl, relativeAnchor)
            baseX = pt.x + x
            baseY = pt.y + y
          }
        }
      }

      const [ox, oy] = getAnchorOffset(anchor as string, w, h)
      let finalX = baseX + ox
      // In elevation mode, baseY is elevation-from-ground; convert to canvas y.
      let finalY = isElevation ? elevToCanvasY(baseY, oy) : baseY + oy
      let finalW = width
      let finalH = height

      // Auto-snap openings (doors/windows) to nearest wall within 3ft
      let wallId: string | undefined
      if (OPENING_BLOX_IDS.has(bloxId) && store.project) {
        const snap = snapOpeningToWall(
          { x: finalX + w / 2, y: finalY + h / 2 },
          getActiveElements(store),
          w,
          3
        )
        if (snap) {
          finalX = snap.x
          finalY = snap.y
          finalW = snap.widthOverride
          finalH = snap.heightOverride
          wallId = snap.wallId
        }
      }

      store.placeElement(bloxId, finalX, finalY, finalW, finalH, wallId)
      const elements = getActiveElements(useStore.getState())
      const newEl = elements[elements.length - 1]
      if (customProps && newEl) {
        useStore.getState().updateElement(newEl.id, {
          properties: { ...newEl.properties, ...customProps }
        } as Parameters<typeof store.updateElement>[1])
      }
      const mode = useStore.getState().project?.mode ?? 'floorplan'
      const finalEl = getActiveElements(useStore.getState()).find(e => e.id === newEl?.id) ?? newEl
      return { success: true, element: finalEl ? elementSummary(finalEl, mode) : null }
    }

    case 'place_wall': {
      const { x1, y1, x2, y2, wallType = 'wall-exterior' } = payload as {
        x1: number; y1: number; x2: number; y2: number; wallType?: string
      }
      const adx = Math.abs(x2 - x1)
      const ady = Math.abs(y2 - y1)
      const t = WALL_THICKNESS[wallType] ?? 0.5
      const isAxisAligned = ady < 0.01 || adx < 0.01
      if (isAxisAligned) {
        // Orthogonal — extend t/2 past each endpoint for clean corners
        if (adx >= ady) {
          store.placeElement(wallType, Math.min(x1, x2) - t / 2, y1 - t / 2, adx + t, t)
        } else {
          store.placeElement(wallType, x1 - t / 2, Math.min(y1, y2) - t / 2, t, ady + t)
        }
      } else {
        // Diagonal — rotate a rect around the midpoint
        const dist = Math.sqrt(adx * adx + ady * ady)
        const angleDeg = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
        const cx = (x1 + x2) / 2
        const cy = (y1 + y2) / 2
        store.placeElement(wallType, cx - dist / 2, cy - t / 2, dist, t, undefined, angleDeg)
      }
      const elements = getActiveElements(useStore.getState())
      const newEl = elements[elements.length - 1]
      return { success: true, element: newEl ? elementSummary(newEl, useStore.getState().project?.mode ?? 'floorplan') : null }
    }

    case 'place_on_wall': {
      const {
        bloxId, wallId, face,
        offsetFromStart, centerAt,
        width: widthOverride,
      } = payload as {
        bloxId: string
        wallId: string
        face?: 'north' | 'south' | 'east' | 'west'
        offsetFromStart?: number
        centerAt?: number
        width?: number
      }
      const def = BLOX_DEFINITIONS.find(d => d.id === bloxId)
      if (!def) return { error: `Unknown blox: ${bloxId}` }
      const wallEls = getActiveElements(store)
      const wall = wallEls.find(e => e.id === wallId)
      if (!wall) return { error: `Wall ${wallId} not found` }

      const isH = wall.width >= wall.height
      const resolvedFace = face ?? (isH ? 'south' : 'east')
      const w = widthOverride ?? def.defaultWidth
      const h = def.defaultHeight
      const hw = w / 2
      const hh = h / 2
      const isFillsWall = def.placement?.fillsWallThickness === true

      let elX: number, elY: number
      let elW: number | undefined, elH: number | undefined
      let rotation = 0
      let snapWallId: string | undefined

      if (isFillsWall) {
        snapWallId = wallId
        if (isH) {
          elX = wall.x + (centerAt !== undefined ? centerAt - hw : offsetFromStart ?? (wall.width / 2 - hw))
          elY = wall.y
          elW = w
          elH = wall.height
        } else {
          elX = wall.x
          elY = wall.y + (centerAt !== undefined ? centerAt - hw : offsetFromStart ?? (wall.height / 2 - hw))
          elW = wall.width
          elH = w
        }
      } else {
        if (isH) {
          const cxAlong = centerAt !== undefined
            ? wall.x + centerAt
            : wall.x + (offsetFromStart !== undefined ? offsetFromStart + hw : wall.width / 2)
          if (resolvedFace === 'north') {
            rotation = 180
            elX = cxAlong - hw
            elY = wall.y - h
          } else {
            rotation = 0
            elX = cxAlong - hw
            elY = wall.y + wall.height
          }
        } else {
          const cyAlong = centerAt !== undefined
            ? wall.y + centerAt
            : wall.y + (offsetFromStart !== undefined ? offsetFromStart + hw : wall.height / 2)
          if (resolvedFace === 'west') {
            rotation = 270
            const cx = wall.x + hh
            elX = cx - hw
            elY = cyAlong - hh
          } else {
            rotation = 90
            const cx = wall.x + wall.width - hh
            elX = cx - hw
            elY = cyAlong - hh
          }
        }
      }

      store.placeElement(bloxId, elX, elY, elW, elH, snapWallId, rotation || undefined)
      const powElements = getActiveElements(useStore.getState())
      const powNewEl = powElements[powElements.length - 1]
      return { success: true, element: powNewEl ? elementSummary(powNewEl, store.project?.mode ?? 'floorplan') : null }
    }

    case 'update_element': {
      const { id, properties: propsUpdate, ...updates } = payload as { id: string; properties?: Record<string, unknown>; [k: string]: unknown }
      const isElevation = (store.project?.mode ?? 'floorplan') === 'elevation'
      if (isElevation && updates.y !== undefined) {
        const el = getActiveElements(store).find(e => e.id === id)
        const h = updates.height !== undefined ? (updates.height as number) : (el?.height ?? 1)
        updates.y = ELEV_CANVAS_H - (updates.y as number) - h
      }
      // Merge properties rather than replace so auto-computed props (stepCount, etc.) are preserved
      if (propsUpdate) {
        const el = getActiveElements(store).find(e => e.id === id)
        updates.properties = { ...(el?.properties ?? {}), ...propsUpdate }
      }
      store.updateElement(id, updates as Parameters<typeof store.updateElement>[1])
      return { success: true }
    }

    case 'delete_elements': {
      const { ids } = payload as { ids: string[] }
      store.selectMany(ids, [])
      store.deleteSelectedElements()
      return { success: true, deleted: ids.length }
    }

    case 'add_dimension': {
      const { x1, y1, x2, y2, offset = -1.5 } = payload as {
        x1: number; y1: number; x2: number; y2: number; offset?: number
      }
      store.addDimension({ x1, y1, x2, y2, offset })
      const dims = getActiveDimensions(useStore.getState())
      const newDim = dims[dims.length - 1]
      return { success: true, id: newDim?.id ?? null }
    }

    case 'mirror_elements': {
      const { ids, axis } = payload as { ids: string[]; axis: 'h' | 'v' }
      store.selectMany(ids, [])
      store.mirrorSelected(axis)
      const newIds = useStore.getState().selectedElementIds
      return { success: true, mirroredIds: newIds }
    }

    case 'place_polygon': {
      const { points } = payload as { points: { x: number; y: number }[] }
      if (!points || points.length < 3) return { error: 'place_polygon requires at least 3 points' }
      store.placePolygon(points)
      const elements = getActiveElements(useStore.getState())
      const newEl = elements[elements.length - 1]
      return { success: true, element: newEl ? elementSummary(newEl, store.project?.mode ?? 'floorplan') : null }
    }

    case 'batch_place': {
      const { elements: placements } = payload as {
        elements: Array<{
          bloxId: string; anchor?: string; rotation?: number
          x?: number; y?: number; width?: number; height?: number
          x1?: number; y1?: number; x2?: number; y2?: number
          properties?: Record<string, unknown>
        }>
      }
      if (!placements?.length) return { error: 'batch_place requires a non-empty elements array' }
      const defMap = new Map(BLOX_DEFINITIONS.map(d => [d.id, d]))
      const batchMode = store.project?.mode ?? 'floorplan'
      const batchIsElev = batchMode === 'elevation'

      const resolved: Array<{ id: string; bloxId: string; x: number; y: number; width?: number; height?: number; rotation?: number }> = []
      const resolvedProps = new Map<string, Record<string, unknown>>()
      const skipped: Array<{ index: number; bloxId: string; reason: string }> = []

      for (let i = 0; i < placements.length; i++) {
        const p = placements[i]
        if (!defMap.has(p.bloxId)) {
          skipped.push({ index: i, bloxId: p.bloxId, reason: `Unknown blox id — use list_blox to see valid ids.` })
          continue
        }
        const def = defMap.get(p.bloxId)!
        const elemId = uuid()

        // Wall with x1,y1,x2,y2 — use same logic as place_wall
        if (WALL_BLOX_IDS.has(p.bloxId) && p.x1 !== undefined && p.y1 !== undefined && p.x2 !== undefined && p.y2 !== undefined) {
          const t = WALL_THICKNESS[p.bloxId] ?? 0.5
          const adx = Math.abs(p.x2 - p.x1)
          const ady = Math.abs(p.y2 - p.y1)
          if (ady < 0.01 || adx < 0.01) {
            if (adx >= ady) {
              resolved.push({ id: elemId, bloxId: p.bloxId, x: Math.min(p.x1, p.x2) - t / 2, y: p.y1 - t / 2, width: adx + t, height: t })
            } else {
              resolved.push({ id: elemId, bloxId: p.bloxId, x: p.x1 - t / 2, y: Math.min(p.y1, p.y2) - t / 2, width: t, height: ady + t })
            }
          } else {
            const dist = Math.sqrt(adx * adx + ady * ady)
            const angleDeg = Math.atan2(p.y2 - p.y1, p.x2 - p.x1) * (180 / Math.PI)
            const cx = (p.x1 + p.x2) / 2
            const cy = (p.y1 + p.y2) / 2
            resolved.push({ id: elemId, bloxId: p.bloxId, x: cx - dist / 2, y: cy - t / 2, width: dist, height: t, rotation: angleDeg })
          }
          if (p.properties) resolvedProps.set(elemId, p.properties)
          continue
        }

        // Regular element with x,y,width,height
        const w = p.width ?? def.defaultWidth
        const h = p.height ?? def.defaultHeight
        const [ox, oy] = getAnchorOffset(p.anchor ?? 'top-left', w, h)
        const elemY = batchIsElev
          ? elevToCanvasY(p.y ?? 0, oy)
          : (p.y ?? 0) + oy
        resolved.push({ id: elemId, bloxId: p.bloxId, x: (p.x ?? 0) + ox, y: elemY, width: p.width, height: p.height, rotation: p.rotation })
        if (p.properties) resolvedProps.set(elemId, p.properties)
      }

      store.batchPlaceElements(resolved)
      // Apply custom properties after batch placement
      if (resolvedProps.size > 0) {
        const allElsNow = getActiveElements(useStore.getState())
        for (const [id, props] of resolvedProps) {
          const el = allElsNow.find(e => e.id === id)
          if (el) {
            useStore.getState().updateElement(id, { properties: { ...el.properties, ...props } } as Parameters<typeof store.updateElement>[1])
          }
        }
      }
      // Split walls for any openings that were batch-placed
      const batchOpeningIds = resolved
        .filter(r => OPENING_BLOX_IDS.has(r.bloxId))
        .map(r => r.id)
      if (batchOpeningIds.length > 0) {
        useStore.getState().splitWallsForOpenings(batchOpeningIds)
      }
      const allEls = getActiveElements(useStore.getState())
      const placedIds = new Set(resolved.map(r => r.id))
      const placedEls = allEls.filter(e => placedIds.has(e.id))
      return {
        success: true,
        count: resolved.length,
        elements: placedEls.map(e => elementSummary(e, batchMode)),
        ...(skipped.length > 0 ? { skipped } : {}),
      }
    }

    case 'get_viewport': {
      const { getViewportFeet } = await import('../utils/exportManager')
      const vp = await getViewportFeet()
      if (!vp) return { error: 'No stage available' }
      return { ...vp, note: 'All values in feet. Use centerX/centerY as the anchor for new floor plans.' }
    }

    case 'fit_view': {
      const { fitView } = await import('../utils/exportManager')
      const ok = await fitView()
      return ok ? { success: true } : { error: 'No stage or elements to fit' }
    }

    case 'zoom_to': {
      const { xMin, xMax } = payload as { xMin: number; xMax: number }
      const mode = store.project?.mode ?? 'floorplan'
      const { zoomToRegion } = await import('../utils/exportManager')
      let canvasYMin: number, canvasYMax: number
      if (mode === 'elevation') {
        const { elevMin = 0, elevMax = 300 } = payload as { elevMin?: number; elevMax?: number }
        // elevation → canvas y: canvasY = ELEV_CANVAS_H - elevFt
        canvasYMin = ELEV_CANVAS_H - elevMax
        canvasYMax = ELEV_CANVAS_H - elevMin
      } else {
        const { yMin = 0, yMax = 200 } = payload as { yMin?: number; yMax?: number }
        canvasYMin = yMin
        canvasYMax = yMax
      }
      const ok = await zoomToRegion(xMin, xMax, canvasYMin, canvasYMax)
      return ok ? { success: true } : { error: 'No stage available' }
    }

    case 'get_snapshot': {
      const { gridIntervalFt } = payload as { gridIntervalFt?: number }

      let snapDataUrl: string
      let snapWidth: number
      let snapHeight: number
      let snapElementCount: number
      let underlayDescription: string | undefined

      if (gridIntervalFt != null) {
        const { getAnnotatedSnapshotDataUrl } = await import('../utils/exportManager')
        const snap = await getAnnotatedSnapshotDataUrl(gridIntervalFt)
        if (!snap) return { error: 'No stage or project available' }
        snapDataUrl = snap.dataUrl
        snapWidth = snap.width
        snapHeight = snap.height
        snapElementCount = snap.elementCount
      } else {
        const { getSnapshotDataUrl } = await import('../utils/exportManager')
        const snap = await getSnapshotDataUrl()
        if (!snap) return { error: 'No stage or project available' }
        snapDataUrl = snap.dataUrl
        snapWidth = snap.width
        snapHeight = snap.height
        snapElementCount = snap.elementCount
        underlayDescription = snap.underlayDescription
      }

      // Build underlay context so Claude can distinguish reference image content from placed elements
      let underlayNote: string | undefined
      if (store.project?.underlay?.visible) {
        underlayNote =
          'UNDERLAY REFERENCE IMAGE IS VISIBLE IN THIS SNAPSHOT. ' +
          'Architectural drawing conventions: walls = thick double parallel lines (solid fill between); ' +
          'floor material = hatch/grid pattern inside rooms (tile, travertine, etc.); ' +
          'dashed lines = overhead/hidden elements; dimension lines have arrowheads and numeric labels; ' +
          'North arrow and title block may appear at edges. ' +
          'IMPORTANT: These underlay lines are a tracing guide only — do NOT interpret them as placed blox. ' +
          `Only the ${snapElementCount} rendered element(s) with distinct shapes/fills are placed blox.` +
          (underlayDescription ? ` User description of this underlay: "${underlayDescription}"` : '')
      }

      return {
        snapshot: snapDataUrl,
        width: snapWidth,
        height: snapHeight,
        elementCount: snapElementCount,
        ...(gridIntervalFt != null ? { gridIntervalFt, coordinateGridNote: 'Blue labels = x (canvas ft from origin). Orange labels = elevation above grade (elevation mode) or y (floor plan mode). Read coordinates directly from the grid lines to precisely place elements.' } : {}),
        ...(underlayNote ? { underlayNote } : {}),
      }
    }

    case 'clear_project': {
      const { project } = store
      if (!project) return { error: 'No project open' }
      const activeEls = getActiveElements(store)
      store.selectMany(activeEls.map(e => e.id), [])
      store.deleteSelectedElements()
      const remaining = getActiveElements(useStore.getState())
      return { success: true, deletedCount: activeEls.length - remaining.length }
    }

    case 'lock_elements': {
      const { ids } = payload as { ids: string[] }
      ids.forEach(id => store.updateElement(id, { locked: true } as Parameters<typeof store.updateElement>[1]))
      return { success: true, locked: ids.length }
    }

    case 'unlock_elements': {
      const { ids } = payload as { ids: string[] }
      ids.forEach(id => store.updateElement(id, { locked: false } as Parameters<typeof store.updateElement>[1]))
      return { success: true, unlocked: ids.length }
    }

    case 'set_underlay': {
      const { imageUrl, realWidthFt } = payload as { imageUrl: string; realWidthFt?: number }
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image()
        // crossOrigin only for actual remote URLs — breaks file:// and localhost
        if (imageUrl.startsWith('https://')) el.crossOrigin = 'anonymous'
        el.onload = () => resolve(el)
        el.onerror = (_e) => reject(new Error(`Failed to load underlay image: ${imageUrl}`))
        el.src = imageUrl
      })
      store.setUnderlay({
        imageData: imageUrl,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        opacity: 0.5,
        visible: true,
        calibration: realWidthFt ? { method: 'simple', realWidthFt } : null
      })
      return { success: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
    }

    case 'clear_underlay': {
      store.clearUnderlay()
      return { success: true }
    }

    case 'set_underlay_opacity': {
      const { opacity } = payload as { opacity: number }
      store.setUnderlayOpacity(Math.max(0.05, Math.min(1, opacity)))
      return { success: true }
    }

    case 'set_underlay_visible': {
      const { visible } = payload as { visible: boolean }
      store.setUnderlayVisible(visible)
      return { success: true }
    }

    case 'get_underlay_info': {
      const u = store.project?.underlay
      if (!u) return { hasUnderlay: false }
      return {
        hasUnderlay: true,
        naturalWidth: u.naturalWidth,
        naturalHeight: u.naturalHeight,
        opacity: u.opacity,
        visible: u.visible,
        calibration: u.calibration,
        imageUrl: u.imageData
      }
    }

    case 'undo': {
      store.undo()
      return { success: true }
    }

    case 'redo': {
      store.redo()
      return { success: true }
    }

    case 'get_drawing_mode': {
      const { project } = store
      if (!project) return { error: 'No project open' }
      const mode = project.mode ?? 'floorplan'
      const noteMap: Record<string, string> = {
        elevation: 'Elevation canvas: 200ft wide × 300ft tall. y = elevation from ground in feet (0 = ground, 300 = top). Use anchor "bottom-left" so y = sill/base height.',
        detail:    'Detail canvas: 240" wide × 180" tall. Coordinates are in INCHES (1 unit = 1 inch). At scale 1:1, a 3.5" stud is 3.5 units tall. Use detail blox (insulation-batt, detail-drywall, detail-stud-2x4). Dimension labels show fractional inches.',
        floorplan: 'Floor plan canvas: 200×200ft. y=0 = top, y increases downward.',
      }
      return { mode, coordinateNote: noteMap[mode] ?? noteMap.floorplan }
    }

    case 'set_drawing_mode': {
      const { mode } = payload as { mode: string }
      if (mode !== 'floorplan' && mode !== 'elevation' && mode !== 'detail') {
        return { error: 'mode must be "floorplan", "elevation", or "detail"' }
      }
      store.setDrawingMode(mode)
      return { success: true, mode }
    }

    // ── measure_gap ─────────────────────────────────────────────────────────
    case 'measure_gap': {
      const { id1, edge1 = 'right', id2, edge2 = 'left' } = payload as {
        id1: string; edge1?: string; id2: string; edge2?: string
      }
      const els = getActiveElements(store)
      const a = els.find(e => e.id === id1)
      const b = els.find(e => e.id === id2)
      if (!a) return { error: `Element ${id1} not found` }
      if (!b) return { error: `Element ${id2} not found` }
      const mode = store.project?.mode ?? 'floorplan'
      const v1 = getEdgeValue(a, edge1, mode)
      const v2 = getEdgeValue(b, edge2, mode)
      const gap = r(v2 - v1)
      return {
        gap,
        from: `${id1} ${edge1}`,
        to: `${id2} ${edge2}`,
        status: gap > 0.01 ? 'gap' : gap < -0.01 ? 'overlap' : 'flush',
      }
    }

    // ── align_elements ──────────────────────────────────────────────────────
    case 'align_elements': {
      const { ids, axis, to } = payload as {
        ids: string[]; axis: string; to?: string | number
      }
      const mode = store.project?.mode ?? 'floorplan'
      const isElevation = mode === 'elevation'
      const allEls = getActiveElements(store)
      const els = allEls.filter(e => ids.includes(e.id))
      if (els.length < 2) return { error: 'Need at least 2 element IDs' }

      // distribute-x / distribute-y: evenly space between the two outermost elements
      if (axis === 'distribute-x' || axis === 'distribute-y') {
        if (els.length < 3) return { error: 'Need at least 3 elements to distribute' }
        const isX = axis === 'distribute-x'
        const sorted = [...els].sort((a, b) => isX ? a.x - b.x : a.y - b.y)
        const first = sorted[0], last = sorted[sorted.length - 1]
        const totalElSize = sorted.reduce((s, e) => s + (isX ? e.width : e.height), 0)
        const span = isX
          ? (last.x + last.width) - first.x
          : (last.y + last.height) - first.y
        const gap = (span - totalElSize) / (sorted.length - 1)
        let cursor = isX ? first.x + first.width + gap : first.y + first.height + gap
        for (let i = 1; i < sorted.length - 1; i++) {
          const upd = isX ? { x: r(cursor) } : { y: r(cursor) }
          store.updateElement(sorted[i].id, upd as Parameters<typeof store.updateElement>[1])
          cursor += (isX ? sorted[i].width : sorted[i].height) + gap
        }
        return { success: true, axis, gap: r(gap), count: els.length }
      }

      const isYAxis = axis === 'top' || axis === 'bottom' || axis === 'center-y'

      // Compute target value in MCP coordinates
      let target: number
      if (typeof to === 'number') {
        target = to
      } else if (typeof to === 'string' && to !== 'min' && to !== 'max') {
        // Align to a specific element's edge
        const anchorEl = allEls.find(e => e.id === to)
        if (!anchorEl) return { error: `Anchor element ${to} not found` }
        if (axis === 'center-x') {
          target = anchorEl.x + anchorEl.width / 2
        } else if (axis === 'center-y') {
          target = isElevation
            ? (getEdgeValue(anchorEl, 'bottom', mode) + getEdgeValue(anchorEl, 'top', mode)) / 2
            : anchorEl.y + anchorEl.height / 2
        } else {
          target = getEdgeValue(anchorEl, axis, mode)
        }
      } else {
        // 'min' or 'max' of the selection (default: min for left/top, max for right/bottom)
        const useMax = (to === 'max') || (to === undefined && (axis === 'right' || axis === 'bottom'))
        const values = els.map(e => {
          if (axis === 'center-x') return e.x + e.width / 2
          if (axis === 'center-y') return isElevation
            ? (getEdgeValue(e, 'bottom', mode) + getEdgeValue(e, 'top', mode)) / 2
            : e.y + e.height / 2
          return getEdgeValue(e, axis, mode)
        })
        target = useMax ? Math.max(...values) : Math.min(...values)
      }

      // Apply alignment to each element
      const moved: string[] = []
      for (const el of els) {
        const updates: Partial<{ x: number; y: number }> = {}
        if (axis === 'left')     updates.x = r(target)
        if (axis === 'right')    updates.x = r(target - el.width)
        if (axis === 'center-x') updates.x = r(target - el.width / 2)
        if (isYAxis)             updates.y = r(targetToCanvasY(target, axis, el.height, mode))
        if (updates.x !== undefined && r(updates.x) !== r(el.x)) { /* x changed */ }
        if (updates.y !== undefined && r(updates.y) !== r(el.y)) { /* y changed */ }
        if (Object.keys(updates).length > 0) {
          store.updateElement(el.id, updates as Parameters<typeof store.updateElement>[1])
          moved.push(el.id)
        }
      }
      return { success: true, axis, target: r(target), moved }
    }

    // ── query_wall_openings ─────────────────────────────────────────────────
    case 'query_wall_openings': {
      const { wallId } = payload as { wallId: string }
      const els = getActiveElements(store)
      const wall = els.find(e => e.id === wallId)
      if (!wall) return { error: `Wall ${wallId} not found` }
      const isH = wall.width >= wall.height
      const openings = els.filter(op =>
        OPENING_BLOX.has(op.bloxId) &&
        op.x < wall.x + wall.width && op.x + op.width > wall.x &&
        op.y < wall.y + wall.height && op.y + op.height > wall.y
      )
      return {
        wallId, orientation: isH ? 'horizontal' : 'vertical',
        wallLength: r(isH ? wall.width : wall.height),
        openings: openings.map(op => {
          const offsetFromStart = r(isH ? op.x - wall.x : op.y - wall.y)
          const opLength = isH ? op.width : op.height
          const gapToEnd = r((isH ? wall.x + wall.width : wall.y + wall.height) - (isH ? op.x + op.width : op.y + op.height))
          const centered = Math.abs(offsetFromStart - gapToEnd) < 0.1
          return { id: op.id, bloxId: op.bloxId, width: r(op.width), height: r(op.height), offsetFromStart, gapToEnd, centered }
        })
      }
    }

    // ── verify_layout ───────────────────────────────────────────────────────
    case 'verify_layout': {
      const { checks } = payload as {
        checks: Array<{
          type: string; label?: string; tolerance?: number
          id?: string; id1?: string; id2?: string; on?: string
          axis?: string; edge?: string; edge1?: string; edge2?: string
          min?: number; max?: number; expected?: number
        }>
      }
      const els = getActiveElements(store)
      const mode = store.project?.mode ?? 'floorplan'
      const GLOBAL_TOL = 0.05

      const results = checks.map(chk => {
        const label = chk.label ?? chk.type
        const tol = chk.tolerance ?? GLOBAL_TOL
        const find = (id?: string) => id ? els.find(e => e.id === id) : undefined
        try {
          switch (chk.type) {

            case 'centered': {
              const el = find(chk.id), ref = find(chk.on)
              if (!el || !ref) return { label, pass: false, error: 'Element not found' }
              const ax = chk.axis ?? 'x'
              let delta: number
              if (ax === 'x') {
                delta = r((el.x + el.width / 2) - (ref.x + ref.width / 2))
              } else {
                const elCY = mode === 'elevation'
                  ? (getEdgeValue(el, 'bottom', mode) + getEdgeValue(el, 'top', mode)) / 2
                  : el.y + el.height / 2
                const refCY = mode === 'elevation'
                  ? (getEdgeValue(ref, 'bottom', mode) + getEdgeValue(ref, 'top', mode)) / 2
                  : ref.y + ref.height / 2
                delta = r(elCY - refCY)
              }
              return { label, pass: Math.abs(delta) <= tol, expected: 0, actual: delta, unit: 'ft', note: `${ax} center offset` }
            }

            case 'flush': {
              const a = find(chk.id1 ?? chk.id), b = find(chk.id2)
              if (!a || !b) return { label, pass: false, error: 'Element not found' }
              const delta = r(getEdgeValue(b, chk.edge2 ?? 'left', mode) - getEdgeValue(a, chk.edge1 ?? 'right', mode))
              return { label, pass: Math.abs(delta) <= tol, expected: 0, actual: delta, unit: 'ft' }
            }

            case 'gap': {
              const a = find(chk.id1 ?? chk.id), b = find(chk.id2)
              if (!a || !b) return { label, pass: false, error: 'Element not found' }
              const gap = r(getEdgeValue(b, chk.edge2 ?? 'left', mode) - getEdgeValue(a, chk.edge1 ?? 'right', mode))
              const expected = chk.expected ?? 0
              return { label, pass: Math.abs(gap - expected) <= tol, expected, actual: gap, unit: 'ft' }
            }

            case 'clearance': {
              const a = find(chk.id1 ?? chk.id), b = find(chk.id2)
              if (!a || !b) return { label, pass: false, error: 'Element not found' }
              const gap = r(getEdgeValue(b, chk.edge2 ?? 'left', mode) - getEdgeValue(a, chk.edge1 ?? 'right', mode))
              const minC = chk.min ?? 0
              return { label, pass: gap >= minC - tol, expected: `>= ${minC}`, actual: gap, unit: 'ft' }
            }

            case 'dimension': {
              const el = find(chk.id)
              if (!el) return { label, pass: false, error: 'Element not found' }
              const actual = (chk.axis ?? 'width') === 'width' ? el.width : el.height
              const expected = chk.expected ?? 0
              return { label, pass: Math.abs(actual - expected) <= tol, expected, actual: r(actual), unit: 'ft' }
            }

            case 'no_overlap': {
              const a = find(chk.id1 ?? chk.id), b = find(chk.id2)
              if (!a || !b) return { label, pass: false, error: 'Element not found' }
              const overlaps = a.x < b.x + b.width && a.x + a.width > b.x &&
                               a.y < b.y + b.height && a.y + a.height > b.y
              return { label, pass: !overlaps, note: overlaps ? 'Elements overlap' : 'No overlap' }
            }

            default:
              return { label, pass: false, error: `Unknown check type: ${chk.type}` }
          }
        } catch (e) {
          return { label, pass: false, error: String(e) }
        }
      })

      const passCount = results.filter(r => r.pass).length
      return { allPass: passCount === results.length, passCount, total: results.length, results }
    }

    case 'pick_point': {
      const pt = await new Promise<{ x: number; y: number }>((resolve) => {
        useStore.getState().setPendingPickPoint(resolve)
      })
      return { x: r(pt.x), y: r(pt.y) }
    }

    case 'place_arc_wall': {
      const {
        cx, cy, radius, startAngle, endAngle, thickness = 0.5,
      } = payload as { cx: number; cy: number; radius: number; startAngle: number; endAngle: number; thickness?: number }
      useStore.getState().placeArcWall({ cx, cy, radius, startAngle, endAngle, thickness })
      const arcWalls = useStore.getState().project?.arcWalls ?? []
      const newWall = arcWalls[arcWalls.length - 1]
      return { success: true, id: newWall?.id ?? null }
    }

    case 'auto_dimension': {
      const { ids } = payload as { ids?: string[] }
      const store = useStore.getState()
      if (ids && ids.length > 0) store.selectMany(ids)
      store.autoDimSelected('left')
      store.autoDimSelected('up')
      return { success: true }
    }

    case 'add_callouts': {
      const { ids } = payload as { ids?: string[] }
      const store = useStore.getState()
      if (ids && ids.length > 0) store.selectMany(ids)
      store.autoCallout()
      return { success: true }
    }

    case 'suggest_missing': {
      const store = useStore.getState()
      const project = store.project
      if (!project) return { suggestions: [] }
      const els = getActiveElements(store)
      const has = (id: string) => els.some(e => e.bloxId === id)
      const hasPrefix = (prefix: string) => els.some(e => e.bloxId.startsWith(prefix))
      const hasPitchedLayer = (type: string) => els.some(e => e.bloxId === 'detail-pitched-layer' && e.properties?.layerType === type)
      const suggestions: { bloxId: string; name: string; reason: string }[] = []

      if (project.mode === 'detail') {
        const hasRafter = has('detail-rafter')
        const hasStud = hasPrefix('detail-stud-') || hasPrefix('detail-post-')
        const hasSheathing = has('detail-plywood') || hasPitchedLayer('plywood')
        const hasFelt = has('detail-felt') || hasPitchedLayer('felt')
        const hasShingles = has('detail-shingles') || hasPitchedLayer('shingles')
        const hasDrywall = has('detail-drywall')
        const hasInsulation = has('insulation-batt') || has('detail-rigid-insulation')
        const hasVentBaffle = has('detail-vent-baffle')
        const hasFlashing = has('detail-flashing')
        const hasSoffit = has('detail-soffit-panel')
        const hasGutter = has('detail-gutter')
        const hasFascia = els.some(e => e.bloxId.startsWith('detail-stud-') && e.width < e.height * 0.3)

        if (hasRafter && !hasSheathing) suggestions.push({ bloxId: 'detail-pitched-layer', name: 'Roof Sheathing', reason: 'Rafter present but no plywood sheathing above it' })
        if (hasSheathing && !hasFelt) suggestions.push({ bloxId: 'detail-pitched-layer', name: 'Felt Underlayment', reason: 'Sheathing present but no felt underlayment between sheathing and shingles' })
        if ((hasSheathing || hasFelt) && !hasShingles) suggestions.push({ bloxId: 'detail-pitched-layer', name: 'Shingles', reason: 'Roof sheathing present but no shingles' })
        if (hasRafter && !hasVentBaffle) suggestions.push({ bloxId: 'detail-vent-baffle', name: 'Ventilation Baffle', reason: 'Rafter present but no vent baffle — required for vented roof assemblies' })
        if (hasStud && !hasDrywall) suggestions.push({ bloxId: 'detail-drywall', name: 'Gypsum Wallboard', reason: 'Wall framing present but no interior drywall' })
        if (hasStud && !hasInsulation) suggestions.push({ bloxId: 'insulation-batt', name: 'Batt Insulation', reason: 'Wall framing present but no insulation in cavity' })
        if (hasShingles && !hasFlashing) suggestions.push({ bloxId: 'detail-flashing', name: 'Drip Edge Flashing', reason: 'Shingles present but no eave drip edge flashing' })
        if (hasSoffit && !hasGutter) suggestions.push({ bloxId: 'detail-gutter', name: 'Gutter', reason: 'Soffit panel present but no gutter at eave' })
      } else {
        // Floor plan suggestions
        const hasDoor = els.some(e => e.bloxId.startsWith('door-'))
        const hasWindow = els.some(e => e.bloxId.startsWith('window-'))
        const hasSmoke = has('smoke-detector')
        const hasBedroom = els.some(e => (e.properties?.roomName as string ?? '').toLowerCase().includes('bed'))
        if (hasBedroom && !hasSmoke) suggestions.push({ bloxId: 'smoke-detector', name: 'Smoke Detector', reason: 'Bedroom present but no smoke detector — IRC R314 requires one in each sleeping room' })
        if (!hasDoor && !hasWindow) suggestions.push({ bloxId: 'door-single', name: 'Door', reason: 'No doors or windows placed yet' })
      }

      return { suggestions, count: suggestions.length }
    }

    case 'get_rooms': {
      const store = useStore.getState()
      if (!store.project) return { rooms: [] }
      const els = getActiveElements(store)
      const rooms = detectRooms(els)
      return { rooms, count: rooms.length }
    }

    case 'get_wall_graph': {
      const store = useStore.getState()
      if (!store.project) return { error: 'No project open' }
      const els = getActiveElements(store)
      const graph = buildWallGraph(els)
      return { ...graph }
    }

    case 'close_gap': {
      const { wallId, end } = payload as { wallId: string; end: 'start' | 'end' }
      const store = useStore.getState()
      if (!store.project) return { error: 'No project open' }
      const els = getActiveElements(store)
      const graph = buildWallGraph(els)
      const node = graph.walls.find(w => w.id === wallId)
      if (!node) return { error: `Wall ${wallId} not found in graph` }
      if (!node.openEnds.includes(end)) return { error: `Wall ${wallId} end "${end}" is already connected` }

      const gap = graph.gaps.find(g => g.wallId === wallId && g.end === end)
      if (!gap || !gap.nearestWallId || gap.gapFt === Infinity)
        return { error: 'No candidate wall found to close gap toward' }

      // Extend the wall to meet the nearest wall's endpoint
      const el = els.find(e => e.id === wallId)
      if (!el) return { error: 'Wall element not found' }

      const target = gap.nearestEndpoint!
      const isH = el.width >= el.height

      if (isH) {
        if (end === 'start') {
          // Extend left: decrease x, increase width
          const newX = target.x
          const newW = el.x + el.width - newX
          store.updateElement(wallId, { x: newX, width: newW } as Parameters<typeof store.updateElement>[1])
        } else {
          // Extend right: increase width
          const newW = target.x - el.x
          store.updateElement(wallId, { width: newW } as Parameters<typeof store.updateElement>[1])
        }
      } else {
        if (end === 'start') {
          // Extend up: decrease y, increase height
          const newY = target.y
          const newH = el.y + el.height - newY
          store.updateElement(wallId, { y: newY, height: newH } as Parameters<typeof store.updateElement>[1])
        } else {
          // Extend down: increase height
          const newH = target.y - el.y
          store.updateElement(wallId, { height: newH } as Parameters<typeof store.updateElement>[1])
        }
      }

      return { success: true, extendedTo: target, gapClosedFt: gap.gapFt }
    }

    case 'find_elements': {
      const {
        bloxId, category, roomName, nearPoint, nearRadiusFt = 10,
        hasProperty, limit = 50,
      } = payload as {
        bloxId?: string
        category?: string
        roomName?: string
        nearPoint?: { x: number; y: number }
        nearRadiusFt?: number
        hasProperty?: string
        limit?: number
      }
      const store = useStore.getState()
      if (!store.project) return { elements: [] }
      const { BLOX_DEFINITIONS: defs } = await import('../blox/definitions')
      let els = getActiveElements(store)

      if (bloxId) {
        const pat = bloxId.toLowerCase()
        els = els.filter(e => e.bloxId === pat || e.bloxId.includes(pat))
      }
      if (category) {
        const cat = category.toLowerCase()
        els = els.filter(e => {
          const def = defs.find((d: { id: string }) => d.id === e.bloxId) as { category?: string } | undefined
          return def?.category?.toLowerCase().includes(cat)
        })
      }
      if (hasProperty) {
        els = els.filter(e => e.properties && hasProperty in e.properties)
      }
      if (nearPoint) {
        els = els.filter(e => {
          const cx = e.x + e.width / 2, cy = e.y + e.height / 2
          return Math.hypot(cx - nearPoint.x, cy - nearPoint.y) <= nearRadiusFt
        })
      }
      if (roomName) {
        const allEls = getActiveElements(store)
        const rooms = detectRooms(allEls)
        const room = rooms.find(r => r.name.toLowerCase().includes(roomName.toLowerCase()))
        if (room) {
          const inRoom = new Set(room.elementIds)
          els = els.filter(e => inRoom.has(e.id))
        } else {
          els = []
        }
      }

      const mode = store.project.mode ?? 'floorplan'
      return {
        elements: els.slice(0, limit).map(e => elementSummary(e, mode)),
        count: els.length,
        ...(els.length > limit ? { truncated: true, showing: limit } : {}),
      }
    }

    case 'get_design_guide': {
      const { roomType } = payload as { roomType?: string }
      const rt = (roomType ?? '').toLowerCase()
      type Guide = {
        minAreaSqFt?: number; minDimFt?: number; note?: string
        clearances?: Record<string, string>; fixtures?: string[]; code?: string[]
      }
      const guides: Record<string, Guide> = {
        bedroom: {
          minAreaSqFt: 70, minDimFt: 7,
          clearances: { 'door swing': '30" clear arc', 'bed side': '18" min each side', 'closet': '24" depth' },
          fixtures: ['bed', 'dresser', 'closet or wardrobe'],
          code: ['IRC R304.1: ≥70 SF', 'IRC R304.2: ≥7ft shortest dimension', 'IRC R310: egress window required — min 20" clear width, 24" clear height, 5.7 SF net area, sill ≤44" AFF'],
        },
        bathroom: {
          clearances: { 'toilet side': '15" min center to wall (18" preferred)', 'toilet front': '21" min clear (30" preferred)', 'lavatory': '15" min center to wall', 'shower/tub': '36" min clear access' },
          fixtures: ['toilet', 'lavatory/sink', 'tub or shower'],
          code: ['IRC P2705: toilet 15" from center to side obstruction', 'ADA 604: 18" center to side wall (accessible)'],
        },
        kitchen: {
          clearances: { 'work aisle': '42" min (48" two-cook)', 'appliance front': '36" clear in front of range', 'refrigerator': '36" clear swing arc' },
          fixtures: ['refrigerator', 'range/cooktop', 'sink', 'dishwasher', 'upper/lower cabinets'],
          note: 'Kitchen triangle (fridge→sink→range) should total 12–26ft. No leg < 4ft or > 9ft.',
        },
        hallway: {
          minDimFt: 3.0,
          clearances: { 'width': '36" min clear (44" for accessible)', 'door swing': 'must not reduce clear to <28"' },
          code: ['IRC R311.4: ≥36" clear width'],
        },
        living: {
          minAreaSqFt: 120,
          clearances: { 'sofa to TV': '8–12ft viewing distance', 'circulation': '36" min pass-through' },
          fixtures: ['sofa', 'chairs', 'coffee table', 'TV/media console'],
        },
        garage: {
          clearances: { 'single car': '12×20ft min', 'double car': '20×20ft min', 'door clearance': '8ft wide × 7ft tall min' },
          code: ['IRC R302.5: fire separation — 1-HR rated wall to living area', 'Door: 20-min fire rated, self-closing'],
        },
        stair: {
          clearances: { 'width': '36" min clear', 'headroom': '6\'-8" min', 'tread depth': '10" min', 'riser height': '7¾" max' },
          code: ['IRC R311.7.5: min tread 10", max riser 7¾"', 'IRC R311.7.8: min 36" clear width'],
        },
      }
      // Try exact match, then partial
      const key = Object.keys(guides).find(k => rt.includes(k)) ?? null
      if (key) return { roomType: key, guide: guides[key] }
      return {
        available: Object.keys(guides),
        message: 'Pass roomType: bedroom | bathroom | kitchen | hallway | living | garage | stair',
      }
    }

    default:
      return { error: `Unknown action: ${action}` }
  }
}

export function useMcpBridge() {
  useEffect(() => {
    if (!window.api?.onMcpAction) return

    window.api.onMcpAction(async ({ requestId, action, payload }) => {
      try {
        const result = await handleMcpAction(action, (payload ?? {}) as Record<string, unknown>)
        window.api.mcpRespond(requestId, result)
      } catch (e) {
        window.api.mcpRespond(requestId, { error: String(e) })
      }
    })
  }, [])
}
