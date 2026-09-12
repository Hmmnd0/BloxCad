import {describe,it,expect} from 'vitest'
import {structuralGeometry} from './structuralGeometry'
describe('generic coordination rectangle',()=>{
  it('uses a neutral footprint with a visible center cross',()=>{
    const shapes=structuralGeometry('shape-rect',120,80)
    expect(shapes).toHaveLength(3)
    expect(shapes[0]).toMatchObject({kind:'rect',x:0,y:0,width:120,height:80,fill:'#fafbfd'})
    expect(shapes.filter(s=>s.kind==='line')).toHaveLength(2)
  })
  it('rejects invalid footprints',()=>expect(structuralGeometry('shape-rect',0,10)).toEqual([]))
})
