import {describe,it,expect} from 'vitest'
import {fixtureGeometry,REFINED_FIXTURES} from './fixtureGeometry'
describe('refined bathroom fixtures',()=>{
  it('keeps all details in their footprint at both orientations and small scales',()=>{
    for(const id of REFINED_FIXTURES) for(const [w,h] of [[20,40],[200,80],[80,200],[90,90]]) {
      const shapes=fixtureGeometry(id,w,h)
      expect(shapes.length).toBeGreaterThan(0)
      for(const s of shapes) {
        const p=s.kind==='rect'||s.kind==='text'?[s.x,s.y,s.x+s.width,s.y+s.height]:s.kind==='ellipse'?[s.x-s.rx,s.y-s.ry,s.x+s.rx,s.y+s.ry]:s.points
        p.forEach((v,i)=>{expect(v).toBeGreaterThanOrEqual(-1e-8);expect(v).toBeLessThanOrEqual((i%2?h:w)+1e-8)})
      }
    }
  })
  it('retains detail counts across display scales',()=>{
    for(const id of REFINED_FIXTURES) expect(fixtureGeometry(id,20,40).length).toBe(fixtureGeometry(id,100,200).length)
  })
  it('rejects invalid dimensions and unknown symbols',()=>{
    for(const n of [0,-1,Infinity,NaN]) expect(fixtureGeometry('fixture-toilet',n,40)).toEqual([])
    expect(fixtureGeometry('unknown',20,40)).toEqual([])
  })
  it('retains distinguishing appliance labels at library and canvas scales',()=>{
    for(const [id,text] of [['refrigerator','REF'],['dishwasher','DW'],['washer','W'],['dryer','D']]) for(const size of [24,120]) {
      expect(fixtureGeometry('fixture-'+id,size,size).filter(s=>s.kind==='text').map(s=>s.text)).toEqual([text])
    }
  })
  it('keeps four burners and paired kitchen basins at either orientation',()=>{
    for(const [w,h] of [[120,80],[80,120]]) {
      expect(fixtureGeometry('fixture-range',w,h).filter(s=>s.kind==='ellipse')).toHaveLength(4)
      expect(fixtureGeometry('fixture-sink-kitchen',w,h).filter(s=>s.kind==='rect')).toHaveLength(3)
    }
  })
})
