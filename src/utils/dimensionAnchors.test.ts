import {describe,it,expect} from 'vitest'
import {attachDimension,dimensionSnapPoints,nearestWallEdgePoint,resolveDimensions,wallOverallDimension} from './dimensionAnchors'
import {dimensionLayout} from './dimensionLayout'
import {useStore,getActiveDimensions} from '../store/useStore'
import {buildProjectSVG} from './svgExport'
import type {PlacedElement,DimensionLine} from '../types'
const wall=(id:string,x:number,y:number,width:number,height:number,bloxId='wall-cmu-footing',rotation=0):PlacedElement=>({id,x,y,width,height,bloxId,rotation,properties:{},locked:false})
const loop=()=>[wall('a',0,0,20,2),wall('b',0,12,20,2),wall('c',0,0,2,14),wall('d',18,0,2,14)]
const dim=(x1=0,y1=0,x2=20,y2=0):DimensionLine=>({id:'dim',x1,y1,x2,y2,offset:1.5})
describe('wall-linked dimensions',()=>{
  it('snaps dimension endpoints to the middle of a wall edge',()=>{
    const point=nearestWallEdgePoint({x:7.02,y:0.2},[wall('w',0,0,20,1,'wall-interior')],.5)
    expect(point?.x).toBeCloseTo(7.02);expect(point?.y).toBeCloseTo(0)
  })
  it('prefers the nearest perimeter edge over a farther corner',()=>{
    const point=nearestWallEdgePoint({x:7.4,y:.18},[wall('w',0,0,20,1,'wall-interior')],.5)
    expect(point?.x).toBeCloseTo(7.4);expect(point?.y).toBeCloseTo(0)
  })
  it('snaps to both footing and stem corners without internal overlap corners',()=>{
    const points=dimensionSnapPoints(loop())
    expect(points.find(p=>p.x===0&&p.y===0)?.anchor).toBeDefined()
    expect(points.find(p=>Math.abs(p.x-.6)<1e-6&&Math.abs(p.y-.6)<1e-6)?.anchor?.regionKey).toContain(':stem')
    expect(points.some(p=>p.x===2&&p.y===0)).toBe(false)
  })
  it('follows translation without changing the measured length',()=>{
    const elements=loop(),d=attachDimension(dim(),elements)
    expect(d.anchor1).toBeDefined();expect(d.anchor2).toBeDefined()
    const [next]=resolveDimensions([d],elements.map(w=>({...w,x:w.x+3,y:w.y+4})))
    expect([next.x1,next.y1,next.x2,next.y2]).toEqual([3,4,23,4])
    expect(next.needsReview).toBe(false)
  })
  it('tracks stem thickness changes',()=>{
    const a=wall('a',0,0,20,2)
    const d=attachDimension(dim(.6,.6,19.4,.6),[a])
    const [next]=resolveDimensions([d],[{...a,height:3}])
    expect(next.x1).toBeCloseTo(.9);expect(next.x2).toBeCloseTo(19.1)
  })
  it('keeps referenced dimensions live when a corner becomes buried by a join',()=>{
    const a=wall('a',0,0,20,1,'wall-interior'),d=attachDimension(dim(),[a])
    expect(resolveDimensions([d],[])[0].needsReview).toBe(true)
    expect(resolveDimensions([d],[a,wall('b',19,-1,3,3,'wall-interior')])[0].needsReview).toBe(false)
  })
  it('does not attach arbitrary fixed points',()=>{
    const d=attachDimension(dim(3,4,6,8),loop())
    expect(d.anchor1).toBeUndefined();expect(d.anchor2).toBeUndefined()
  })
  it('dimensions the selected foundation span, not unrelated nearby sections',()=>{
    const elements=[...loop(),wall('far',40,0,10,2)]
    const d=wallOverallDimension(elements,['a'],'up')!
    expect(d.x2-d.x1).toBe(20)
    const next=resolveDimensions([{...d,id:'dim'}],elements.map(w=>w.id==='a'||w.id==='b'?{...w,width:25}:w.id==='d'?{...w,x:23}:w))[0]
    expect(next.x2-next.x1).toBe(25)
  })
  it('auto dimensions a 9 foot 8 inch segment without extending to a connected tall wall',()=>{
    const h=9+8/12,els=[wall('short',0,118,.5,h,'wall-exterior'),wall('link',0,121,15,.5,'wall-exterior'),wall('tall',14.5,0,.5,121.5,'wall-exterior')]
    for(const side of ['left','right'] as const){
      const d=wallOverallDimension(els,['short'],side)!
      expect(d.y1).toBeCloseTo(118);expect(d.y2-d.y1).toBeCloseTo(h)
      const [updated]=resolveDimensions([{...d,id:'auto'}],els.map(e=>e.id==='short'?{...e,height:10}:e))
      expect(updated.y2-updated.y1).toBeCloseTo(10)
      expect(updated.needsReview).toBe(false)
    }
    const combined=wallOverallDimension(els,['short','link','tall'],'left')!
    expect(combined.y1).toBe(0);expect(combined.y2).toBeCloseTo(118+h)
  })
  it('resolves after JSON round-trip and updates through undo/redo',()=>{
    const s=useStore.getState();s.createProject('Dimension test','quarter')
    s.placeElement('wall-interior',0,0,10,1)
    const id=useStore.getState().project!.elements[0].id
    s.autoDimSelected('up');s.updateElement(id,{width:15})
    expect(getActiveDimensions(useStore.getState())[0].x2).toBe(15)
    s.undo();expect(getActiveDimensions(useStore.getState())[0].x2).toBe(10)
    s.redo();expect(getActiveDimensions(useStore.getState())[0].x2).toBe(15)
    const p=JSON.parse(JSON.stringify(useStore.getState().project!))
    expect(resolveDimensions(p.dimensions,p.elements)[0].x2).toBe(15)
    expect(buildProjectSVG(p)).toContain('15')
  })
})
describe('dimension layout',()=>{
  it('measures a 3-4-5 diagonal as 5 only in aligned mode',()=>{
    const d=dim(0,0,3,4)
    expect(dimensionLayout({...d,measurement:'aligned'},24).value).toBe(5)
    expect(dimensionLayout({...d,measurement:'horizontal'},24).value).toBe(3)
    expect(dimensionLayout({...d,measurement:'vertical'},24).value).toBe(4)
    expect(dimensionLayout(d,24).value).toBe(4)
  })
  it('anchors extension lines at their own endpoints for unequal heights',()=>{
    const g=dimensionLayout({...dim(0,2,5,4),measurement:'horizontal'},24)
    expect(g.ext1[1]).toBe(45);expect(g.ext2[1]).toBe(93)
  })
  it('has a stable aligned offset when endpoints are reversed and handles zero length',()=>{
    const a=dimensionLayout({...dim(0,0,3,4),measurement:'aligned'},24)
    const b=dimensionLayout({...dim(3,4,0,0),measurement:'aligned'},24)
    expect(a.handle).toEqual(b.handle)
    expect(JSON.stringify(dimensionLayout({...dim(0,0,0,0),measurement:'aligned'},24))).not.toMatch(/null|NaN/)
  })
})
