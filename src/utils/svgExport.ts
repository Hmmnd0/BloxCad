// SVG export — a genuine vector export path alongside the raster PNG/PDF
// exporters in exportManager.ts (Konva has no built-in vector output).
//
// Scope, deliberately: walls, openings (doors/windows), dimensions, and
// text/room-tag annotations get real vector geometry mirroring their Konva
// renderer's actual shape. Everything else (fixtures, furniture, casework,
// structural, fire/safety, site, MEP, elevation/detail blox) renders
// as a labeled outline rect — real vector geometry (position/size/rotation
// are exact), just not a pixel match for each renderer's hand-drawn icon.
// Reproducing every renderer's hatch/stipple/icon work 1:1 in SVG would mean
// a second implementation of every renderer in the app; this covers what
// actually gets edited/measured downstream (CAD reference, laser/CNC, line
// drawings) without that cost.
// Openings and all seven Stairs-category blox now use circulationGeometry,
// exactly shared with the canvas and library rather than the legacy helpers below.

import type { Project, PlacedElement, DimensionLine } from '../types'
import { SCALES } from '../types'
import { getBloxById } from '../blox/definitions'
import { formatFeet, formatInches } from './scale'
import { wallSolidRects } from './hostedOpenings'
import { buildWallRegions, wallRegionPath, JOINED_WALLS } from './wallUnion'
import { dimensionLayout } from './dimensionLayout'
import { resolveDimensions } from './dimensionAnchors'
import { circulationGeometry, circulationSVG, REFINED_CIRCULATION } from './circulationGeometry'
import { furnitureGeometry, REFINED_FURNITURE } from './furnitureGeometry'
import { caseworkGeometry, REFINED_CASEWORK } from './caseworkGeometry'
import { fixtureGeometry, REFINED_FIXTURES, FixtureShape } from './fixtureGeometry'
import { structuralGeometry, REFINED_STRUCTURAL } from './structuralGeometry'
import { electricalGeometry, REFINED_ELECTRICAL } from './electricalGeometry'
import { equipmentGeometry, REFINED_EQUIPMENT } from './equipmentGeometry'
import { siteGeometry, REFINED_SITE } from './siteGeometry'
import { routingGeometry, REFINED_ROUTING } from './routingGeometry'
import { DEMOLITION_IDS, demolitionSVG } from './demolitionGeometry'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Wall fills — flat color per type, matching each renderer's base fill
// (no hatch/coursing texture reproduced — see file header). ──────────────
const WALL_FILL: Record<string, string> = {
  'wall-exterior': '#3C3C3C',
  'wall-interior': '#5A5A5A',
  'wall-cmu': '#888888',
  'wall-cmu-footing': '#888888',
  'wall-glazing': '#BEEBFF',
  'wall-fire-1hr': '#E08A8A',
  'wall-fire-2hr': '#C85050',
}

const STROKE = '#1A1A1A'
const DIM_COLOR = '#3A3A3A'
const HAIRLINE = 0.6
const MED_LINE = 1.1

