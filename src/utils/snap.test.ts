import { describe, it, expect } from 'vitest'
import {
  snapOpeningToWall,
  snapWallCenterline,
  getElementSnapPoints,
  nearestSnapPoint,
  edgeSnapThresholdFt,
  snapWallEndpoint,
  snapElementEdges,
  getElementAABB,
  getDoorClearanceZones,
  pushOutOfClearanceZones,
} from './snap'
import type { PlacedElement } from '../types'

function el(id: string, bloxId: string, x: number, y: number, width: number, height: number, rotation = 0): PlacedElement {
  return { id, bloxId, x, y, width, height, rotation, properties: {}, locked: false }
}

describe('snapOpeningToWall', () => {
  it('starts a partition on the host centerline, not its face', () => {
    const wall = el('host', 'wall-exterior', -0.25, -0.25, 10.5, 0.5)
    expect(snapWallCenterline({ x: 4, y: 0.2 }, [wall], 1)).toEqual({ x: 4, y: 0 })
  })
  it('finishes an orthogonal partition at the host centerline', () => {
    const wall = el('host', 'wall-exterior', -0.25, -0.25, 10.5, 0.5)
    expect(snapWallCenterline({ x: 4, y: 0.2 }, [wall], 1, { x: 4, y: 8 })).toEqual({ x: 4, y: 0 })
    expect(snapWallCenterline({ x: 14, y: 0.2 }, [wall], 1, { x: 14, y: 8 })).toBeNull()
  })
  const horizWall = el('w1', 'wall-exterior', 0, 10, 20, 0.5)

  it('snaps to a horizontal wall centerline within threshold', () => {
    const result = snapOpeningToWall({ x: 5, y: 10.3 }, [horizWall], 3, 1)
    expect(result).not.toBeNull()
    expect(result!.wallId).toBe('w1')
    expect(result!.y).toBe(10)
    expect(result!.heightOverride).toBe(0.5)
  })

  it('clamps the opening so it does not run past the wall end', () => {
    // Cursor near the very start of the wall — opening should clamp to wall.x, not go negative
    const result = snapOpeningToWall({ x: 0.2, y: 10.1 }, [horizWall], 3, 1)
    expect(result!.x).toBe(0)
  })

  it('returns null when nothing is within threshold', () => {
    const result = snapOpeningToWall({ x: 5, y: 50 }, [horizWall], 3, 1)
    expect(result).toBeNull()
  })

  it('returns null when the opening is wider than the wall', () => {
    const result = snapOpeningToWall({ x: 5, y: 10.1 }, [horizWall], 25, 1)
    expect(result).toBeNull()
  })

  it('snaps to a vertical wall centerline', () => {
    const vertWall = el('w2', 'wall-interior', 10, 0, 0.375, 20)
    const result = snapOpeningToWall({ x: 10.1, y: 5 }, [vertWall], 3, 1)
    expect(result).not.toBeNull()
    expect(result!.x).toBe(10)
    expect(result!.widthOverride).toBe(0.375)
  })

  it('ignores rotated walls', () => {
    const rotated = el('w3', 'wall-exterior', 0, 10, 20, 0.5, 45)
    const result = snapOpeningToWall({ x: 5, y: 10.1 }, [rotated], 3, 1)
    expect(result).toBeNull()
  })

  it('picks the closest wall when multiple are in range', () => {
    const near = el('near', 'wall-exterior', 0, 10, 20, 0.5)
    const far = el('far', 'wall-exterior', 0, 11, 20, 0.5)
    const result = snapOpeningToWall({ x: 5, y: 10.2 }, [near, far], 3, 2)
    expect(result!.wallId).toBe('near')
  })
})

describe('getElementAABB', () => {
  it('returns the raw box when rotation is 0', () => {
    const bounds = getElementAABB({ x: 5, y: 5, width: 10, height: 4 })
    expect(bounds).toEqual({ x: 5, y: 5, width: 10, height: 4 })
  })

  it('swaps width/height for a 90° rotation, keeping the center fixed', () => {
    const bounds = getElementAABB({ x: 5, y: 5, width: 10, height: 4, rotation: 90 })
    expect(bounds.width).toBeCloseTo(4)
    expect(bounds.height).toBeCloseTo(10)
    // center was (10, 7) — must stay put
    expect(bounds.x).toBeCloseTo(8)
    expect(bounds.y).toBeCloseTo(2)
  })

  it('treats 270° the same as 90° for bounding purposes', () => {
    const b90 = getElementAABB({ x: 0, y: 0, width: 6, height: 2, rotation: 90 })
    const b270 = getElementAABB({ x: 0, y: 0, width: 6, height: 2, rotation: 270 })
    expect(b90.x).toBeCloseTo(b270.x)
    expect(b90.y).toBeCloseTo(b270.y)
    expect(b90.width).toBeCloseTo(b270.width)
    expect(b90.height).toBeCloseTo(b270.height)
  })

  it('treats 180° as an identity transform', () => {
    const bounds = getElementAABB({ x: 5, y: 5, width: 10, height: 4, rotation: 180 })
    expect(bounds).toEqual({ x: 5, y: 5, width: 10, height: 4 })
  })
})

