import {describe,it,expect} from 'vitest'
import {planBounds} from './planSheet'
import {electricalGeometry} from './electricalGeometry'
import {symbolBounds} from './symbolBounds'
import type {Project} from '../types'
describe('device annotation bounds',()=>{
  it('includes external GFCI labels without changing the saved footprint',()=>{
    const b=symbolBounds(electricalGeometry('elec-outlet-gfci',12,12),12,12)
    expect(b.y).toBeLessThan(0);expect(b.x).toBeLessThan(0)
    expect(b.width).toBeGreaterThan(12)
  })
  it('fits rotated and mirrored qualifiers',()=>{
    const e={id:'device',bloxId:'elec-outlet-gfci',x:0,y:0,width:.5,height:.5,rotation:0,properties:{flipV:false},locked:false}
    const p:Project={id:'p',name:'Test',scale:'quarter',mode:'floorplan',elements:[e],dimensions:[]}
    const top=planBounds(p)
    e.properties.flipV=true
    const bottom=planBounds(p)
    expect(top.y).toBeLessThan(0);expect(bottom.y).toBe(0)
    expect(bottom.height).toBe(top.height)
    e.properties.flipV=false;e.rotation=90
    const right=planBounds(p)
    expect(right.width).toBeCloseTo(top.height)
    expect(right.height).toBeCloseTo(top.width)
    expect(e.width).toBe(.5);expect(e.height).toBe(.5)
  })
})
