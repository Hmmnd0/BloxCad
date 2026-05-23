import React from 'react'
import { Layer, Group, Line, Text, Circle } from 'react-konva'
import Konva from 'konva'
import { DimensionLine } from '../../types'
import { formatFeet } from '../../utils/scale'

interface DimShapeProps {
  dim: DimensionLine
  pixelsPerFoot: number
  selected: boolean
  preview?: boolean
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onOffsetDrag?: (newOffset: number) => void
}

const DIM_COLOR = '#555'
const SEL_COLOR = '#4F9EFF'
const EXT_OVERHANG = 6   // px past the dim line
const EXT_GAP = 3        // px gap from the element edge before ext line starts
const TICK_SIZE = 5      // px half-length of tick marks
const FONT_SIZE = 11

function DimShape({ dim, pixelsPerFoot, selected, preview, onClick, onOffsetDrag }: DimShapeProps) {
  const { x1, y1, x2, y2, offset } = dim
  const color = selected ? SEL_COLOR : preview ? '#4F9EFF' : DIM_COLOR
  const opacity = preview ? 0.7 : 1

  // Determine orientation
  const isHoriz = Math.abs(x2 - x1) >= Math.abs(y2 - y1)

  // Convert to pixels
  const p1xPx = x1 * pixelsPerFoot
  const p1yPx = y1 * pixelsPerFoot
  const p2xPx = x2 * pixelsPerFoot
  const p2yPx = y2 * pixelsPerFoot
  const offPx = offset * pixelsPerFoot

  let dimLinePts: number[]
  let ext1Pts: number[]
  let ext2Pts: number[]
  let tick1: number[]
  let tick2: number[]
  let textX: number, textY: number, textRot: number
  let dist: number
  let handleX: number, handleY: number

  if (isHoriz) {
    dist = Math.abs(x2 - x1)
    const minX = Math.min(p1xPx, p2xPx)
    const maxX = Math.max(p1xPx, p2xPx)
    const refY = p1yPx
    const dimY = refY - offPx

    // Direction: dim can be above (dimY < refY) or below (dimY > refY)
    const s = dimY < refY ? -1 : 1  // -1 = upward, +1 = downward
    ext1Pts = [minX, refY + s * EXT_GAP, minX, dimY + s * EXT_OVERHANG]
    ext2Pts = [maxX, refY + s * EXT_GAP, maxX, dimY + s * EXT_OVERHANG]
    dimLinePts = [minX, dimY, maxX, dimY]

    tick1 = [minX - TICK_SIZE, dimY + TICK_SIZE, minX + TICK_SIZE, dimY - TICK_SIZE]
    tick2 = [maxX - TICK_SIZE, dimY + TICK_SIZE, maxX + TICK_SIZE, dimY - TICK_SIZE]

    textX = (minX + maxX) / 2
    textY = s < 0 ? dimY - FONT_SIZE - 3 : dimY + 3
    textRot = 0

    handleX = (minX + maxX) / 2
    handleY = dimY
  } else {
    dist = Math.abs(y2 - y1)
    const minY = Math.min(p1yPx, p2yPx)
    const maxY = Math.max(p1yPx, p2yPx)
    const refX = p1xPx
    const dimX = refX - offPx

    // Direction: dim can be left (dimX < refX) or right (dimX > refX)
    const s = dimX < refX ? -1 : 1  // -1 = leftward, +1 = rightward
    ext1Pts = [refX + s * EXT_GAP, minY, dimX + s * EXT_OVERHANG, minY]
    ext2Pts = [refX + s * EXT_GAP, maxY, dimX + s * EXT_OVERHANG, maxY]
    dimLinePts = [dimX, minY, dimX, maxY]

    tick1 = [dimX - TICK_SIZE, minY + TICK_SIZE, dimX + TICK_SIZE, minY - TICK_SIZE]
    tick2 = [dimX - TICK_SIZE, maxY + TICK_SIZE, dimX + TICK_SIZE, maxY - TICK_SIZE]

    textX = s < 0 ? dimX - 4 : dimX + 4
    textY = (minY + maxY) / 2
    textRot = -90

    handleX = dimX
    handleY = (minY + maxY) / 2
  }

  const label = formatFeet(dist)

  return (
    <Group opacity={opacity} onClick={(e) => { e.cancelBubble = true; onClick?.(e) }}>
      {/* Extension lines */}
      <Line points={ext1Pts} stroke={color} strokeWidth={0.8} listening={false} />
      <Line points={ext2Pts} stroke={color} strokeWidth={0.8} listening={false} />

      {/* Dimension line (clickable hit area slightly wider) */}
      <Line
        points={dimLinePts}
        stroke={color} strokeWidth={selected ? 1.5 : 0.8}
        hitStrokeWidth={10}
      />

      {/* Tick marks */}
      <Line points={tick1} stroke={color} strokeWidth={1.2} listening={false} />
      <Line points={tick2} stroke={color} strokeWidth={1.2} listening={false} />

      {/* Measurement label */}
      <Text
        text={label}
        x={textX}
        y={textY}
        rotation={textRot}
        fontSize={FONT_SIZE}
        fill={color}
        fontFamily="'SF Mono', 'Menlo', monospace"
        align="center"
        offsetX={isHoriz ? label.length * (FONT_SIZE * 0.32) : FONT_SIZE / 2}
        offsetY={isHoriz ? 0 : label.length * (FONT_SIZE * 0.32)}
        listening={false}
      />

      {/* Drag handle on dim line for adjusting offset */}
      {selected && (
        <Circle
          x={handleX} y={handleY}
          radius={5}
          fill={SEL_COLOR} stroke="white" strokeWidth={1.5}
          draggable
          onDragMove={(e) => {
            if (!onOffsetDrag) return
            // Compute new offset from drag position
            if (isHoriz) {
              const refY = p1yPx
              const newOffPx = refY - e.target.y()
              onOffsetDrag(newOffPx / pixelsPerFoot)
              // Keep handle on the dim line axis
              e.target.x(handleX)
            } else {
              const refX = p1xPx
              const newOffPx = refX - e.target.x()
              onOffsetDrag(newOffPx / pixelsPerFoot)
              e.target.y(handleY)
            }
          }}
          onDragEnd={(e) => {
            // Snap handle back to center of dim line
            e.target.x(handleX)
            e.target.y(handleY)
          }}
        />
      )}

      {/* Selected dot markers at measured points */}
      {selected && (
        <>
          <Circle x={p1xPx} y={p1yPx} radius={3} fill={SEL_COLOR} listening={false} />
          <Circle x={p2xPx} y={p2yPx} radius={3} fill={SEL_COLOR} listening={false} />
        </>
      )}
    </Group>
  )
}

