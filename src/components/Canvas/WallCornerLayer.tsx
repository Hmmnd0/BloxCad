import React, { useState } from 'react'
import { Layer, Circle, Line, Text } from 'react-konva'
import { useStore } from '../../store/useStore'
import { WALL_BLOX_IDS } from '../../blox/definitions'
import { wallEndpoints, moveWallJunction, WallPoint } from '../../utils/wallJunctions'
import { snapToGrid } from '../../utils/scale'

export function WallCornerLayer({ pixelsPerFoot, snapFeet }: { pixelsPerFoot: number; snapFeet: number }) {
  const { project, selectedElementIds, activeTool, activeBloxId, stageScale, moveWallCorner } = useStore()
  const [preview, setPreview] = useState<WallPoint[][]>([])
  const [error, setError] = useState('')
  if (!project || project.mode === 'detail' || activeTool !== 'select' || activeBloxId) return null
  const walls = project.elements.filter(w => selectedElementIds.includes(w.id) && WALL_BLOX_IDS.has(w.bloxId) &&
    !w.locked && !project.layers?.some(l => l.id === w.layerId && (!l.visible || l.locked)))
  const seen = new Set<string>()
  return <Layer>
    {preview.map((points, i) => <Line key={i} points={points.flatMap(p => [p.x * pixelsPerFoot, p.y * pixelsPerFoot])}
      stroke="#F1C40F" strokeWidth={2 / stageScale} listening={false} />)}
    {walls.flatMap(wall => (['start', 'end'] as const).map(end => {
      const point = wallEndpoints(wall)[end]
      const key = `${point.x.toFixed(5)}:${point.y.toFixed(5)}`
      if (seen.has(key)) return null
      seen.add(key)
      return <Circle key={`${wall.id}:${end}`} x={point.x * pixelsPerFoot} y={point.y * pixelsPerFoot}
        radius={6 / stageScale} fill="white" stroke="#F1C40F" strokeWidth={2 / stageScale} draggable
        onMouseDown={e => { e.cancelBubble = true }} onClick={e => { e.cancelBubble = true }}
        onDragStart={e => { e.cancelBubble = true; setError('') }}
        onDragMove={e => {
          e.cancelBubble = true
          const target = { x: snapToGrid(e.target.x() / pixelsPerFoot, snapFeet), y: snapToGrid(e.target.y() / pixelsPerFoot, snapFeet) }
          e.target.position({ x: target.x * pixelsPerFoot, y: target.y * pixelsPerFoot })
          try {
            const next = moveWallJunction(project.elements, project.layers ?? [], wall.id, end, target)
            setPreview(next.filter((w, i) => WALL_BLOX_IDS.has(w.bloxId) && w !== project.elements[i]).map(w => {
              const p = wallEndpoints(w); return [p.start, p.end]
            }))
            setError('')
          } catch (err) { setPreview([]); setError((err as Error).message) }
        }}
        onDragEnd={e => {
          e.cancelBubble = true
          const target = { x: snapToGrid(e.target.x() / pixelsPerFoot, snapFeet), y: snapToGrid(e.target.y() / pixelsPerFoot, snapFeet) }
          e.target.position({ x: point.x * pixelsPerFoot, y: point.y * pixelsPerFoot })
          setError(moveWallCorner(wall.id, end, target) ?? '')
          setPreview([])
        }} />
    }))}
    {error && walls[0] && <Text x={walls[0].x * pixelsPerFoot} y={walls[0].y * pixelsPerFoot - 24 / stageScale}
      text={error} fill="#E74C3C" fontSize={13 / stageScale} listening={false} />}
  </Layer>
}