describe('snapElementEdges with rotated targets', () => {
  it('snaps against a rotated element\'s true (swapped) bounding box, not its stored width/height', () => {
    // A 10x4 element rotated 90° at center (10,7) has a true footprint of 4 wide x 10 tall,
    // spanning x:[8,12]. Dragging a 3x3 box toward x=12.2 should snap its left edge to 12.
    const rotated = el('r', 'furniture-bed', 5, 5, 10, 4, 90)
    const dragged = { x: 12.2, y: 6, width: 3, height: 3 }
    const result = snapElementEdges(dragged, [rotated], 1)
    expect(result.snapX).toBe(true)
    expect(result.x).toBe(12)
  })
})

describe('getElementSnapPoints', () => {
  it('uses actual rotated corners rather than empty selection-box corners', () => {
    const item = el('r', 'furniture-bed', 0, 0, 4, 2, 45)
    const points = getElementSnapPoints([item])
    const box = getElementAABB(item)
    expect(points.some(p => Math.hypot(p.x - box.x, p.y - box.y) < 1e-8)).toBe(false)
    expect(points[0].x).toBeCloseTo(2 - Math.SQRT1_2)
    expect(points[0].y).toBeCloseTo(1 - 3 * Math.SQRT1_2)
  })
  it('returns 8 points per element (corners, edge midpoints)', () => {
    const pts = getElementSnapPoints([el('a', 'furniture-bed', 0, 0, 10, 4)])
    expect(pts).toHaveLength(8)
    expect(pts).toContainEqual({ x: 0, y: 0 })
    expect(pts).toContainEqual({ x: 10, y: 4 })
    expect(pts).toContainEqual({ x: 5, y: 0 }) // top-mid
    expect(pts).toContainEqual({ x: 0, y: 2 }) // left-mid
  })

  it('accumulates points across multiple elements', () => {
    const pts = getElementSnapPoints([
      el('a', 'furniture-bed', 0, 0, 2, 2),
      el('b', 'furniture-bed', 10, 10, 2, 2),
    ])
    expect(pts).toHaveLength(16)
  })
})

describe('nearestSnapPoint', () => {
  const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 3, y: 3 }]

  it('returns the closest point within threshold', () => {
    const result = nearestSnapPoint({ x: 3.2, y: 3.1 }, points, 1)
    expect(result).toEqual({ x: 3, y: 3 })
  })

  it('returns null when nothing is within threshold', () => {
    const result = nearestSnapPoint({ x: 50, y: 50 }, points, 1)
    expect(result).toBeNull()
  })
})

describe('edgeSnapThresholdFt', () => {
  it('converts a fixed pixel threshold into feet based on zoom', () => {
    expect(edgeSnapThresholdFt(24, 1, 24)).toBe(1)
    expect(edgeSnapThresholdFt(24, 2, 24)).toBe(0.5) // zoomed in → smaller feet threshold
  })
})

describe('snapWallEndpoint', () => {
  const elements = [el('a', 'wall-exterior', 5, 0, 0.5, 10)]

  it('snaps a horizontally-moving endpoint to a nearby element edge', () => {
    const result = snapWallEndpoint({ x: 0, y: 0 }, { x: 5.3, y: 0 }, elements, 1)
    expect(result.x).toBe(5.5) // snapped to el's right edge (5 + 0.5 width), closer than left edge
    expect(result.y).toBe(0)
  })

  it('snaps a vertically-moving endpoint to the exposed continuous wall end', () => {
    const result = snapWallEndpoint({ x: 0, y: 0 }, { x: 0, y: 9.7 }, elements, 1)
    expect(result.y).toBe(10)
  })

  it('leaves the point unchanged when nothing is within threshold', () => {
    const result = snapWallEndpoint({ x: 0, y: 0 }, { x: 50, y: 0 }, elements, 1)
    expect(result).toEqual({ x: 50, y: 0 })
  })
})

describe('getDoorClearanceZones', () => {
  it('builds a symmetric swing zone around a door on a horizontal wall', () => {
    // Door on a horizontal wall: x=10, y=4.81, width=3 (span), height=0.38 (wall thickness)
    const door = el('d1', 'door-single', 10, 4.81, 3, 0.38)
    const [zone] = getDoorClearanceZones([door])
    expect(zone.openingId).toBe('d1')
    expect(zone.x).toBe(10)
    expect(zone.width).toBe(3)
    // Extends by the swing radius (door width = 3) on both sides of the wall
    expect(zone.y).toBeCloseTo(4.81 - 3)
    expect(zone.height).toBeCloseTo(0.38 + 6)
  })

  it('builds a swing zone around a door on a vertical wall', () => {
    const door = el('d2', 'door-single', 20, 5, 0.38, 3)
    const [zone] = getDoorClearanceZones([door])
    expect(zone.x).toBeCloseTo(20 - 3)
    expect(zone.width).toBeCloseTo(0.38 + 6)
    expect(zone.y).toBe(5)
    expect(zone.height).toBe(3)
  })

  it('ignores non-swinging openings', () => {
    const sliding = el('s1', 'door-sliding', 10, 4.81, 3, 0.38)
    const pocket = el('p1', 'door-pocket', 10, 4.81, 3, 0.38)
    const cased = el('c1', 'cased-opening', 10, 4.81, 3, 0.38)
    expect(getDoorClearanceZones([sliding, pocket, cased])).toHaveLength(0)
  })
})

