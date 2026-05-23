import Konva from 'konva'
import { Scale, SCALES, Project } from '../types'

let _stage: Konva.Stage | null = null

export function registerStage(stage: Konva.Stage): void { _stage = stage }
export function unregisterStage(): void { _stage = null }

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

async function buildCompositeDataUrl(mimeType: 'image/png' | 'image/jpeg'): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!_stage) return { dataUrl: '', width: 0, height: 0 }

  const { useStore } = await import('../store/useStore')
  const { project, showTitleBlock } = useStore.getState()
  if (!project) return { dataUrl: '', width: 0, height: 0 }

  const pixelRatio = 2
  const pxPerFt = SCALES[project.scale].pixelsPerFoot
  const PADDING_FT = 2

  // Bounding box of all elements (feet)
  let minX = 0, minY = 0, maxX = 40, maxY = 30
  if (project.elements.length > 0) {
    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity
    for (const el of project.elements) {
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

  // Title block
  if (tbPxH > 0) {
    drawTitleBlock(ctx, project, pxW, pxH, tbPxH, pixelRatio)
  }

  const quality = mimeType === 'image/jpeg' ? 0.92 : undefined
  const dataUrl = offscreen.toDataURL(mimeType, quality)
  return { dataUrl, width: pxW, height: pxH + tbPxH }
}

export async function exportAsPNG(projectName: string): Promise<void> {
  const { dataUrl } = await buildCompositeDataUrl('image/png')
  if (dataUrl) await window.api?.exportPNG(dataUrl, projectName)
}

export async function exportAsPDF(projectName: string): Promise<void> {
  const { dataUrl, width, height } = await buildCompositeDataUrl('image/jpeg')
  if (dataUrl) await window.api?.exportPDF(dataUrl, width, height, projectName)
}
