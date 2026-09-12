import React,{useEffect,useState} from 'react'
import {formatLengthInput,parseLengthInput} from '../../utils/lengthInput'

export function LengthInput({value,label,onCommit}:{value:number;label:string;onCommit:(value:number)=>void}) {
  const [draft,setDraft]=useState(()=>formatLengthInput(value)),[invalid,setInvalid]=useState(false)
  useEffect(()=>{setDraft(formatLengthInput(value));setInvalid(false)},[value])
  const commit=()=>{
    const parsed=parseLengthInput(draft)
    if(parsed===null){setInvalid(true);return}
    setInvalid(false);setDraft(formatLengthInput(parsed))
    if(parsed!==value)onCommit(parsed)
  }
  return <input type="text" aria-label={label} aria-invalid={invalid} value={draft}
    title={invalid?'Enter a positive length, for example 9\'8" or 116".':'Feet and inches (9\'8"), inches (116"), or decimal feet (9.666667). Enter to apply; Escape to cancel.'}
    onChange={e=>{setDraft(e.target.value);setInvalid(false)}} onBlur={commit}
    onKeyDown={e=>{
      e.stopPropagation()
      if(e.key==='Enter'){e.preventDefault();commit()}
      if(e.key==='Escape'){e.preventDefault();setDraft(formatLengthInput(value));setInvalid(false)}
    }}
    className={`w-24 bg-gray-800 text-white px-1.5 py-0.5 rounded border ${invalid?'border-red-400':'border-gray-600'} text-xs`}/>
}
