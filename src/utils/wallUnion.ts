import polygonClipping, { type Polygon, type MultiPolygon, type Pair } from 'polygon-clipping'
const { union, intersection } = polygonClipping
import type { PlacedElement } from '../types'
import { wallDisplayPieces } from './hostedOpenings'

export const JOINED_WALLS = new Set(['wall-exterior','wall-interior','wall-cmu','wall-cmu-footing','wall-glazing','wall-fire-1hr','wall-fire-2hr','structural-foundation-wall'])
export const isFoundation = (id: string) => id === 'wall-cmu-footing' || id === 'structural-foundation-wall'
export interface WallRegion { key: string; bloxId: string; polygons: MultiPolygon; fill: string; footing: boolean }
function rectangle(w: PlacedElement, inset = 0): Polygon {
  const a = (w.rotation || 0)*Math.PI/180, c = Math.cos(a), s = Math.sin(a)
  const hx=w.width/2-inset, hy=w.height/2-inset
  return [[[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]].map(([x,y]): Pair => [w.x+w.width/2+x*c-y*s,w.y+w.height/2+x*s+y*c])]
}
const fills: Record<string,string> = {'wall-exterior':'#3C3C3C','wall-interior':'#5A5A5A','wall-cmu':'#888888','wall-glazing':'#BEEBFF','wall-fire-1hr':'#E08A8A','wall-fire-2hr':'#C85050','wall-cmu-footing':'#888888','structural-foundation-wall':'#9A9A9A'}
/** Exact set unions, not proximity-based gap filling. Different layers/materials stay separate. */
export function buildWallRegions(elements: PlacedElement[]): WallRegion[] {
  const groups = new Map<string,{bloxId:string; solids:Polygon[]; stems:Polygon[]}>()
  for (const wall of elements) {
    if (!JOINED_WALLS.has(wall.bloxId) || ![wall.x,wall.y,wall.width,wall.height,wall.rotation||0].every(Number.isFinite) || wall.width<=0 || wall.height<=0) continue
    const key = `${wall.layerId ?? ''}:${wall.bloxId}`
    const group = groups.get(key) ?? {bloxId:wall.bloxId,solids:[],stems:[]}
    const pieces = wallDisplayPieces(wall,elements).map(p => rectangle(p))
    group.solids.push(...pieces)
    if (wall.bloxId === 'wall-cmu-footing' && pieces.length) {
      // Existing compound blox defines an 8-inch stem on a 20-inch footing.
      // Inset all sides to remove the footing's end padding from the stem too.
      const stem = rectangle(wall,Math.min(wall.width,wall.height)*.3)
      group.stems.push(...intersection(stem,union(pieces[0],...pieces.slice(1))))
    }
    groups.set(key,group)
  }
  const regions: WallRegion[] = []
  for (const [key,g] of groups) {
    if (!g.solids.length) continue
    regions.push({key,bloxId:g.bloxId,polygons:union(g.solids[0],...g.solids.slice(1)),fill:g.bloxId==='wall-cmu-footing'?'#E4E4E4':fills[g.bloxId],footing:g.bloxId==='wall-cmu-footing'})
    if (g.stems.length) regions.push({key:key+':stem',bloxId:g.bloxId,polygons:union(g.stems[0],...g.stems.slice(1)),fill:'#888888',footing:false})
  }
  // All footing bands below every stem, independent of element order.
  return regions.sort((a,b)=>Number(b.footing)-Number(a.footing))
}
export function wallRegionPath(polygons: MultiPolygon, scale = 1): string {
  return polygons.flatMap(p=>p.map(r=>r.map(([x,y],i)=>`${i?'L':'M'}${x*scale},${y*scale}`).join(' ')+' Z')).join(' ')
}
