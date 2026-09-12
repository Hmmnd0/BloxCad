import { describe, it, expect } from 'vitest'
import { buildWallRegions, wallRegionPath } from './wallUnion'
import type { PlacedElement } from '../types'
const wall = (id:string,x:number,y:number,width:number,height:number,bloxId='wall-cmu-footing',rotation=0):PlacedElement=>({id,x,y,width,height,bloxId,rotation,properties:{},locked:false})
const area = (regions:ReturnType<typeof buildWallRegions>) => regions.reduce((sum,r)=>sum+r.polygons.reduce((n,p)=>n+p.reduce((a,ring)=>a+ring.slice(1).reduce((s,[x,y],i)=>s+ring[i][0]*y-x*ring[i][1],0)/2,0),0),0)
describe('continuous wall regions',()=>{
  it('forms one footing and one stem ring around a closed foundation',()=>{
    const r=buildWallRegions([wall('a',0,0,20,2),wall('b',0,12,20,2),wall('c',0,0,2,14),wall('d',18,0,2,14)])
    expect(r).toHaveLength(2)
    for(const region of r) { expect(region.polygons).toHaveLength(1); expect(region.polygons[0]).toHaveLength(2) }
    expect(area([r[0]])).toBeCloseTo(120)
  })
  it('removes overlap areas and internal boundaries at L and T joins',()=>{
    for(const x of [0,4]) {
      const r=buildWallRegions([wall('a',0,0,10,1,'wall-interior'),wall('b',x,0,1,6,'wall-interior')])
      expect(r[0].polygons).toHaveLength(1)
      expect(area(r)).toBeCloseTo(15)
    }
  })
  it('keeps the outline of duplicated or coincident sections',()=>{
    const a=wall('a',0,0,10,1,'wall-interior')
    expect(buildWallRegions([a,{...a,id:'b'}])).toEqual(buildWallRegions([a]))
  })
  it('unions rotated intersections without axis-aligned approximation',()=>{
    const r=buildWallRegions([wall('a',0,0,10,1,'wall-interior'),wall('b',0,0,10,1,'wall-interior',45)])
    expect(r[0].polygons).toHaveLength(1)
    expect(area(r)).toBeLessThan(20)
    expect(wallRegionPath(r[0].polygons)).not.toMatch(/NaN|undefined/)
  })
  it('does not bridge small real gaps or join different layers',()=>{
    const a=wall('a',0,0,10,1,'wall-interior')
    expect(buildWallRegions([a,wall('b',10.001,0,5,1,'wall-interior')])[0].polygons).toHaveLength(2)
    expect(buildWallRegions([a,{...a,id:'b',layerId:'other'}])).toHaveLength(2)
  })
  it('retains hosted opening cuts',()=>{
    const a=wall('a',0,0,10,1,'wall-interior')
    const op={...wall('door',4,0,2,1,'cased-opening'),wallHost:{wallId:'a',offset:4}}
    const r=buildWallRegions([a,op])
    expect(r[0].polygons).toHaveLength(2)
    expect(area(r)).toBeCloseTo(8)
  })
})
