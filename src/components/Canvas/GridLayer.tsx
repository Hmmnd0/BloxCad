import React, { useMemo } from 'react'
import { Layer, Line, Rect, Text as KText } from 'react-konva'
import { DrawingMode } from '../../types'

interface GridLayerProps {
  pixelsPerFoot: number
  mode?: DrawingMode
}

const PLAN_GRID_FT = 200
const ELEV_GRID_W_FT = 200
const ELEV_GRID_H_FT = 300
export const DETAIL_GRID_W = 240  // units = inches
export const DETAIL_GRID_H = 180  // units = inches

export const ELEV_GRID_H = ELEV_GRID_H_FT

export function GridLayer({ pixelsPerFoot, mode = 'floorplan' }: GridLayerProps) {
  const isElev = mode === 'elevation'
  const isDetail = mode === 'detail'

  const gridW = isElev ? ELEV_GRID_W_FT : isDetail ? DETAIL_GRID_W : PLAN_GRID_FT
  const gridH = isElev ? ELEV_GRID_H_FT : isDetail ? DETAIL_GRID_H : PLAN_GRID_FT

  const lines = useMemo(() => {
    const items: React.ReactNode[] = []
    const totalW = gridW * pixelsPerFoot
    const totalH = gridH * pixelsPerFoot

    for (let i = 0; i <= gridW; i++) {
      const pos = i * pixelsPerFoot
      // Detail: major every 12 units (1 foot), minor every 1 unit (1 inch)
      // Other modes: major every 10 units (10 feet)
      const isMajor = isDetail ? i % 12 === 0 : i % 10 === 0
      const color = isMajor ? '#C8C8C8' : '#E8E8E8'
      const strokeW = isMajor ? 0.8 : 0.4
      items.push(
        <Line key={`v${i}`} points={[pos, 0, pos, totalH]} stroke={color} strokeWidth={strokeW} listening={false} />
      )
    }
    for (let i = 0; i <= gridH; i++) {
      const pos = i * pixelsPerFoot
      const isMajor = isDetail ? i % 12 === 0 : i % 10 === 0
      const color = isMajor ? '#C8C8C8' : '#E8E8E8'
      const strokeW = isMajor ? 0.8 : 0.4
      items.push(
        <Line key={`h${i}`} points={[0, pos, totalW, pos]} stroke={color} strokeWidth={strokeW} listening={false} />
      )
    }
    return items
  }, [pixelsPerFoot, gridW, gridH, isDetail])

  const elevLabels = useMemo(() => {
    if (!isElev) return null
    const labels: React.ReactNode[] = []
    const totalH = ELEV_GRID_H_FT * pixelsPerFoot
    for (let elev = 0; elev <= ELEV_GRID_H_FT; elev += 20) {
      const screenY = totalH - elev * pixelsPerFoot
      labels.push(
        <KText
          key={`lbl${elev}`}
          x={4} y={screenY - 8}
          text={`${elev}'`}
          fontSize={Math.max(8, pixelsPerFoot * 0.4)}
          fill="#999"
          listening={false}
        />
      )
    }
    return labels
  }, [isElev, pixelsPerFoot])

  const detailLabels = useMemo(() => {
    if (!isDetail) return null
    const labels: React.ReactNode[] = []
    // Label each foot mark (every 12 inches)
    for (let ft = 0; ft * 12 <= DETAIL_GRID_W; ft++) {
      const x = ft * 12 * pixelsPerFoot
      labels.push(
        <KText key={`xft${ft}`} x={x + 2} y={2}
          text={ft === 0 ? '' : `${ft}'`}
          fontSize={Math.max(7, pixelsPerFoot * 0.35)}
          fill="#AAA" listening={false}
        />
      )
    }
    for (let ft = 0; ft * 12 <= DETAIL_GRID_H; ft++) {
      const y = ft * 12 * pixelsPerFoot
      labels.push(
        <KText key={`yft${ft}`} x={2} y={y + 1}
          text={ft === 0 ? '' : `${ft}'`}
          fontSize={Math.max(7, pixelsPerFoot * 0.35)}
          fill="#AAA" listening={false}
        />
      )
    }
    return labels
  }, [isDetail, pixelsPerFoot])

  return (
    <Layer listening={false}>
      <Rect
        x={0} y={0}
        width={gridW * pixelsPerFoot}
        height={gridH * pixelsPerFoot}
        fill="#FAFAFA"
      />
      {lines}
      {isElev && (
        <>
          {/* Ground line — heavy */}
          <Line
            points={[0, ELEV_GRID_H_FT * pixelsPerFoot, gridW * pixelsPerFoot, ELEV_GRID_H_FT * pixelsPerFoot]}
            stroke="#555" strokeWidth={2} listening={false}
          />
          {elevLabels}
        </>
      )}
      {isDetail && detailLabels}
    </Layer>
  )
}
