import { describe, expect, it } from 'vitest'
import { BLOX_DEFINITIONS } from '../blox/definitions'
import { circulationGeometry as geometry, circulationDirection, circulationSVG, REFINED_CIRCULATION, boundedCount } from './circulationGeometry'
import { buildProjectSVG } from './svgExport'

describe('shared opening and circulation symbols',()=>{
  it('covers all 17 definitions, including actual plan previews',()=>{
    const defs=BLOX_DEFINITIONS.filter(d=>d.category==='Openings'||d.category==='Stairs')
    expect(new Set(defs.map(d=>d.id))).toEqual(REFINED_CIRCULATION)
    expect(defs).toHaveLength(17)
    for(const d of defs) expect(geometry(d.id,d.defaultWidth,d.defaultHeight).shapes.length).toBeGreaterThan(1)
  })
  it('does not change geometry complexity with drawing scale',()=>{
    for(const id of REFINED_CIRCULATION) for(const [w,h] of [[3,10],[10,3],[3,.01],[.01,3]]) {
      const a=geometry(id,w,h), b=geometry(id,w*24,h*24)
      expect(a.shapes.length,id).toBe(b.shapes.length)
      expect(b.bounds.width,id).toBeCloseTo(a.bounds.width*24)
      expect(b.bounds.height,id).toBeCloseTo(a.bounds.height*24)
      expect(JSON.stringify(a)).not.toMatch(/NaN|Infinity|undefined/)
    }
  })
  it('rejects invalid sizes and bounds unsafe property counts',()=>{
    for(const n of [0,-1,NaN,Infinity]) expect(geometry('stairs-straight',n,3).shapes).toEqual([])
    expect(boundedCount(NaN,11)).toBe(11)
    expect(boundedCount(Infinity,11)).toBe(11)
    expect(boundedCount(1e6,11)).toBe(64)
    expect(boundedCount(3.6,11)).toBe(4)
    expect(geometry('window-multi',6,.5,{paneCount:1}).shapes).toEqual(geometry('window-single',6,.5).shapes)
  })
  it('puts double-door hinges at both jambs, never at the center',()=>{
    const shapes=geometry('door-double',6,.5).shapes.filter(s=>s.kind==='path')
    expect(shapes.map(s=>s.d)).toContain('M0,0 L0,3')
    expect(shapes.map(s=>s.d)).toContain('M6,0 L6,3')
    expect(shapes.map(s=>s.d)).toContain('M3,0 A3,3 0 0 1 0,3')
    expect(shapes.map(s=>s.d)).toContain('M3,0 A3,3 0 0 0 6,3')
  })
  it('transposes door arcs and preserves legacy flip handedness',()=>{
    const arcs=(w:number,h:number,flipped=false)=>geometry('door-double',w,h,{flipped}).shapes.filter(s=>s.kind==='path'&&s.d.includes(' A')).map(s=>s.kind==='path'?s.d:'')
    expect(arcs(.5,6)).toEqual(['M0,3 A3,3 0 0 0 3,0','M0,3 A3,3 0 0 1 3,6'])
    expect(arcs(.5,6,true)).toEqual(['M0.5,3 A3,3 0 0 1 -2.5,0','M0.5,3 A3,3 0 0 0 -2.5,6'])
    expect(arcs(6,.5,true)).toEqual(['M3,0.5 A3,3 0 0 0 0,-2.5','M3,0.5 A3,3 0 0 1 6,-2.5'])
  })
  it('tracks symbol extents outside the wall slot without changing its footprint',()=>{
    expect(geometry('door-single',3,.5).bounds).toEqual({x:0,y:0,width:3,height:3})
    expect(geometry('door-pocket',3,.5).bounds).toEqual({x:-3,y:0,width:6,height:.5})
    expect(geometry('door-pocket',.5,3).bounds).toEqual({x:0,y:-3,width:.5,height:6})
    expect(geometry('door-bifold',3,.5).bounds.height).toBeCloseTo(1.5/Math.SQRT2)
  })
  it('uses two equal half-span bifold leaves',()=>{
    const fold=1.5/Math.SQRT2
    expect(Math.hypot(fold,fold)*2).toBeCloseTo(3)
    expect(geometry('door-bifold',3,.5).shapes.some(s=>s.kind==='path'&&s.d===`M0,0 L${fold},${fold} L${fold*2},0`)).toBe(true)
  })
  it('shares arrow semantics across flips and arbitrary rotations',()=>{
    const el={bloxId:'stairs-straight',width:3,height:10,rotation:0,properties:{}}
    expect(circulationDirection(el)?.direction).toBe('up')
    expect(circulationDirection({...el,properties:{flipV:true}})?.direction).toBe('down')
    expect(circulationDirection({...el,rotation:90})?.direction).toBe('right')
    expect(circulationDirection({...el,rotation:45})?.vector.x).toBeCloseTo(Math.SQRT1_2)
    expect(circulationDirection({...el,width:10,height:3,properties:{flipH:true}})?.direction).toBe('left')
    expect(circulationDirection({...el,bloxId:'stairs-hatch'})?.label).toBe('DN')
    expect(circulationDirection({...el,bloxId:'fixture-ramp'})?.direction).toBe('down')
    expect(circulationDirection({...el,bloxId:'stairs-landing'})).toBeUndefined()
  })
  it('honors explicit steps and keeps ramps free of treads',()=>{
    expect(geometry('stairs-straight',3,10,{stepCount:20}).shapes.length-geometry('stairs-straight',3,10,{stepCount:12}).shapes.length).toBe(8)
    expect(geometry('fixture-ramp',3,10).shapes).toEqual(geometry('fixture-ramp',3,10,{stepCount:20}).shapes)
  })
  it('exports shared paths and counter-reflects text, without a labeled-box fallback',()=>{
    for(const id of REFINED_CIRCULATION) {
      const model=geometry(id,72,24)
      const svg=circulationSVG(model,72,24,{flipH:true})
      for(const s of model.shapes) if(s.kind==='path') expect(svg).toContain(`d="${s.d}"`)
      expect(svg).toContain('translate(72,0) scale(-1,1)')
      expect(svg).not.toMatch(/NaN|undefined/)
    }
    const svg=buildProjectSVG({id:'p',name:'Circulation',scale:'quarter',elements:[{id:'s',bloxId:'stairs-straight',x:0,y:0,width:3,height:10,rotation:90,locked:false,properties:{flipV:true}}],dimensions:[]})
    expect(svg).toContain('>UP</text>')
    expect(svg).not.toContain('Straight Stairs</text>')
  })
})
