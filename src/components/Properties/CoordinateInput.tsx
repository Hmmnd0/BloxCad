import React,{useEffect,useState} from 'react'

export function CoordinateInput({value,label,onCommit,disabled=false}:{value:number;label:string;onCommit:(value:number)=>void;disabled?:boolean}){
  const [draft,setDraft]=useState(String(Math.round(value*1000)/1000))
  useEffect(()=>setDraft(String(Math.round(value*1000)/1000)),[value])
  const commit=()=>{const n=Number(draft);if(Number.isFinite(n)){setDraft(String(Math.round(n*1000)/1000));if(n!==value)onCommit(n)}else setDraft(String(Math.round(value*1000)/1000))}
  return <input type="number" step="0.01" aria-label={label} title="Drawing coordinates in feet" value={draft} disabled={disabled}
    onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();commit()}if(e.key==='Escape'){setDraft(String(Math.round(value*1000)/1000))}}}
    className="w-24 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"/>
}
