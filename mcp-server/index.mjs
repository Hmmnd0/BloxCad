#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import Anthropic from '@anthropic-ai/sdk'

import { readFile, writeFile, unlink } from 'fs/promises'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = 57489
const BASE = `http://localhost:${PORT}`

const WALL_THICKNESS_MAP = {
  'wall-exterior': 0.5,
  'wall-interior': 0.375,
  'wall-cmu': 0.667,
  'wall-glazing': 0.375,
}

// Single-pass DXF parser: returns segments (or null if dryRun), bounds, layer names, and count.
// Handles LINE, LWPOLYLINE, POLYLINE entities. Collects all layer names in one pass.
function parseDxf(dxfText, { scaleFt, layerFilter, minLengthFt, dryRun }) {
  const lines = dxfText.split(/\r?\n/).map(l => l.trim())
  const segments = dryRun ? null : []
  const allLayersSet = new Set()
  const segLayersSet = new Set()
  let segmentCount = 0
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  let i = 0

  function trackBounds(x, y) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }

  function addSeg(x1, y1, x2, y2, layer) {
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    if (len < minLengthFt) return
    segmentCount++
    trackBounds(x1, y1); trackBounds(x2, y2)
    segLayersSet.add(layer)
    if (segments) segments.push({ rawX1: x1, rawY1: y1, rawX2: x2, rawY2: y2, layer })
  }

  // Collect layer names from TABLES/HEADER sections before ENTITIES
  while (i < lines.length - 1) {
    if (lines[i] === '8') allLayersSet.add(lines[i + 1])
    if (lines[i] === '2' && lines[i + 1] === 'ENTITIES') { i += 2; break }
    i++
  }

  while (i < lines.length - 1) {
    const code = parseInt(lines[i])
    if (isNaN(code)) { i++; continue }
    const value = lines[i + 1]
    i += 2

    if (code === 0 && value === 'ENDSEC') break
    if (code === 8) allLayersSet.add(value)

    if (code === 0 && value === 'LINE') {
      let layer = '0', x1 = 0, y1 = 0, x2 = 0, y2 = 0
      while (i < lines.length - 1) {
        const c = parseInt(lines[i])
        if (isNaN(c)) { i++; continue }
        const v = lines[i + 1]; i += 2
        if (c === 0) { i -= 2; break }
        if (c === 8) layer = v
        if (c === 10) x1 = parseFloat(v) * scaleFt
        if (c === 20) y1 = parseFloat(v) * scaleFt
        if (c === 11) x2 = parseFloat(v) * scaleFt
        if (c === 21) y2 = parseFloat(v) * scaleFt
      }
      if (!layerFilter || layerFilter.includes(layer)) addSeg(x1, y1, x2, y2, layer)
    }

    else if (code === 0 && value === 'LWPOLYLINE') {
      let layer = '0', flags = 0
      const verts = []
      let pendingX = null
      while (i < lines.length - 1) {
        const c = parseInt(lines[i])
        if (isNaN(c)) { i++; continue }
        const v = lines[i + 1]; i += 2
        if (c === 0) { i -= 2; break }
        if (c === 8) layer = v
        if (c === 70) flags = parseInt(v)
        if (c === 10) pendingX = parseFloat(v) * scaleFt
        if (c === 20 && pendingX !== null) { verts.push({ x: pendingX, y: parseFloat(v) * scaleFt }); pendingX = null }
      }
      if (!layerFilter || layerFilter.includes(layer)) {
        const isClosed = (flags & 1) === 1
        const segCount = isClosed ? verts.length : verts.length - 1
        for (let j = 0; j < segCount; j++) {
          const v1 = verts[j], v2 = verts[(j + 1) % verts.length]
          addSeg(v1.x, v1.y, v2.x, v2.y, layer)
        }
      }
    }

    else if (code === 0 && value === 'POLYLINE') {
      let layer = '0', flags = 0
      while (i < lines.length - 1) {
        const c = parseInt(lines[i])
        if (isNaN(c)) { i++; continue }
        const v = lines[i + 1]; i += 2
        if (c === 0) { i -= 2; break }
        if (c === 8) layer = v
        if (c === 70) flags = parseInt(v)
      }
      const verts = []
      while (i < lines.length - 1) {
        const c = parseInt(lines[i])
        if (isNaN(c)) { i++; continue }
        const v = lines[i + 1]; i += 2
        if (c === 0) {
          if (v === 'SEQEND') break
          if (v === 'VERTEX') {
            let vx = 0, vy = 0
            while (i < lines.length - 1) {
              const vc = parseInt(lines[i])
              if (isNaN(vc)) { i++; continue }
              const vv = lines[i + 1]; i += 2
              if (vc === 0) { i -= 2; break }
              if (vc === 10) vx = parseFloat(vv) * scaleFt
              if (vc === 20) vy = parseFloat(vv) * scaleFt
            }
            verts.push({ x: vx, y: vy })
          }
        }
      }
      if (!layerFilter || layerFilter.includes(layer)) {
        const isClosed = (flags & 1) === 1
        const segCount = isClosed ? verts.length : verts.length - 1
        for (let j = 0; j < segCount; j++) {
          const v1 = verts[j], v2 = verts[(j + 1) % verts.length]
          addSeg(v1.x, v1.y, v2.x, v2.y, layer)
        }
      }
    }
  }

  return {
    segments,
    segmentCount,
    allLayers: [...allLayersSet].sort(),
    segLayers: [...segLayersSet].sort(),
    minX, maxX, minY, maxY,
  }
}

// Detect DXF units from $INSUNITS header variable (returns feet-per-unit)
function detectDxfScale(dxfText) {
  const m = dxfText.match(/\$INSUNITS[\s\S]{0,60}?70\s*\n\s*(\d+)/)
  if (!m) return null
  // DXF INSUNITS: 1=in, 2=ft, 4=mm, 5=cm, 6=m, 14=microin, 15=mils, etc.
  const unit = parseInt(m[1])
  const map = { 1: 1/12, 2: 1, 4: 1/304.8, 5: 1/30.48, 6: 3.28084 }
  return map[unit] ?? null
}

async function callBloxCAD(action, payload = {}) {
  let res
  try {
    res = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    const msg = e.code === 'ECONNREFUSED' || e.name === 'TimeoutError'
      ? 'bloxCAD is not running — open the app first.'
      : e.message
    throw new Error(msg)
  }
  const body = await res.json()
  if (body.error) throw new Error(body.error)
  return body
}