interface DimensionLayerProps {
  dimensions: DimensionLine[]
  selectedDimIds: string[]
  pixelsPerFoot: number
  onSelect: (id: string, multi: boolean) => void
  onOffsetDrag: (id: string, newOffset: number) => void
  preview?: Omit<DimensionLine, 'id' | 'offset'>
  previewOffset?: number
}

export function DimensionLayer({
  dimensions, selectedDimIds, pixelsPerFoot,
  onSelect, onOffsetDrag, preview, previewOffset = 1.5
}: DimensionLayerProps) {
  return (
    <Layer>
      {dimensions.map(dim => (
        <DimShape
          key={dim.id}
          dim={dim}
          pixelsPerFoot={pixelsPerFoot}
          selected={selectedDimIds.includes(dim.id)}
          onClick={(e?: Konva.KonvaEventObject<MouseEvent>) => {
            e?.cancelBubble && (e.cancelBubble = true)
            const multi = !!(e?.evt.shiftKey || e?.evt.metaKey)
            onSelect(dim.id, multi)
          }}
          onOffsetDrag={(off) => onOffsetDrag(dim.id, off >= 0 ? Math.max(0.5, off) : Math.min(-0.5, off))}
        />
      ))}

      {preview && (
        <DimShape
          dim={{ ...preview, id: '__preview__', offset: previewOffset }}
          pixelsPerFoot={pixelsPerFoot}
          selected={false}
          preview
        />
      )}
    </Layer>
  )
}
