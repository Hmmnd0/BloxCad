import { describe,expect,it } from 'vitest'
import { electricalGeometry,REFINED_ELECTRICAL } from './electricalGeometry'
import { structuralGeometry,REFINED_STRUCTURAL } from './structuralGeometry'
import { elementSVG } from './svgExport'

describe('electrical device graphics',()=>{
  it.each([...REFINED_ELECTRICAL])('%s has scale-stable notation and readable labels',id=>{
    for(const size of [7.2,12,24,100]) {
      const shapes=electricalGeometry(id,size,size)
      expect(shapes.length).toBe(electricalGeometry(id,size*2,size*2).length)
      expect(shapes.length).toBeGreaterThan(0)
      for(const s of shapes)if(s.kind==='text') {
        expect(s.fontSize).toBeGreaterThanOrEqual(12)
        expect(s.height).toBeGreaterThanOrEqual(s.fontSize*1.25)
      }
    }
  })
  it('keeps outlet qualifiers clear of the device circle',()=>{
    const top=electricalGeometry('elec-outlet-gfci',12,12).find(s=>s.kind==='text')!
    const bottom=electricalGeometry('elec-outlet-240v',12,12).find(s=>s.kind==='text')!
    expect(top.kind==='text'&&top.y+top.height).toBeLessThan(0)
    expect(bottom.kind==='text'&&bottom.y).toBeGreaterThan(12)
  })
  it('keeps three-way and dimmer identities explicit',()=>{
    expect(electricalGeometry('elec-switch-3way',7.2,7.2)[0]).toMatchObject({text:'S3'})
    expect(electricalGeometry('elec-switch-dimmer',7.2,7.2)[0]).toMatchObject({text:'SD'})
  })
  it('does not take over routing or accept invalid geometry',()=>{
    expect(electricalGeometry('elec-conduit',100,10)).toEqual([])
    expect(electricalGeometry('elec-homerun',100,10)).toEqual([])
    expect(electricalGeometry('elec-meter',NaN,10)).toEqual([])
    expect(electricalGeometry('elec-meter',10,0)).toEqual([])
  })
  it.each([...REFINED_ELECTRICAL,...REFINED_STRUCTURAL])('%s exports actual native shapes',id=>{
    const el={id:'test',bloxId:id,x:0,y:0,width:2,height:1,rotation:90,properties:{flipH:true},locked:false}
    const svg=elementSVG(el,24)
    expect(svg).not.toMatch(/NaN|undefined/)
    expect(svg).toMatch(/<(rect|ellipse|polyline|text) /)
    const shapes=REFINED_STRUCTURAL.has(id)?structuralGeometry(id,48,24):electricalGeometry(id,48,24)
    for(const shape of shapes)if(shape.kind==='text'){expect(svg).toContain(shape.text);expect(svg).toContain('scale(-1 1)')}
  })
})
