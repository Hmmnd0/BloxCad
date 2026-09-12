import {describe,it,expect} from 'vitest'
import {routingGeometry,REFINED_ROUTING} from './routingGeometry'
import {elementSVG} from './svgExport'
describe('electrical routing geometry',()=>{
  it('retains the original quadratic control curve, not a nearly straight run',()=>{
    const curve=routingGeometry('elec-circuit-wire',120,40)[0]
    expect(curve.kind).toBe('line')
    if(curve.kind!=='line')return
    expect(curve.points.slice(0,2)).toEqual([0,34])
    expect(curve.points.slice(24,26)).toEqual([60,18])
    expect(curve.points.slice(-2)).toEqual([120,34])
  })
  it('keeps portrait conduit running vertically',()=>{
    const lines=routingGeometry('elec-conduit',10,120)
    expect(lines).toMatchObject([{points:[3,0,3,120]},{points:[7,0,7,120]}])
  })
  it('retains a solid terminal arrow in SVG',()=>{
    const arrow=routingGeometry('elec-homerun',120,20)[3]
    expect(arrow).toMatchObject({kind:'line',fill:'#80621f'})
  })
  it.each([...REFINED_ROUTING])('%s stays bounded and exports its path',id=>{
    const shapes=routingGeometry(id,240,30,{conduitLabel:'3/4 C',circuitLabel:'A3'})
    expect(shapes.length).toBeGreaterThan(0)
    for(const s of shapes)if(s.kind==='line')for(let i=0;i<s.points.length;i++){expect(s.points[i]).toBeGreaterThanOrEqual(-4);expect(s.points[i]).toBeLessThanOrEqual((i%2?30:240)+4)}
    const svg=elementSVG({id:'r',bloxId:id,x:0,y:0,width:10,height:1,rotation:0,properties:{conduitLabel:'3/4 C',circuitLabel:'A3'},locked:false},24)
    expect(svg).not.toMatch(/NaN|undefined/)
  })
  it('keeps conduit and circuit wire metadata separate',()=>{
    expect(routingGeometry('elec-conduit',120,10,{conduitLabel:'3/4 C'}).some(s=>s.kind==='text'&&s.text==='3/4 C')).toBe(true)
    expect(routingGeometry('elec-circuit-wire',120,30,{circuitLabel:'A3'}).some(s=>s.kind==='text')).toBe(false)
  })
  it('uses a broken home-run with a terminal arrow',()=>{
    const lines=routingGeometry('elec-homerun',120,20,{circuitLabel:'A3'}).filter(s=>s.kind==='line')
    expect(lines).toHaveLength(4);expect(lines[3].points[2]).toBe(120)
  })
})