// Renders one element's shape as SVG markup, in the element's LOCAL space —
// i.e. (0,0) is the element's own center, matching the outer <g> transform
// (translate to cx,cy, then rotate) that every element is wrapped in. `w`/`h`
// are the element's full width/height in px (pre-rotation, same convention
// Konva renderers use as widthPx/heightPx before their own internal offset).
function shapeSVG(el: PlacedElement, w: number, h: number, pixelsPerFoot:number): string {
  if(DEMOLITION_IDS.has(el.bloxId))return `<g transform="translate(${-w/2+(el.properties.flipH?w:0)} ${-h/2+(el.properties.flipV?h:0)}) scale(${el.properties.flipH?-1:1} ${el.properties.flipV?-1:1})">${demolitionSVG(el.bloxId,w,h)}</g>`
  const half = (n: number) => n / 2
  if(REFINED_ROUTING.has(el.bloxId)||REFINED_SITE.has(el.bloxId)||REFINED_EQUIPMENT.has(el.bloxId)||REFINED_ELECTRICAL.has(el.bloxId)||REFINED_STRUCTURAL.has(el.bloxId)||REFINED_FURNITURE.has(el.bloxId)||REFINED_CASEWORK.has(el.bloxId)||REFINED_FIXTURES.has(el.bloxId)) {
    const shapes:FixtureShape[]=REFINED_ROUTING.has(el.bloxId)?routingGeometry(el.bloxId,w,h,el.properties):REFINED_SITE.has(el.bloxId)?siteGeometry(el.bloxId,w,h,pixelsPerFoot,el.properties):REFINED_EQUIPMENT.has(el.bloxId)?equipmentGeometry(el.bloxId,w,h):REFINED_ELECTRICAL.has(el.bloxId)?electricalGeometry(el.bloxId,w,h):REFINED_STRUCTURAL.has(el.bloxId)?structuralGeometry(el.bloxId,w,h):REFINED_FURNITURE.has(el.bloxId)?furnitureGeometry(el.bloxId,w,h):REFINED_CASEWORK.has(el.bloxId)?caseworkGeometry(el.bloxId,w,h):fixtureGeometry(el.bloxId,w,h)
    const body=shapes.map(s=>s.kind==='text'?`<text x="0" y="0" transform="translate(${s.x+s.width/2} ${s.y+s.height/2}) scale(${el.properties.flipH?-1:1} ${el.properties.flipV?-1:1})" font-size="${s.fontSize}" text-anchor="middle" dominant-baseline="central" font-family="Arial" fill="${s.fill}">${esc(s.text)}</text>`
      :s.kind==='rect'?`<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.radius??0}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.weight}"${s.dash?` stroke-dasharray="${s.dash.join(',')}"`:''}/>`
      :s.kind==='ellipse'?`<ellipse cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.weight}"/>`
      :`<polyline points="${s.points.join(' ')}" fill="${s.fill??'none'}" stroke="${s.stroke}" stroke-width="${s.weight}"${s.dash?` stroke-dasharray="${s.dash.join(',')}"`:''}/>`).join('')
    return `<g transform="translate(${-w/2+(el.properties.flipH?w:0)},${-h/2+(el.properties.flipV?h:0)}) scale(${el.properties.flipH?-1:1},${el.properties.flipV?-1:1})">${body}</g>`
  }
  if (REFINED_CIRCULATION.has(el.bloxId)) {
    return `<g transform="translate(${-w/2},${-h/2})">${circulationSVG(circulationGeometry(el.bloxId,w,h,el.properties),w,h,el.properties)}</g>`
  }

  if (WALL_FILL[el.bloxId]) {
    const fill = WALL_FILL[el.bloxId]
    return `<rect x="${-half(w)}" y="${-half(h)}" width="${w}" height="${h}" fill="${fill}"/>`
  }

  if (el.bloxId === 'door-single') {
    return doorSingleSVG(w, h, el.properties?.flipped === true)
  }
  if (el.bloxId === 'door-double') {
    return doorDoubleSVG(w, h, el.properties?.flipped === true)
  }
  if (el.bloxId === 'door-sliding') {
    return slidingDoorSVG(w, h)
  }
  if (el.bloxId === 'door-pocket' || el.bloxId === 'door-bifold' || el.bloxId === 'door-garage' || el.bloxId === 'cased-opening') {
    // Simplified but real-positioned opening outline — see file header.
    return `<rect x="${-half(w)}" y="${-half(h)}" width="${w}" height="${h}" fill="white" stroke="${STROKE}" stroke-width="${HAIRLINE}" stroke-dasharray="${Math.max(w, h) * 0.08},${Math.max(w, h) * 0.05}"/>`
  }
  if (el.bloxId.startsWith('window-')) {
    return windowSVG(w, h)
  }

  if (el.bloxId === 'annotation-window-tag') {
    const label = String(el.properties.label || '?')
    const size = Math.min(w * .3, h * .3, w * .55 / Math.max(1, label.length) * 1.5)
    return `<path d="M0 ${-h/2} L${w/2} 0 L0 ${h/2} L${-w/2} 0 Z" fill="white" stroke="${STROKE}" stroke-width="${HAIRLINE}"/><text x="0" y="${size*.35}" text-anchor="middle" font-size="${size}" font-family="Arial, sans-serif" fill="${STROKE}">${esc(label)}</text>`
  }
  if (el.bloxId === 'annotation-room-tag') {
    return roomTagSVG(el, w, h)
  }
  if (el.bloxId === 'text-note') {
    return textNoteSVG(el, w, h)
  }

  // Fallback for every other category (Fixtures/Furniture/Casework/
  // Structural/Fire-Safety/Site/Electrical/Mechanical/Plumbing/Stairs/
  // Elevation/Details/other Annotations): outline rect + centered label.
  const def = getBloxById(el.bloxId)
  const label = def?.name ?? el.bloxId
  const fontSize = Math.max(6, Math.min(10, w * 0.12, h * 0.35))
  return [
    `<rect x="${-half(w)}" y="${-half(h)}" width="${w}" height="${h}" fill="white" fill-opacity="0.6" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>`,
    `<text x="0" y="${fontSize * 0.35}" font-size="${fontSize}" text-anchor="middle" fill="${STROKE}" font-family="Arial, sans-serif">${esc(label)}</text>`,
  ].join('')
}

