import React from 'react'
import type { PlacedElement } from '../../types'
import { stairMeasurements, STAIR_PROFILE, STAIR_REFERENCE_URL } from '../../utils/stairReview'
import { useStore } from '../../store/useStore'

export function StairDesignFields({element}:{element:PlacedElement}) {
  const m=stairMeasurements(element)
  const set=(key:string,value:unknown)=>useStore.getState().updateElement(element.id,{properties:{...element.properties,[key]:value}})
  return <fieldset className="inspector-group stair-design-fields"><legend>Physical stair design · single flight</legend>
    <div className="inspector-fields">
      <label>Reference <select aria-label="Stair review reference" value={m.referenceSelected?STAIR_PROFILE:''} onChange={e=>set('stairReviewProfile',e.target.value)}>
        <option value="">Not selected</option><option value={STAIR_PROFILE}>2021 IRC · straight residential</option>
      </select></label>
      {[
        ['stairRiseFt','Flight rise (ft)',.01],['stairRiserCount','Physical risers',1],
        ['stairHeadroomIn','Min headroom (in)',.25],['stairClearWidthIn','Clear width above rails (in)',.25],
      ].map(([key,label,step])=><label key={key}> {label}
        <input aria-label={String(label)} type="number" placeholder="Unknown" step={step} min={key==='stairRiserCount'?2:.01} max={key==='stairRiserCount'?64:undefined}
          value={typeof element.properties[String(key)]==='number'?String(element.properties[String(key)]):''}
          onChange={e=>{const n=e.target.valueAsNumber;set(String(key),e.target.value===''?null:Number.isFinite(n)?n:null)}}/>
      </label>)}
    </div>
    <div className="stair-measurements" aria-label="Calculated stair measurements">
      Run: {m.runFt?.toFixed(2)??'—'} ft · {m.treads??'—'} treads · Riser: {m.riserIn?.toFixed(2)??'—'} in · Tread: {m.treadIn?.toFixed(2)??'—'} in
    </div>
    <small>Run uses the drawn long dimension, excluding landings. Upper landing is the final surface: N risers / N−1 treads. No automatic resize. <a href={STAIR_REFERENCE_URL} target="_blank" rel="noreferrer">Reference</a> · Local applicability unverified.</small>
  </fieldset>
}
