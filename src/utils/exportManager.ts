import Konva from 'konva'
import { Scale, SCALES, Project } from '../types'
import { getBloxById } from '../blox/definitions'

let _stage: Konva.Stage | null = null

export function registerStage(stage: Konva.Stage): void { _stage = stage }
export function unregisterStage(): void { _stage = null }

export async function getViewportFeet(): Promise<{ centerX: number; centerY: number; minX: number; minY: number; maxX: number; maxY: number; widthFt: number; heightFt: number } | null> {
  if (!_stage) return null
  const { useStore } = await import('../store/useStore')
  const { project } = useStore.getState()
  if (!project) return null
  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const sx = _stage.x(), sy = _stage.y(), scale = _stage.scaleX()
  const stageW = _stage.width(), stageH = _stage.height()
  const minX = (0 - sx) / scale / pxPerFt
  const minY = (0 - sy) / scale / pxPerFt
  const maxX = (stageW - sx) / scale / pxPerFt
  const maxY = (stageH - sy) / scale / pxPerFt
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    minX, minY, maxX, maxY,
    widthFt: maxX - minX,
    heightFt: maxY - minY,
  }
}

// Zoom the viewport to a specific canvas-foot region.
// canvasYMin/canvasYMax are raw canvas feet (y=0 = top). In elevation mode, convert from
// elevation values before calling: canvasY = 300 - elevationFt.
export async function zoomToRegion(
  xMin: number, xMax: number, canvasYMin: number, canvasYMax: number,
  paddingFt = 2
): Promise<boolean> {
  if (!_stage) return false
  const { useStore } = await import('../store/useStore')
  const { project, setStageTransform } = useStore.getState()
  if (!project) return false

  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const stageW = _stage.width(), stageH = _stage.height()
  if (stageW <= 0 || stageH <= 0) return false

  const x0 = xMin - paddingFt, x1 = xMax + paddingFt
  const y0 = canvasYMin - paddingFt, y1 = canvasYMax + paddingFt
  const wFt = x1 - x0, hFt = y1 - y0
  if (wFt <= 0 || hFt <= 0) return false

  const scale = Math.min(stageW / (wFt * pxPerFt), stageH / (hFt * pxPerFt), 8)
  const cx = stageW / 2 - (x0 + wFt / 2) * pxPerFt * scale
  const cy = stageH / 2 - (y0 + hFt / 2) * pxPerFt * scale

  if (!isFinite(scale) || scale <= 0 || !isFinite(cx) || !isFinite(cy)) return false
  setStageTransform(cx, cy, scale)
  _stage.position({ x: cx, y: cy })
  _stage.scale({ x: scale, y: scale })
  _stage.getLayers().forEach(l => l.draw())
  return true
}

let _fitViewPending = false

export async function fitView(paddingFt = 3): Promise<boolean> {
  if (!_stage) return false
  // Debounce: only one fitView at a time
  if (_fitViewPending) return false
  _fitViewPending = true
  try {
    const { useStore } = await import('../store/useStore')
    const { project, setStageTransform } = useStore.getState()
    if (!project) return false

    const stageW = _stage.width()
    const stageH = _stage.height()
    if (stageW <= 0 || stageH <= 0) return false

    const pxPerFt = SCALES[project.scale].pixelsPerFoot
    const {planBounds,planNotesLayout}=await import('./planSheet')
    const b=planBounds(project),notes=planNotesLayout(project,useStore.getState().showLegend)
    let minX=b.x/pxPerFt,minY=Math.min(b.y,notes.y)/pxPerFt,maxX=Math.max(b.x+b.width,notes.x+notes.width)/pxPerFt,maxY=Math.max(b.y+b.height,notes.y+notes.height)/pxPerFt
    minX -= paddingFt; minY -= paddingFt; maxX += paddingFt; maxY += paddingFt

    const contentWFt = maxX - minX
    const contentHFt = maxY - minY
    if (contentWFt <= 0 || contentHFt <= 0) return false

    const scale = Math.min(
      stageW / (contentWFt * pxPerFt),
      stageH / (contentHFt * pxPerFt),
      2
    )
    const cx = stageW / 2 - (minX + contentWFt / 2) * pxPerFt * scale
    const cy = stageH / 2 - (minY + contentHFt / 2) * pxPerFt * scale

    if (!isFinite(scale) || scale <= 0 || !isFinite(cx) || !isFinite(cy)) return false

    setStageTransform(cx, cy, scale)
    _stage.position({ x: cx, y: cy })
    _stage.scale({ x: scale, y: scale })
    _stage.getLayers().forEach(l => l.draw())
    return true
  } finally {
    _fitViewPending = false
  }
}