// Mirrors SingleDoorRenderer (openings.tsx): leaf line + quarter-circle
// swing arc, sz = max(w,h), oriented for a horizontal or vertical wall.
function doorSingleSVG(w: number, h: number, flipped: boolean): string {
  const isVertical = h > w
  const sz = Math.max(w, h)
  const ox = -w / 2, oy = -h / 2   // top-left of the local (pre-flip) box
  const flip = flipped ? `translate(${w},0) scale(-1,1)` : ''
  const inner = isVertical
    ? `<path d="M 0,0 L 0,${sz} A ${sz},${sz} 0 0 1 ${sz},0 Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="0" y1="0" x2="${w}" y2="0" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<line x1="0" y1="0" x2="0" y2="${sz}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>`
    : `<path d="M 0,0 L ${sz},0 A ${sz},${sz} 0 0 1 0,${sz} Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="0" y1="0" x2="0" y2="${sz}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<line x1="0" y1="0" x2="${w}" y2="0" stroke="${STROKE}" stroke-width="${MED_LINE}"/>`
  return `<g transform="translate(${ox},${oy})${flip ? ' ' + flip : ''}">${inner}</g>`
}

// Mirrors DoubleDoorRenderer: two mirrored leaves + swing arcs, split at the
// element's midline.
function doorDoubleSVG(w: number, h: number, flipped: boolean): string {
  const isVertical = h > w
  const ox = -w / 2, oy = -h / 2
  const flip = flipped ? `translate(0,${h}) scale(1,-1)` : ''
  let inner: string
  if (isVertical) {
    const half = h / 2
    inner =
      `<line x1="0" y1="${half}" x2="${w}" y2="${half}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<path d="M 0,${half} L 0,0 A ${half},${half} 0 0 0 ${half},${half} Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="0" y1="0" x2="0" y2="${half}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<path d="M 0,${half} L ${half},${half} A ${half},${half} 0 0 0 0,${h} Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="0" y1="${half}" x2="0" y2="${h}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>`
  } else {
    const half = w / 2
    inner =
      `<line x1="${half}" y1="0" x2="${half}" y2="${half}" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<path d="M ${half},0 L ${w},0 A ${half},${half} 0 0 1 ${half},${half} Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="0" y1="0" x2="${half}" y2="0" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
      `<path d="M ${half},0 L 0,0 A ${half},${half} 0 0 1 ${half},${half} Z" fill="rgba(135,206,250,0.12)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
      `<line x1="${half}" y1="0" x2="${w}" y2="0" stroke="${STROKE}" stroke-width="${MED_LINE}"/>`
  }
  return `<g transform="translate(${ox},${oy})${flip ? ' ' + flip : ''}">${inner}</g>`
}

function slidingDoorSVG(w: number, h: number): string {
  const ox = -w / 2, oy = -h / 2
  const isLandscape = w >= h
  const panelW = isLandscape ? w / 2 : w
  const panelH = isLandscape ? h : h / 2
  return `<g transform="translate(${ox},${oy})">` +
    `<rect width="${w}" height="${h}" fill="rgba(135,206,250,0.18)" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
    `<rect width="${panelW}" height="${panelH}" fill="rgba(135,206,250,0.3)" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
    `</g>`
}

