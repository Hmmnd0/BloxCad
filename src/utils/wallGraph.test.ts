import { describe, it, expect } from 'vitest'
import { buildWallGraph } from './wallGraph'
import type { PlacedElement } from '../types'

function wall(id: string, bloxId: string, x: number, y: number, width: number, height: number): PlacedElement {
  return { id, bloxId, x, y, width, height, rotation: 0, properties: {}, locked: false }
}

describe('buildWallGraph', () => {
  it('detects a closed 10x10 rectangular loop with no gaps', () => {
    // Walls meet corner-to-corner: each 0.5ft thick, drawn with corner overlap like place_wall does
    const elements = [
      wall('top',    'wall-exterior', 0, 0, 10.5, 0.5),
      wall('right',  'wall-exterior', 10, 0, 0.5, 10.5),
      wall('bottom', 'wall-exterior', 0, 10, 10.5, 0.5),
      wall('left',   'wall-exterior', 0, 0, 0.5, 10.5),
    ]
    const graph = buildWallGraph(elements)

    expect(graph.summary.totalWalls).toBe(4)
    expect(graph.summary.exteriorCount).toBe(4)
    expect(graph.summary.openEndCount).toBe(0)
    expect(graph.summary.closedLoops).toBe(true)
    expect(graph.gaps).toHaveLength(0)
  })

  it('flags open ends on a layout with a gap', () => {
    // Two walls that don't reach each other — 5ft gap between them
    const elements = [
      wall('a', 'wall-exterior', 0, 0, 10, 0.5),
      wall('b', 'wall-exterior', 20, 0, 10, 0.5),
    ]
    const graph = buildWallGraph(elements)

    expect(graph.summary.closedLoops).toBe(false)
    expect(graph.summary.openEndCount).toBe(4) // both ends of both walls are unconnected
    // Each open end should nominate the nearest open end on the other wall as a candidate
    const aEndGap = graph.gaps.find(g => g.wallId === 'a' && g.end === 'end')
    expect(aEndGap?.nearestWallId).toBe('b')
    expect(aEndGap?.gapFt).toBeCloseTo(10, 1)
  })

  it('recognizes a T-junction where an interior wall meets the body of another wall', () => {
    const elements = [
      wall('ext', 'wall-exterior', 0, 0, 20, 0.5),        // long horizontal wall
      wall('int', 'wall-interior', 10, 0.5, 0.375, 8),    // vertical wall starting on ext's body
    ]
    const graph = buildWallGraph(elements)

    const intNode = graph.walls.find(w => w.id === 'int')!
    expect(intNode.connections.start).toContain('ext')
    // The T-junction wall's free end (bottom) remains open
    expect(intNode.openEnds).toContain('end')
    expect(graph.summary.interiorCount).toBe(1)
  })

  it('returns an empty graph for no walls', () => {
    const graph = buildWallGraph([])
    expect(graph.walls).toHaveLength(0)
    expect(graph.gaps).toHaveLength(0)
    expect(graph.summary.closedLoops).toBe(true) // vacuously true — no open ends
  })

  it('ignores non-wall elements', () => {
    const elements = [
      wall('w', 'wall-exterior', 0, 0, 10, 0.5),
      { id: 'fixture', bloxId: 'fixture-toilet', x: 2, y: 2, width: 2, height: 2, rotation: 0, properties: {}, locked: false },
    ]
    const graph = buildWallGraph(elements)
    expect(graph.summary.totalWalls).toBe(1)
  })
})
