import React from 'react'
import type {PlacedElement} from '../../types'
import {useStore} from '../../store/useStore'

/** Specifications are deliberately separate from the plan symbol's footprint. */
export function OpeningScheduleFields({element}:{element:PlacedElement}) {
  const update=useStore(s=>s.updateElement)
  const door=element.bloxId.startsWith('door-'),window=element.bloxId.startsWith('window-')
  const room=element.bloxId==='annotation-room-tag'
  if(!door&&!window&&!room)return null
  const fields=door?[
    ['doorMark','Door mark'],['location','Location'],['doorType','Door type'],
    ['doorSize','Specified W × H × thickness'],['clearOpening','Clear opening'],
    ['doorFinish','Door material / finish'],['frame','Frame material / finish'],
    ['hardwareSet','Hardware set'],['fireRating','Rating, if applicable'],['closer','Closer, if applicable'],['notes','Notes'],
  ]:room?[
    ['floorFinish','Floor finish'],['baseFinish','Base finish'],['wallFinish','Wall finish'],['ceilingFinish','Ceiling finish'],
  ]:[
    ['windowMark','Window mark'],['location','Location'],['windowType','Operating type'],
    ['windowSize','Specified W × H'],['sillHeight','Sill height'],['glazing','Glazing'],
    ['manufacturer','Manufacturer'],['model','Model'],['notes','Notes'],
  ]
  return <details className="opening-schedule-fields"><summary>Schedule specifications</summary>
    <p>{room?'Finishes populate the room finish schedule.':'Plan span updates from the drawing. Enter the selected leaf/unit size here; plan depth is not height.'}</p>
    <div>{fields.map(([key,label])=><label key={key}>{label}<input aria-label={label} type="text"
      placeholder={key.endsWith('Size')?'Enter specified dimensions':'Not specified'}
      value={String(element.properties[key]??'')}
      onChange={e=>update(element.id,{properties:{...element.properties,[key]:e.target.value}})}/></label>)}</div>
  </details>
}