// Mirrors WindowRenderer: outline + parallel glazing lines across the span.
function windowSVG(w: number, h: number): string {
  const ox = -w / 2, oy = -h / 2
  const isLandscape = w >= h
  const lines = isLandscape
    ? [h / 4, h / 2, (h * 3) / 4].map(y => `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>`)
    : [w / 4, w / 2, (w * 3) / 4].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>`)
  return `<g transform="translate(${ox},${oy})">` +
    `<rect width="${w}" height="${h}" fill="white" stroke="${STROKE}" stroke-width="${MED_LINE}"/>` +
    lines.join('') +
    `</g>`
}

function roomTagSVG(el: PlacedElement, w: number, h: number): string {
  const ox = -w / 2, oy = -h / 2
  const name = typeof el.properties?.roomName === 'string' ? el.properties.roomName : 'ROOM NAME'
  const area = typeof el.properties?.roomArea === 'string' ? el.properties.roomArea : ''
  const fontSize = Math.max(7, Math.min(11, h * 0.4))
  return `<g transform="translate(${ox},${oy})">` +
    `<rect width="${w}" height="${h}" fill="white" stroke="${STROKE}" stroke-width="${HAIRLINE}"/>` +
    `<text x="${w / 2}" y="${h * 0.4}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="${STROKE}" font-family="Arial, sans-serif">${esc(name)}</text>` +
    (area ? `<text x="${w / 2}" y="${h * 0.75}" font-size="${fontSize * 0.85}" text-anchor="middle" fill="${STROKE}" font-family="Arial, sans-serif">${esc(area)}</text>` : '') +
    `</g>`
}

function textNoteSVG(el: PlacedElement, w: number, h: number): string {
  const ox = -w / 2, oy = -h / 2
  const text = typeof el.properties?.text === 'string' ? el.properties.text : ''
  const fontSize = typeof el.properties?.fontSize === 'number' ? el.properties.fontSize : 11
  const lines = text.split('\n')
  const tspans = lines.map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : fontSize * 1.2}">${esc(line)}</tspan>`).join('')
  return `<g transform="translate(${ox},${oy})">` +
    `<text x="0" y="${fontSize}" font-size="${fontSize}" fill="${STROKE}" font-family="Arial, sans-serif">${tspans}</text>` +
    `</g>`
}

export function elementSVG(el: PlacedElement, pxPerFt: number): string {
  const w = el.width * pxPerFt
  const h = el.height * pxPerFt
  const cx = (el.x + el.width / 2) * pxPerFt
  const cy = (el.y + el.height / 2) * pxPerFt
  const rot = el.rotation ?? 0
  const transform = rot ? `translate(${cx},${cy}) rotate(${rot})` : `translate(${cx},${cy})`
  return `<g transform="${transform}">${shapeSVG(el, w, h,pxPerFt)}</g>`
}

// Mirrors DimensionLayer's DimShape geometry exactly (extension lines, tick
// marks, offset direction, label placement).
const EXT_OVERHANG = 6, EXT_GAP = 3, TICK_SIZE = 5, FONT_SIZE = 12

export function dimensionSVG(dim: DimensionLine, pxPerFt: number, isDetailMode: boolean): string {
  const g=dimensionLayout(dim,pxPerFt)
  const label=dim.needsReview?'CHECK':isDetailMode?formatInches(g.value):formatFeet(g.value)
  const color=dim.needsReview?'#B45309':DIM_COLOR
  const line=(p:number[],weight:number)=>`<line x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}" stroke="${color}" stroke-width="${weight}"/>`
  return `<g>${line(g.ext1,HAIRLINE)}${line(g.ext2,HAIRLINE)}${line(g.line,HAIRLINE)}${line(g.tick1,1.2)}${line(g.tick2,1.2)}<text x="${g.label.x}" y="${g.label.y}" font-size="${FONT_SIZE}" fill="${color}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" transform="rotate(${g.rotation},${g.label.x},${g.label.y})">${esc(label)}</text></g>`
}

