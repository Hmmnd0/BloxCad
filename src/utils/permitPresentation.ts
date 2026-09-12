import type {Project} from '../types'
import type {PermitColumn,PermitData,PermitRow} from './permitSheet'

export interface PermitTableSpec {key:string;title:string;columns:PermitColumn[]}
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const weights:Record<string,number>={mark:.7,set:.7,location:1.1,description:2,span:1,size:1.5,clear:1,closer:.7,rating:.85,finish:1,frame:1.2,hardware:.85,notes:2,subject:1.8,reference:1.7,required:1.5,actual:1.5,status:1,sheet:.85,text:3,scope:3}
const columnWeights=(t:PermitTableSpec)=>t.key==='project-notes'?[.2,5]:t.key==='coordination'?[.7,1.5,5]:t.columns.map(c=>c.key==='status'?1.35:weights[c.key]??1.2)
const FONT=12,LINE=16
let measuringContext:CanvasRenderingContext2D|null|undefined
function textWidth(text:string,bold:boolean):number {
  if(measuringContext===undefined)measuringContext=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d')
  if(measuringContext){measuringContext.font=`${bold?'bold ':''}${FONT}px Arial`;return measuringContext.measureText(text).width}
  // Server/test fallback is conservative; browser exports use actual font metrics.
  return text.length*FONT*(bold?.62:.56)
}
// Conservative paper-space wrapping. Oversize cells continue on subsequent
// rows/pages instead of shrinking the entire table or clipping specifications.
function wrap(value:string,width:number,bold:boolean):string[] {
  return value.split('\n').flatMap(paragraph=>{
    if(!paragraph)return ['']
    const lines:string[]=[];let remaining=paragraph
    while(textWidth(remaining,bold)>width) {
      let low=1,high=remaining.length
      while(low<high){const mid=Math.ceil((low+high)/2);if(textWidth(remaining.slice(0,mid),bold)<=width)low=mid;else high=mid-1}
      const space=remaining.lastIndexOf(' ',low)
      const at=space>0?space:low
      lines.push(remaining.slice(0,at));remaining=remaining.slice(at+(at===space?1:0))
    }
    lines.push(remaining);return lines
  })
}
interface PrintRow {cells:Record<string,string>;height:number;continued:boolean;review:boolean}
function printRows(t:PermitTableSpec,rows:PermitRow[],width:number):PrintRow[] {
  const ws=columnWeights(t),sum=ws.reduce((a,b)=>a+b,0)
  return rows.flatMap(row=>{
    const lines=t.columns.map((c,i)=>wrap(row.cells[c.key]??'',Math.max(20,width*ws[i]/sum-16),i===0))
    const length=Math.max(1,...lines.map(a=>a.length)),result:PrintRow[]=[]
    for(let start=0;start<length;start+=12) {
      const cells=Object.fromEntries(t.columns.map((c,i)=>[c.key,lines[i].slice(start,start+12).join('\n')]))
      if(start>0&&lines[0].length<=12)cells[t.columns[0].key]=(row.cells[t.columns[0].key]||'Row')+' (cont.)'
      const review=!!row.issues?.length||!!row.sourceMissing
      result.push({cells,height:Math.min(12,length-start)*LINE+12+(review?12:0),continued:start>0,review})
    }
    return result
  })
}
const groups:Record<string,[string,number][]>={doors:[['Identification',3],['Dimensions',3],['Operation / rating',2],['Finishes',2],['Hardware / remarks',2]],windows:[['Identification',3],['Dimensions',3],['Specification',3],['Remarks',1]]}
function tableHTML(t:PermitTableSpec,rows:PrintRow[],continued:boolean):string {
  const ws=columnWeights(t),sum=ws.reduce((a,b)=>a+b,0)
  const matrix=t.key.includes('-construction')||t.key.includes('-zoning')
  return `<section class="schedule ${matrix?'matrix':''}" data-table="${esc(t.key)}"><h2>${esc(t.title)}${continued?' <small>CONTINUED</small>':''}</h2><table><colgroup>${ws.map(w=>`<col style="width:${w/sum*100}%">`).join('')}</colgroup><thead>${groups[t.key]?`<tr class="column-groups">${groups[t.key].map(([label,n])=>`<th colspan="${n}">${label}</th>`).join('')}</tr>`:''}<tr>${t.columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${t.columns.map((c,i)=>`<td${i===0?' class="mark-cell"':''}>${esc(row.cells[c.key])||'-'}${i===0&&row.review?'<small class="review-mark">REVIEW</small>':''}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${t.columns.length}" class="empty-table">No entries. Complete the drawing specifications or mark this schedule not applicable.</td></tr>`}</tbody></table></section>`
}
interface Part {html:string;height:number}
function tableParts(t:PermitTableSpec,rows:PermitRow[],width:number,budget:number):Part[] {
  const printed=printRows(t,rows,width),header=groups[t.key]?96:80,parts:Part[]=[]
  let current:PrintRow[]=[],height=header
  for(const row of printed) {
    if(current.length&&height+row.height>budget) {parts.push({html:tableHTML(t,current,parts.length>0),height});current=[];height=header}
    current.push(row);height+=row.height
  }
  parts.push({html:tableHTML(t,current,parts.length>0),height:height+(printed.length?0:44)})
  return parts
}