const TOOLS = [
  {
    name: 'list_blox',
    description:
      'List every architectural element available in the bloxCAD library. ' +
      'Returns id, name, category, description, and default width/height in feet. ' +
      'Always call this before place_element so you know valid bloxId values.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_project',
    description:
      'Return the current project state: all placed elements (id, bloxId, x, y, width, height in feet, rotation) ' +
      'and dimension lines. Returns null if no project is open in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'place_element',
    description:
      'Place an architectural element on the canvas. x/y position is determined by the anchor point ' +
      '(default "top-left"). Use anchor "center" to place by center point, which is much easier for ' +
      'centering elements in rooms or on walls. ' +
      'Use relativeToId + relativeAnchor to position relative to another element instead of absolute coordinates — ' +
      'e.g. place a sink 0.5ft from the right edge of a counter. ' +
      'Doors and windows auto-snap to the nearest wall within 3ft. ' +
      'width/height are optional — omit to use the blox default size. ' +
      'ELEVATION MODE: y is elevation from ground in feet (y=0 = ground, y=300 = top). ' +
      'Use anchor "bottom-left" so y = sill/base height of the element. ' +
      'Example: window with sill at 3ft, height 4ft → y=3, height=4, anchor="bottom-left". ' +
      'DETAIL MODE: x/y and width/height are in INCHES. Use detail blox (detail-drywall, detail-stud-2x4, insulation-batt). ' +
      'FLOOR PLAN MODE: y is canvas distance from origin in feet (y increases downward). ' +
      'Returns the new element id.',
    inputSchema: {
      type: 'object',
      properties: {
        bloxId:  { type: 'string', description: 'Element type ID from list_blox, e.g. "fixture-toilet", "door-single"' },
        x:       { type: 'number', description: 'X position in feet (meaning depends on anchor)' },
        y:       { type: 'number', description: 'Y position in feet (meaning depends on anchor)' },
        width:   { type: 'number', description: 'Width in feet (optional)' },
        height:  { type: 'number', description: 'Height in feet (optional)' },
        rotation: { type: 'number', description: 'Rotation in degrees (optional, default 0) — e.g. for an angled conduit/duct run computed from two points: atan2(y2-y1, x2-x1) in degrees.' },
        anchor:  {
          type: 'string',
          enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
          description: 'Which point of the element x/y refers to (default: "top-left")'
        },
        relativeToId: {
          type: 'string',
          description: 'If set, x/y are treated as an offset from the anchor point of this element ID rather than absolute coordinates'
        },
        relativeAnchor: {
          type: 'string',
          enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
          description: 'Which anchor point of relativeToId to measure from (default: "top-left")'
        },
        properties: {
          type: 'object',
          description: 'Optional element-specific properties merged into the element on placement. Examples: { "fillColor": "#B87333" } for copper color; { "angleDeg": 30 } for louver fins or angled panels; { "floorLabel": "FL 7 / 79\'-6\\"" } for floor markers; { "material": "COPPER SPANDREL PANEL" } for callouts; { "taperFt": 2 } for tapered slabs; { "glassColor": "#B8D2E4" } for curtain wall / ribbon window; { "solidBays": [0, 2] } for ribbon window solid bays; { "fillPattern": "triangles" } for spandrel panels; { "fontSize": 18 } for annotation-leader callout text size (default ~12, range 6-36) or text-note body size (default 11, range 6-48).'
        },
      },
      required: ['bloxId', 'x', 'y']
    }
  },
  {
    name: 'place_wall',
    description:
      'Draw a wall segment from (x1,y1) to (x2,y2). ' +
      'Axis-aligned walls snap to horizontal or vertical automatically. ' +
      'DIAGONAL WALLS: any angle is supported — just set x1,y1,x2,y2 to any two points and the wall rotates to match. ' +
      'Thickness and corner extensions are applied automatically for all wall types. ' +
      'Returns the new element with its actual rendered position.',
    inputSchema: {
      type: 'object',
      properties: {
        x1:       { type: 'number', description: 'Start X in feet' },
        y1:       { type: 'number', description: 'Start Y in feet' },
        x2:       { type: 'number', description: 'End X in feet' },
        y2:       { type: 'number', description: 'End Y in feet' },
        wallType: {
          type: 'string',
          enum: ['wall-exterior', 'wall-interior', 'wall-cmu', 'wall-glazing'],
          description: 'Wall type (default: wall-exterior). Use wall-glazing for floor-to-ceiling glass curtain walls.'
        }
      },
      required: ['x1', 'y1', 'x2', 'y2']
    }
  },
  {
    name: 'place_on_wall',
    description:
      'Place a fixture, furniture piece, or opening snapped to a wall — no coordinate math needed. ' +
      'Provide the wall ID and optionally which face to place on (north/south/east/west). ' +
      'The element is auto-positioned flush against the wall face, correctly rotated, at the specified offset or centered. ' +
      'Openings (doors, windows, cased-opening) automatically split the wall at the placed position. ' +
      'Get wall IDs from get_project. face defaults to "south" for horizontal walls, "east" for vertical walls. ' +
      'Use centerAt (ft from wall start) OR offsetFromStart (ft from wall start to element leading edge). ' +
      'Returns the placed element.',
    inputSchema: {
      type: 'object',
      properties: {
        bloxId:          { type: 'string', description: 'Element type to place (e.g. "fixture-toilet", "door-single")' },
        wallId:          { type: 'string', description: 'ID of the wall to place against (from get_project)' },
        face:            { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Which face of the wall to place on (default: south for H walls, east for V walls)' },
        centerAt:        { type: 'number', description: 'Distance in feet from wall start to center the element (mutually exclusive with offsetFromStart)' },
        offsetFromStart: { type: 'number', description: 'Distance in feet from wall start to the leading edge of the element' },
        width:           { type: 'number', description: 'Override element width in feet' },
      },
      required: ['bloxId', 'wallId']
    }
  },
  {
    name: 'update_element',
    description:
      'Move, resize, or rotate an existing element. All update fields are optional — only provided fields change. ' +
      'ELEVATION MODE: y = elevation from ground of the bottom edge of the element (same convention as place_element).',
    inputSchema: {
      type: 'object',
      properties: {
        id:       { type: 'string', description: 'Element ID from get_project' },
        x:        { type: 'number', description: 'New left edge in feet' },
        y:        { type: 'number', description: 'New top edge in feet' },
        width:    { type: 'number', description: 'New width in feet' },
        height:   { type: 'number', description: 'New height in feet' },
        rotation: { type: 'number', description: 'Rotation in degrees (any value, e.g. 0, 45, 90, 135, 180, 270)' },
        properties: {
          type: 'object',
          description: 'Element-specific properties to merge (not replace). E.g. { "fillColor": "#B87333" }, { "angleDeg": 30 }, { "floorLabel": "FL 7" }, { "material": "COPPER" }, { "taperFt": 2 }, { "fontSize": 18 } for annotation-leader or text-note text size.'
        },
      },
      required: ['id']
    }
  },
  {
    name: 'delete_elements',
    description: 'Delete one or more placed elements by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to delete' }
      },
      required: ['ids']
    }
  },
  {
    name: 'add_dimension',
    description:
      'Add a dimension line between two measured points. ' +
      'offset controls how far the line sits from the reference edge in feet ' +
      '(positive = up for a horizontal span (x1,y1)-(x2,y2), or left for a vertical span; ' +
      'negative = down or right; default -1.5).',
    inputSchema: {
      type: 'object',
      properties: {
        x1:     { type: 'number' }, y1: { type: 'number' },
        x2:     { type: 'number' }, y2: { type: 'number' },
        offset: { type: 'number', description: 'Feet offset from reference edge — positive = up/left, negative = down/right (default -1.5)' },
        measurement: { type:'string', enum:['horizontal','vertical','aligned'], description:'Use aligned for the true distance along an angled span. Horizontal/vertical measure the projected distance. Exact joined wall corners attach automatically.' }
      },
      required: ['x1', 'y1', 'x2', 'y2']
    }
  },
  {
    name: 'mirror_elements',
    description:
      'Create mirrored duplicates of the specified elements. The copies are reflected across the ' +
      'center axis of the selection bounding box and have their flip property toggled. ' +
      'Use axis "h" to mirror left↔right (across vertical center), "v" to mirror top↔bottom. ' +
      'Returns the IDs of the newly created mirror copies.',
    inputSchema: {
      type: 'object',
      properties: {
        ids:  { type: 'array', items: { type: 'string' }, description: 'Element IDs to mirror' },
        axis: { type: 'string', enum: ['h', 'v'], description: '"h" = horizontal mirror (left↔right), "v" = vertical mirror (top↔bottom)' }
      },
      required: ['ids', 'axis']
    }
  },
  {
    name: 'batch_place',
    description:
      'Place multiple architectural elements in a single call — far faster than repeated calls. ' +
      'For wall types (wall-exterior, wall-interior, wall-cmu, wall-glazing) use x1,y1,x2,y2 — same as place_wall — thickness and corner extensions are handled automatically. ' +
      'For furniture/fixtures that belong against a specific wall (beds, dressers, desks, vanities, toilets, tubs, closet rods, etc.) use wallId instead of x,y — same as place_on_wall — ' +
      'it computes exact wall-flush position and rotation with no coordinate guessing, and works against walls placed earlier in the same batch call. ' +
      'Prefer this over hand-computed x,y for anything that should sit flush against a wall: guessed coordinates only auto-snap flush when they land within ~0.5ft of the wall, ' +
      'so an off-by-a-few-feet guess (e.g. centering a bed in the room instead of anchoring it to a wall) silently leaves it floating disconnected from any wall. ' +
      'For everything else (freestanding furniture like a dining table, kitchen island, or a sofa arranged to face a TV) use x,y (and optional width, height, anchor, rotation) — same as place_element. ' +
      'Mix walls, wall-attached items, and freestanding elements freely in one call. ' +
      'All elements are added as a single undo step. ' +
      'ELEVATION MODE: y = elevation from ground in feet for each element (same convention as place_element).',
    inputSchema: {
      type: 'object',
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bloxId:   { type: 'string' },
              x:        { type: 'number', description: 'For freestanding non-wall elements (with anchor)' },
              y:        { type: 'number', description: 'For freestanding non-wall elements (with anchor)' },
              x1:       { type: 'number', description: 'Wall start X (use instead of x/y for wall types)' },
              y1:       { type: 'number', description: 'Wall start Y' },
              x2:       { type: 'number', description: 'Wall end X' },
              y2:       { type: 'number', description: 'Wall end Y' },
              wallId:         { type: 'string', description: 'Attach this element flush to the given wall (from an earlier item in this batch, or an existing element id) — same as place_on_wall. Mutually exclusive with x,y.' },
              face:           { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Which face of the wall to place on when using wallId (default: south for horizontal walls, east for vertical walls)' },
              offsetFromStart: { type: 'number', description: 'When using wallId: distance in feet from the wall start to this element\'s leading edge (mutually exclusive with centerAt)' },
              centerAt:       { type: 'number', description: 'When using wallId: distance in feet from the wall start to center this element (mutually exclusive with offsetFromStart)' },
              width:    { type: 'number' },
              height:   { type: 'number' },
              anchor:   { type: 'string', enum: ['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'] },
              rotation: { type: 'number' },
              properties: { type: 'object', description: 'Element-specific properties (fillColor, angleDeg, floorLabel, material, taperFt, etc.)' }
            },
            required: ['bloxId']
          },
          description: 'Array of elements to place'
        }
      },
      required: ['elements']
    }
  },
  {
    name: 'repeat_elements',
    description: 'Create a parametric linear array from existing elements. Useful for repeated windows, louvers, floor bands, and façade modules. Coordinates are drawing units; the complete repetition is one undo step.',
    inputSchema: { type:'object', properties:{
      sourceIds:{type:'array',items:{type:'string'},description:'Existing element IDs to repeat as a module'},
      count:{type:'integer',minimum:1,maximum:500},
      stepX:{type:'number',description:'X spacing per repetition in drawing units'},
      stepY:{type:'number',description:'Y spacing per repetition in drawing units'},
      rotationStep:{type:'number',description:'Rotation change per repetition in degrees'},
      properties:{type:'object',description:'Optional properties merged into every copy'}
    },required:['sourceIds','count']}
  },
  {
    name: 'preview_batch',
    description: 'Validate a proposed batch without changing the drawing. Run this before batch_place when generating a coordinated layout.',
    inputSchema:{type:'object',properties:{elements:{type:'array',items:{type:'object'}}},required:['elements']}
  },
  {
    name: 'get_snapshot',
    description:
      'Capture a PNG image of what is currently visible on the canvas. ' +
      'Plain snapshot is 1× resolution (lean on tokens). ' +
      'Pass gridIntervalFt (e.g. 10) to overlay a labeled coordinate grid at 2× resolution: ' +
      'blue dashed vertical lines show x values in canvas feet; ' +
      'orange dashed horizontal lines show elevation-from-ground (elevation mode) or y (floor plan mode). ' +
      'USE gridIntervalFt when tracing underlays — read coordinates directly from the grid labels. ' +
      'Without gridIntervalFt the plain 1× snapshot is returned (use for quick visual verification). ' +
      'If a reference underlay image is loaded and visible, it appears in the snapshot — read the underlayNote field for guidance on ' +
      'distinguishing architectural drawing conventions (wall lines, floor hatch patterns, dimension strings) from placed blox.',
    inputSchema: {
      type: 'object',
      properties: {
        gridIntervalFt: {
          type: 'number',
          description: 'If provided, overlays a coordinate grid every N feet. Recommended: 10 for elevation tracing, 5 for detail work. Blue lines = x (canvas ft), orange lines = elevation or y.'
        }
      }
    }
  },
  {
    name: 'zoom_to',
    description:
      'Pan and zoom the canvas viewport to show a specific region. ' +
      'ELEVATION MODE: provide xMin, xMax, elevMin, elevMax (elevation from ground in feet). ' +
      'FLOOR PLAN MODE: provide xMin, xMax, yMin, yMax (canvas feet from origin). ' +
      'Use this before get_snapshot to get a high-resolution zoomed view of a specific area. ' +
      'Example: zoom_to({xMin:40, xMax:160, elevMin:0, elevMax:220}) then get_snapshot({gridIntervalFt:5}) ' +
      'to read building features at ±1ft precision.',
    inputSchema: {
      type: 'object',
      required: ['xMin', 'xMax'],
      properties: {
        xMin:    { type: 'number', description: 'Left edge in canvas feet' },
        xMax:    { type: 'number', description: 'Right edge in canvas feet' },
        elevMin: { type: 'number', description: 'Bottom elevation in feet (elevation mode)' },
        elevMax: { type: 'number', description: 'Top elevation in feet (elevation mode)' },
        yMin:    { type: 'number', description: 'Top edge in canvas feet (floor plan mode)' },
        yMax:    { type: 'number', description: 'Bottom edge in canvas feet (floor plan mode)' },
      }
    }
  },
  {
    name: 'place_polygon',
    description:
      'Place a freeform closed polygon. Provide an array of (x,y) vertices in feet — at least 3. ' +
      'The bounding box is computed automatically. Use for irregular room footprints, stone masses, ' +
      'terraces, and any non-rectangular area. Returns the new element id.',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } },
            required: ['x', 'y']
          },
          description: 'Ordered list of polygon vertices in feet (min 3, close is automatic)'
        }
      },
      required: ['points']
    }
  },
  {
    name: 'get_viewport',
    description:
      'Return the current visible canvas bounds in feet: minX, minY, maxX, maxY, centerX, centerY, widthFt, heightFt. ' +
      'Call this BEFORE placing any floor plan elements so you can anchor the layout to the center of the current view. ' +
      'Place a floor plan of size W×H by starting its top-left at (centerX - W/2, centerY - H/2).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'clear_project',
    description:
      'Delete all placed elements and dimension lines from the current project, leaving a blank canvas. ' +
      'Use this to start fresh before placing a new floor plan. Supports undo.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'fit_view',
    description:
      'Pan and zoom the canvas to fit all placed elements in view. ' +
      'Call this after placing a floor plan so the user can see the result centered on screen.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'lock_elements',
    description:
      'Lock one or more elements so they cannot be moved, resized, or deleted by subsequent operations. ' +
      'Use this after placing walls to protect them before adding fixtures and furniture.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to lock' }
      },
      required: ['ids']
    }
  },
  {
    name: 'unlock_elements',
    description: 'Unlock previously locked elements so they can be edited again.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to unlock' }
      },
      required: ['ids']
    }
  },
  {
    name: 'set_underlay',
    description: 'Set a reference image underlay (floor plan scan, HABS drawing, site photo) as a non-interactive background layer. Accepts a local absolute path (e.g. "/Users/joe/Downloads/plan.jpg") or a public https:// URL. Provide realWidthFt for scale calibration.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'Local absolute path (e.g. "/Users/joe/Downloads/plan.jpg") or public https:// URL of the image' },
        realWidthFt: { type: 'number', description: 'Real-world width of the image in feet for simple calibration (optional)' }
      },
      required: ['imageUrl']
    }
  },
  {
    name: 'calibrate_underlay',
    description: 'Calibrate the active underlay from two pixel points and their known real-world distance. Use this after set_underlay when a known dimension is available; this is more reliable than image-width calibration.',
    inputSchema: { type:'object', properties: {
      p1px:{type:'object',properties:{x:{type:'number'},y:{type:'number'}},required:['x','y']},
      p2px:{type:'object',properties:{x:{type:'number'},y:{type:'number'}},required:['x','y']},
      realDistFt:{type:'number',description:'Known distance between the points in feet'}
    }, required:['p1px','p2px','realDistFt'] }
  },
  { name:'calibrate_underlay_multi', description:'Calibrate an underlay from two or more known pixel-distance pairs. Returns averaged pixels-per-foot, residual error, and confidence.', inputSchema:{type:'object',properties:{pairs:{type:'array',items:{type:'object'}}},required:['pairs']} },
  { name:'register_underlay', description:'Register an underlay to drawing coordinates using at least two pixel-to-feet control points. Applies scale, rotation, and translation and reports residual error/confidence.', inputSchema:{type:'object',properties:{points:{type:'array',items:{type:'object'}}},required:['points']} },
  { name:'set_elevation_datum', description:'Store a named elevation datum in feet for repeatable elevation placement and verification.', inputSchema:{type:'object',properties:{name:{type:'string'},elevationFt:{type:'number'}},required:['name','elevationFt']} },
  {
    name: 'clear_underlay',
    description: 'Remove the current underlay reference image.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'set_underlay_opacity',
    description: 'Set the opacity of the underlay reference image.',
    inputSchema: {
      type: 'object',
      properties: {
        opacity: { type: 'number', description: 'Opacity value 0.05–1.0' }
      },
      required: ['opacity']
    }
  },
  {
    name: 'set_underlay_visible',
    description: 'Show or hide the underlay reference image without removing it.',
    inputSchema: {
      type: 'object',
      properties: {
        visible: { type: 'boolean', description: 'true to show, false to hide' }
      },
      required: ['visible']
    }
  },
  {
    name: 'get_underlay_info',
    description: 'Get information about the current underlay reference image (dimensions, calibration, opacity).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'undo',
    description: 'Undo the last action in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'redo',
    description: 'Redo the last undone action in bloxCAD.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_drawing_mode',
    description:
      'Returns the current drawing mode ("floorplan", "elevation", or "detail") and the coordinate system in use. ' +
      'Call this before placing elements to confirm the coordinate system. ' +
      'ELEVATION MODE: y = elevation from ground in feet (0 = ground, 300 = top). Use anchor "bottom-left" so y is the sill/base height. ' +
      'DETAIL MODE: coordinates are in INCHES (1 unit = 1 inch). Canvas is 240"×180". Use detail blox: insulation-batt, detail-drywall, detail-stud-2x4. Dimensions show fractional inches (e.g. 3½"). ' +
      'FLOOR PLAN MODE: y = canvas distance from top-left origin, increases downward.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'set_drawing_mode',
    description:
      'Switch the project between "floorplan", "elevation", and "detail" drawing modes. ' +
      'Each mode has its own element array — switching preserves all drawings. ' +
      'DETAIL MODE: 1 unit = 1 inch. Use for wall assembly cross-sections, construction details, large-scale drawings. ' +
      'The canvas grid, element library, and coordinate interpretation all update to match the mode. ' +
      'Call get_drawing_mode after switching to confirm the new coordinate system.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['floorplan', 'elevation', 'detail'],
          description: 'Target drawing mode'
        }
      },
      required: ['mode']
    }
  },
  {
    name: 'measure_gap',
    description:
      'Measure the exact distance between two element edges. ' +
      'Returns gap in feet (positive = space between edges, negative = overlap, 0 = flush). ' +
      'Use to verify spacing before or after placement — e.g. check toilet is 1.5ft from wall, ' +
      'window sill is 3ft above grade, two counters are flush on their left edges.',
    inputSchema: {
      type: 'object',
      properties: {
        id1:   { type: 'string', description: 'First element ID' },
        edge1: { type: 'string', enum: ['left','right','top','bottom'], description: 'Which edge of the first element (default: "right")' },
        id2:   { type: 'string', description: 'Second element ID' },
        edge2: { type: 'string', enum: ['left','right','top','bottom'], description: 'Which edge of the second element (default: "left")' },
      },
      required: ['id1', 'id2']
    }
  },
  {
    name: 'align_elements',
    description:
      'Align or distribute a set of elements along a common edge or axis. ' +
      'axis values: "left" | "right" | "top" | "bottom" | "center-x" | "center-y" — align all elements to a shared edge. ' +
      '"distribute-x" | "distribute-y" — evenly space elements between the two outermost ones (needs ≥ 3 elements). ' +
      'to: element ID = align to that element\'s edge; "min" = align to the smallest value in the selection; "max" = align to the largest; ' +
      'a number = align to that absolute coordinate. Default: "min" for left/top/center-x/center-y, "max" for right/bottom. ' +
      'ELEVATION MODE: top/bottom/center-y values are in elevation-from-ground feet.',
    inputSchema: {
      type: 'object',
      properties: {
        ids:  { type: 'array', items: { type: 'string' }, description: 'Element IDs to align' },
        axis: {
          type: 'string',
          enum: ['left','right','top','bottom','center-x','center-y','distribute-x','distribute-y'],
          description: 'What to align or distribute'
        },
        to: {
          description: 'Target: element ID, "min", "max", or an absolute coordinate in feet',
        }
      },
      required: ['ids', 'axis']
    }
  },
  {
    name: 'query_wall_openings',
    description:
      'Return all doors and windows placed on a given wall element. ' +
      'For each opening: width, height, offsetFromStart (distance from the wall\'s left/top edge), ' +
      'gapToEnd (distance to the wall\'s right/bottom edge), and whether it is centered on the wall. ' +
      'Use to audit opening placement and compute repositioning offsets.',
    inputSchema: {
      type: 'object',
      properties: {
        wallId: { type: 'string', description: 'ID of the wall element to query' }
      },
      required: ['wallId']
    }
  },
  {
    name: 'auto_dimension',
    description:
      'Add overall dimensions above and to the left. For selected straight walls, measures the connected same-type, same-layer union and follows edits. Foundation overall dimensions use outer footing edges. ' +
      'For a single non-wall element, measures its width and height. Does not generate segmented chains. ' +
      'Pass element IDs to dimension, or omit ids to dimension all selected elements.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to dimension. If omitted, uses current selection.' }
      }
    }
  },
  {
    name: 'add_callouts',
    description:
      'Auto-generate material callout labels for one or more elements. ' +
      'Places an annotation-leader pointing to each element labeled with the blox name. ' +
      'Leaders are positioned to the right of the rightmost element.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Element IDs to label. If omitted, uses current selection.' }
      }
    }
  },
  {
    name: 'suggest_missing',
    description:
      'Analyze the current detail or floor plan and return a list of likely missing elements based on what is present. ' +
      'For example: if a rafter is present but no sheathing, it will suggest adding plywood. ' +
      'Returns an array of suggestions each with bloxId, name, and reason.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'pick_point',
    description:
      'Ask the user to click a point on the canvas. Returns the canvas coordinates (x, y in feet) of the clicked point. ' +
      'Use this when you need exact coordinates from a user-selected location — much faster than zoom_to + get_snapshot for coordinate reading. ' +
      'The canvas enters "pick" mode and waits for the user to click, then returns immediately. ' +
      'No payload needed.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'place_arc_wall',
    description:
      'Place a curved (arc) wall segment defined by a center point, radius, start angle, and end angle. ' +
      'Angles are in radians (0 = east/right, Math.PI/2 = south/down, Math.PI = west/left, 3*Math.PI/2 = north/up). ' +
      'For a semicircle opening south: startAngle=0, endAngle=Math.PI. ' +
      'For a full circle: startAngle=0, endAngle=2*Math.PI. ' +
      'thickness defaults to 0.5ft (exterior wall). Returns the new arc wall id.',
    inputSchema: {
      type: 'object',
      properties: {
        cx:         { type: 'number', description: 'Center x in canvas feet' },
        cy:         { type: 'number', description: 'Center y in canvas feet' },
        radius:     { type: 'number', description: 'Arc radius in feet (measured to centerline of wall)' },
        startAngle: { type: 'number', description: 'Start angle in radians (0 = east)' },
        endAngle:   { type: 'number', description: 'End angle in radians' },
        thickness:  { type: 'number', description: 'Wall thickness in feet (default 0.5)' },
      },
      required: ['cx', 'cy', 'radius', 'startAngle', 'endAngle']
    }
  },
  {
    name: 'close_gap',
    description:
      'Extend a wall to close an open gap identified by get_wall_graph. ' +
      'Stretches the wall at the specified end until it reaches the nearest unconnected wall endpoint. ' +
      'Use get_wall_graph first to identify gaps, then call close_gap for each one. ' +
      'Returns the coordinate the wall was extended to and the gap distance that was closed.',
    inputSchema: {
      type: 'object',
      properties: {
        wallId: { type: 'string', description: 'ID of the wall with an open end' },
        end:    { type: 'string', enum: ['start', 'end'], description: 'Which end to extend (from get_wall_graph openEnds)' }
      },
      required: ['wallId', 'end']
    }
  },
  {
    name: 'find_elements',
    description:
      'Query elements by type, category, room, or proximity — without downloading the full element list. ' +
      'Filters can be combined. bloxId supports partial match (e.g. "door" matches all door types). ' +
      'roomName requires room tags to be placed (uses get_rooms internally). ' +
      'nearPoint returns elements whose center is within nearRadiusFt (default 10ft) of the given point. ' +
      'Returns matched elements with id, bloxId, position, and size.',
    inputSchema: {
      type: 'object',
      properties: {
        bloxId:       { type: 'string',  description: 'Full or partial bloxId to match (e.g. "door", "fixture-toilet")' },
        category:     { type: 'string',  description: 'Category name to filter by (e.g. "Fixtures", "Furniture")' },
        roomName:     { type: 'string',  description: 'Room name to find elements inside (partial match)' },
        nearPoint:    { type: 'object',  description: 'Center point { x, y } in canvas feet',
                        properties: { x: { type: 'number' }, y: { type: 'number' } } },
        nearRadiusFt: { type: 'number',  description: 'Radius in feet for nearPoint search (default 10)' },
        hasProperty:  { type: 'string',  description: 'Only return elements that have this property key set' },
        limit:        { type: 'number',  description: 'Max results to return (default 50)' },
      }
    }
  },
  {
    name: 'analyze_underlay',
    description:
      'Send the current underlay reference image to Claude vision and get back suggested wall coordinates. ' +
      'Returns a list of wall segments (start/end in canvas feet), estimated room outlines, and overall building dimensions. ' +
      'Use this ONCE at the start of a tracing session — it replaces the entire zoom→snapshot→read loop. ' +
      'Requires an underlay to be loaded and calibrated (set_underlay + calibration). ' +
      'Pass a hint describing what kind of drawing it is (e.g. "residential floor plan", "commercial office layout") ' +
      'to get more accurate results. ' +
      'Requires ANTHROPIC_API_KEY in environment.',
    inputSchema: {
      type: 'object',
      properties: {
        hint: {
          type: 'string',
          description: 'Description of the drawing (e.g. "single-family residential floor plan, 1/4 inch scale")'
        },
        gridIntervalFt: {
          type: 'number',
          description: 'Overlay a coordinate grid every N feet on the image before analysis (e.g. 10). Helps the model read coordinates accurately.'
        }
      }
    }
  },
  {
    name: 'detect_walls_opencv',
    description:
      'Detect structural wall segments in the loaded underlay image using OpenCV Hough line detection. ' +
      'Returns a list of wall segments as canvas-foot coordinates ready for place_wall calls. ' +
      'Dominant angle buckets are returned so you can see what angles the building uses (e.g. 60°/90°/150° for a 30° triangular module). ' +
      'ALWAYS call this before manually tracing any floor plan — it tells you the actual wall angles in the drawing. ' +
      'Requires python3 + opencv-python installed. Requires underlay to be loaded and calibrated.',
    inputSchema: {
      type: 'object',
      properties: {
        minLengthFt: {
          type: 'number',
          description: 'Minimum wall segment length in feet to return (default 4)'
        },
        maxLengthFt: {
          type: 'number',
          description: 'Maximum wall segment length in feet — filters image-spanning artifacts (default 40 for floor-plan, 200 for elevation)'
        },
        topN: {
          type: 'number',
          description: 'Number of top segments to return, sorted by length (default 50)'
        },
        mode: {
          type: 'string',
          enum: ['floor-plan', 'elevation'],
          description: 'Detection mode. "floor-plan" (default) is tuned for thick double-line walls and hatch suppression. "elevation" is tuned for thin single lines, JPEG artifacts, and long horizontal floor bands.'
        }
      }
    }
  },
  {
    name: 'web_search',
    description:
      'Search the web for architectural data, building dimensions, material specs, or code references. ' +
      'Use this when you need exact measurements for a specific building or room type before placing elements. ' +
      'Returns instant answers and top results from DuckDuckGo. ' +
      'Example queries: "Price Tower Bartlesville floor plate dimensions", ' +
      '"Fallingwater cantilever span feet", "IRC minimum bedroom window egress area". ' +
      'If BRAVE_API_KEY is set in environment, uses Brave Search for richer results.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query — be specific, include building name and what you need (e.g. "dimensions", "floor plan", "structural bay")' },
        fetchUrl: { type: 'string', description: 'Optional: fetch and extract text from this specific URL (e.g. a Wikipedia page or architectural database entry)' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_wall_graph',
    description:
      'Return the wall connectivity graph for the current floor plan. ' +
      'For each wall: its two endpoints in canvas feet, orientation (horizontal/vertical), length, ' +
      'which other wall IDs connect at each endpoint, and which endpoints are open (unconnected). ' +
      'Also returns a gap list — open endpoints with the nearest candidate wall to connect to and the distance. ' +
      'Summary includes total wall count, exterior/interior split, open end count, and whether the perimeter is closed. ' +
      'Use this to: detect missing wall connections, find where to extend a wall to close a room, ' +
      'understand the floor plan topology without needing a snapshot.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_rooms',
    description:
      'Return a semantic room list for the current floor plan. ' +
      'For each room with an annotation-room-tag placed, returns: name, bounding box in feet, width×height, area (sqft), ' +
      'list of element IDs inside the room (fixtures, furniture), and connected room names (via doors/openings). ' +
      'Use this instead of get_project when you need spatial/room context — much more efficient than visual snapshots. ' +
      'Returns empty if no room tags have been placed. ' +
      'Example use: "which room is the toilet in?", "what are the master bedroom dimensions?", "which rooms connect to the hallway?"',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_design_guide',
    description:
      'Return architectural design constraints and clearance requirements for a given room type. ' +
      'Includes minimum dimensions, fixture clearances, required fixtures, and applicable code references. ' +
      'Covers: bedroom, bathroom, kitchen, hallway, living, garage, stair. ' +
      'Call this before placing fixtures in a new room type to know what clearances and minimums apply.',
    inputSchema: {
      type: 'object',
      properties: {
        roomType: {
          type: 'string',
          description: 'Room type to look up: bedroom | bathroom | kitchen | hallway | living | garage | stair'
        }
      }
    }
  },
  {
    name: 'import_dxf',
    description:
      'Import a DXF file from disk and place all line geometry as walls on the canvas. ' +
      'Handles LINE, LWPOLYLINE, and POLYLINE entities. Automatically flips the Y-axis ' +
      '(DXF is Y-up, canvas is Y-down) and centers the result on the current viewport. ' +
      'WORKFLOW: (1) Run with dryRun:true first — returns segment count, bounding box, and all layer names. ' +
      '(2) Use layerFilter to pick only the wall layers (e.g. ["A-WALL", "A-WALL-EXTR"]). ' +
      '(3) Set the correct scaleFt — if DXF is in inches use 0.0833 (1/12); in feet use 1; in mm use 0.00328. ' +
      'The tool auto-detects units from the DXF header if available. ' +
      'Use minLengthFt (default 0.5) to filter out hatching, dimension lines, and text leaders. ' +
      'HABS drawings from Library of Congress are typically in inches (scaleFt=0.0833).',
    inputSchema: {
      type: 'object',
      properties: {
        filePath:       { type: 'string',  description: 'Absolute path to the DXF file on disk (e.g. "/Users/joe/Downloads/price-tower.dxf")' },
        scaleFt:        { type: 'number',  description: 'DXF units per foot. 1/12 ≈ 0.0833 for inches, 1 for feet, 1/304.8 ≈ 0.00328 for mm. Auto-detected from header if omitted.' },
        wallType:       { type: 'string',  enum: ['wall-exterior','wall-interior','wall-cmu','wall-glazing'], description: 'Wall type for all imported segments (default: wall-exterior)' },
        layerFilter:    { type: 'array',   items: { type: 'string' }, description: 'Only import segments from these DXF layer names. Run dryRun:true first to see available layers.' },
        minLengthFt:    { type: 'number',  description: 'Minimum segment length in feet after scaling (default 0.5). Increase to 2-3 to filter out hatch/detail lines.' },
        dryRun:         { type: 'boolean', description: 'If true, analyze the file and return segment count, bounds, and layers without placing anything (default false).' },
        centerOnCanvas: { type: 'boolean', description: 'Center the imported geometry on the current viewport (default true).' },
      },
      required: ['filePath']
    }
  },
  {
    name: 'verify_layout',
    description:
      'Run a set of declarative layout checks and get pass/fail results with measurements. ' +
      'Use this to audit your own work before calling it done. ' +
      'Check types: ' +
      '"centered" — is element centered on another (axis: "x" or "y"); ' +
      '"flush" — are two element edges at the same coordinate (edge1, edge2); ' +
      '"gap" — is the gap between two edges equal to expected feet; ' +
      '"clearance" — is the gap between two edges at least min feet; ' +
      '"dimension" — does element have expected width or height (axis: "width" or "height"); ' +
      '"no_overlap" — do two elements not overlap. ' +
      'All checks accept an optional tolerance (default 0.05ft ≈ 0.6"). ' +
      'ELEVATION MODE: edge values for top/bottom are elevation from ground.',
    inputSchema: {
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type:      { type: 'string', enum: ['centered','flush','gap','clearance','dimension','no_overlap'] },
              label:     { type: 'string', description: 'Human-readable label for this check' },
              id:        { type: 'string', description: 'Primary element ID' },
              id1:       { type: 'string', description: 'First element ID (alternative to id)' },
              id2:       { type: 'string', description: 'Second element ID' },
              on:        { type: 'string', description: 'Reference element ID (used by "centered")' },
              axis:      { type: 'string', description: '"x" or "y" for centered; "width" or "height" for dimension' },
              edge1:     { type: 'string', enum: ['left','right','top','bottom'], description: 'Edge of first element' },
              edge2:     { type: 'string', enum: ['left','right','top','bottom'], description: 'Edge of second element' },
              expected:  { type: 'number', description: 'Expected value in feet' },
              min:       { type: 'number', description: 'Minimum acceptable gap in feet (clearance check)' },
              tolerance: { type: 'number', description: 'Acceptable error in feet (default 0.05)' },
            },
            required: ['type']
          }
        }
      },
      required: ['checks']
    }
  },
  {
    name: 'precision_audit',
    description: 'Run a precision audit of the active drawing. Reports disconnected wall ends, associative dimensions needing review, underlay calibration status, and the wall topology summary. Use before and after MCP tracing or a coordinated batch.',
    inputSchema: { type:'object', properties:{} }
  },
]