export function buildProjectSVG(project: Project): string {
  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const isDetailMode = project.mode === 'detail'
  const activeElements = isDetailMode ? (project.detailElements ?? []) : project.elements
  const dimensions = isDetailMode ? (project.detailDimensions ?? []) : resolveDimensions(project.dimensions ?? [],activeElements)

  const PAD_FT = 2
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  for (const el of activeElements) {
    if (REFINED_CIRCULATION.has(el.bloxId)) {
      const b=circulationGeometry(el.bloxId,el.width,el.height,el.properties).bounds
      const angle=el.rotation*Math.PI/180, cos=Math.cos(angle),sin=Math.sin(angle)
      for(const x of [b.x,b.x+b.width]) for(const y of [b.y,b.y+b.height]) {
        const lx=(el.properties.flipH?el.width-x:x)-el.width/2
        const ly=(el.properties.flipV?el.height-y:y)-el.height/2
        consider(el.x+el.width/2+lx*cos-ly*sin,el.y+el.height/2+lx*sin+ly*cos)
      }
      continue
    }
    // Rotation-agnostic bbox pass — exact per-shape extents aren't worth
    // computing here since this only sizes the canvas with generous padding.
    const pad = Math.max(el.width, el.height) * 0.5
    consider(el.x - pad, el.y - pad)
    consider(el.x + el.width + pad, el.y + el.height + pad)
  }
  for (const d of dimensions) {
    const g=dimensionLayout(d,pxPerFt)
    for(const points of [g.line,g.ext1,g.ext2,g.tick1,g.tick2]) for(let i=0;i<points.length;i+=2) consider(points[i]/pxPerFt,points[i+1]/pxPerFt)
    consider(g.label.x/pxPerFt-1,g.label.y/pxPerFt-1)
    consider(g.label.x/pxPerFt+1,g.label.y/pxPerFt+1)
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 40; maxY = 30 }
  minX -= PAD_FT; minY -= PAD_FT; maxX += PAD_FT; maxY += PAD_FT

  const originX = minX * pxPerFt, originY = minY * pxPerFt
  const widthPx = Math.round((maxX - minX) * pxPerFt)
  const heightPx = Math.round((maxY - minY) * pxPerFt)

  const wallEls = activeElements.filter(el => el.bloxId.startsWith('wall-') || JOINED_WALLS.has(el.bloxId))
  const openingEls = activeElements.filter(el => el.bloxId.startsWith('door-') || el.bloxId.startsWith('window-') || el.bloxId === 'cased-opening')
  const otherEls = activeElements.filter(el => !wallEls.includes(el) && !openingEls.includes(el))

  const body = [
    `<g transform="translate(${-originX},${-originY})">`,
    `<rect x="${originX}" y="${originY}" width="${widthPx}" height="${heightPx}" fill="white"/>`,
    ...buildWallRegions(activeElements).map(r => `<path d="${wallRegionPath(r.polygons,pxPerFt)}" fill="${r.fill}" fill-rule="evenodd" stroke="#1A1A1A" stroke-width="1"${r.footing?' stroke-dasharray="5 3"':''}/>`),
    ...wallEls.filter(el=>!JOINED_WALLS.has(el.bloxId)).map(el => {
      const pieces = wallSolidRects(el, activeElements).map(r =>
        `<rect x="${r.x * pxPerFt}" y="${r.y * pxPerFt}" width="${r.width * pxPerFt}" height="${r.height * pxPerFt}" fill="${WALL_FILL[el.bloxId] ?? '#888'}"/>`).join('')
      return `<g transform="translate(${(el.x + el.width / 2) * pxPerFt},${(el.y + el.height / 2) * pxPerFt}) rotate(${el.rotation}) translate(${-el.width / 2 * pxPerFt},${-el.height / 2 * pxPerFt})">${pieces}</g>`
    }),
    ...otherEls.map(el => elementSVG(el, pxPerFt)),
    ...openingEls.map(el => elementSVG(el, pxPerFt)),
    ...dimensions.map(d => dimensionSVG(d, pxPerFt, isDetailMode)),
    `</g>`,
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" ` +
    `viewBox="0 0 ${widthPx} ${heightPx}">\n` +
    `<title>${esc(project.name)}</title>\n` +
    body + `\n</svg>\n`
}

export async function exportAsSVG(projectName: string): Promise<void> {
  const { useStore } = await import('../store/useStore')
  const { project } = useStore.getState()
  if (!project) return
  const {buildPrintSheet}=await import('./printSheet')
  const state=useStore.getState()
  const {svg}=await buildPrintSheet(project,state.showLegend,state.showTitleBlock,'image/png',true)
  await window.api?.exportSVG(svg, projectName)
}
