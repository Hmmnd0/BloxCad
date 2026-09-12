import React, { useMemo } from 'react'
import { Layer, Path } from 'react-konva'
import { useStore, getActiveElements } from '../../store/useStore'
import { STROKE, STROKE_CUT, STROKE_THIN } from './renderers/shared'
import { buildWallRegions, wallRegionPath, isFoundation } from '../../utils/wallUnion'

export function WallOutlineLayer({pixelsPerFoot, phase = 'outline'}: {pixelsPerFoot:number; phase?:'fill'|'outline'}) {
  const elements = useStore(getActiveElements)
  const layers = useStore(s=>s.project?.layers)
  const regions = useMemo(()=>buildWallRegions(elements.filter(el=>!layers?.some(l=>l.id===el.layerId&&!l.visible))),[elements,layers])
  return <Layer listening={false}>{regions.map(r=> {
    if (phase==='fill' && !isFoundation(r.bloxId)) return null
    return <Path key={r.key} data={wallRegionPath(r.polygons,pixelsPerFoot)}
      fill={phase==='fill'?r.fill:undefined} fillRule="evenodd"
      stroke={phase==='outline'?STROKE:undefined}
      strokeWidth={r.footing || r.bloxId==='wall-glazing' || r.bloxId.startsWith('wall-fire') ? STROKE_THIN : STROKE_CUT}
      dash={r.footing?[5,3]:undefined} strokeScaleEnabled={false} lineJoin="miter" />
  })}</Layer>
}