const server = new Server(
  { name: 'bloxcad', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params
  try {
    // analyze_underlay is handled here in the MCP server (not forwarded to bloxCAD)
    // because it needs direct access to the Anthropic API
    if (name === 'web_search') {
      const { query, fetchUrl } = args ?? {}
      try {
        // If a specific URL was provided, fetch and extract its text
        if (fetchUrl) {
          const pageRes = await fetch(fetchUrl, {
            headers: { 'User-Agent': 'bloxCAD/1.0 architectural research' },
            signal: AbortSignal.timeout(8000)
          })
          const html = await pageRes.text()
          // Strip HTML tags and collapse whitespace
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 4000)
          return { content: [{ type: 'text', text: `Content from ${fetchUrl}:\n\n${text}` }] }
        }

        // Brave Search if key is available
        const braveKey = process.env.BRAVE_API_KEY
        if (braveKey) {
          const braveRes = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
            { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }, signal: AbortSignal.timeout(8000) }
          )
          const braveData = await braveRes.json()
          const results = (braveData.web?.results ?? []).slice(0, 5).map(r => ({
            title: r.title, url: r.url, snippet: r.description
          }))
          return { content: [{ type: 'text', text: JSON.stringify({ query, results }, null, 2) }] }
        }

        // DuckDuckGo instant answer API (no key required)
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=bloxcad`,
          { signal: AbortSignal.timeout(8000) }
        )
        const ddg = await ddgRes.json()
        const answer = ddg.Answer || null
        const abstract = ddg.AbstractText || null
        const results = {
          query,
          answer,
          abstract,
          abstractSource: ddg.AbstractSource || null,
          abstractUrl: ddg.AbstractURL || null,
          relatedTopics: (ddg.RelatedTopics ?? [])
            .filter(t => t.Text)
            .slice(0, 6)
            .map(t => ({ text: t.Text, url: t.FirstURL })),
          tip: (!answer && !abstract)
            ? 'No instant answer found. Try a more specific query, or set BRAVE_API_KEY in environment for full web search results.'
            : null
        }
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Search error: ${e.message}` }], isError: true }
      }
    }

    if (name === 'analyze_underlay') {
      const { hint = 'architectural floor plan', gridIntervalFt } = args ?? {}
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return { content: [{ type: 'text', text: 'Error: ANTHROPIC_API_KEY not set in environment. Add it to the MCP server environment config.' }], isError: true }
      }

      // Get underlay info + annotated snapshot from bloxCAD
      const info = await callBloxCAD('get_underlay_info', {})
      if (!info.hasUnderlay) {
        return { content: [{ type: 'text', text: 'Error: No underlay loaded. Use set_underlay to load a reference image first.' }], isError: true }
      }

      // Ensure underlay is visible, then get an annotated snapshot with coordinate grid
      await callBloxCAD('set_underlay_visible', { visible: true })
      const effectiveGrid = gridIntervalFt ?? 10
      const snap = await callBloxCAD('get_snapshot', { gridIntervalFt: effectiveGrid })
      if (!snap.snapshot) {
        return { content: [{ type: 'text', text: 'Error: Could not capture canvas snapshot.' }], isError: true }
      }

      const base64Image = String(snap.snapshot).replace(/^data:[^;]+;base64,/, '')
      const calibration = info.calibration
        ? `Calibration: ${JSON.stringify(info.calibration)}`
        : 'No calibration — coordinates are approximate. Grid interval is ${effectiveGrid}ft.'

      const client = new Anthropic({ apiKey })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: base64Image }
            },
            {
              type: 'text',
              text: `This is a ${hint} shown with a blue/orange coordinate grid overlay.
Blue vertical lines = x in canvas feet. Orange horizontal lines = y in canvas feet (y increases downward).
${calibration}

Analyze this floor plan and return JSON with this exact structure:
{
  "buildingBounds": { "minX": number, "minY": number, "maxX": number, "maxY": number },
  "estimatedWidthFt": number,
  "estimatedHeightFt": number,
  "walls": [
    { "x1": number, "y1": number, "x2": number, "y2": number, "type": "exterior|interior", "note": "optional" }
  ],
  "rooms": [
    { "name": "room name", "centerX": number, "centerY": number, "estimatedWidthFt": number, "estimatedHeightFt": number }
  ],
  "notes": "any important observations about the drawing"
}
Read coordinates directly from the grid lines. Return ONLY valid JSON, no prose.`
            }
          ]
        }]
      })

      const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { content: [{ type: 'text', text: `Vision analysis returned:\n${raw}` }] }
      }
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return { content: [{ type: 'text', text: JSON.stringify({ analysis: parsed, usage: response.usage }, null, 2) }] }
      } catch {
        return { content: [{ type: 'text', text: `Vision analysis (unparsed):\n${raw}` }] }
      }
    }

    if (name === 'set_underlay') {
      const { imageUrl, realWidthFt } = args ?? {}
      // Rewrite local absolute paths to file:// URLs so the renderer can load them
      const resolvedUrl = imageUrl?.startsWith('/') ? `file://${imageUrl}` : imageUrl
      return callBloxCAD('set_underlay', { imageUrl: resolvedUrl, realWidthFt })
        .then(r => ({ content: [{ type: 'text', text: JSON.stringify(r) }] }))
    }

    if (name === 'detect_walls_opencv') {
      const { minLengthFt = 4, maxLengthFt, topN = 50, mode = 'floor-plan' } = args ?? {}
      const effectiveMaxLengthFt = maxLengthFt ?? (mode === 'elevation' ? 200 : 40)

      const info = await callBloxCAD('get_underlay_info', {})
      if (!info.hasUnderlay) {
        return { content: [{ type: 'text', text: 'Error: No underlay loaded.' }], isError: true }
      }
      if (!info.calibration?.realWidthFt) {
        return { content: [{ type: 'text', text: 'Error: Underlay has no calibration. Set realWidthFt first.' }], isError: true }
      }

      // Resolve image path — handle file:// URLs and local paths
      let imagePath = info.imageUrl ?? ''
      if (imagePath.startsWith('file://')) {
        imagePath = decodeURIComponent(imagePath.replace(/^file:\/\//, ''))
      }

      // For non-file URLs (http), download to a temp file
      let tempFile = null
      if (imagePath.startsWith('http')) {
        const resp = await fetch(imagePath)
        if (!resp.ok) {
          return { content: [{ type: 'text', text: `Error: Could not fetch underlay image: ${resp.statusText}` }], isError: true }
        }
        const buf = Buffer.from(await resp.arrayBuffer())
        tempFile = join(tmpdir(), `bloxcad_underlay_${Date.now()}.png`)
        await writeFile(tempFile, buf)
        imagePath = tempFile
      }

      const scriptPath = join(__dirname, '..', 'tools', 'analyze_walls.py')
      const minPx = Math.round(minLengthFt / (info.calibration.realWidthFt / info.naturalWidth))

      const result = await new Promise((resolve) => {
        const proc = spawn('python3', [
          scriptPath,
          imagePath,
          '--real-width-ft', String(info.calibration.realWidthFt),
          '--min-length-px', String(minPx),
          '--max-length-ft', String(effectiveMaxLengthFt),
          '--top-n', String(topN),
          '--mode', mode,
        ])
        let stdout = '', stderr = ''
        proc.stdout.on('data', d => { stdout += d })
        proc.stderr.on('data', d => { stderr += d })
        proc.on('close', code => resolve({ code, stdout, stderr }))
      })

      if (tempFile) await unlink(tempFile).catch(() => {})

      if (result.code !== 0) {
        return { content: [{ type: 'text', text: `OpenCV error (code ${result.code}):\n${result.stderr}` }], isError: true }
      }

      let walls = []
      try {
        walls = JSON.parse(result.stdout)
      } catch {
        return { content: [{ type: 'text', text: `Parse error. stderr:\n${result.stderr}\nstdout:\n${result.stdout}` }], isError: true }
      }

      // Extract angle distribution from stderr
      const angleLines = result.stderr.split('\n').filter(l => l.match(/^\s+\d+°:/))
      const summary = result.stderr.split('\n').filter(l => l.includes('Detected') || l.includes('After ') || l.includes('Image:')).join('\n')

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary,
            angleBuckets: angleLines.join('\n'),
            wallCount: walls.length,
            walls
          }, null, 2)
        }]
      }
    }

    if (name === 'import_dxf') {
      const {
        filePath,
        scaleFt: userScaleFt,
        wallType = 'wall-exterior',
        layerFilter,
        minLengthFt = 0.5,
        dryRun = false,
        centerOnCanvas = true,
      } = args ?? {}

      let dxfText
      try {
        dxfText = await readFile(filePath, 'utf-8')
      } catch (e) {
        return { content: [{ type: 'text', text: `Error reading file: ${e.message}` }], isError: true }
      }

      // Auto-detect scale from header if not provided
      const detectedScale = userScaleFt == null ? detectDxfScale(dxfText) : null
      const scaleFt = userScaleFt ?? detectedScale ?? 1
      const scaleSource = userScaleFt != null ? 'user-provided' : detectedScale != null ? 'auto-detected from DXF header' : 'default (1 = feet assumed)'

      const parsed = parseDxf(dxfText, { scaleFt, layerFilter, minLengthFt, dryRun })
      const { segmentCount, allLayers, segLayers, minX, maxX, minY, maxY } = parsed
      const segments = parsed.segments

      if (segmentCount === 0) {
        return { content: [{ type: 'text', text: JSON.stringify({
          warning: 'No segments found matching the criteria',
          scaleFt, scaleSource,
          availableLayers: allLayers,
          tip: 'Try removing layerFilter, reducing minLengthFt, or checking scaleFt'
        }, null, 2) }] }
      }

      const widthFt = maxX - minX
      const heightFt = maxY - minY

      if (dryRun) {
        return { content: [{ type: 'text', text: JSON.stringify({
          dryRun: true,
          segmentCount,
          widthFt: Math.round(widthFt * 10) / 10,
          heightFt: Math.round(heightFt * 10) / 10,
          scaleFt, scaleSource,
          layersInFile: allLayers,
          layersWithSegments: segLayers,
          tip: 'Set dryRun:false and optionally layerFilter to import. Increase minLengthFt to filter noise.'
        }, null, 2) }] }
      }

      // Transform: origin → (0,0), flip Y (DXF Y-up → canvas Y-down)
      // canvasX = rawX - minX
      // canvasY = maxY - rawY  ← bottom of DXF → top of canvas bounding box
      let offsetX = 0, offsetY = 0
      if (centerOnCanvas) {
        try {
          const vp = await callBloxCAD('get_viewport', {})
          offsetX = (vp.centerX ?? 100) - widthFt / 2
          offsetY = (vp.centerY ?? 100) - heightFt / 2
        } catch (_) { /* leave at 0,0 */ }
      }

      // Batch in chunks of 200 to avoid HTTP payload/timeout issues
      const CHUNK = 200
      let placed = 0
      for (let start = 0; start < segments.length; start += CHUNK) {
        const chunk = segments.slice(start, start + CHUNK).map(seg => ({
          bloxId: wallType,
          x1: (seg.rawX1 - minX) + offsetX,
          y1: (maxY - seg.rawY1) + offsetY,
          x2: (seg.rawX2 - minX) + offsetX,
          y2: (maxY - seg.rawY2) + offsetY,
        }))
        await callBloxCAD('batch_place', { elements: chunk })
        placed += chunk.length
      }

      const r = n => Math.round(n * 10) / 10
      return { content: [{ type: 'text', text: JSON.stringify({
        success: true,
        wallsPlaced: placed,
        widthFt: r(widthFt),
        heightFt: r(heightFt),
        scaleFt, scaleSource,
        layersImported: segLayers,
        canvasBounds: { minX: r(offsetX), minY: r(offsetY), maxX: r(offsetX + widthFt), maxY: r(offsetY + heightFt) },
        tip: 'Call fit_view to see the result. Use undo if the import looks wrong.'
      }, null, 2) }] }
    }

    const result = await callBloxCAD(name, args ?? {})
    if (name === 'get_snapshot' && result.snapshot) {
      const base64 = String(result.snapshot).replace(/^data:[^;]+;base64,/, '')
      const lines = [`Canvas snapshot — ${result.width}×${result.height}px, ${result.elementCount} placed element(s)`]
      if (result.underlayNote) lines.push(result.underlayNote)
      return {
        content: [
          { type: 'image', data: base64, mimeType: 'image/png' },
          { type: 'text', text: lines.join('\n\n') }
        ]
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
