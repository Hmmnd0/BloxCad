import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Line, Text as KText } from 'react-konva'
import Konva from 'konva'
import { GridLayer } from './GridLayer'
import { ElementsLayer } from './ElementsLayer'
import { PreviewLayer } from './PreviewLayer'
import { DimensionLayer } from './DimensionLayer'
import { useStore, getPixelsPerFoot, getSnapFeet } from '../../store/useStore'
import { snapToGrid, pixelsToFeet, formatFeet } from '../../utils/scale'
import { SCALES, Scale } from '../../types'
import { getElementSnapPoints, nearestSnapPoint, edgeSnapThresholdFt, snapOpeningToWall, snapWallEndpoint, WallSnapResult } from '../../utils/snap'
import { getBloxById } from '../../blox/definitions'
import { registerStage, unregisterStage } from '../../utils/exportManager'
import { ScaleBar } from './ScaleBar'

const ZOOM_SPEED = 1.1
const MIN_ZOOM = 0.15
const MAX_ZOOM = 8
const DRAG_THRESHOLD = 4
const WALL_THICKNESS: Record<string, number> = {
  'wall-exterior': 0.5,
  'wall-interior': 0.375,
  'wall-cmu': 0.667,
}
const WALL_SNAP_BLOX_IDS = new Set(['cased-opening', 'window-single', 'window-double', 'door-single', 'door-double', 'door-sliding', 'insulation-batt'])

function constrainToOrthogonal(
  start: { x: number; y: number },
  end: { x: number; y: number }
): { x: number; y: number } {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  return dx >= dy ? { x: end.x, y: start.y } : { x: start.x, y: end.y }
}

