import React from 'react'
import { Scale } from '../../types'

interface ScaleBarProps {
  scale: Scale
  pixelsPerFoot: number
}

const SCALE_LABEL: Record<Scale, string> = {
  eighth:  '1/8" = 1\'',
  quarter: '1/4" = 1\'',
  half:    '1/2" = 1\'',
}

const SCALE_BAR_CONFIG: Record<Scale, { segmentFt: number; segments: number }> = {
  eighth:  { segmentFt: 5, segments: 4 },
  quarter: { segmentFt: 5, segments: 2 },
  half:    { segmentFt: 2, segments: 2 },
}

export function ScaleBar({ scale, pixelsPerFoot }: ScaleBarProps) {
  const { segmentFt, segments } = SCALE_BAR_CONFIG[scale]
  const segmentPx = segmentFt * pixelsPerFoot
  const totalPx = segmentPx * segments
  const tickLabels = Array.from({ length: segments + 1 }, (_, i) => i * segmentFt)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36,
        right: 14,
        background: 'rgba(255,255,255,0.93)',
        border: '1px solid #c0c0c0',
        borderRadius: 4,
        padding: '5px 10px 4px 8px',
        fontFamily: "'Arial', sans-serif",
        userSelect: 'none',
        pointerEvents: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }}
    >
      {/* Scale label */}
      <div style={{ fontSize: 9, color: '#555', marginBottom: 4, letterSpacing: '0.03em' }}>
        SCALE &nbsp; {SCALE_LABEL[scale]}
      </div>

      {/* Bar */}
      <div style={{ display: 'flex', width: totalPx }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              width: segmentPx,
              height: 7,
              background: i % 2 === 0 ? '#1a1a1a' : '#ffffff',
              border: '1px solid #444',
              boxSizing: 'border-box',
              marginLeft: i === 0 ? 0 : -1,
            }}
          />
        ))}
      </div>

      {/* Tick labels — pinned relative to bar start, last label left-aligned to avoid overflow */}
      <div style={{ position: 'relative', height: 13, width: totalPx }}>
        {tickLabels.map((ft, i) => {
          const isLast = i === tickLabels.length - 1
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: i * segmentPx,
                transform: isLast ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)',
                fontSize: 8,
                color: '#333',
                whiteSpace: 'nowrap',
              }}
            >
              {ft} {isLast ? 'ft' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
