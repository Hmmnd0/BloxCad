import { describe, expect, it } from 'vitest'
import { furnitureGeometry, REFINED_FURNITURE } from './furnitureGeometry'
describe('refined furniture geometry', () => {
  it('keeps every shape within its footprint in both orientations and scales', () => {
    for (const id of REFINED_FURNITURE) for (const [w,h] of [[200,80],[80,200],[20,12],[12,20],[90,90]]) {
      const shapes = furnitureGeometry(id,w,h)
      expect(shapes.length).toBeGreaterThan(0)
      for (const s of shapes) {
        const points = s.kind === 'rect' ? [s.x,s.y,s.x+s.width,s.y+s.height] : s.points
        points.forEach((v,i) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual((i % 2 ? h : w) + 1e-8) })
      }
    }
  })
  it('uses one pillow for a twin, two for a queen, regardless of display scale', () => {
    expect(furnitureGeometry('furniture-bed-twin',100,200)).toHaveLength(4)
    expect(furnitureGeometry('furniture-bed-queen',100,200)).toHaveLength(5)
    expect(furnitureGeometry('furniture-bed-queen',20,40)).toHaveLength(5)
  })
  it('does not generate unsupported or zero-size geometry', () => {
    expect(furnitureGeometry('wall-interior',100,100)).toEqual([])
    expect(furnitureGeometry('furniture-sofa',0,100)).toEqual([])
    expect(furnitureGeometry('furniture-sofa',NaN,100)).toEqual([])
    expect(furnitureGeometry('furniture-sofa',Infinity,100)).toEqual([])
  })
  it('keeps storage detail counts stable across thumbnail and canvas scales', () => {
    for (const id of ['furniture-dresser','furniture-nightstand','furniture-bookcase','furniture-tv-unit']) {
      const small = furnitureGeometry(id,40,15), large = furnitureGeometry(id,240,90)
      expect(small.length).toBe(large.length)
      small.forEach((shape,i) => {
        const other = large[i]
        expect(shape.kind).toBe(other.kind)
        if (shape.kind === 'rect' && other.kind === 'rect') expect(other.width).toBeCloseTo(shape.width * 6)
      })
    }
  })
})
