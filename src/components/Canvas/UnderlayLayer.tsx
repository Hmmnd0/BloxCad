import React, { useEffect, useState } from 'react'
import { Layer, Image as KonvaImage, Circle } from 'react-konva'
import { useStore } from '../../store/useStore'
import { Underlay } from '../../types'

function computeRenderSize(u: Underlay, pixelsPerFoot: number): { w: number; h: number } {
  const { calibration, naturalWidth, naturalHeight } = u
  let widthFt: number

  if (!calibration) {
    widthFt = naturalWidth / pixelsPerFoot
  } else if (calibration.method === 'simple') {
    widthFt = calibration.realWidthFt
  } else if (calibration.method === 'multi-point') {
    widthFt = naturalWidth / calibration.pixelsPerFoot
  } else {
    const distPx = Math.hypot(calibration.p2px.x - calibration.p1px.x, calibration.p2px.y - calibration.p1px.y)
    const pxPerFtImg = distPx / calibration.realDistFt
    widthFt = naturalWidth / pxPerFtImg
  }

  const heightFt = (naturalHeight / naturalWidth) * widthFt
  return { w: widthFt * pixelsPerFoot, h: heightFt * pixelsPerFoot }
}

interface Props { pixelsPerFoot: number }

export function UnderlayLayer({ pixelsPerFoot }: Props) {
  const underlay = useStore(s => s.project?.underlay)
  const calibrationPoints = useStore(s => s.underlayCalibrationPoints)
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!underlay?.imageData) { setHtmlImage(null); return }
    const img = new window.Image()
    // Must set crossOrigin before src — prevents canvas taint on cross-origin URLs,
    // which would cause stage.toDataURL() to return "" (silent SecurityError).
    // For file:// URLs (local underlays) skip it — file:// has no CORS concept.
    if (!underlay.imageData.startsWith('data:') && !underlay.imageData.startsWith('file://')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => setHtmlImage(img)
    img.src = underlay.imageData
  }, [underlay?.imageData])

  if (!underlay || !underlay.visible || !htmlImage) return null

  const { w, h } = computeRenderSize(underlay, pixelsPerFoot)
  const reg=underlay.registration
  const imageScale=reg?.scaleFtPerPx ?? (w/(underlay.naturalWidth*pixelsPerFoot))
  const imageW=underlay.naturalWidth*imageScale*pixelsPerFoot
  const imageH=underlay.naturalHeight*imageScale*pixelsPerFoot
  const imageX=reg ? (reg.originFt.x-reg.originPx.x*imageScale)*pixelsPerFoot : 0
  const imageY=reg ? (reg.originFt.y-reg.originPx.y*imageScale)*pixelsPerFoot : 0

  return (
    <Layer listening={false} name="underlay">
      <KonvaImage
        image={htmlImage}
        x={imageX} y={imageY}
        width={reg?imageW:w} height={reg?imageH:h}
        rotation={reg?.rotationDeg ?? 0}
        opacity={underlay.opacity}
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* Calibration pick dots */}
      {calibrationPoints.map((pt, i) => (
        <Circle
          key={i}
          x={reg ? imageX + pt.x*imageScale*pixelsPerFoot : (pt.x / underlay.naturalWidth) * w}
          y={reg ? imageY + pt.y*imageScale*pixelsPerFoot : (pt.y / underlay.naturalHeight) * h}
          radius={6}
          fill="#FF4444"
          stroke="white"
          strokeWidth={1.5}
          listening={false}
        />
      ))}
    </Layer>
  )
}

export { computeRenderSize }
