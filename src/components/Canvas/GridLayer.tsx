import React, { useMemo } from 'react'
import { Layer, Line, Rect } from 'react-konva'

interface GridLayerProps {
  pixelsPerFoot: number
}

const GRID_SIZE_FEET = 200  // Draw grid for 200×200 foot area

export function GridLayer({ pixelsPerFoot }: GridLayerProps) {
  const lines = useMemo(() => {
    const items: React.ReactNode[] = []
    const total = GRID_SIZE_FEET * pixelsPerFoot

    for (let i = 0; i <= GRID_SIZE_FEET; i++) {
      const pos = i * pixelsPerFoot
      const isMajor = i % 10 === 0
      const color = isMajor ? '#C8C8C8' : '#E8E8E8'
      const strokeW = isMajor ? 0.8 : 0.4

      items.push(
        <Line key={`v${i}`}
          points={[pos, 0, pos, total]}
          stroke={color} strokeWidth={strokeW} listening={false}
        />,
        <Line key={`h${i}`}
          points={[0, pos, total, pos]}
          stroke={color} strokeWidth={strokeW} listening={false}
        />
      )
    }
    return items
  }, [pixelsPerFoot])

  return (
    <Layer listening={false}>
      {/* Canvas background */}
      <Rect
        x={0} y={0}
        width={GRID_SIZE_FEET * pixelsPerFoot}
        height={GRID_SIZE_FEET * pixelsPerFoot}
        fill="#FAFAFA"
      />
      {lines}
    </Layer>
  )
}
