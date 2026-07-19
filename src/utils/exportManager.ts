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
    if (!project || project.elements.length === 0) return false

    const stageW = _stage.width()
    const stageH = _stage.height()
    if (stageW <= 0 || stageH <= 0) return false

    const pxPerFt = SCALES[project.scale].pixelsPerFoot
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of project.elements) {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    }
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

const SCALE_BAR_CFG: Record<Scale, { segmentFt: number; segments: number }> = {
  eighth:  { segmentFt: 5, segments: 4 },
  quarter: { segmentFt: 5, segments: 2 },
  half:    { segmentFt: 2, segments: 2 },
}

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  scale: Scale,
  pxPerFt: number,
  pr: number,
  canvasW: number,
  canvasH: number
) {
  const { segmentFt, segments } = SCALE_BAR_CFG[scale]
  const segPx = segmentFt * pxPerFt * pr
  const totalPx = segPx * segments

  const padR = 14 * pr
  const padB = 14 * pr
  const padInner = 8 * pr
  const labelH = 13 * pr
  const barH = 7 * pr
  const scaleTextH = 11 * pr
  const bgW = totalPx + padInner * 2
  const bgH = scaleTextH + 4 * pr + barH + labelH + 4 * pr
  const bgX = canvasW - padR - bgW
  const bgY = canvasH - padB - bgH

  ctx.fillStyle = 'rgba(255,255,255,0.93)'
  ctx.fillRect(bgX, bgY, bgW, bgH)
  ctx.strokeStyle = '#c0c0c0'
  ctx.lineWidth = pr
  ctx.strokeRect(bgX, bgY, bgW, bgH)

  ctx.font = `${9 * pr}px Arial, sans-serif`
  ctx.fillStyle = '#555555'
  ctx.textAlign = 'left'
  ctx.fillText(`SCALE   ${SCALES[scale].label}`, bgX + padInner, bgY + scaleTextH)

  const barX = bgX + padInner
  const barY = bgY + scaleTextH + 4 * pr
  for (let i = 0; i < segments; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1a1a1a' : '#ffffff'
    ctx.fillRect(barX + i * segPx, barY, segPx, barH)
    ctx.strokeStyle = '#444444'
    ctx.lineWidth = pr
    ctx.strokeRect(barX + i * segPx, barY, segPx, barH)
  }

  ctx.font = `${8 * pr}px Arial, sans-serif`
  ctx.fillStyle = '#333333'
  const tickY = barY + barH + 9 * pr
  for (let i = 0; i <= segments; i++) {
    const ft = i * segmentFt
    const tx = barX + i * segPx
    const label = i === segments ? `${ft} ft` : `${ft}`
    if (i === 0) {
      ctx.textAlign = 'left'
    } else if (i === segments) {
      ctx.textAlign = 'right'
    } else {
      ctx.textAlign = 'center'
    }
    ctx.fillText(label, tx, tickY)
  }
  ctx.textAlign = 'left'
}

