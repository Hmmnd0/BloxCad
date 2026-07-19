import { PlacedElement } from '../types'

export interface RoomInfo {
  id: string          // room-tag element id
  name: string
  num: string
  center: { x: number; y: number }
  bounds: { left: number; top: number; right: number; bottom: number }
  widthFt: number
  heightFt: number
  area: number        // sq ft, interior
  elementIds: string[] // fixture/furniture/equipment IDs inside this room
  connectedTo: string[] // names of adjacent rooms via openings
}

function ptInRoom(r: RoomInfo, pt: { x: number; y: number }): boolean {
  return pt.x > r.bounds.left  && pt.x < r.bounds.right &&
         pt.y > r.bounds.top   && pt.y < r.bounds.bottom
}

export function detectRooms(elements: PlacedElement[]): RoomInfo[] {
  const labels = elements.filter(el => el.bloxId === 'annotation-room-tag')
  if (labels.length === 0) return []

  const boundary = elements.filter(el =>
    el.bloxId.startsWith('wall-') ||
    el.bloxId.startsWith('window-') ||
    el.bloxId.startsWith('door-') ||
    el.bloxId === 'cased-opening',
  )
  const hB = boundary.filter(w => w.width >= w.height)
  const vB = boundary.filter(w => w.height >  w.width)

  // 1. Compute room bounds from ray-cast
  const rooms: RoomInfo[] = labels.map(label => {
    const cx = label.x + label.width  / 2
    const cy = label.y + label.height / 2

    const above  = hB.filter(w => w.y + w.height <= cy + 0.1 && w.x <= cx && w.x + w.width >= cx)
    const topEl  = above.reduce<PlacedElement | null>(
      (best, w) => !best || w.y + w.height > best.y + best.height ? w : best, null)
    const below  = hB.filter(w => w.y >= cy - 0.1 && w.x <= cx && w.x + w.width >= cx)
    const botEl  = below.reduce<PlacedElement | null>(
      (best, w) => !best || w.y < best.y ? w : best, null)
    const leftOf = vB.filter(w => w.x + w.width <= cx + 0.1 && w.y <= cy && w.y + w.height >= cy)
    const leftEl = leftOf.reduce<PlacedElement | null>(
      (best, w) => !best || w.x + w.width > best.x + best.width ? w : best, null)
    const rightOf = vB.filter(w => w.x >= cx - 0.1 && w.y <= cy && w.y + w.height >= cy)
    const rightEl = rightOf.reduce<PlacedElement | null>(
      (best, w) => !best || w.x < best.x ? w : best, null)

    const top    = topEl   ? topEl.y   + topEl.height   : cy - 6
    const bottom = botEl   ? botEl.y                    : cy + 6
    const left   = leftEl  ? leftEl.x  + leftEl.width   : cx - 6
    const right  = rightEl ? rightEl.x                  : cx + 6

    const w = Math.max(0, right - left)
    const h = Math.max(0, bottom - top)
    return {
      id:        label.id,
      name:      (label.properties?.roomName as string) || 'Room',
      num:       (label.properties?.roomNum  as string) || '',
      center:    { x: cx, y: cy },
      bounds:    { left, top, right, bottom },
      widthFt:   Math.round(w * 10) / 10,
      heightFt:  Math.round(h * 10) / 10,
      area:      Math.round(w * h),
      elementIds: [],
      connectedTo: [],
    }
  })

  // 2. Find elements inside each room
  const nonBoundary = elements.filter(el =>
    !el.bloxId.startsWith('wall-') &&
    !el.bloxId.startsWith('window-') &&
    !el.bloxId.startsWith('door-') &&
    el.bloxId !== 'cased-opening' &&
    el.bloxId !== 'annotation-room-tag',
  )
  for (const el of nonBoundary) {
    const ecx = el.x + el.width  / 2
    const ecy = el.y + el.height / 2
    for (const r of rooms) {
      if (ptInRoom(r, { x: ecx, y: ecy })) {
        r.elementIds.push(el.id)
        break
      }
    }
  }

  // 3. Build connectivity (which rooms are adjacent via openings)
  const openings = elements.filter(el =>
    el.bloxId.startsWith('door-') ||
    el.bloxId === 'cased-opening',
  )
  for (const op of openings) {
    const isH = op.width >= op.height
    const ocx  = op.x + op.width  / 2
    const ocy  = op.y + op.height / 2
    const gap  = 0.6
    const ptA  = isH ? { x: ocx, y: op.y - gap }              : { x: op.x - gap,             y: ocy }
    const ptB  = isH ? { x: ocx, y: op.y + op.height + gap }  : { x: op.x + op.width + gap,  y: ocy }
    const rA   = rooms.find(r => ptInRoom(r, ptA))
    const rB   = rooms.find(r => ptInRoom(r, ptB))
    if (rA && rB && rA.id !== rB.id) {
      if (!rA.connectedTo.includes(rB.name)) rA.connectedTo.push(rB.name)
      if (!rB.connectedTo.includes(rA.name)) rB.connectedTo.push(rA.name)
    }
  }

  return rooms
}
