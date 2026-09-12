import { describe, expect, it } from 'vitest'
import { caseworkGeometry, REFINED_CASEWORK } from './caseworkGeometry'
describe('refined casework', () => {
  it('keeps details inside the footprint in both orientations', () => {
    for (const id of REFINED_CASEWORK) for (const [w,h] of [[200,80],[80,200],[12,20],[90,90]]) {
      const shapes = caseworkGeometry(id,w,h)
      expect(shapes.length).toBeGreaterThan(0)
      for (const s of shapes) {
        const points = s.kind === 'rect' ? [s.x,s.y,s.x+s.width,s.y+s.height] : s.points
        points.forEach((v,i) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual((i%2?h:w)+1e-8) })
      }
    }
  })
  it('keeps divider counts stable across display scales', () => {
    for (const id of REFINED_CASEWORK) expect(caseworkGeometry(id,40,15).length).toBe(caseworkGeometry(id,240,90).length)
  })
  it('retains dashed overhead boundaries', () => {
    expect(caseworkGeometry('casework-upper',80,30)[0].dash).toEqual([5,3])
    expect(caseworkGeometry('casework-base',80,30)[0].dash).toBeUndefined()
  })
  it('rejects invalid dimensions and unsupported IDs', () => {
    for (const v of [0,-1,NaN,Infinity]) expect(caseworkGeometry('casework-base',v,30)).toEqual([])
    expect(caseworkGeometry('unknown',80,30)).toEqual([])
  })
})