describe('pushOutOfClearanceZones', () => {
  it('pushes an element the minimum distance clear of an intruding zone', () => {
    // Tall zone spans x:[8,14], y:[-10,14]. A 2x2 element at (9,1): moving left to clear
    // (elRight-zLeft = 11-8 = 3) is far cheaper than right (14-9=5) or up/down (13 each),
    // so it should shift left by exactly 3 and leave Y untouched.
    const zones = [{ x: 8, y: -10, width: 6, height: 24, openingId: 'door-1' }]
    const result = pushOutOfClearanceZones({ x: 9, y: 1, width: 2, height: 2 }, zones)
    expect(result.blockedBy).toEqual(['door-1'])
    expect(result.x).toBeCloseTo(6)
    expect(result.y).toBe(1)
  })

  it('leaves the element alone when it does not intersect any zone', () => {
    const zones = [{ x: 8, y: 0, width: 6, height: 4, openingId: 'door-1' }]
    const result = pushOutOfClearanceZones({ x: 100, y: 100, width: 2, height: 2 }, zones)
    expect(result).toEqual({ x: 100, y: 100, blockedBy: [] })
  })

  it('resolves against multiple zones sequentially', () => {
    const zones = [
      { x: 0, y: 0, width: 4, height: 4, openingId: 'door-a' },
      { x: 3, y: -10, width: 2, height: 30, openingId: 'door-b' }, // a tall vertical-wall zone
    ]
    const result = pushOutOfClearanceZones({ x: 1, y: 1, width: 1, height: 1 }, zones)
    expect(result.blockedBy).toContain('door-a')
    // After clearing door-a it may or may not still sit in door-b's tall strip;
    // whichever happens, the result must not intersect either zone.
    for (const z of zones) {
      const overlapsX = result.x < z.x + z.width && result.x + 1 > z.x
      const overlapsY = result.y < z.y + z.height && result.y + 1 > z.y
      expect(overlapsX && overlapsY).toBe(false)
    }
  })
})

describe('snapElementEdges', () => {
  it('aligns the visible solids of both continuous walls', () => {
    const moving = el('m', 'wall-interior', 0.1, 0, 10, 0.5)
    const target = el('t', 'wall-interior', 10, 0, 10, 0.5)
    const result = snapElementEdges(moving, [target], 1)
    expect(result.x).toBeCloseTo(0)
    expect(result.guideX).toBeCloseTo(10)
  })
  it('snaps a horizontal wall end to a vertical face at 800% zoom',()=>{
    const target=el('v','wall-exterior',10,0,.5,10)
    const moving=el('h','wall-exterior',.04,9.5,10,.5)
    const result=snapElementEdges(moving,[target],edgeSnapThresholdFt(24,8))
    expect(result.snapX).toBe(true);expect(result.x+moving.width).toBeCloseTo(10)
    expect(result.snapY).toBe(true);expect(result.y+moving.height).toBeCloseTo(10)
  })
  it('does not invent axis edges around diagonal targets', () => {
    const target = el('t', 'furniture-bed', 0, 0, 4, 2, 45)
    const box = getElementAABB(target)
    const result = snapElementEdges({ x: box.x - 1.05, y: box.y - 1.05, width: 1, height: 1 }, [target], 0.1)
    expect(result.snapX).toBe(false)
    expect(result.snapY).toBe(false)
  })
  const others = [el('a', 'furniture-bed', 10, 10, 4, 4)]

  it('snaps the dragged element left edge to another element right edge', () => {
    const dragged = { x: 14.2, y: 10, width: 3, height: 3 }
    const result = snapElementEdges(dragged, others, 1)
    expect(result.snapX).toBe(true)
    expect(result.x).toBe(14) // other's right edge
    expect(result.guideX).toBe(14)
  })

  it('excludes the element itself by id', () => {
    const dragged = { x: 10.2, y: 10, width: 4, height: 4 }
    const result = snapElementEdges(dragged, others, 1, 'a')
    expect(result.snapX).toBe(false)
    expect(result.x).toBe(10.2)
  })

  it('falls back to original position when nothing is within threshold', () => {
    const dragged = { x: 100, y: 100, width: 2, height: 2 }
    const result = snapElementEdges(dragged, others, 1)
    expect(result).toEqual({ x: 100, y: 100, snapX: false, snapY: false, guideX: undefined, guideY: undefined })
  })
})
