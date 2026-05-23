import React from 'react'
import { Layer, Group } from 'react-konva'
import { RENDERERS } from './renderers'
import { getBloxById } from '../../blox/definitions'

interface PreviewLayerProps {
  bloxId: string
  xFeet: number
  yFeet: number
  pixelsPerFoot: number
  widthOverride?: number
  heightOverride?: number
}

export function PreviewLayer({ bloxId, xFeet, yFeet, pixelsPerFoot, widthOverride, heightOverride }: PreviewLayerProps) {
  const def = getBloxById(bloxId)
  const Renderer = RENDERERS[bloxId]
  if (!def || !Renderer) return null

  const x = xFeet * pixelsPerFoot
  const y = yFeet * pixelsPerFoot
  const w = (widthOverride ?? def.defaultWidth) * pixelsPerFoot
  const h = (heightOverride ?? def.defaultHeight) * pixelsPerFoot

  return (
    <Layer listening={false}>
      <Group x={x} y={y} opacity={0.55}>
        <Renderer widthPx={w} heightPx={h} selected={false} properties={{}} />
      </Group>
    </Layer>
  )
}
