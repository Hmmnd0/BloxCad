import {describe,it,expect} from 'vitest'
import {syncPermitSchedules} from './permitSync'
import {defaultPermitData} from './permitSheet'
import type {PlacedElement,Project} from '../types'
const el=(id:string,bloxId:string,properties:Record<string,unknown>={}):PlacedElement=>({id,bloxId,x:0,y:0,width:3,height:.5,rotation:0,properties,locked:false})
const project=(elements:PlacedElement[]):Project=>({id:'p',name:'Test',scale:'quarter',elements,dimensions:[]})
describe('drawing label schedule coordination',()=>{
  it('carries explicit detail and section reference numbers with their destination sheets',()=>{
    const p=project([el('detail','annotation-detail-bubble',{detailNum:'3',sheetRef:'A-501'}),el('section','annotation-section-ref',{secNum:'B',sheetRef:'A-301'})])
    const rows=syncPermitSchedules(p,defaultPermitData()).tables.callouts
    expect(rows.map(r=>[r.cells.mark,r.cells.sheet])).toEqual([['3','A-501'],['B','A-301']])
  })
  it('uses explicit tag links instead of assigning nearby text to a door',()=>{
    const p=project([el('d','door-single'),el('t','annotation-door-tag',{label:'D2',targetId:'d'}),el('other','annotation-door-tag',{label:'D9'})])
    const data=syncPermitSchedules(p,defaultPermitData())
    expect(data.tables.doors[0].cells.mark).toBe('D2')
    expect(data.tables.callouts).toHaveLength(2)
  })
  it('refreshes source edits, preserves overrides including intentional blanks, and marks deleted sources',()=>{
    const p=project([el('d','door-single',{doorMark:'D1'})])
    let data=syncPermitSchedules(p,defaultPermitData())
    p.elements[0].properties.doorMark='D2'
    data=syncPermitSchedules(p,data);expect(data.tables.doors[0].cells.mark).toBe('D2')
    data.tables.doors[0].cells.mark='';data.tables.doors[0].overrides=['mark']
    p.elements[0].properties.doorMark='D3'
    data=syncPermitSchedules(p,data);expect(data.tables.doors[0].cells.mark).toBe('')
    expect(syncPermitSchedules(project([]),data).tables.doors[0].sourceMissing).toBe(true)
    expect(data.tables.doors).toHaveLength(1)
  })
  it('imports room labels and linked demolition notes without deriving code requirements',()=>{
    const p=project([el('r','annotation-room-tag',{roomName:'Office',roomNum:'101',roomArea:'120 SF'}),el('demo','demo-wall'),el('n','annotation-leader',{targetId:'demo',label:'Remove nonbearing partition'})])
    const original=defaultPermitData(),data=syncPermitSchedules(p,original)
    expect(data.tables.rooms[0].cells).toMatchObject({mark:'101',name:'Office',area:'120 SF'})
    expect(data.tables.demolition[0].cells.scope).toBe('Remove nonbearing partition')
    expect(data.tables['chicago-construction']).toEqual(original.tables['chicago-construction'])
  })
  it('reports conflicting linked marks without selecting one arbitrarily',()=>{
    const p=project([el('d','door-single'),el('t1','annotation-door-tag',{label:'1',targetId:'d'}),el('t2','annotation-door-tag',{label:'2',targetId:'d'})])
    const row=syncPermitSchedules(p,defaultPermitData()).tables.doors[0]
    expect(row.cells.mark).toBe('');expect(row.cells.notes).toContain('Conflicting')
  })
})

