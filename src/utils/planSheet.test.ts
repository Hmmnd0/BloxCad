import {describe,it,expect} from 'vitest'
import {buildPlanLegend,planBounds,planNotesLayout,sheetSize,planScaleLabel} from './planSheet'
import type {Project,PlacedElement} from '../types'
const el=(id:string,bloxId:string,x=0,y=0,width=3,height=.5):PlacedElement=>({id,bloxId,x,y,width,height,rotation:0,properties:{},locked:false})
const project=(elements:PlacedElement[]):Project=>({id:'p',name:'Sheet',scale:'quarter',elements,dimensions:[]})
describe('scaled drawing sheets',()=>{
  it('uses one symbol key entry per visible type, never wall segment counts or box sizes',()=>{
    const p=project([el('a','wall-exterior'),el('b','wall-exterior',3),el('t','text-note'),{...el('h','door-single'),layerId:'hidden'}])
    p.layers=[{id:'hidden',name:'Hidden',visible:false,locked:false,color:'#fff'}]
    const key=buildPlanLegend(p)
    expect(key.map(e=>e.id)).toEqual(['wall-exterior'])
    expect(key[0]).not.toHaveProperty('count');expect(key[0]).not.toHaveProperty('size')
  })
  it('includes rotations and swing extents without padding by half every wall length',()=>{
    const p=project([el('w','wall-exterior',0,0,36,.5)])
    expect(planBounds(p)).toEqual({x:0,y:0,width:864,height:12})
    expect(planBounds(project([el('d','door-single')])).height).toBe(72)
  })
  it('keeps dimension-only drawings and detail units',()=>{
    const p=project([]);p.dimensions=[{id:'d',x1:0,y1:0,x2:20,y2:0,offset:-5}]
    const bounds=planBounds(p)
    expect(bounds.y+bounds.height).toBeGreaterThan(100)
    expect(planScaleLabel({...p,mode:'detail'})).toBe('1:4 (detail)')
  })
  it('places the scale and key outside the drawing and honors the key toggle',()=>{
    const p=project([el('w','wall-exterior')]),b=planBounds(p)
    expect(planNotesLayout(p,true).x).toBeGreaterThan(b.x+b.width)
    expect(planNotesLayout(p,false).entries).toEqual([])
  })
  it('chooses a physical page without scaling the content',()=>{
    expect(sheetSize(700,500)).toMatchObject({widthIn:11,heightIn:8.5})
    const page=sheetSize(1300,800)
    expect(page).toMatchObject({widthIn:17,heightIn:11})
    expect(page.width).toBeGreaterThanOrEqual(1396)
    expect(page.height).toBeGreaterThanOrEqual(896)
  })
})
