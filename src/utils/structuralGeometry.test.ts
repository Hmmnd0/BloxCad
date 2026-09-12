import { describe,expect,it } from 'vitest'
import { REFINED_STRUCTURAL,structuralGeometry } from './structuralGeometry'
describe('structural plan graphics',()=>{
  it.each([...REFINED_STRUCTURAL])('%s remains bounded at any scale',id=>{
    for(const [w,h] of [[120,30],[30,120],[40,40],[.1,.3]]) {
      const shapes=structuralGeometry(id,w,h)
      expect(shapes.length).toBeGreaterThan(0)
      expect(structuralGeometry(id,w*2,h*2).length).toBe(shapes.length)
      for(const s of shapes) {
        if(s.kind==='line')for(let i=0;i<s.points.length;i++) {
          expect(s.points[i]).toBeGreaterThanOrEqual(-1e-8)
          expect(s.points[i]).toBeLessThanOrEqual((i%2?h:w)+1e-8)
        }
        if(s.kind==='rect') {
          expect(s.x+s.width).toBeLessThanOrEqual(w+1e-8)
          expect(s.y+s.height).toBeLessThanOrEqual(h+1e-8)
        }
      }
    }
  })
  it('rejects invalid sizes and IDs',()=>{
    for(const size of [0,-1,NaN,Infinity])expect(structuralGeometry('structural-beam',size,20)).toEqual([])
    expect(structuralGeometry('unknown',20,20)).toEqual([])
  })
  it('retains circular column geometry without implying a hollow core',()=>{
    expect(structuralGeometry('structural-column-round',40,80)).toEqual([{kind:'ellipse',x:20,y:40,rx:20,ry:20,fill:'#404750',stroke:'#263343',weight:1.2}])
  })
  it('matches the foundation union instead of drawing per-run material joints',()=>{
    expect(structuralGeometry('structural-foundation-wall',120,20)).toHaveLength(1)
    expect(structuralGeometry('structural-foundation-wall',120,20)[0]).toMatchObject({fill:'#9A9A9A'})
  })
})
