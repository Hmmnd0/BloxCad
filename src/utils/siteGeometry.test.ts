import {describe,it,expect} from 'vitest'
import {siteGeometry,REFINED_SITE} from './siteGeometry'
import {elementSVG} from './svgExport'
describe('shared site graphics',()=>{
  it.each(['site-easement','site-retaining-wall'])('%s clips hatching to its physical boundary',id=>{
    for(const [w,h] of [[240,48],[48,240]])for(const s of siteGeometry(id,w,h,24))if(s.kind==='line')s.points.forEach((v,i)=>{
      expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(i%2?h:w)
    })
  })
  it('keeps survey data and explicit font size in readable text boxes',()=>{
    const shapes=siteGeometry('site-property-line',1200,24,24,{bearing:'N 30° E',lineType:'front',fontSize:18})
    const labels=shapes.filter(s=>s.kind==='text')
    expect(labels.map(s=>s.text)).toEqual(['PL',"N 30° E  50.00'",'FRONT'])
    for(const s of labels){expect(s.fontSize).toBe(18);expect(s.height).toBeGreaterThanOrEqual(23.4)}
  })
  it('does not reverse short setback lines or cross a contour label',()=>{
    const setback=siteGeometry('site-setback-line',12,6,24)
    for(const s of setback)if(s.kind==='line')expect(s.points[2]).toBeGreaterThanOrEqual(s.points[0])
    const contour=siteGeometry('site-contour',240,24,24,{elevLabel:'125.5'})
    const label=contour.find(s=>s.kind==='text')!
    expect(label.kind).toBe('text')
    if(label.kind==='text')for(const s of contour)if(s.kind==='line')for(let i=0;i<s.points.length;i+=2)expect(s.points[i]<=label.x||s.points[i]>=label.x+label.width).toBe(true)
  })
  it.each([...REFINED_SITE])('%s keeps its divisions independent of rendering scale',id=>{
    const a=siteGeometry(id,27*12,18*12,12),b=siteGeometry(id,27*48,18*48,48)
    expect(a.length).toBeGreaterThan(0);expect(a.length).toBe(b.length)
    expect(elementSVG({id:'s',bloxId:id,x:0,y:0,width:27,height:18,rotation:0,properties:{},locked:false},24)).not.toMatch(/NaN|undefined/)
  })
  it('preserves nine-foot parking divisions including partial final stalls',()=>{
    const a=siteGeometry('site-parking-stall',27*24,18*24,24)
    expect(a).toHaveLength(3)
    expect(a[1]).toMatchObject({points:[216,0,216,432]})
    expect(siteGeometry('site-parking-stall',28*24,18*24,24)).toHaveLength(4)
  })
  it('preserves existing paving and deck spacing',()=>{
    expect(siteGeometry('site-sidewalk',20*24,5*24,24)).toHaveLength(6)
    expect(siteGeometry('site-driveway',20*24,10*24,24)).toHaveLength(5)
    expect(siteGeometry('site-deck-patio',12*24,10*24,24)).toHaveLength(30)
  })
  it('rejects invalid scale and leaves legal boundaries alone',()=>{
    expect(siteGeometry('site-tree',10,10,0)).toEqual([])
    expect(siteGeometry('unknown',100,10,24)).toEqual([])
  })
})
