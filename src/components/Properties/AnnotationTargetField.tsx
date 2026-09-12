import React from 'react'
import { useStore, getActiveElements } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'
import type { PlacedElement } from '../../types'
import {openingTagField,validOpeningTarget} from '../../utils/openingTags'

export function AnnotationTargetField({element}:{element:PlacedElement}) {
  const state=useStore(),target=String(element.properties.targetId??'')
  const candidates=getActiveElements(state).filter(e=>e.id!==element.id&&(openingTagField(element.bloxId)?validOpeningTarget(element,e):getBloxById(e.bloxId)?.category!=='Annotations'))
  return <label className="flex items-center gap-1">Links to
    <select aria-label="Callout linked object" className="bg-gray-800 text-gray-200 rounded px-2 py-1 max-w-64" value={target} onChange={e=>state.updateElement(element.id,{properties:{...element.properties,targetId:e.target.value||undefined}})}>
      <option value="">Unlinked</option>
      {target&&!candidates.some(e=>e.id===target)&&<option value={target}>Missing object — review link</option>}
      {candidates.map(e=><option key={e.id} value={e.id}>{getBloxById(e.bloxId)?.name}{e.properties.windowMark||e.properties.doorMark?` · ${e.properties.windowMark||e.properties.doorMark}`:''} · ({e.x.toFixed(1)}, {e.y.toFixed(1)}) · {e.id.slice(0,6)}</option>)}
    </select>
  </label>
}
