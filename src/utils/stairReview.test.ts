import { describe,it,expect } from 'vitest'
import type { PlacedElement } from '../types'
import { stairMeasurements,reviewStraightStairs,stairLandingCoverage,STAIR_PROFILE } from './stairReview'
import { circulationGeometry } from './circulationGeometry'
const stair=(properties:Record<string,unknown>={}):PlacedElement=>({id:'s',bloxId:'stairs-straight',x:0,y:0,width:3,height:12.5,rotation:0,locked:false,properties})
const complete={stairRiseFt:10,stairRiserCount:16,stairHeadroomIn:80,stairClearWidthIn:36,stairReviewProfile:STAIR_PROFILE}
describe('physical straight stair review',()=>{
  it('calculates N risers and N−1 treads, without decorative assumptions',()=>{
    expect(stairMeasurements(stair({stepCount:16})).risers).toBeNull()
    expect(stairMeasurements(stair(complete))).toMatchObject({risers:16,treads:15,riserIn:7.5,treadIn:10})
    expect(stairMeasurements({...stair(complete),width:12.5,height:3})).toMatchObject({riserIn:7.5,treadIn:10})
  })
  it('reports unknown inputs and never claims complete compliance',()=>{
    expect(reviewStraightStairs([stair()]).map(v=>v.id)).toEqual(expect.arrayContaining(['stair-inputs-s','stair-reference-s','stair-scope-s']))
    expect(reviewStraightStairs([stair(complete)]).every(v=>v.status==='unverified')).toBe(true)
  })
  it('does not silently enable residential thresholds',()=>{
    const props={...complete,stairRiseFt:20,stairReviewProfile:''}
    expect(reviewStraightStairs([stair(props)]).some(v=>v.id==='stair-riser-s')).toBe(false)
    expect(reviewStraightStairs([stair({...props,stairReviewProfile:STAIR_PROFILE})]).some(v=>v.id==='stair-riser-s')).toBe(true)
  })
  it('checks strict reference boundaries without rounding before comparison',()=>{
    const pass=stair({...complete,stairRiseFt:16*7.75/12})
    expect(reviewStraightStairs([pass]).filter(v=>v.status==='measured')).toEqual([])
    const fail=stair({...complete,stairRiseFt:11,stairRiserCount:17,stairHeadroomIn:79.99,stairClearWidthIn:35.99})
    expect(reviewStraightStairs([fail]).filter(v=>v.status==='measured')).toHaveLength(4)
  })
  it('rejects invalid/partial data instead of passing NaN comparisons',()=>{
    for(const value of [NaN,Infinity,-1,0,'16',16.5,65]) expect(stairMeasurements(stair({stairRiserCount:value})).risers).toBeNull()
    expect(stairMeasurements(stair({stairRiseFt:NaN,stairHeadroomIn:-1}))).toMatchObject({riseFt:null,headroomIn:null})
    expect(reviewStraightStairs([stair({...complete,stairClearWidthIn:48})]).some(v=>v.id==='stair-width-conflict-s')).toBe(true)
  })
  it('requires full landing coverage, not a nearby landing center',()=>{
    const s=stair(complete),landing={...s,id:'l',bloxId:'stairs-landing',y:-3,height:3}
    expect(stairLandingCoverage(s,[landing])).toEqual([true,false])
    expect(stairLandingCoverage(s,[{...landing,y:-2}])).toEqual([false,false])
    expect(stairLandingCoverage(s,[{...landing,width:2.9}])).toEqual([false,false])
    expect(stairLandingCoverage(s,[{...landing,layerId:'other'}])).toEqual([false,false])
    expect(stairLandingCoverage(s,[landing,{...landing,id:'b',y:12.5}])).toEqual([true,true])
  })
  it('handles rotated landing coverage in world coordinates',()=>{
    const s={...stair(complete),rotation:90}
    // Original landing center (1.5,-1.5) rotated about flight center (1.5,6.25).
    const landing={...s,id:'l',bloxId:'stairs-landing',x:7.75,y:4.75,width:3,height:3}
    expect(stairLandingCoverage(s,[landing])).toEqual([true,false])
  })
  it('drives plan tread geometry from physical risers without mutating saved data',()=>{
    const props={...complete,stepCount:30}
    const g=circulationGeometry('stairs-straight',72,300,props)
    expect(g.shapes).toEqual(circulationGeometry('stairs-straight',72,300,{stepCount:15}).shapes)
    expect(props.stepCount).toBe(30)
  })
  it('does not provide auto-fixes or allow a remote rail to clear manual review',()=>{
    const s=stair(complete),rail={...s,id:'rail',bloxId:'handrail',x:100,y:100}
    expect(reviewStraightStairs([s,rail])).toEqual(reviewStraightStairs([s]))
    expect(reviewStraightStairs([s]).some(v=>'fix' in v)).toBe(false)
  })
})