describe('residential opening schedules',()=>{
  it('flags a stored door mark that disagrees with its tag without discarding notes',()=>{
    const p=project([el('d','door-single',{doorMark:'D1',notes:'Owner selection'}),el('tag','annotation-door-tag',{targetId:'d',label:'D2'})])
    const row=syncPermitSchedules(p,defaultPermitData()).tables.doors[0]
    expect(row.cells.mark).toBe('D1')
    expect(row.cells.notes).toContain('Owner selection')
    expect(row.issues).toContain('Door mark and linked tags disagree.')
  })
  it('preserves fractional-inch opening spans',()=>{
    const window={...el('w','window-single'),width:3+1.5/12}
    expect(syncPermitSchedules(project([window]),defaultPermitData()).tables.windows[0].cells.span).toBe('3\'1 1/2"')
  })
  it('imports plan windows once, excludes elevation copies, and never mistakes plan depth for height',()=>{
    const p=project([el('w','window-single',{windowMark:'W1'}),el('e','elev-window-fixed',{windowMark:'W1'})])
    let data=syncPermitSchedules(p,defaultPermitData())
    expect(data.tables.windows).toHaveLength(1)
    expect(data.tables.windows[0].cells).toMatchObject({mark:'W1',span:"3'",size:''})
    expect(data.tables.windows[0].issues?.join(' ')).toContain('Missing specified size')
    p.elements[0].width=.5;p.elements[0].height=4
    p.elements[0].properties.windowSize='3\' × 5\''
    data=syncPermitSchedules(p,data)
    expect(data.tables.windows).toHaveLength(1)
    expect(data.tables.windows[0].cells).toMatchObject({span:"4'",size:"3' × 5'"})
  })
  it('flags copied marks and deleted objects, then clears duplicate warnings when renamed',()=>{
    const p=project([el('a','door-single',{doorMark:'D1'}),el('b','door-single',{doorMark:'D1'})])
    let data=syncPermitSchedules(p,defaultPermitData())
    expect(data.tables.doors.every(r=>r.issues?.some(i=>i.includes('Duplicate')))).toBe(true)
    p.elements[1].properties.doorMark='D2'
    data=syncPermitSchedules(p,data)
    expect(data.tables.doors.some(r=>r.issues?.some(i=>i.includes('Duplicate')))).toBe(false)
    p.elements.pop();data=syncPermitSchedules(p,data)
    expect(data.tables.doors[1].sourceMissing).toBe(true)
  })
  it('links hardware sets without inventing items and retains multiple item rows per set',()=>{
    const p=project([el('a','door-single',{doorMark:'D1',hardwareSet:'H1'}),el('b','door-single',{doorMark:'D2',hardwareSet:'H1'})])
    let data=syncPermitSchedules(p,defaultPermitData())
    expect(data.tables.hardware).toHaveLength(1)
    expect(data.tables.hardware[0].cells).toEqual({set:'H1',openings:'D1, D2'})
    expect(data.tables.hardware[0].issues).toContain('Hardware items not specified.')
    data.tables.hardware[0].cells.description='Passage latch'
    data.tables.hardware.push({id:'hinges',cells:{set:'H1',description:'Hinges',quantity:'3'}})
    p.elements.pop();data=syncPermitSchedules(p,data)
    expect(data.tables.hardware).toHaveLength(2)
    expect(data.tables.hardware.every(r=>r.cells.openings==='D1')).toBe(true)
    expect(data.tables.hardware[1].cells.quantity).toBe('3')
  })
  it('imports room finishes and retains window table overrides on repeated refresh',()=>{
    const p=project([el('w','window-single',{windowMark:'W1',glazing:'Tempered'}),el('r','annotation-room-tag',{roomName:'Bedroom',floorFinish:'Oak',wallFinish:'Paint'})])
    let data=syncPermitSchedules(p,defaultPermitData())
    expect(data.tables.rooms[0].cells).toMatchObject({floor:'Oak',wall:'Paint'})
    data.tables.windows[0].cells.glazing='';data.tables.windows[0].overrides=['glazing']
    data=syncPermitSchedules(p,data)
    expect(data.tables.windows[0].cells.glazing).toBe('')
    expect(data.tables.windows[0].issues).toContain('Glazing not specified.')
  })
})
