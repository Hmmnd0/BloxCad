import { describe, it, expect } from 'vitest'
import {
  snapOpeningToWall,
  getElementSnapPoints,
  nearestSnapPoint,
  edgeSnapThresholdFt,
  snapWallEndpoint,
  snapElementEdges,
} from './snap'
import type { PlacedElement } from '../types'

function el(id: string, bloxId: string, x: number, y: number, width: number, height: number, rotation = 0): PlacedElement {
  return { id, bloxId, x, y, width, height, rotation, properties: {}, locked: false }
}

describe('snapOpeningToWall', () => {
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

describe('getElementSnapPoints', () => {
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

  it('snaps a vertically-moving endpoint to a nearby element edge', () => {
    const result = snapWallEndpoint({ x: 0, y: 0 }, { x: 0, y: 9.7 }, elements, 1)
    expect(result.y).toBe(10) // snapped to el's bottom edge
  })

  it('leaves the point unchanged when nothing is within threshold', () => {
    const result = snapWallEndpoint({ x: 0, y: 0 }, { x: 50, y: 0 }, elements, 1)
    expect(result).toEqual({ x: 50, y: 0 })
  })
})

describe('snapElementEdges', () => {
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
