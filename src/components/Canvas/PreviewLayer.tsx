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
  rotation?: number
}

export function PreviewLayer({ bloxId, xFeet, yFeet, pixelsPerFoot, widthOverride, heightOverride, rotation = 0 }: PreviewLayerProps) {
  const def = getBloxById(bloxId)
  const Renderer = RENDERERS[bloxId]
  if (!def || !Renderer) return null

  const x = xFeet * pixelsPerFoot
  const y = yFeet * pixelsPerFoot
  const w = (widthOverride ?? def.defaultWidth) * pixelsPerFoot
  const h = (heightOverride ?? def.defaultHeight) * pixelsPerFoot

  return (
    <Layer listening={false}>
      <Group x={x + w / 2} y={y + h / 2} offsetX={w / 2} offsetY={h / 2} rotation={rotation} opacity={0.55}>
        <Renderer widthPx={w} heightPx={h} pixelsPerFoot={pixelsPerFoot} selected={false} properties={{}} />
      </Group>
    </Layer>
  )
}
