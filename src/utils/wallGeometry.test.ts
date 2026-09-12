import { describe, expect, it } from 'vitest'
import { REFINED_WALLS, wallGeometry, wallGeometrySVG } from './wallGeometry'

describe('shared wall plan graphics', () => {
  it.each([...REFINED_WALLS])('%s preserves its footprint and transposes cleanly', id => {
    const horizontal = wallGeometry(id, 240, 18)
    const vertical = wallGeometry(id, 18, 240)
    expect(horizontal.length).toBe(vertical.length)
    expect(horizontal[0]).toMatchObject({ kind: 'rect', x: 0, y: 0, width: 240, height: 18 })
    horizontal.forEach((shape, i) => {
      const other = vertical[i]
      if (shape.kind === 'rect') {
        expect(other).toMatchObject({ kind: 'rect', x: shape.y, y: shape.x, width: shape.height, height: shape.width })
        expect(shape.x).toBeGreaterThanOrEqual(0)
        expect(shape.y).toBeGreaterThanOrEqual(0)
        expect(shape.x + shape.width).toBeLessThanOrEqual(240.000001)
        expect(shape.y + shape.height).toBeLessThanOrEqual(18.000001)
      }
      if (shape.kind === 'line' && other.kind === 'line') {
        for (let p = 0; p < shape.points.length; p += 2) {
          expect(other.points[p]).toBe(shape.points[p + 1])
          expect(other.points[p + 1]).toBe(shape.points[p])
        }
      }
    })
    expect(wallGeometry(id, 480, 36).length).toBe(horizontal.length)
    expect(wallGeometrySVG(id, 240, 18)).not.toMatch(/NaN|Infinity|undefined/)
  })
  it('rejects invalid input', () => {
    for (const size of [0, -1, NaN, Infinity]) expect(wallGeometry('wall-cmu', size, 18)).toEqual([])
    expect(wallGeometry('unknown', 240, 18)).toEqual([])
  })
  it('uses paired hollow cells, not elevation brick courses', () => {
    const cells = wallGeometry('wall-cmu', 240, 20).filter(s => s.kind === 'rect' && s.fill === '#edf0f3')
    expect(cells).toHaveLength(12)
    expect(cells.every(s => s.kind === 'rect' && s.y === 4.4)).toBe(true)
  })
  it('matches the continuous footing stem inset on all four sides', () => {
    expect(wallGeometry('wall-cmu-footing', 240, 20)[1]).toMatchObject({ x: 6, y: 6, width: 228, height: 8 })
  })
  it('distinguishes fire ratings without relying on color', () => {
    expect(wallGeometry('wall-fire-1hr', 240, 20).filter(s => s.kind === 'line')).toHaveLength(1)
    expect(wallGeometry('wall-fire-2hr', 240, 20).filter(s => s.kind === 'line')).toHaveLength(2)
    expect(wallGeometrySVG('wall-fire-1hr', 240, 20)).toContain('1HR')
    expect(wallGeometrySVG('wall-fire-2hr', 240, 20)).toContain('2HR')
  })
})