async function buildCompositeDataUrl(mimeType: 'image/png' | 'image/jpeg'): Promise<{ dataUrl: string; width: number; height: number }> {
  const { useStore } = await import('../store/useStore')
  const state = useStore.getState()
  if (!state.project) return { dataUrl: '', width: 0, height: 0 }
  const { buildPrintSheet } = await import('./printSheet')
  return buildPrintSheet(state.project, state.showLegend, state.showTitleBlock, mimeType)
}

export async function getSnapshotDataUrl(): Promise<{ dataUrl: string; width: number; height: number; elementCount: number; underlayDescription?: string } | null> {
  if (!_stage) return null
  const { useStore } = await import('../store/useStore')
  const { project } = useStore.getState()
  if (!project) return null

  const dataUrl = _stage.toDataURL({ pixelRatio: 1 })
  const w = _stage.width()
  const h = _stage.height()
  return {
    dataUrl,
    width: w,
    height: h,
    elementCount: project.elements.length,
    ...(project.underlay?.description ? { underlayDescription: project.underlay.description } : {}),
  }
}

// Annotated snapshot: draws a canvas-coordinate grid over the stage snapshot.
// Grid lines every gridIntervalFt canvas feet, labeled with canvas ft values.
// In elevation mode, horizontal labels show elevation (300 - canvas_y).
export async function getAnnotatedSnapshotDataUrl(
  gridIntervalFt = 10
): Promise<{ dataUrl: string; width: number; height: number; elementCount: number; gridIntervalFt: number } | null> {
  if (!_stage) return null
  const { useStore } = await import('../store/useStore')
  const { project } = useStore.getState()
  if (!project) return null

  const PIXEL_RATIO = 2
  const baseDataUrl = _stage.toDataURL({ pixelRatio: PIXEL_RATIO })
  const stageW = _stage.width()
  const stageH = _stage.height()

  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const sx = _stage.x()
  const sy = _stage.y()
  const scale = _stage.scaleX()
  const effectivePxPerFt = pxPerFt * scale  // screen px per canvas ft

  // Visible canvas ft range
  const minFtX = (0 - sx) / effectivePxPerFt
  const maxFtX = (stageW - sx) / effectivePxPerFt
  const minFtY = (0 - sy) / effectivePxPerFt
  const maxFtY = (stageH - sy) / effectivePxPerFt

  // Canvas ft → snapshot pixel
  const ftXToSnapPx = (ftX: number) => (sx + ftX * effectivePxPerFt) * PIXEL_RATIO
  const ftYToSnapPx = (ftY: number) => (sy + ftY * effectivePxPerFt) * PIXEL_RATIO

  // Draw base image then grid overlay
  const canvas = document.createElement('canvas')
  canvas.width = stageW * PIXEL_RATIO
  canvas.height = stageH * PIXEL_RATIO
  const ctx = canvas.getContext('2d')!

  const img = new Image()
  await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = baseDataUrl })
  ctx.drawImage(img, 0, 0)

  const isElevation = project.mode === 'elevation'
  const ELEV_H = 300 // canvas ft tall in elevation mode

  // Grid styling
  ctx.font = `bold ${11 * PIXEL_RATIO}px "SF Mono", "Fira Code", monospace`
  ctx.textBaseline = 'top'

  // Draw vertical grid lines (X axis)
  const startFtX = Math.ceil(minFtX / gridIntervalFt) * gridIntervalFt
  for (let ftX = startFtX; ftX <= maxFtX + 0.001; ftX += gridIntervalFt) {
    const px = ftXToSnapPx(ftX)
    const isMajor = Math.abs(ftX % (gridIntervalFt * 5)) < 0.001
    ctx.strokeStyle = isMajor ? 'rgba(0,160,255,0.55)' : 'rgba(0,160,255,0.25)'
    ctx.lineWidth = isMajor ? 1.5 * PIXEL_RATIO : 0.8 * PIXEL_RATIO
    ctx.setLineDash([4 * PIXEL_RATIO, 4 * PIXEL_RATIO])
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke()

    // Label at top
    const label = `x=${Math.round(ftX)}ft`
    const tm = ctx.measureText(label)
    const lx = px + 3 * PIXEL_RATIO
    const ly = 4 * PIXEL_RATIO
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(lx - 2, ly - 1, tm.width + 4, 13 * PIXEL_RATIO + 2)
    ctx.fillStyle = '#00BFFF'
    ctx.fillText(label, lx, ly)
  }

  // Draw horizontal grid lines (Y axis / elevation)
  const startFtY = Math.ceil(minFtY / gridIntervalFt) * gridIntervalFt
  for (let ftY = startFtY; ftY <= maxFtY + 0.001; ftY += gridIntervalFt) {
    const py = ftYToSnapPx(ftY)
    const displayVal = isElevation ? Math.round(ELEV_H - ftY) : Math.round(ftY)
    const label = isElevation ? `elev=${displayVal}ft` : `y=${displayVal}ft`
    const isMajor = Math.abs(ftY % (gridIntervalFt * 5)) < 0.001
    ctx.strokeStyle = isMajor ? 'rgba(255,160,0,0.55)' : 'rgba(255,160,0,0.25)'
    ctx.lineWidth = isMajor ? 1.5 * PIXEL_RATIO : 0.8 * PIXEL_RATIO
    ctx.setLineDash([4 * PIXEL_RATIO, 4 * PIXEL_RATIO])
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke()

    // Label at left edge
    const tm = ctx.measureText(label)
    const lx = 4 * PIXEL_RATIO
    const ly = py + 3 * PIXEL_RATIO
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(lx - 2, ly - 1, tm.width + 4, 13 * PIXEL_RATIO + 2)
    ctx.fillStyle = '#FFA500'
    ctx.fillText(label, lx, ly)
  }

  // Legend in bottom-right corner
  ctx.setLineDash([])
  const legendLines = [
    `Grid: ${gridIntervalFt}ft intervals`,
    `Blue = x (canvas ft from origin)`,
    isElevation ? 'Orange = elevation above grade' : 'Orange = y (canvas ft)',
    `Scale: ${project.scale}`,
  ]
  const legX = canvas.width - 220 * PIXEL_RATIO
  const legY = canvas.height - (legendLines.length * 16 + 8) * PIXEL_RATIO
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(legX - 6, legY - 4, 220 * PIXEL_RATIO, (legendLines.length * 16 + 8) * PIXEL_RATIO)
  ctx.fillStyle = '#EEE'
  ctx.font = `${10 * PIXEL_RATIO}px "SF Mono", "Fira Code", monospace`
  legendLines.forEach((line, i) => {
    ctx.fillText(line, legX, legY + i * 16 * PIXEL_RATIO)
  })

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: stageW,
    height: stageH,
    elementCount: project.elements.length,
    gridIntervalFt,
  }
}

export async function exportAsPNG(projectName: string): Promise<void> {
  const { dataUrl } = await buildCompositeDataUrl('image/png')
  if (dataUrl) await window.api?.exportPNG(dataUrl, projectName)
}

export async function exportAsPDF(projectName: string): Promise<void> {
  const { dataUrl, width, height } = await buildCompositeDataUrl('image/jpeg')
  if (dataUrl) await window.api?.exportPDF(dataUrl, width, height, projectName)
}