function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  project: Project,
  pxW: number,
  topY: number,
  tbPxH: number,
  pr: number
) {
  const tb = project.titleBlock ?? {
    address: '', drawingTitle: 'Floor Plan', drawnBy: '', checkedBy: '',
    projectDate: '', sheetNumber: 'A1.1', jobNumber: ''
  }
  const scaleLabel = SCALES[project.scale].label

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, topY, pxW, tbPxH)
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(0, topY); ctx.lineTo(pxW, topY); ctx.stroke()

  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = pr

  const LABEL_SZ = 9 * pr
  const VALUE_SZ = 12 * pr

  function drawCell(cx: number, cy: number, cw: number, ch: number, label: string, value: string, bold = false) {
    ctx.strokeRect(cx, cy, cw, ch)
    ctx.font = `${LABEL_SZ}px sans-serif`
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(label.toUpperCase(), cx + 4 * pr, cy + 14 * pr)
    ctx.font = bold ? `bold ${VALUE_SZ}px sans-serif` : `${VALUE_SZ}px sans-serif`
    ctx.fillStyle = '#111827'
    ctx.fillText(value, cx + 4 * pr, cy + 28 * pr, cw - 8 * pr)
  }

  const colProj = Math.round(pxW * 0.22)
  const colAddr = Math.round(pxW * 0.28)
  const colDraw = Math.round(pxW * 0.22)
  const colRight = pxW - colProj - colAddr - colDraw
  const halfH = Math.round(tbPxH / 2)

  drawCell(0,                       topY, colProj, tbPxH,  'Project Name', project.name, true)
  drawCell(colProj,                 topY, colAddr, tbPxH,  'Address',       tb.address)
  drawCell(colProj + colAddr,       topY, colDraw, tbPxH,  'Drawing Title', tb.drawingTitle)

  const rx = colProj + colAddr + colDraw
  const colW4 = Math.round(colRight / 4)
  drawCell(rx,          topY,          colW4,              halfH, 'Drawn By',   tb.drawnBy)
  drawCell(rx + colW4,  topY,          colRight - colW4,   halfH, 'Checked By', tb.checkedBy)

  const botY = topY + halfH
  const colW5 = Math.round(colRight / 5)
  drawCell(rx,              botY, colW5,              halfH, 'Date',      tb.projectDate)
  drawCell(rx + colW5,      botY, colW5,              halfH, 'Sheet No.', tb.sheetNumber)
  drawCell(rx + colW5 * 2,  botY, colW5,              halfH, 'Job No.',   tb.jobNumber)
  drawCell(rx + colW5 * 3,  botY, colRight - colW5*3, halfH, 'Scale',     scaleLabel)
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  project: Project,
  pr: number,
  activeElements: { bloxId: string; width: number; height: number }[],
  getBloxById: (id: string) => { name?: string; category?: string } | undefined
) {
  function fmtFt(ft: number): string {
    const wf = Math.floor(ft), inch = Math.round((ft - wf) * 12)
    if (inch === 0) return `${wf}'`
    if (wf === 0) return `${inch}"`
    return `${wf}'${inch}"`
  }

  // Build grouped entries
  const map = new Map<string, { name: string; size: string; category: string; count: number }>()
  for (const el of activeElements) {
    if (el.bloxId === 'shape-polygon') continue
    const def = getBloxById(el.bloxId)
    const name = def?.name ?? el.bloxId
    const category = def?.category ?? 'Other'
    const size = `${fmtFt(el.width)} × ${fmtFt(el.height)}`
    const key = `${el.bloxId}|${el.width.toFixed(2)}|${el.height.toFixed(2)}`
    const ex = map.get(key)
    if (ex) { ex.count++ } else { map.set(key, { name, size, category, count: 1 }) }
  }
  if (map.size === 0) return

  // Group by category
  const byCategory = new Map<string, { name: string; size: string; count: number }[]>()
  for (const [, e] of map) {
    const list = byCategory.get(e.category) ?? []
    list.push(e)
    byCategory.set(e.category, list)
  }
  for (const list of byCategory.values()) list.sort((a, b) => a.name.localeCompare(b.name))
  const categories = Array.from(byCategory.keys()).sort()

  const PAD = 10 * pr
  const ROW_H = 16 * pr
  const CAT_H = 18 * pr
  const HEADER_H = 22 * pr
  const W = 200 * pr

  let totalH = HEADER_H + PAD
  for (const cat of categories) {
    totalH += CAT_H + byCategory.get(cat)!.length * ROW_H
  }
  totalH += PAD

  const X = PAD
  const Y = PAD

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = pr
  ctx.fillRect(X, Y, W, totalH)
  ctx.strokeRect(X, Y, W, totalH)

  // Header
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(X, Y, W, HEADER_H)
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath(); ctx.moveTo(X, Y + HEADER_H); ctx.lineTo(X + W, Y + HEADER_H); ctx.stroke()
  ctx.font = `bold ${10 * pr}px Arial, sans-serif`
  ctx.fillStyle = '#374151'
  ctx.fillText('LEGEND', X + PAD, Y + HEADER_H * 0.65)

  let curY = Y + HEADER_H + PAD * 0.5
  for (const cat of categories) {
    // Category label
    ctx.font = `bold ${8 * pr}px Arial, sans-serif`
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(cat.toUpperCase(), X + PAD, curY + CAT_H * 0.7)
    curY += CAT_H

    // Entries
    for (const e of byCategory.get(cat)!) {
      ctx.font = `${10 * pr}px Arial, sans-serif`
      ctx.fillStyle = '#1f2937'
      ctx.fillText(e.name, X + PAD, curY + ROW_H * 0.72)
      ctx.fillStyle = '#9ca3af'
      ctx.fillText(e.size, X + PAD + 110 * pr, curY + ROW_H * 0.72)
      ctx.fillStyle = '#4b5563'
      ctx.textAlign = 'right'
      ctx.fillText(`×${e.count}`, X + W - PAD, curY + ROW_H * 0.72)
      ctx.textAlign = 'left'
      curY += ROW_H
    }
  }
}

