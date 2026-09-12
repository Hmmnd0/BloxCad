import {renderPermitPresentation} from './permitPresentation'
import type { Project } from '../types'
import { getBloxById } from '../blox/definitions'

export type Jurisdiction='chicago'|'indianapolis'
export interface PermitRow { id:string; elementId?:string; cells:Record<string,string>; sourceCells?:Record<string,string>; overrides?:string[]; sourceMissing?:boolean; issues?:string[] }
export interface PermitData { jurisdiction:Jurisdiction; scope:string; tables:Record<string,PermitRow[]> }
export interface PermitColumn { key:string; label:string }
export const PERMIT_SOURCES:Record<Jurisdiction,{name:string;url:string}[]>={
  chicago:[
    {name:'Chicago Construction Codes — Title 14A and related titles',url:'https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2660327'},
    {name:'Chicago Building Rehabilitation Code — Title 14R',url:'https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2673631'},
    {name:'Chicago Zoning and Land Use Ordinance',url:'https://codelibrary.amlegal.com/codes/chicago/latest/chicagozoning_il/0-0-0-48750'},
  ],
  indianapolis:[
    {name:'Indiana DHS — building safety rules and adopted editions',url:'https://www.in.gov/dhs/boards-and-commissions/fpbsc-rules/'},
    {name:'Indianapolis–Marion County ordinances — zoning chapters 740–744',url:'https://library.municode.com/in/indianapolis_-_marion_county/code_of_ordinances'},
    {name:'MapIndy — parcel and zoning lookup',url:'https://maps.indy.gov/'},
  ],
}
const columns=(pairs:string[][]):PermitColumn[]=>pairs.map(([key,label])=>({key,label}))
export const MATRIX_COLUMNS=columns([['subject','Subject'],['reference','Code / ordinance reference'],['required','Requirement'],['actual','Actual / proposed'],['status','Review / N/A'],['sheet','Sheet / detail']])
export const SCHEDULES={
  doors:{title:'Door schedule',columns:columns([['mark','Mark'],['location','Location'],['description','Type'],['span','Plan opening span'],['size','Specified W × H × thickness'],['clear','Clear opening'],['closer','Closer'],['rating','Label / rating'],['finish','Door finish'],['frame','Frame material / finish'],['hardware','Hardware set'],['notes','Notes']])},
  windows:{title:'Window schedule',columns:columns([['mark','Mark'],['location','Location'],['description','Type / operation'],['span','Plan opening span'],['size','Specified W × H'],['sill','Sill height'],['glazing','Glazing'],['manufacturer','Manufacturer'],['model','Model'],['notes','Notes']])},
  hardware:{title:'Door hardware schedule',columns:columns([['set','Set'],['openings','Used by doors'],['description','Description'],['manufacturer','Manufacturer'],['catalog','Catalog / model'],['finish','Finish'],['quantity','Qty / opening'],['notes','Notes']])},
  walls:{title:'Wall schedule',columns:columns([['mark','Type'],['assembly','Assembly / layers'],['rating','Rating'],['listing','Tested assembly reference'],['notes','Notes']])},
  equipment:{title:'Equipment / furniture schedule',columns:columns([['mark','Mark'],['description','Description'],['quantity','Qty'],['dimensions','Dimensions'],['manufacturer','Manufacturer'],['model','Model'],['input','Input'],['output','Output'],['notes','Notes']])},
  sheets:{title:'Drawing index',columns:columns([['number','Sheet'],['title','Title'],['revision','Revision']])},
  demolition:{title:'Demolition notes',columns:columns([['mark','Note'],['scope','Removal / protection scope'],['sheet','Sheet / detail']])},
  abbreviations:{title:'Abbreviations',columns:columns([['mark','Abbreviation'],['meaning','Meaning']])},
  rooms:{title:'Room finish schedule',columns:columns([['mark','Room number'],['name','Room name'],['area','Stated area'],['floor','Floor finish'],['base','Base finish'],['wall','Wall finish'],['ceiling','Ceiling finish']])},
  callouts:{title:'Drawing callouts and labels',columns:columns([['mark','Mark'],['text','Text'],['target','Linked object'],['sheet','Sheet / detail']])},
}
export function newPermitRow(cells:Record<string,string>={}):PermitRow {return {id:crypto.randomUUID(),cells}}
export function defaultPermitData():PermitData {
  const tables:Record<string,PermitRow[]>={}
  for(const city of ['chicago','indianapolis'] as const) {
    tables[`${city}-construction`]=['Applicable editions / amendments','Existing occupancy','Proposed occupancy','Construction type','Existing building / alteration scope','Building area','Building height / stories','Occupant load','Exits / travel distance','Fire-resistance ratings','Sprinkler / alarm systems','Accessibility','Plumbing fixtures','Mechanical / ventilation','Electrical','Energy conservation'].map(subject=>newPermitRow({subject,status:'Unreviewed'}))
    tables[`${city}-zoning`]=['Parcel / PIN','Zoning district / overlays','Existing use','Proposed use','Lot area','Floor area ratio','Building height','Front setback','Side setbacks','Rear setback','Open space / landscaping','Vehicle parking / loading','Bicycle parking','Variances / special approvals'].map(subject=>newPermitRow({subject,status:'Unreviewed'}))
  }
  for(const key of Object.keys(SCHEDULES))tables[key]=[]
  return {jurisdiction:'chicago',scope:'',tables}
}
/** Explicit refresh adds missing doors by stable element ID; never infers leaf height from plan depth. */
export function syncDoorSchedule(project:Project,data:PermitData):PermitData {
  const rows=[...(data.tables.doors??[])],known=new Set(rows.map(r=>r.elementId))
  for(const el of project.elements) {
    if(!el.bloxId.startsWith('door-')||known.has(el.id))continue
    rows.push({...newPermitRow({description:getBloxById(el.bloxId)?.name??el.bloxId,mark:typeof el.properties.doorMark==='string'?el.properties.doorMark:'',notes:'Verify leaf size and clear opening; plan depth is not door height.'}),elementId:el.id})
  }
  return {...data,tables:{...data.tables,doors:rows}}
}
export function permitTables(data:PermitData) {
  const name=data.jurisdiction==='chicago'?'Chicago':'Indianapolis / Indiana'
  return [
    {key:`${data.jurisdiction}-construction`,title:`${name} construction code matrix`,columns:MATRIX_COLUMNS},
    {key:`${data.jurisdiction}-zoning`,title:`${data.jurisdiction==='chicago'?'Chicago':'Indianapolis–Marion County'} zoning matrix`,columns:MATRIX_COLUMNS},
    ...Object.entries(SCHEDULES).map(([key,value])=>({key,...value})),
  ]
}
/** Paginated companion sheets; drawing geometry is rendered separately. */
export function permitSheetHTML(project:Project,data:PermitData):string {
  return renderPermitPresentation(project,data,permitTables(data),PERMIT_SOURCES[data.jurisdiction])
}
