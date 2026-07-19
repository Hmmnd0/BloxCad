import React from 'react'
import { Layer, Shape } from 'react-konva'
import Konva from 'konva'
import { useStore } from '../../store/useStore'
import { LINE_WEIGHTS } from '../../utils/lineWeights'

interface Props {
  pixelsPerFoot: number
}

export function ArcWallLayer({ pixelsPerFoot: p }: Props) {
  const { project, selectedArcWallIds, selectArcWall } = useStore()
  if (!project || project.mode === 'elevation') return null

  const arcWalls = project.arcWalls ?? []
  const layers = project.layers ?? []

  return (
    <Layer>
      {arcWalls.map(wall => {
        const layer = wall.layerId ? layers.find(l => l.id === wall.layerId) : undefined
        if (layer && !layer.visible) return null

        const isSelected = selectedArcWallIds.includes(wall.id)
        const outerR = (wall.radius + wall.thickness / 2) * p
        const innerR = Math.max(0, (wall.radius - wall.thickness / 2) * p)
        const sa = wall.startAngle
        const ea = wall.endAngle

        return (
          <Shape
            key={wall.id}
            x={wall.cx * p}
            y={wall.cy * p}
            sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
              ctx.beginPath()
              ctx.arc(0, 0, outerR, sa, ea, false)
              ctx.arc(0, 0, innerR, ea, sa, true)
              ctx.closePath()
              ctx.fillStrokeShape(shape)
            }}
            hitFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
              ctx.beginPath()
              ctx.arc(0, 0, outerR, sa, ea, false)
              ctx.arc(0, 0, innerR, ea, sa, true)
              ctx.closePath()
              ctx.fillStrokeShape(shape)
            }}
            fill={isSelected ? '#505050' : '#3C3C3C'}
            stroke={isSelected ? '#4F9EFF' : '#222222'}
            strokeWidth={isSelected ? LINE_WEIGHTS.cut + 0.5 : LINE_WEIGHTS.cut}
            onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
              if (layer?.locked || wall.locked) return
              e.cancelBubble = true
              selectArcWall(wall.id, e.evt.shiftKey)
            }}
          />
        )
      })}
    </Layer>
  )
}