export function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const sizeRef = useRef(size)

  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null)
  const [wallSnap, setWallSnap] = useState<WallSnapResult | null>(null)
  const wallSnapRef = useRef<WallSnapResult | null>(null)
  const [dimStart, setDimStart] = useState<{ x: number; y: number } | null>(null)
  const [dimCursor, setDimCursor] = useState<{ x: number; y: number } | null>(null)
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null)
  const [wallCursor, setWallCursor] = useState<{ x: number; y: number } | null>(null)
  const DEFAULT_DIM_OFFSET = 1.5

  const [marquee, setMarquee] = useState<{
    startFt: { x: number; y: number }
    endFt: { x: number; y: number }
  } | null>(null)

  const [rectDraw, setRectDraw] = useState<{
    startFt: { x: number; y: number }
    endFt: { x: number; y: number }
  } | null>(null)
  const rectDrawRef = useRef<typeof rectDraw>(null)

  const {
    project, stageX, stageY, stageScale,
    activeBloxId, activeTool, activeWallType, selectedDimIds, pendingBloxWidth,
    setStageTransform, placeElement, clearSelection, setActiveBlox,
    addDimension, updateDimension, deleteSelectedDims, selectDim, selectMany
  } = useStore()

  const pixelsPerFoot = getPixelsPerFoot(useStore.getState())
  const snapFeet = getSnapFeet(useStore.getState())

  const activeBloxRef = useRef(activeBloxId);       activeBloxRef.current = activeBloxId
  const activeToolRef = useRef(activeTool);         activeToolRef.current = activeTool
  const activeWallTypeRef = useRef(activeWallType); activeWallTypeRef.current = activeWallType
  const snapFeetRef = useRef(snapFeet);             snapFeetRef.current = snapFeet
  const pxPerFtRef = useRef(pixelsPerFoot);         pxPerFtRef.current = pixelsPerFoot
  const pendingBloxWidthRef = useRef(pendingBloxWidth); pendingBloxWidthRef.current = pendingBloxWidth
  const dimStartRef = useRef(dimStart);       dimStartRef.current = dimStart
  const wallStartRef = useRef(wallStart);     wallStartRef.current = wallStart
  const projectRef = useRef(project);         projectRef.current = project
  const placeRef = useRef(placeElement);      placeRef.current = placeElement

  const isPanning = useRef(false)
  const spaceHeld = useRef(false)
  const isMarqueeActive = useRef(false)
  const leftDownOnBg = useRef(false)
  const totalDragDist = useRef(0)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const marqueeStartFt = useRef<{ x: number; y: number } | null>(null)

  // Register Konva stage for export
  useEffect(() => {
    if (stageRef.current) registerStage(stageRef.current)
    return () => unregisterStage()
  }, [])

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      sizeRef.current = { width, height }
      setSize({ width, height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // ── Center view on new project ───────────────────────────────────────────
  const centeredForProjectRef = useRef<string | null>(null)
  useEffect(() => {
    if (!project || centeredForProjectRef.current === project.id) return
    centeredForProjectRef.current = project.id
    // rAF ensures the container has its final layout dimensions before we read them
    requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect()
      const width = rect?.width ?? sizeRef.current.width
      const height = rect?.height ?? sizeRef.current.height
      const cx = width / 2
      const cy = height / 2
      setStageTransform(cx, cy, 1)
      stageRef.current?.scale({ x: 1, y: 1 })
      stageRef.current?.position({ x: cx, y: cy })
    })
  }, [project?.id])

  // ── Keyboard shortcuts (Illustrator-style) ──────────────────────────────
  useEffect(() => {
    const zoomStage = (factor: number) => {
      const stage = stageRef.current
      if (!stage) return
      const oldScale = stage.scaleX()
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale * factor))
      // Zoom toward the viewport center
      const cx = stage.width() / 2
      const cy = stage.height() / 2
      const to = { x: (cx - stage.x()) / oldScale, y: (cy - stage.y()) / oldScale }
      const newX = cx - to.x * newScale
      const newY = cy - to.y * newScale
      stage.scale({ x: newScale, y: newScale })
      stage.position({ x: newX, y: newY })
      setStageTransform(newX, newY, newScale)
    }

    const onDown = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      const isMod = e.metaKey || e.ctrlKey

      if (e.code === 'Space' && !inInput) { spaceHeld.current = true; e.preventDefault() }

      // Escape — cancel active operation / deselect
      if (e.key === 'Escape') {
        setActiveBlox(null); setPreviewPos(null)
        setDimStart(null); setDimCursor(null)
        setWallStart(null); setWallCursor(null)
        rectDrawRef.current = null; setRectDraw(null)
        clearSelection()
      }

      // ⌘/Ctrl shortcuts
      if (isMod) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); useStore.getState().undo(); return }
        if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); useStore.getState().redo(); return }
        if (e.key === 'c' && !inInput)     { e.preventDefault(); useStore.getState().copySelected(); return }
        if (e.key === 'v' && !inInput)     { e.preventDefault(); useStore.getState().pasteClipboard(); return }
        if (e.key === 'd' && !inInput)     { e.preventDefault(); useStore.getState().duplicateSelected(); return }
        if (e.key === 'a' && !inInput)     {
          e.preventDefault()
          const { project } = useStore.getState()
          if (project) useStore.getState().selectMany(project.elements.map(el => el.id), project.dimensions.map(d => d.id))
          return
        }
        if ((e.key === '=' || e.key === '+') && !inInput) { e.preventDefault(); zoomStage(ZOOM_SPEED); return }
        if (e.key === '-' && !inInput)                    { e.preventDefault(); zoomStage(1 / ZOOM_SPEED); return }
        if (e.key === '0' && !inInput)                    { e.preventDefault(); const { width, height } = sizeRef.current; const cx = width / 2; const cy = height / 2; useStore.getState().setStageTransform(cx, cy, 1); stageRef.current?.scale({ x: 1, y: 1 }); stageRef.current?.position({ x: cx, y: cy }); return }
        return
      }

      if (!inInput) {
        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          useStore.getState().deleteSelectedElements()
          useStore.getState().deleteSelectedDims()
        }

        // Tool shortcuts (AI-style)
        if (e.key === 'v' || e.key === 'V') useStore.getState().setActiveTool('select')
        if (e.key === 'h' || e.key === 'H') useStore.getState().setActiveTool('hand')
        if (e.key === 'd' || e.key === 'D') useStore.getState().setActiveTool('dimension')
        if (e.key === 'w' || e.key === 'W') useStore.getState().setActiveTool('wall')
        if (e.key === 's' || e.key === 'S') useStore.getState().setActiveTool('rect')

        // R — rotate 90°
        if (e.key === 'r' || e.key === 'R') useStore.getState().rotateSelected(90)

        // Arrow keys — nudge selected elements (Shift = 10× step)
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        if (arrowKeys.includes(e.key)) {
          const { selectedElementIds } = useStore.getState()
          if (selectedElementIds.length > 0) {
            e.preventDefault()
            const step = snapFeetRef.current * (e.shiftKey ? 10 : 1)
            const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
            const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
            useStore.getState().nudgeSelected(dx, dy)
          }
        }
      }
    }

    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeld.current = false
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [setActiveBlox, clearSelection, setStageTransform])

  // ── Coordinate helpers ───────────────────────────────────────────────────
  const screenToFeet = useCallback((pos: { x: number; y: number }) => {
    const scale = stageRef.current?.scaleX() ?? 1
    const sx = stageRef.current?.x() ?? 0
    const sy = stageRef.current?.y() ?? 0
    return {
      x: pixelsToFeet((pos.x - sx) / scale, pxPerFtRef.current),
      y: pixelsToFeet((pos.y - sy) / scale, pxPerFtRef.current)
    }
  }, [])

  const getSnappedFeet = useCallback((pos: { x: number; y: number }, edgeSnap = false) => {
    const raw = screenToFeet(pos)
    if (edgeSnap && projectRef.current) {
      const stageScale = stageRef.current?.scaleX() ?? 1
      const threshold = edgeSnapThresholdFt(pxPerFtRef.current, stageScale)
      const nearest = nearestSnapPoint(raw, getElementSnapPoints(projectRef.current.elements), threshold)
      if (nearest) return nearest
    }
    return { x: snapToGrid(raw.x, snapFeetRef.current), y: snapToGrid(raw.y, snapFeetRef.current) }
  }, [screenToFeet])

  // ── Wheel: two-finger scroll = pan, pinch (ctrlKey) = zoom ──────────────
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    if (e.evt.ctrlKey) {
      // Pinch-to-zoom — zoom toward the pointer
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const factor = e.evt.deltaY < 0 ? ZOOM_SPEED : 1 / ZOOM_SPEED
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale * factor))
      const to = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
      const newX = pointer.x - to.x * newScale
      const newY = pointer.y - to.y * newScale
      stage.scale({ x: newScale, y: newScale })
      stage.position({ x: newX, y: newY })
      setStageTransform(newX, newY, newScale)
    } else {
      // Two-finger scroll → pan
      const newX = stage.x() - e.evt.deltaX
      const newY = stage.y() - e.evt.deltaY
      stage.position({ x: newX, y: newY })
      setStageTransform(newX, newY, stage.scaleX())
    }
  }, [setStageTransform])

  // ── Mouse down ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Always reset drag distance at the start of every new interaction
    totalDragDist.current = 0

    const isMiddle = e.evt.button === 1
    const isAltLeft = e.evt.button === 0 && e.evt.altKey
    const isSpaceLeft = e.evt.button === 0 && spaceHeld.current
    const isHandTool = e.evt.button === 0 && activeToolRef.current === 'hand'
    const isOnBg = e.target === e.target.getStage()

    if (isMiddle || isAltLeft || isSpaceLeft || isHandTool) {
      isPanning.current = true
      lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
      e.evt.preventDefault()
      return
    }

    if (e.evt.button === 0 && isOnBg && !activeBloxRef.current &&
        activeToolRef.current === 'select') {
      leftDownOnBg.current = true
      lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
      const pos = stageRef.current?.getPointerPosition()
      if (pos) marqueeStartFt.current = screenToFeet(pos)
    }

    if (e.evt.button === 0 && !activeBloxRef.current && activeToolRef.current === 'rect') {
      const pos = stageRef.current?.getPointerPosition()
      if (pos) {
        const ft = getSnappedFeet(pos)
        const draw = { startFt: ft, endFt: ft }
        rectDrawRef.current = draw
        setRectDraw(draw)
      }
    }
  }, [screenToFeet, getSnappedFeet])

  // ── Mouse move ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      const stage = stageRef.current
      if (!stage) return
      const dx = e.evt.clientX - lastMousePos.current.x
      const dy = e.evt.clientY - lastMousePos.current.y
      lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
      const newX = stage.x() + dx
      const newY = stage.y() + dy
      stage.position({ x: newX, y: newY })
      setStageTransform(newX, newY, stage.scaleX())
      return
    }

    if (leftDownOnBg.current) {
      const dx = e.evt.clientX - lastMousePos.current.x
      const dy = e.evt.clientY - lastMousePos.current.y
      totalDragDist.current += Math.hypot(dx, dy)
      lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
      if (totalDragDist.current > DRAG_THRESHOLD) {
        isMarqueeActive.current = true
        const pos = stageRef.current?.getPointerPosition()
        if (pos && marqueeStartFt.current) {
          setMarquee({ startFt: marqueeStartFt.current, endFt: screenToFeet(pos) })
        }
      }
      return
    }

    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return
    if (activeBloxRef.current) {
      const snapped = getSnappedFeet(pos)
      setPreviewPos(snapped)
      if (WALL_SNAP_BLOX_IDS.has(activeBloxRef.current)) {
        const def = getBloxById(activeBloxRef.current)
        // Always read elements from the live store — projectRef.current can lag
        // a React render cycle behind after a wall-split placement.
        const elements = useStore.getState().project?.elements ?? []
        const stageScale = stageRef.current?.scaleX() ?? 1
        const threshold = edgeSnapThresholdFt(pxPerFtRef.current, stageScale, 30)
        // Use raw (un-grid-snapped) cursor for wall proximity test so grid alignment
        // doesn't accidentally push the cursor past the snap threshold.
        const rawFt = screenToFeet(pos)
        const snapW = pendingBloxWidthRef.current ?? def?.defaultWidth ?? 3
        const snap = def ? snapOpeningToWall(rawFt, elements, snapW, threshold) : null
        wallSnapRef.current = snap
        setWallSnap(snap)
      } else {
        wallSnapRef.current = null
        setWallSnap(null)
      }
    }
    if (activeToolRef.current === 'dimension') setDimCursor(getSnappedFeet(pos, true))
    if (activeToolRef.current === 'wall') {
      const gridPt = getSnappedFeet(pos)
      if (wallStartRef.current) {
        const elements = useStore.getState().project?.elements ?? []
        const stageScale = stageRef.current?.scaleX() ?? 1
        const threshFt = edgeSnapThresholdFt(pxPerFtRef.current, stageScale, 20)
        const constrained = constrainToOrthogonal(wallStartRef.current, gridPt)
        setWallCursor(snapWallEndpoint(wallStartRef.current, constrained, elements, threshFt))
      } else {
        setWallCursor(gridPt)
      }
    }
    if (activeToolRef.current === 'rect' && rectDrawRef.current) {
      const ft = getSnappedFeet(pos)
      const draw = { ...rectDrawRef.current, endFt: ft }
      rectDrawRef.current = draw
      setRectDraw(draw)
    }
  }, [setStageTransform, screenToFeet, getSnappedFeet])

  // ── Mouse up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    isPanning.current = false

    if (isMarqueeActive.current && marqueeStartFt.current) {
      const pos = stageRef.current?.getPointerPosition()
      const endFt = pos ? screenToFeet(pos) : marqueeStartFt.current

      const minX = Math.min(marqueeStartFt.current.x, endFt.x)
      const minY = Math.min(marqueeStartFt.current.y, endFt.y)
      const maxX = Math.max(marqueeStartFt.current.x, endFt.x)
      const maxY = Math.max(marqueeStartFt.current.y, endFt.y)

      const hitEls = (projectRef.current?.elements ?? [])
        .filter(el => !(el.x + el.width < minX || el.x > maxX || el.y + el.height < minY || el.y > maxY))
        .map(el => el.id)

      const hitDims = (projectRef.current?.dimensions ?? [])
        .filter(d => {
          const inRect = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY
          return inRect(d.x1, d.y1) || inRect(d.x2, d.y2)
        })
        .map(d => d.id)

      if (hitEls.length > 0 || hitDims.length > 0) {
        selectMany(hitEls, hitDims)
      } else if (!e.evt.shiftKey) {
        clearSelection()
      }

      isMarqueeActive.current = false
      setMarquee(null)
      marqueeStartFt.current = null
    }

    leftDownOnBg.current = false

    if (activeToolRef.current === 'rect' && rectDrawRef.current) {
      const { startFt, endFt } = rectDrawRef.current
      const x = Math.min(startFt.x, endFt.x)
      const y = Math.min(startFt.y, endFt.y)
      const w = Math.abs(endFt.x - startFt.x)
      const h = Math.abs(endFt.y - startFt.y)
      if (w >= 0.25 && h >= 0.25) {
        placeRef.current('shape-rect', x, y, w, h)
      }
      rectDrawRef.current = null
      setRectDraw(null)
    }
  }, [screenToFeet, selectMany, clearSelection])

  // ── Stage click ──────────────────────────────────────────────────────────
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (totalDragDist.current > DRAG_THRESHOLD) return

    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return

    // Active blox placement always takes priority — tool mode is irrelevant
    if (activeBloxRef.current) {
      const snap = WALL_SNAP_BLOX_IDS.has(activeBloxRef.current) ? wallSnapRef.current : null
      if (snap) {
        placeRef.current(activeBloxRef.current, snap.x, snap.y, snap.widthOverride, snap.heightOverride, snap.wallId)
      } else {
        const ft = getSnappedFeet(pos)
        const pendW = pendingBloxWidthRef.current ?? undefined
        placeRef.current(activeBloxRef.current, ft.x, ft.y, pendW)
      }
      return
    }

    // Wall tool — orthogonal chain drawing
    if (activeToolRef.current === 'wall') {
      const gridPt = getSnappedFeet(pos)
      const elements = useStore.getState().project?.elements ?? []
      const stageScale = stageRef.current?.scaleX() ?? 1
      const threshFt = edgeSnapThresholdFt(pxPerFtRef.current, stageScale, 20)
      if (!wallStartRef.current) {
        // Snap start to nearest element corner/edge-midpoint
        const snapPts = getElementSnapPoints(elements)
        const snapped = nearestSnapPoint(gridPt, snapPts, threshFt) ?? gridPt
        setWallStart(snapped)
      } else {
        const constrained = constrainToOrthogonal(wallStartRef.current, gridPt)
        const snapped = snapWallEndpoint(wallStartRef.current, constrained, elements, threshFt)
        const start = wallStartRef.current
        const dx = Math.abs(snapped.x - start.x)
        const dy = Math.abs(snapped.y - start.y)
        if (dx < 0.25 && dy < 0.25) return // too short — ignore click

        const wallType = activeWallTypeRef.current
        const t = WALL_THICKNESS[wallType] ?? 0.5
        const isHoriz = dx >= dy
        if (isHoriz) {
          placeRef.current(wallType,
            Math.min(start.x, snapped.x) - t / 2, start.y - t / 2,
            dx + t, t)
        } else {
          placeRef.current(wallType,
            start.x - t / 2, Math.min(start.y, snapped.y) - t / 2,
            t, dy + t)
        }
        setWallStart(snapped)
      }
      return
    }

    // Dimension tool — two-click placement
    if (activeToolRef.current === 'dimension') {
      const snapped = getSnappedFeet(pos, true)
      if (!dimStartRef.current) {
        setDimStart(snapped)
      } else {
        addDimension({ x1: dimStartRef.current.x, y1: dimStartRef.current.y,
                       x2: snapped.x, y2: snapped.y, offset: DEFAULT_DIM_OFFSET })
        setDimStart(snapped)  // chain: next dim starts from this endpoint; ESC to finish
      }
      return
    }

    // Clear selection on background click
    if (e.target !== e.target.getStage()) {
      clearSelection()
      return
    }
    clearSelection()
  }, [getSnappedFeet, addDimension, clearSelection])

  const handleMouseLeave = useCallback(() => {
    setPreviewPos(null); setDimCursor(null); setWallCursor(null)
    wallSnapRef.current = null; setWallSnap(null)
    rectDrawRef.current = null; setRectDraw(null)
  }, [])

  if (!project) return null
  const scale = SCALES[project.scale]
  const pxPerFt = scale.pixelsPerFoot

  const marqueeRect = marquee ? {
    x: Math.min(marquee.startFt.x, marquee.endFt.x) * pxPerFt,
    y: Math.min(marquee.startFt.y, marquee.endFt.y) * pxPerFt,
    w: Math.abs(marquee.endFt.x - marquee.startFt.x) * pxPerFt,
    h: Math.abs(marquee.endFt.y - marquee.startFt.y) * pxPerFt
  } : null

  // Wall preview: wallCursor is already constrained+edge-snapped when wallStart exists
  const wallPreview = activeTool === 'wall' && wallStart && wallCursor
    ? (() => {
        const c = wallCursor  // already constrained + edge-snapped in mousemove
        const dx = Math.abs(c.x - wallStart.x)
        const dy = Math.abs(c.y - wallStart.y)
        const t = WALL_THICKNESS[activeWallType] ?? 0.5
        const isHoriz = dx >= dy
        return isHoriz
          ? { x: (Math.min(wallStart.x, c.x) - t / 2) * pxPerFt, y: (wallStart.y - t / 2) * pxPerFt, w: (dx + t) * pxPerFt, h: t * pxPerFt }
          : { x: (wallStart.x - t / 2) * pxPerFt, y: (Math.min(wallStart.y, c.y) - t / 2) * pxPerFt, w: t * pxPerFt, h: (dy + t) * pxPerFt }
      })()
    : null

  const wallStartDot = activeTool === 'wall' && wallStart
    ? { x: wallStart.x * pxPerFt, y: wallStart.y * pxPerFt }
    : null

  const cursor = activeBloxId || activeTool === 'dimension' || activeTool === 'wall' || activeTool === 'rect'
    ? 'crosshair'
    : activeTool === 'hand' || spaceHeld.current
    ? (isPanning.current ? 'grabbing' : 'grab')
    : 'default'

  const rectPreview = rectDraw ? {
    x: Math.min(rectDraw.startFt.x, rectDraw.endFt.x) * pxPerFt,
    y: Math.min(rectDraw.startFt.y, rectDraw.endFt.y) * pxPerFt,
    w: Math.abs(rectDraw.endFt.x - rectDraw.startFt.x) * pxPerFt,
    h: Math.abs(rectDraw.endFt.y - rectDraw.startFt.y) * pxPerFt,
    wFt: Math.abs(rectDraw.endFt.x - rectDraw.startFt.x),
    hFt: Math.abs(rectDraw.endFt.y - rectDraw.startFt.y)
  } : null

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-100 relative" style={{ cursor }}>
      <Stage
        ref={stageRef}
        width={size.width} height={size.height}
        x={stageX} y={stageY}
        scaleX={stageScale} scaleY={stageScale}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <GridLayer pixelsPerFoot={pxPerFt} />
        <ElementsLayer pixelsPerFoot={pxPerFt} snapFeet={scale.snapFeet} toolActive={activeTool} />
        <DimensionLayer
          dimensions={project.dimensions}
          selectedDimIds={selectedDimIds}
          pixelsPerFoot={pxPerFt}
          onSelect={(id, multi) => selectDim(id, multi)}
          onOffsetDrag={(id, off) => updateDimension(id, { offset: off })}
          preview={
            activeTool === 'dimension' && dimStart && dimCursor
              ? { x1: dimStart.x, y1: dimStart.y, x2: dimCursor.x, y2: dimCursor.y }
              : undefined
          }
          previewOffset={DEFAULT_DIM_OFFSET}
        />
        {activeBloxId && previewPos && (
          <PreviewLayer
            bloxId={activeBloxId}
            xFeet={wallSnap ? wallSnap.x : previewPos.x}
            yFeet={wallSnap ? wallSnap.y : previewPos.y}
            pixelsPerFoot={pxPerFt}
            widthOverride={wallSnap?.widthOverride ?? pendingBloxWidth ?? undefined}
            heightOverride={wallSnap?.heightOverride}
          />
        )}

        {/* Wall drawing preview */}
        {(wallPreview || wallStartDot) && (
          <Layer listening={false}>
            {wallPreview && (() => {
              const isHoriz = wallPreview.w > wallPreview.h
              const lenFt = isHoriz ? wallPreview.w / pxPerFt : wallPreview.h / pxPerFt
              const labelX = wallPreview.x + wallPreview.w / 2
              const labelY = wallPreview.y + wallPreview.h / 2
              const fs = Math.max(10, 13 / stageScale)
              return (
                <>
                  <Rect
                    x={wallPreview.x} y={wallPreview.y}
                    width={wallPreview.w} height={wallPreview.h}
                    fill="rgba(60,60,60,0.45)" stroke="#3C3C3C" strokeWidth={1}
                  />
                  <KText
                    text={formatFeet(lenFt)}
                    x={isHoriz ? labelX - 24 / stageScale : labelX + 4 / stageScale}
                    y={isHoriz ? labelY - 22 / stageScale : labelY - 8 / stageScale}
                    fontSize={fs}
                    fontFamily="sans-serif"
                    fill="#4F9EFF"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={2 / stageScale}
                    fillAfterStrokeEnabled
                    listening={false}
                  />
                </>
              )
            })()}
            {wallStartDot && (
              <>
                {/* Crosshair at start point */}
                <Line
                  points={[wallStartDot.x - 8 / stageScale, wallStartDot.y, wallStartDot.x + 8 / stageScale, wallStartDot.y]}
                  stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
                />
                <Line
                  points={[wallStartDot.x, wallStartDot.y - 8 / stageScale, wallStartDot.x, wallStartDot.y + 8 / stageScale]}
                  stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
                />
              </>
            )}
          </Layer>
        )}

        {/* Rectangle draw preview */}
        {rectPreview && rectPreview.w > 0 && rectPreview.h > 0 && (
          <Layer listening={false}>
            <Rect
              x={rectPreview.x} y={rectPreview.y}
              width={rectPreview.w} height={rectPreview.h}
              fill="rgba(255,255,255,0.4)" stroke="#1A1A1A" strokeWidth={1 / stageScale}
            />
            <KText
              text={`${formatFeet(rectPreview.wFt)} × ${formatFeet(rectPreview.hFt)}`}
              x={rectPreview.x + rectPreview.w / 2}
              y={rectPreview.y + rectPreview.h / 2 - 8 / stageScale}
              offsetX={60 / stageScale}
              fontSize={Math.max(10, 13 / stageScale)}
              fontFamily="sans-serif"
              fill="#4F9EFF"
              stroke="rgba(0,0,0,0.6)"
              strokeWidth={2 / stageScale}
              fillAfterStrokeEnabled
              listening={false}
            />
          </Layer>
        )}

        {/* Marquee selection */}
        {marqueeRect && (
          <Layer listening={false}>
            <Rect
              x={marqueeRect.x} y={marqueeRect.y}
              width={marqueeRect.w} height={marqueeRect.h}
              fill="rgba(79,158,255,0.07)"
              stroke="#4F9EFF" strokeWidth={1 / stageScale}
              dash={[4 / stageScale, 2 / stageScale]}
            />
          </Layer>
        )}
      </Stage>
      <ScaleBar scale={project.scale as Scale} pixelsPerFoot={pxPerFt} />
    </div>
  )
}