async function buildCompositeDataUrl(mimeType: 'image/png' | 'image/jpeg'): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!_stage) return { dataUrl: '', width: 0, height: 0 }

  const { useStore } = await import('../store/useStore')
  const { project, showTitleBlock } = useStore.getState()
  if (!project) return { dataUrl: '', width: 0, height: 0 }

  const pixelRatio = 2
  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const PADDING_FT = 2

  // Bounding box of all elements (feet) — use the active mode's element array
  const activeElements = project.mode === 'detail'
    ? (project.detailElements ?? [])
    : project.elements
  let minX = 0, minY = 0, maxX = 40, maxY = 30
  if (activeElements.length > 0) {
    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity
    for (const el of activeElements) {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    }
  }
  minX -= PADDING_FT; minY -= PADDING_FT
  maxX += PADDING_FT; maxY += PADDING_FT

  const contentW = Math.round((maxX - minX) * pxPerFt)
  const contentH = Math.round((maxY - minY) * pxPerFt)

  // Save current stage state
  const savedX  = _stage.x()
  const savedY  = _stage.y()
  const savedSX = _stage.scaleX()
  const savedSY = _stage.scaleY()
  const savedW  = _stage.width()
  const savedH  = _stage.height()

  // Reposition stage to show all content at base scale (no zoom)
  _stage.x(Math.round(-minX * pxPerFt))
  _stage.y(Math.round(-minY * pxPerFt))
  _stage.scaleX(1)
  _stage.scaleY(1)
  _stage.width(contentW)
  _stage.height(contentH)
  _stage.getLayers().forEach(l => l.draw())

  const stageUrl = _stage.toDataURL({ pixelRatio, mimeType: 'image/png' })

  // Restore stage immediately
  _stage.x(savedX)
  _stage.y(savedY)
  _stage.scaleX(savedSX)
  _stage.scaleY(savedSY)
  _stage.width(savedW)
  _stage.height(savedH)
  _stage.getLayers().forEach(l => l.draw())

  const pxW = contentW * pixelRatio
  const pxH = contentH * pixelRatio
  const tbPxH = showTitleBlock ? 128 : 0

  const offscreen = document.createElement('canvas')
  offscreen.width = pxW
  offscreen.height = pxH + tbPxH
  const ctx = offscreen.getContext('2d')!

  // Stage content
  const img = new Image()
  img.src = stageUrl
  await new Promise(r => { img.onload = r })
  ctx.drawImage(img, 0, 0)

  // Scale bar (bottom-right of canvas area)
  drawScaleBar(ctx, project.scale, pxPerFt, pixelRatio, pxW, pxH)

  // Legend always included in export
  drawLegend(ctx, project, pixelRatio, activeElements, getBloxById)

  // Title block
  if (tbPxH > 0) {
    drawTitleBlock(ctx, project, pxW, pxH, tbPxH, pixelRatio)
  }

  const quality = mimeType === 'image/jpeg' ? 0.92 : undefined
  const dataUrl = offscreen.toDataURL(mimeType, quality)
  return { dataUrl, width: pxW, height: pxH + tbPxH }
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
