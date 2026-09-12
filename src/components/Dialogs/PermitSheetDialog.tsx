import React, { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { defaultPermitData, newPermitRow, permitSheetHTML, permitTables, PERMIT_SOURCES, type Jurisdiction } from '../../utils/permitSheet'
import './permitSheet.css'
import { buildPermitSetHTML } from '../../utils/permitSet'
import { syncPermitSchedules } from '../../utils/permitSync'

export function PermitSheetDialog({onClose}:{onClose:()=>void}) {
  const project=useStore(s=>s.project)!
  const [data,setData]=useState(()=>syncPermitSchedules(project,project.permitData??defaultPermitData()))
  const [preview,setPreview]=useState(false)
  const [message,setMessage]=useState('')
  const [exporting,setExporting]=useState(false)
  useEffect(()=>{setData(d=>syncPermitSchedules(project,d))},[project.elements])
  const exportPDF=async()=>{
    setExporting(true)
    try {
      if(!window.api?.exportPermitPDF)throw new Error('Restart the desktop app to load permit PDF export. HTML export is available here.')
      const refreshed=syncPermitSchedules(project,data);setData(refreshed)
      const result=await window.api.exportPermitPDF(await buildPermitSetHTML(project,refreshed),project.name)
      setMessage(result.success?'Permit PDF saved':'Export canceled')
    }catch(error){setMessage(error instanceof Error?error.message:'Export failed')}
    finally{setExporting(false)}
  }
  const save=()=>{const refreshed=syncPermitSchedules(project,data);setData(refreshed);useStore.getState().updatePermitData(refreshed);setMessage('Saved with project')}
  const followDrawing=(key:string,id:string)=>setData(d=>{
    const rows=d.tables[key].map(r=>r.id===id?{...r,cells:{...r.cells,...r.sourceCells},overrides:[]}:r)
    return syncPermitSchedules(project,{...d,tables:{...d.tables,[key]:rows}})
  })
  const change=(key:string,rowId:string,column:string,value:string)=>setData(d=>({...d,tables:{...d.tables,[key]:(d.tables[key]??[]).map(r=>r.id===rowId?{...r,cells:{...r.cells,[column]:value},overrides:[...new Set([...(r.overrides??[]),column])]}:r)}}))
  const download=()=>{
    const refreshed=syncPermitSchedules(project,data);setData(refreshed)
    const url=URL.createObjectURL(new Blob([permitSheetHTML(project,refreshed)],{type:'text/html;charset=utf-8'}))
    const a=document.createElement('a');a.href=url;a.download='permit-matrices-and-schedules.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <div className="permit-overlay"><section className="permit-dialog" role="dialog" aria-modal="true" aria-label="Permit sheet and schedules">
    <header><div><h1>Permit sheet & schedules</h1><p>Code matrices, demolition conventions and coordinated schedules</p></div><button onClick={()=>{save();onClose()}}>Save & close</button></header>
    <nav>
      <label>Jurisdiction <select aria-label="Permit jurisdiction" value={data.jurisdiction} onChange={e=>setData(d=>({...d,jurisdiction:e.target.value as Jurisdiction}))}><option value="chicago">Chicago</option><option value="indianapolis">Indianapolis / Marion County</option></select></label>
      <button onClick={()=>{setData(d=>syncPermitSchedules(project,d));setMessage('Drawing labels and schedules refreshed. Manual edits retained.')}}>Refresh all from drawing</button>
      <button onClick={()=>setPreview(!preview)}>{preview?'Edit tables':'Preview sheet'}</button>
      <button onClick={download}>Download print sheet (HTML)</button>
      <button disabled={exporting} onClick={exportPDF}>{exporting?'Exporting…':'Export permit PDF + drawing'}</button>
      <button onClick={save}>Save</button><span role="status">{message}</span>
    </nav>
    {preview?<iframe title="Permit sheet preview" sandbox="" srcDoc={permitSheetHTML(project,syncPermitSchedules(project,data))}/>:<main>
      <label className="permit-scope">Scope of work<textarea value={data.scope} onChange={e=>setData(d=>({...d,scope:e.target.value}))}/></label>
      <p className="permit-guidance">Enter applicable editions and project requirements. Each jurisdiction keeps its own matrix. Door height, clear opening, ratings and hardware are entered from the selected assemblies.</p>
      <p className="permit-guidance">Residential coordination: one row per opening. Plan opening span is not the specified leaf/unit size. Missing specifications and duplicate marks are flagged; no ratings or hardware are assumed. Table edits override drawing values; use Follow drawing to restore linked values.</p>
      <div className="permit-sources">{PERMIT_SOURCES[data.jurisdiction].map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a>)}</div>
      {permitTables(data).map(t=><section key={t.key} className="permit-table-section"><h2>{t.title}</h2><div className="permit-table-scroll"><table><thead><tr>{t.columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead><tbody onBlur={e=>{if(e.target instanceof HTMLTextAreaElement)setData(d=>syncPermitSchedules(project,d))}}>
        {(data.tables[t.key]??[]).map(row=><tr key={row.id}>{t.columns.map(c=><td key={c.key}><textarea aria-label={`${t.title} ${row.id} ${c.label}`} value={row.cells[c.key]??''} onChange={e=>change(t.key,row.id,c.key,e.target.value)}/></td>)}<td>
          {row.elementId&&<span className="permit-link-status">{row.sourceMissing?'Source removed or no longer scheduled — review':project.elements.some(e=>e.id===row.elementId)?'Linked drawing object':'Object removed — review row'}</span>}
          {row.issues?.map(issue=><span key={issue} className="permit-link-status">⚠ {issue}</span>)}
          {row.elementId&&!!row.overrides?.length&&<button onClick={()=>followDrawing(t.key,row.id)}>Follow drawing</button>}
          <button aria-label={`Remove row ${row.id}`} onClick={()=>setData(d=>({...d,tables:{...d.tables,[t.key]:d.tables[t.key].filter(r=>r.id!==row.id)}}))}>Remove</button>
        </td></tr>)}
      </tbody></table></div><button onClick={()=>setData(d=>({...d,tables:{...d.tables,[t.key]:[...(d.tables[t.key]??[]),newPermitRow()]}}))}>Add row to {t.title.toLowerCase()}</button></section>)}
    </main>}
  </section></div>
}
