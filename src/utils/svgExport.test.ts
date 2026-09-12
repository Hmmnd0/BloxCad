import { describe, it, expect } from 'vitest'
import { buildProjectSVG } from './svgExport'
import type { PlacedElement, DimensionLine, Project } from '../types'

function el(id: string, bloxId: string, x: number, y: number, width: number, height: number, rotation = 0, properties: Record<string, unknown> = {}): PlacedElement {
  return { id, bloxId, x, y, width, height, rotation, properties, locked: false }
}

function dim(id: string, x1: number, y1: number, x2: number, y2: number, offset = -1.5): DimensionLine {
  return { id, x1, y1, x2, y2, offset }
}

function project(elements: PlacedElement[], dimensions: DimensionLine[] = []): Project {
  return {
    id: 'p1', name: 'Test Project', scale: 'quarter', mode: 'floorplan',
    elements, dimensions,
  }
}

describe('buildProjectSVG', () => {
  it('produces a well-formed SVG document with no leaked NaN/undefined', () => {
    const p = project([
      el('w1', 'wall-exterior', 0, 0, 20, 0.5),
      el('w2', 'wall-exterior', 0, 0, 0.5, 15, 90),
      el('d1', 'door-single', 5, 0, 3, 0.5),
      el('d2', 'door-single', 0, 5, 0.5, 3),
      el('d3', 'door-double', 10, 0, 6, 0.5, 0, { flipped: true }),
      el('win1', 'window-single', 15, 0, 0.5, 3),
      el('tag1', 'annotation-room-tag', 8, 8, 6, 2, 0, { roomName: 'Living Room', roomArea: '200 SF' }),
      el('note1', 'text-note', 8, 12, 10, 3, 0, { text: 'Line one\nLine two', fontSize: 12 }),
      el('fx1', 'fixture-toilet', 2, 2, 1.5, 2.5),
    ], [
      dim('dm1', 0, 0, 20, 0, 3),
      dim('dm2', 0, 0, 0, 15, -3),
    ])

    const svg = buildProjectSVG(p)

    expect(svg.startsWith('<?xml')).toBe(true)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).not.toMatch(/NaN/)
    expect(svg).not.toMatch(/undefined/)

    // Tag balance sanity check — <g> and <text> are always explicitly closed
    // in this module; <rect>/<path>/<line> are self-closing throughout, so
    // they're excluded here rather than asserted balanced.
    for (const tag of ['g', 'text']) {
      const opens = (svg.match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length
      const closes = (svg.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
      expect(closes).toBe(opens)
      expect(opens).toBeGreaterThan(0)
    }
    expect((svg.match(/<rect /g) ?? []).length).toBeGreaterThan(0)

    // Real vector content for the "common elements" bucket
    expect(svg).toContain('#3C3C3C')          // exterior wall fill
    expect(svg).toContain('Living Room')      // room tag text
    expect(svg).toContain('Line one')         // text-note content
    expect(svg).toMatch(/<path d="M/)         // door swing arc path

    // Refined fixtures now retain actual vector geometry, not labeled boxes.
    expect(svg).toContain('<ellipse')
    expect(svg).not.toContain('>Toilet</text>')
  })

  it('falls back to a default canvas size for an empty project', () => {
    const svg = buildProjectSVG(project([]))
    expect(svg).toContain('<svg')
    expect(svg).not.toMatch(/NaN/)
  })

  it('renders detail-mode elements/dimensions from the detail arrays, not floorplan ones', () => {
    const p: Project = {
      ...project([el('floor1', 'wall-exterior', 0, 0, 20, 0.5)]),
      mode: 'detail',
      detailElements: [el('det1', 'wall-interior', 0, 0, 10, 10)],
      detailDimensions: [dim('dd1', 0, 0, 10, 0, 2)],
    }
    const svg = buildProjectSVG(p)
    expect(svg).not.toContain('floor1')
    expect(svg).toContain('#5A5A5A') // interior wall fill from the detail element
  })
})