/** Reference-inspired construction-document layout; no copied code findings or seals. */
export function renderPermitPresentation(project:Project,data:PermitData,tables:PermitTableSpec[],sources:{name:string;url:string}[]):string {
  const pages:{title:string;html:string}[]=[],width=1320,budget=760
  const matrices=tables.slice(0,2).map(t=>tableParts(t,data.tables[t.key]??[],(width-24)/2,budget))
  for(let i=0;i<Math.max(...matrices.map(a=>a.length));i++)pages.push({title:'Code matrices & project information',html:`<div class="matrix-grid">${matrices.map(parts=>parts[i]?.html??'').join('')}</div>`})
  const pack=(title:string,specs:PermitTableSpec[])=>{
    let html='',height=0
    for(const t of specs)for(const part of tableParts(t,data.tables[t.key]??[],width,budget)) {
      if(html&&height+part.height>budget){pages.push({title,html});html='';height=0}
      html+=part.html;height+=part.height
    }
    if(html)pages.push({title,html})
  }
  const scheduleSpecs=tables.slice(2).filter(t=>['doors','windows','hardware','rooms'].includes(t.key)||data.tables[t.key]?.length)
  const reviews:PermitRow[]=tables.flatMap(t=>(data.tables[t.key]??[]).flatMap((r,i)=>{
    const messages=[...(r.issues??[]),...(r.sourceMissing&&!r.issues?.length?['Source removed - review row.']:[])]
    return messages.length?[{id:r.id,cells:{mark:r.cells.mark||r.cells.set||String(i+1),description:t.title,notes:messages.join('\n')}}]:[]
  }))
  if(reviews.length) {
    const t={key:'coordination',title:'Schedule coordination - items requiring review',columns:[{key:'mark',label:'Mark / row'},{key:'description',label:'Schedule'},{key:'notes',label:'Review item'}]}
    data={...data,tables:{...data.tables,coordination:reviews}}
    scheduleSpecs.push(t)
  }
  // Scope and reference directories use the same pagination as tables, including
  // unusually long project notes. They are not assertions of code compliance.
  const notes:PermitRow[]=[{id:'scope',cells:{mark:'01',notes:data.scope||'Scope of work not entered.'}},{id:'review',cells:{mark:'02',notes:'Blank or unreviewed cells are not findings of compliance. Confirm applicable editions, local amendments and project requirements. Schedule plan spans do not establish leaf/unit sizes, heights or clear openings.'}},{id:'scale',cells:{mark:'03',notes:'These schedule sheets are not to scale. The appended drawing retains its own labeled physical scale. Print the drawing at 100%; do not fit to page.'}},...sources.map((s,i)=>({id:String(i),cells:{mark:String(i+4).padStart(2,'0'),notes:s.name+'\n'+s.url}}))]
  const noteSpec={key:'project-notes',title:'Scope & coordination notes',columns:[{key:'mark',label:'No.'},{key:'notes',label:'Project note / source directory'}]}
  data={...data,tables:{...data.tables,'project-notes':notes}}
  scheduleSpecs.push(noteSpec)
  pack('Residential schedules & notes',scheduleSpecs)
  const tb=project.titleBlock
  const pageHTML=pages.map((page,i)=>`<article class="permit-page"><div class="sheet-content"><header class="sheet-heading"><div><span>RESIDENTIAL DRAWING COORDINATION</span><h1>${esc(page.title)}</h1></div><div>SUPPLEMENTAL SHEETS<br>NOT TO SCALE</div></header>${page.html}<footer class="sheet-footer">${esc(project.name)} · ${esc(tb?.address)}<span>PS-${String(i+1).padStart(2,'0')} / ${pages.length}</span></footer></div><aside class="title-strip"><div class="strip-label">PROJECT</div><div class="project-name">${esc(project.name)}</div><p>${esc(tb?.address)||'Address not entered'}</p><div class="strip-rule"></div><div class="strip-label">SHEET CONTENT</div><h3>${esc(page.title)}</h3><div class="strip-label">JURISDICTION</div><p>${data.jurisdiction==='chicago'?'Chicago':'Indianapolis / Indiana'}</p><div class="title-bottom"><table><tr><th>Date</th><td>${esc(tb?.projectDate)||'-'}</td></tr><tr><th>Drawn</th><td>${esc(tb?.drawnBy)||'-'}</td></tr><tr><th>Checked</th><td>${esc(tb?.checkedBy)||'-'}</td></tr><tr><th>Project</th><td>${esc(tb?.jobNumber)||'-'}</td></tr></table><p>Schedule coordination<br>Review before issue</p><div class="sheet-number">PS-${String(i+1).padStart(2,'0')}</div></div></aside></article>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(project.name)} - permit tables</title><style>
  @page {size:17in 11in;margin:0}*{box-sizing:border-box}body{margin:0;background:#e6e8eb;color:#111;font:9pt Arial,Helvetica,sans-serif}.permit-page{width:17in;height:11in;padding:.45in;display:grid;grid-template-columns:minmax(0,1fr) 1.75in;gap:.25in;background:white;break-after:page;position:relative;margin:16px auto}.permit-page:last-child{break-after:auto}.sheet-content{min-width:0;position:relative;padding-bottom:28px}.sheet-heading{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px}.sheet-heading span{font-size:8pt;letter-spacing:1px}.sheet-heading h1{font-size:19pt;line-height:1.15;margin:5px 0 0;text-transform:uppercase}.sheet-heading>div:last-child{text-align:right;font-size:8pt;line-height:1.5}.matrix-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}h2{font-size:12pt;line-height:20px;font-weight:700;margin:0;padding:0 0 6px;text-transform:uppercase}h2 small{font-size:8pt;font-weight:400}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:.5pt solid #333;padding:5px 6px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere;line-height:16px;font-size:9pt}th{font-weight:700;text-align:left;background:white}thead{display:table-header-group}.matrix thead th{background:#111;color:white}.column-groups th{font-size:8pt;text-align:center;background:#f0f0f0;text-transform:uppercase;letter-spacing:.3px}.schedule{margin:0 0 20px;break-inside:avoid}.mark-cell{font-weight:700}.review-mark{display:block;font-size:7pt;line-height:12px}.empty-table{color:#555;font-style:italic}.title-strip{border:1.25pt solid #111;padding:12px;display:flex;flex-direction:column;min-width:0;overflow-wrap:anywhere}.strip-label{font-size:7pt;letter-spacing:.8px;margin-bottom:7px}.project-name{font-size:16pt;font-weight:700;line-height:1.2;text-transform:uppercase}.title-strip p{line-height:1.5;white-space:pre-wrap;margin:10px 0 16px}.strip-rule{border-top:1px solid #111;margin:0 -12px 18px}.title-strip h3{font-size:12pt;line-height:1.35;margin:0 0 20px;text-transform:uppercase}.title-bottom{margin-top:auto}.title-bottom table th,.title-bottom table td{font-size:7pt;line-height:12px;padding:5px 3px}.title-bottom p{font-size:8pt}.sheet-number{font-size:30pt;line-height:1.2;text-align:right;border-top:1.25pt solid #111;padding-top:12px}.sheet-footer{position:absolute;bottom:0;left:0;right:0;border-top:.5pt solid #111;padding-top:7px;font-size:8pt;display:flex;justify-content:space-between;gap:16px}tr{break-inside:avoid}@media print{body{background:white}.permit-page{margin:0}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body>${pageHTML}</body></html>`
}
