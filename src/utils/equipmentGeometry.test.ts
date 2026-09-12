import {describe,it,expect} from 'vitest'
import {equipmentGeometry,REFINED_EQUIPMENT} from './equipmentGeometry'
import {elementSVG} from './svgExport'
describe('mechanical and plumbing shared symbols',()=>{
  it.each([['plumb-roof-vent','VTR'],['plumb-hose-bibb','HB'],['plumb-floor-drain','FD'],['lv-camera','CAM'],['lv-security-keypad','KP']])('keeps %s identifiable without category colors', (id,label)=>{
    expect(equipmentGeometry(id,12,12)).toContainEqual(expect.objectContaining({kind:'text',text:label}))
    expect(elementSVG({id:'sample',bloxId:id,x:0,y:0,width:.5,height:.5,rotation:0,properties:{},locked:false},24)).toContain(label)
  })
  it.each([...REFINED_EQUIPMENT])('%s has finite proportional geometry and native SVG',id=>{
    for(const [w,h] of [[120,40],[40,120],[7.2,7.2]]) {
      const shapes=equipmentGeometry(id,w,h)
      expect(shapes.length).toBeGreaterThan(0)
      expect(equipmentGeometry(id,w*2,h*2).length).toBe(shapes.length)
      for(const s of shapes) {
        if(s.kind==='line')for(let i=0;i<s.points.length;i++) {
          expect(s.points[i]).toBeGreaterThanOrEqual(-1e-8)
          expect(s.points[i]).toBeLessThanOrEqual((i%2?h:w)+1e-8)
        }
        if(s.kind==='ellipse'){expect(s.rx).toBeGreaterThan(0);expect(s.ry).toBeGreaterThan(0)}
        if(s.kind==='text'){expect(s.fontSize).toBeGreaterThanOrEqual(12);expect(s.height).toBeGreaterThanOrEqual(15)}
      }
      const svg=elementSVG({id:'sample',bloxId:id,x:1,y:2,width:w/24,height:h/24,rotation:90,properties:{},locked:false},24)
      expect(svg).not.toMatch(/NaN|undefined/)
      expect(svg).toMatch(/<(rect|ellipse|polyline|text) /)
    }
  })
  it('retains supply-arrow direction in horizontal and vertical runs',()=>{
    expect(equipmentGeometry('mech-duct-supply',100,20)[1]).toMatchObject({points:[10,10,85,10]})
    expect(equipmentGeometry('mech-duct-supply',20,100)[1]).toMatchObject({points:[10,10,10,85]})
  })
  it('preserves dashed hood/return distinctions and clearout qualifiers',()=>{
    expect(equipmentGeometry('mech-range-hood',100,40)[0]).toMatchObject({dash:[5,3]})
    expect(equipmentGeometry('mech-duct-return',100,40)[0]).toMatchObject({dash:[6,3]})
    expect(equipmentGeometry('plumb-cleanout',12,12).some(s=>s.kind==='text'&&s.text==='CO')).toBe(true)
  })
  it('rejects invalid sizes and preserves closed bowtie valve faces',()=>{
    const valve=equipmentGeometry('plumb-shutoff-valve',20,20)
    expect(valve).toHaveLength(2)
    expect(valve[0]).toMatchObject({points:[0,0,10,10,0,20,0,0],fill:'#fafbfd'})
    expect(equipmentGeometry('mech-furnace',0,20)).toEqual([])
    expect(equipmentGeometry('mech-furnace',20,Infinity)).toEqual([])
  })
  it('retains triangular telecom outlets with explicit qualifiers',()=>{
    expect(equipmentGeometry('lv-data-jack',20,20)[0]).toMatchObject({kind:'line',fill:'#fafbfd'})
    expect(equipmentGeometry('lv-data-jack',20,20)[1]).toMatchObject({text:'D'})
    expect(equipmentGeometry('lv-coax-jack',20,20)[1]).toMatchObject({text:'C'})
  })
})
