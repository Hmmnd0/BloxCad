import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Line, Text as KText, Circle, Shape, Group } from 'react-konva'
import Konva from 'konva'
import { GridLayer } from './GridLayer'
import { UnderlayLayer, computeRenderSize } from './UnderlayLayer'
import { ArcWallLayer } from './ArcWallLayer'
import { ElementsLayer } from './ElementsLayer'
import { WallOutlineLayer } from './WallOutlineLayer'
import { WallCornerLayer } from './WallCornerLayer'
import { snapWallCenterline } from '../../utils/snap'
import { dimensionSnapPoints, nearestWallEdgePoint, resolveDimensions } from '../../utils/dimensionAnchors'
import { JOINED_WALLS } from '../../utils/wallUnion'
import { PreviewLayer } from './PreviewLayer'
import { DimensionLayer } from './DimensionLayer'
import { useStore, getPixelsPerFoot, getSnapFeet } from '../../store/useStore'
import { snapToGrid, pixelsToFeet, formatFeet, formatInches } from '../../utils/scale'
import { getActiveElements, getActiveDimensions } from '../../store/useStore'
import { SCALES, Scale } from '../../types'
import { getElementSnapPoints, nearestSnapPoint, edgeSnapThresholdFt, snapOpeningToWall, snapWallEndpoint, WallSnapResult } from '../../utils/snap'
import { getBloxById, OPENING_BLOX_IDS } from '../../blox/definitions'
import { registerStage, unregisterStage, fitView } from '../../utils/exportManager'
import { PlanNotesLayer } from './PlanNotesLayer'
import { ZoomControl } from './ZoomControl'

const ZOOM_SPEED = 1.1
const MIN_ZOOM = 0.15
const MAX_ZOOM = 8
const DRAG_THRESHOLD = 4
const WALL_THICKNESS: Record<string, number> = {
  'wall-exterior': 0.5,
  'wall-interior': 0.375,
  'wall-cmu': 0.667,
}
const CONDUIT_THICKNESS = 0.15
const CIRCUIT_WIRE_HEIGHT = 1.2
const WALL_SNAP_BLOX_IDS = OPENING_BLOX_IDS

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
  const [diagWallStart, setDiagWallStart] = useState<{ x: number; y: number } | null>(null)
  const [diagWallCursor, setDiagWallCursor] = useState<{ x: number; y: number } | null>(null)
  const [conduitStart, setConduitStart] = useState<{ x: number; y: number } | null>(null)
  const [conduitCursor, setConduitCursor] = useState<{ x: number; y: number } | null>(null)
  const [circuitWireStart, setCircuitWireStart] = useState<{ x: number; y: number } | null>(null)
  const [circuitWireCursor, setCircuitWireCursor] = useState<{ x: number; y: number } | null>(null)
  const [polyVerts, setPolyVerts] = useState<{ x: number; y: number }[]>([])
  const [polyCursor, setPolyCursor] = useState<{ x: number; y: number } | null>(null)
  const [arcWallPhase, setArcWallPhase] = useState<0 | 1 | 2>(0)
  const [arcWallCenter, setArcWallCenter] = useState<{ x: number; y: number } | null>(null)
  const [arcWallStart, setArcWallStart] = useState<{ x: number; y: number } | null>(null)
  const [arcWallCursor, setArcWallCursor] = useState<{ x: number; y: number } | null>(null)
  const DEFAULT_DIM_OFFSET = 1.5

  const cursorReadoutRef = useRef<HTMLDivElement>(null)

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
    addDimension, updateDimension, deleteSelectedDims, selectDim, selectMany, placePolygon,
    underlayCalibrationMode, addUnderlayCalibrationPoint, cancelUnderlayCalibration,
    placeArcWall, pickPointResolver
  } = useStore()

  const pixelsPerFoot = getPixelsPerFoot(useStore.getState())
  const snapFeet = getSnapFeet(useStore.getState())

  const activeBloxRef = useRef(activeBloxId);       activeBloxRef.current = activeBloxId
  const activeToolRef = useRef(activeTool);         activeToolRef.current = activeTool
  const activeWallTypeRef = useRef(activeWallType); activeWallTypeRef.current = activeWallType
  const snapFeetRef = useRef(snapFeet);             snapFeetRef.current = snapFeet
  const pxPerFtRef = useRef(pixelsPerFoot);         pxPerFtRef.current = pixelsPerFoot
  const underlayCalModeRef = useRef(underlayCalibrationMode); underlayCalModeRef.current = underlayCalibrationMode
  const pendingBloxWidthRef = useRef(pendingBloxWidth); pendingBloxWidthRef.current = pendingBloxWidth
  const dimStartRef = useRef(dimStart);       dimStartRef.current = dimStart
  const wallStartRef = useRef(wallStart);     wallStartRef.current = wallStart
  const diagWallStartRef = useRef(diagWallStart); diagWallStartRef.current = diagWallStart
  const conduitStartRef = useRef(conduitStart); conduitStartRef.current = conduitStart
  const circuitWireStartRef = useRef(circuitWireStart); circuitWireStartRef.current = circuitWireStart
  const polyVertsRef = useRef(polyVerts); polyVertsRef.current = polyVerts
  const projectRef = useRef(project);         projectRef.current = project
  const placeRef = useRef(placeElement);      placeRef.current = placeElement
  const placePolyRef = useRef(placePolygon);  placePolyRef.current = placePolygon
  const placeArcWallRef = useRef(placeArcWall); placeArcWallRef.current = placeArcWall

  const arcWallPhaseRef = useRef(arcWallPhase);   arcWallPhaseRef.current = arcWallPhase
  const arcWallCenterRef = useRef(arcWallCenter); arcWallCenterRef.current = arcWallCenter
  const arcWallStartRef = useRef(arcWallStart);   arcWallStartRef.current = arcWallStart

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

  const wheelSyncTimerRef = useRef<ReturnType<typeof setTimeout>>()

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
      const viewW = rect?.width ?? sizeRef.current.width
      const viewH = rect?.height ?? sizeRef.current.height
      const pxPerFt = SCALES[project.scale].pixelsPerFoot
      // Center the grid in the viewport (elevation uses a 200×60 grid)
      const isElev = project.mode === 'elevation'
      const isDetail = project.mode === 'detail'
      // Detail: center of 240×180 inch canvas; elev: top-center (30ft up); plan: center of 200×200
      const gridCenterX = (isDetail ? 120 : 100) * pxPerFt
      const gridCenterY = (isElev ? 30 : isDetail ? 90 : 100) * pxPerFt
      const cx = viewW / 2 - gridCenterX
      const cy = viewH / 2 - gridCenterY
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

      // Escape — exit group isolation first, then cancel active operation / deselect
      if (e.key === 'Escape') {
        if (useStore.getState().activeGroupId !== null) {
          useStore.getState().exitGroup()
          return
        }
        setActiveBlox(null); setPreviewPos(null)
        setDimStart(null); setDimCursor(null)
        setWallStart(null); setWallCursor(null)
        setDiagWallStart(null); setDiagWallCursor(null)
        setConduitStart(null); setConduitCursor(null)
        setCircuitWireStart(null); setCircuitWireCursor(null)
        setPolyVerts([]); setPolyCursor(null)
        rectDrawRef.current = null; setRectDraw(null)
        setArcWallPhase(0); setArcWallCenter(null); setArcWallStart(null); setArcWallCursor(null)
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
          if (project) useStore.getState().selectMany(getActiveElements(useStore.getState()).map(el => el.id), getActiveDimensions(useStore.getState()).map(d => d.id))
          return
        }
        if ((e.key === '=' || e.key === '+') && !inInput) { e.preventDefault(); zoomStage(ZOOM_SPEED); return }
        if (e.key === '-' && !inInput)                    { e.preventDefault(); zoomStage(1 / ZOOM_SPEED); return }
        if (e.key === '0' && !inInput)                    { e.preventDefault(); const { width, height } = sizeRef.current; const proj = useStore.getState().project; const pxPerFt = proj ? SCALES[proj.scale].pixelsPerFoot : 24; const gridCenterPx = 100 * pxPerFt; const cx = width / 2 - gridCenterPx; const cy = height / 2 - gridCenterPx; useStore.getState().setStageTransform(cx, cy, 1); stageRef.current?.scale({ x: 1, y: 1 }); stageRef.current?.position({ x: cx, y: cy }); return }
        if (e.key === 'g' && !e.shiftKey && !inInput) { e.preventDefault(); useStore.getState().groupSelected(); return }
        if (e.key === 'g' && e.shiftKey && !inInput)  { e.preventDefault(); useStore.getState().ungroupSelected(); return }
        return
      }

      if (!inInput) {
        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          useStore.getState().deleteSelectedElements()
          useStore.getState().deleteSelectedDims()
          useStore.getState().deleteSelectedArcWalls()
        }

        // Tool shortcuts (AI-style)
        if (e.key === 'v' || e.key === 'V') useStore.getState().setActiveTool('select')
        if (e.key === 'h' || e.key === 'H') useStore.getState().setActiveTool('hand')
        if (e.key === 'd' || e.key === 'D') useStore.getState().setActiveTool('dimension')
        if (e.key === 'w' || e.key === 'W') useStore.getState().setActiveTool('wall')
        if (e.key === 'a' || e.key === 'A') useStore.getState().setActiveTool('diagonal-wall')
        if (e.key === 'p' || e.key === 'P') useStore.getState().setActiveTool('polygon')
        if (e.key === 's' || e.key === 'S') useStore.getState().setActiveTool('rect')
        if (e.key === 'c' || e.key === 'C') useStore.getState().setActiveTool('arc-wall')
        if (e.key === 'k' || e.key === 'K') useStore.getState().setActiveTool('conduit')
        if (e.key === 'l' || e.key === 'L') useStore.getState().setActiveTool('circuit-wire')

        // R — rotate 90° (Shift+R = 45°)
        if (e.key === 'r' || e.key === 'R') useStore.getState().rotateSelected(e.shiftKey ? 45 : 90)

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
    if ((edgeSnap || !!activeBloxRef.current) && projectRef.current) {
      const stageScale = stageRef.current?.scaleX() ?? 1
      const threshold = edgeSnapThresholdFt(pxPerFtRef.current, stageScale)
      const visible=getActiveElements(useStore.getState()).filter(e=>!projectRef.current?.layers?.some(l=>l.id===e.layerId&&!l.visible))
      if(activeToolRef.current==='dimension') {
        // Dimension clicks prioritize the actual wall perimeter. This runs
        // before the first endpoint is stored, so the initial left-click is
        // anchored to the visible edge rather than a selection-box midpoint.
        const edge=nearestWallEdgePoint(raw,visible,threshold)
        if(edge)return edge
      }
      // Dimension endpoints/extension anchors are real drafting geometry. When
      // placing a blox, include them in the same point-snap set so the cursor
      // and the placed object's anchor land on the measured edge—not on the
      // dimension text or its selection outline.
      const includeDimensions=activeToolRef.current==='dimension'||!!activeBloxRef.current
      const points=includeDimensions ? [...dimensionSnapPoints(visible),...getElementSnapPoints(visible.filter(e=>!JOINED_WALLS.has(e.bloxId)))] : getElementSnapPoints(visible)
      const nearest = nearestSnapPoint(raw, points, threshold)
      if (nearest) return nearest
    }
    return { x: snapToGrid(raw.x, snapFeetRef.current), y: snapToGrid(raw.y, snapFeetRef.current) }
  }, [screenToFeet])

  // ── Absolute zoom (ZoomControl presets) — zooms toward the viewport center ──
  const setZoomAbsolute = useCallback((newScale: number) => {
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const cx = stage.width() / 2
    const cy = stage.height() / 2
    const to = { x: (cx - stage.x()) / oldScale, y: (cy - stage.y()) / oldScale }
    const newX = cx - to.x * newScale
    const newY = cy - to.y * newScale
    stage.scale({ x: newScale, y: newScale })
    stage.position({ x: newX, y: newY })
    setStageTransform(newX, newY, newScale)
  }, [setStageTransform])

  // ── Wheel: two-finger scroll = pan, pinch (ctrlKey) = zoom ──────────────
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    if (e.evt.ctrlKey) {
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
    } else {
      stage.position({ x: stage.x() - e.evt.deltaX, y: stage.y() - e.evt.deltaY })
    }
    // Debounce store sync — avoids a full React re-render on every scroll tick.
    clearTimeout(wheelSyncTimerRef.current)
    wheelSyncTimerRef.current = setTimeout(() => {
      const s = stageRef.current
      if (s) setStageTransform(s.x(), s.y(), s.scaleX())
    }, 80)
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
      stage.position({ x: stage.x() + dx, y: stage.y() + dy })
      // Do NOT call setStageTransform here — it would re-render the entire component
      // tree at 60fps. Store is synced on mouseup instead.
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
    if (cursorReadoutRef.current) {
      const ft = screenToFeet(pos)
      const mode = projectRef.current?.mode
      cursorReadoutRef.current.style.display = 'block'
      cursorReadoutRef.current.textContent = mode === 'elevation'
        ? `x: ${ft.x.toFixed(1)} ft  |  elev: ${(300 - ft.y).toFixed(1)} ft`
        : `x: ${ft.x.toFixed(1)} ft  |  y: ${ft.y.toFixed(1)} ft`
    }
    if (activeBloxRef.current) {
      const snapped = getSnappedFeet(pos)
      setPreviewPos(snapped)
      if (WALL_SNAP_BLOX_IDS.has(activeBloxRef.current)) {
        const def = getBloxById(activeBloxRef.current)
        // Always read elements from the live store — projectRef.current can lag
        // a React render cycle behind after a wall-split placement.
        const elements = getActiveElements(useStore.getState())
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
    if (activeToolRef.current === 'dimension') {
      const snapped=getSnappedFeet(pos, true)
      const start=dimStartRef.current
      // Manual dimensions are orthogonal drafting dimensions. Once the first
      // point is set, project the hover point onto the dominant axis so the
      // preview line cannot drift diagonally.
      if(start) {
        const dx=Math.abs(snapped.x-start.x),dy=Math.abs(snapped.y-start.y)
        setDimCursor(dx>=dy?{x:snapped.x,y:start.y}:{x:start.x,y:snapped.y})
      } else setDimCursor(snapped)
    }
    if (activeToolRef.current === 'wall') {
      const gridPt = getSnappedFeet(pos)
      if (wallStartRef.current) {
        const elements = getActiveElements(useStore.getState())
        const stageScale = stageRef.current?.scaleX() ?? 1
        const threshFt = edgeSnapThresholdFt(pxPerFtRef.current, stageScale, 20)
        const constrained = constrainToOrthogonal(wallStartRef.current, gridPt)
        setWallCursor(snapWallCenterline(constrained, elements, threshFt, wallStartRef.current) ?? snapWallEndpoint(wallStartRef.current, constrained, elements, threshFt))
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
    if (activeToolRef.current === 'polygon') {
      setPolyCursor(getSnappedFeet(pos))
    }
    if (activeToolRef.current === 'arc-wall') {
      setArcWallCursor(getSnappedFeet(pos))
    }
    if (activeToolRef.current === 'diagonal-wall') {
      const gridPt = getSnappedFeet(pos)
      if (diagWallStartRef.current && e.evt.shiftKey) {
        const dx = gridPt.x - diagWallStartRef.current.x
        const dy = gridPt.y - diagWallStartRef.current.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len > 0.01) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          setDiagWallCursor({ x: diagWallStartRef.current.x + len * Math.cos(snapped), y: diagWallStartRef.current.y + len * Math.sin(snapped) })
        } else {
          setDiagWallCursor(gridPt)
        }
      } else {
        setDiagWallCursor(gridPt)
      }
    }
    // Conduit tool — same free-angle two-click drawing as diagonal-wall,
    // with the same optional shift-to-15°-increments snap.
    if (activeToolRef.current === 'conduit') {
      const gridPt = getSnappedFeet(pos)
      if (conduitStartRef.current && e.evt.shiftKey) {
        const dx = gridPt.x - conduitStartRef.current.x
        const dy = gridPt.y - conduitStartRef.current.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len > 0.01) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          setConduitCursor({ x: conduitStartRef.current.x + len * Math.cos(snapped), y: conduitStartRef.current.y + len * Math.sin(snapped) })
        } else {
          setConduitCursor(gridPt)
        }
      } else {
        setConduitCursor(gridPt)
      }
    }
    // Circuit wire tool — same free-angle two-click drawing as conduit
    if (activeToolRef.current === 'circuit-wire') {
      const gridPt = getSnappedFeet(pos)
      if (circuitWireStartRef.current && e.evt.shiftKey) {
        const dx = gridPt.x - circuitWireStartRef.current.x
        const dy = gridPt.y - circuitWireStartRef.current.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len > 0.01) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          setCircuitWireCursor({ x: circuitWireStartRef.current.x + len * Math.cos(snapped), y: circuitWireStartRef.current.y + len * Math.sin(snapped) })
        } else {
          setCircuitWireCursor(gridPt)
        }
      } else {
        setCircuitWireCursor(gridPt)
      }
    }
  }, [setStageTransform, screenToFeet, getSnappedFeet])

  // ── Mouse up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const wasPanning = isPanning.current
    isPanning.current = false
    // Sync stage position to store only after an actual pan gesture
    if (wasPanning) {
      const stage = stageRef.current
      if (stage) setStageTransform(stage.x(), stage.y(), stage.scaleX())
    }

    if (isMarqueeActive.current && marqueeStartFt.current) {
      const pos = stageRef.current?.getPointerPosition()
      const endFt = pos ? screenToFeet(pos) : marqueeStartFt.current

      const minX = Math.min(marqueeStartFt.current.x, endFt.x)
      const minY = Math.min(marqueeStartFt.current.y, endFt.y)
      const maxX = Math.max(marqueeStartFt.current.x, endFt.x)
      const maxY = Math.max(marqueeStartFt.current.y, endFt.y)

      const activeEls = projectRef.current?.mode === 'detail'
        ? (projectRef.current?.detailElements ?? [])
        : (projectRef.current?.elements ?? [])
      const activeDims = projectRef.current?.mode === 'detail'
        ? (projectRef.current?.detailDimensions ?? [])
        : (projectRef.current?.dimensions ?? [])

      const hitEls = activeEls
        .filter(el => !(el.x + el.width < minX || el.x > maxX || el.y + el.height < minY || el.y > maxY))
        .map(el => el.id)

      const hitDims = activeDims
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
  }, [screenToFeet, selectMany, clearSelection, setStageTransform])

  // ── Stage click ──────────────────────────────────────────────────────────
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (totalDragDist.current > DRAG_THRESHOLD) return

    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return

    // pick_point intercept — resolves pending MCP coordinate request
    const pickResolver = useStore.getState().pickPointResolver
    if (pickResolver) {
      useStore.getState().clearPendingPickPoint()
      pickResolver(screenToFeet(pos))
      return
    }

    // Underlay two-point calibration intercept
    if (underlayCalModeRef.current === 'two-point-picking') {
      // Calibration points belong to the reference image, never to a placed
      // dimension or blox beneath the cursor.
      e.cancelBubble = true
      const stage = stageRef.current
      if (!stage) return
      const stageScale = stage.scaleX()
      const sx = stage.x(), sy = stage.y()
      const stagePxX = (pos.x - sx) / stageScale
      const stagePxY = (pos.y - sy) / stageScale
      const underlay = useStore.getState().project?.underlay
      if (!underlay) return
      const pxPerFt = pxPerFtRef.current
      const { w, h } = computeRenderSize(underlay, pxPerFt)
      const imgPxX = (stagePxX / w) * underlay.naturalWidth
      const imgPxY = (stagePxY / h) * underlay.naturalHeight
      addUnderlayCalibrationPoint({ x: imgPxX, y: imgPxY })
      return
    }

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
        const snapped = snapWallCenterline(gridPt, elements, threshFt) ?? nearestSnapPoint(gridPt, snapPts, threshFt) ?? gridPt
        setWallStart(snapped)
      } else {
        const constrained = constrainToOrthogonal(wallStartRef.current, gridPt)
        const snapped = snapWallCenterline(constrained, elements, threshFt, wallStartRef.current) ?? snapWallEndpoint(wallStartRef.current, constrained, elements, threshFt)
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
                       x2: snapped.x, y2: snapped.y, offset: DEFAULT_DIM_OFFSET,
                       measurement: undefined })
        setDimStart(snapped)  // chain: next dim starts from this endpoint; ESC to finish
      }
      return
    }

    // Polygon tool — click to add vertices; double-click or click near start to close
    if (activeToolRef.current === 'polygon') {
      const ft = getSnappedFeet(pos)
      const verts = polyVertsRef.current
      const CLOSE_THRESHOLD_FT = 0.75
      const now = Date.now()
      const isDbl = now - lastPolyClickTime.current < 350
      lastPolyClickTime.current = now

      if (isDbl && verts.length >= 3) {
        // Double-click: close with current verts (don't add this point)
        placePolyRef.current(verts)
        setPolyVerts([])
        setPolyCursor(null)
        return
      }
      if (verts.length >= 3) {
        const first = verts[0]
        if (Math.hypot(ft.x - first.x, ft.y - first.y) < CLOSE_THRESHOLD_FT) {
          placePolyRef.current(verts)
          setPolyVerts([])
          setPolyCursor(null)
          return
        }
      }
      setPolyVerts([...verts, ft])
      return
    }

    // Arc wall tool — 3-click: center → start endpoint → end endpoint
    if (activeToolRef.current === 'arc-wall') {
      const ft = getSnappedFeet(pos)
      const phase = arcWallPhaseRef.current
      if (phase === 0) {
        setArcWallCenter(ft)
        setArcWallPhase(1)
      } else if (phase === 1) {
        setArcWallStart(ft)
        setArcWallPhase(2)
      } else {
        const center = arcWallCenterRef.current!
        const start = arcWallStartRef.current!
        const radius = Math.hypot(start.x - center.x, start.y - center.y)
        const startAngle = Math.atan2(start.y - center.y, start.x - center.x)
        const endAngle = Math.atan2(ft.y - center.y, ft.x - center.x)
        const sweep = ((endAngle - startAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
        if (radius >= 0.5 && sweep > 0.08) {
          placeArcWallRef.current({ cx: center.x, cy: center.y, radius, startAngle, endAngle, thickness: 0.5 })
        }
        setArcWallPhase(0)
        setArcWallCenter(null)
        setArcWallStart(null)
      }
      return
    }

    // Diagonal wall tool — two-click free-angle drawing
    if (activeToolRef.current === 'diagonal-wall') {
      const gridPt = getSnappedFeet(pos)
      if (!diagWallStartRef.current) {
        setDiagWallStart(gridPt)
      } else {
        const start = diagWallStartRef.current
        let dx = gridPt.x - start.x
        let dy = gridPt.y - start.y
        const rawLen = Math.sqrt(dx * dx + dy * dy)
        if (rawLen < 0.25) return
        if (e.evt.shiftKey) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          dx = rawLen * Math.cos(snapped)
          dy = rawLen * Math.sin(snapped)
        }
        const len = Math.sqrt(dx * dx + dy * dy)
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
        const end = { x: start.x + dx, y: start.y + dy }
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        const t = WALL_THICKNESS[activeWallTypeRef.current] ?? 0.5
        placeRef.current(activeWallTypeRef.current, cx - len / 2, cy - t / 2, len, t, undefined, angleDeg)
        setDiagWallStart(end)
      }
      return
    }

    // Conduit tool — two-click free-angle drawing, chainable like walls
    if (activeToolRef.current === 'conduit') {
      const gridPt = getSnappedFeet(pos)
      if (!conduitStartRef.current) {
        setConduitStart(gridPt)
      } else {
        const start = conduitStartRef.current
        let dx = gridPt.x - start.x
        let dy = gridPt.y - start.y
        const rawLen = Math.sqrt(dx * dx + dy * dy)
        if (rawLen < 0.25) return
        if (e.evt.shiftKey) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          dx = rawLen * Math.cos(snapped)
          dy = rawLen * Math.sin(snapped)
        }
        const len = Math.sqrt(dx * dx + dy * dy)
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
        const end = { x: start.x + dx, y: start.y + dy }
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        placeRef.current('elec-conduit', cx - len / 2, cy - CONDUIT_THICKNESS / 2, len, CONDUIT_THICKNESS, undefined, angleDeg)
        setConduitStart(end)
      }
      return
    }

    // Circuit wire tool — two-click free-angle drawing, chainable like walls
    if (activeToolRef.current === 'circuit-wire') {
      const gridPt = getSnappedFeet(pos)
      if (!circuitWireStartRef.current) {
        setCircuitWireStart(gridPt)
      } else {
        const start = circuitWireStartRef.current
        let dx = gridPt.x - start.x
        let dy = gridPt.y - start.y
        const rawLen = Math.sqrt(dx * dx + dy * dy)
        if (rawLen < 0.25) return
        if (e.evt.shiftKey) {
          const snapped = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          dx = rawLen * Math.cos(snapped)
          dy = rawLen * Math.sin(snapped)
        }
        const len = Math.sqrt(dx * dx + dy * dy)
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
        const end = { x: start.x + dx, y: start.y + dy }
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        placeRef.current('elec-circuit-wire', cx - len / 2, cy - CIRCUIT_WIRE_HEIGHT / 2, len, CIRCUIT_WIRE_HEIGHT, undefined, angleDeg)
        setCircuitWireStart(end)
      }
      return
    }

    // Clear selection on background click; exit group isolation if active
    if (e.target !== e.target.getStage()) {
      useStore.getState().exitGroup()
      clearSelection()
      return
    }
    useStore.getState().exitGroup()
    clearSelection()
  }, [getSnappedFeet, addDimension, clearSelection])

  const lastPolyClickTime = useRef(0)

  const handleDblClick = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    // Double-click is handled via timing in handleStageClick — nothing to do here
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPreviewPos(null); setDimCursor(null); setWallCursor(null); setDiagWallCursor(null)
    setPolyCursor(null); setArcWallCursor(null)
    wallSnapRef.current = null; setWallSnap(null)
    rectDrawRef.current = null; setRectDraw(null)
    if (cursorReadoutRef.current) cursorReadoutRef.current.style.display = 'none'
    // Sync stage transform to store so pan position is persisted
    const stage = stageRef.current
    if (stage) setStageTransform(stage.x(), stage.y(), stage.scaleX())
  }, [setStageTransform])

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

  const cursor = pickPointResolver || activeBloxId || activeTool === 'dimension' || activeTool === 'wall' || activeTool === 'rect' || activeTool === 'diagonal-wall' || activeTool === 'polygon' || activeTool === 'arc-wall' || activeTool === 'conduit' || activeTool === 'circuit-wire'
    ? 'crosshair'
    : activeTool === 'hand' || spaceHeld.current
    ? (isPanning.current ? 'grabbing' : 'grab')
    : 'default'

  // Polygon preview: all placed verts + cursor, with close-snap indicator
  const POLY_CLOSE_THRESHOLD_FT = 0.75
  const polyPreviewPts = activeTool === 'polygon' && polyVerts.length > 0 && polyCursor
    ? (() => {
        const cursor = polyCursor
        const first = polyVerts[0]
        const nearClose = polyVerts.length >= 3 && Math.hypot(cursor.x - first.x, cursor.y - first.y) < POLY_CLOSE_THRESHOLD_FT
        const tip = nearClose ? first : cursor
        return {
          pts: [...polyVerts, tip].flatMap(p => [p.x * pxPerFt, p.y * pxPerFt]),
          firstPx: { x: first.x * pxPerFt, y: first.y * pxPerFt },
          nearClose,
          vertDots: polyVerts.map(v => ({ x: v.x * pxPerFt, y: v.y * pxPerFt }))
        }
      })()
    : null

  const diagWallPreview = activeTool === 'diagonal-wall' && diagWallStart && diagWallCursor
    ? (() => {
        const dx = diagWallCursor.x - diagWallStart.x
        const dy = diagWallCursor.y - diagWallStart.y
        const lenFt = Math.sqrt(dx * dx + dy * dy)
        if (lenFt < 0.01) return null
        const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI)
        const t = WALL_THICKNESS[activeWallType] ?? 0.5
        const cx = (diagWallStart.x + diagWallCursor.x) / 2 * pxPerFt
        const cy = (diagWallStart.y + diagWallCursor.y) / 2 * pxPerFt
        const normalAngle = ((rawAngle % 180) + 180) % 180
        const dispAngle = Math.round(normalAngle > 90 ? 180 - normalAngle : normalAngle)
        return { cx, cy, lenPx: lenFt * pxPerFt, tPx: t * pxPerFt, angleDeg: rawAngle, lenFt, dispAngle }
      })()
    : null

  const diagWallStartDot = activeTool === 'diagonal-wall' && diagWallStart
    ? { x: diagWallStart.x * pxPerFt, y: diagWallStart.y * pxPerFt }
    : null

  const conduitPreview = activeTool === 'conduit' && conduitStart && conduitCursor
    ? (() => {
        const dx = conduitCursor.x - conduitStart.x
        const dy = conduitCursor.y - conduitStart.y
        const lenFt = Math.sqrt(dx * dx + dy * dy)
        if (lenFt < 0.01) return null
        const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI)
        const cx = (conduitStart.x + conduitCursor.x) / 2 * pxPerFt
        const cy = (conduitStart.y + conduitCursor.y) / 2 * pxPerFt
        const normalAngle = ((rawAngle % 180) + 180) % 180
        const dispAngle = Math.round(normalAngle > 90 ? 180 - normalAngle : normalAngle)
        return { cx, cy, lenPx: lenFt * pxPerFt, tPx: CONDUIT_THICKNESS * pxPerFt, angleDeg: rawAngle, lenFt, dispAngle }
      })()
    : null

  const conduitStartDot = activeTool === 'conduit' && conduitStart
    ? { x: conduitStart.x * pxPerFt, y: conduitStart.y * pxPerFt }
    : null

  const circuitWirePreview = activeTool === 'circuit-wire' && circuitWireStart && circuitWireCursor
    ? (() => {
        const dx = circuitWireCursor.x - circuitWireStart.x
        const dy = circuitWireCursor.y - circuitWireStart.y
        const lenFt = Math.sqrt(dx * dx + dy * dy)
        if (lenFt < 0.01) return null
        const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI)
        const cx = (circuitWireStart.x + circuitWireCursor.x) / 2 * pxPerFt
        const cy = (circuitWireStart.y + circuitWireCursor.y) / 2 * pxPerFt
        const normalAngle = ((rawAngle % 180) + 180) % 180
        const dispAngle = Math.round(normalAngle > 90 ? 180 - normalAngle : normalAngle)
        return { cx, cy, lenPx: lenFt * pxPerFt, tPx: CIRCUIT_WIRE_HEIGHT * pxPerFt, angleDeg: rawAngle, lenFt, dispAngle }
      })()
    : null

  const circuitWireStartDot = activeTool === 'circuit-wire' && circuitWireStart
    ? { x: circuitWireStart.x * pxPerFt, y: circuitWireStart.y * pxPerFt }
    : null

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
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <GridLayer pixelsPerFoot={pxPerFt} mode={project?.mode ?? 'floorplan'} />
        <UnderlayLayer pixelsPerFoot={pxPerFt} />
        <ArcWallLayer pixelsPerFoot={pxPerFt} />
        <WallOutlineLayer pixelsPerFoot={pxPerFt} phase="fill" />
        <ElementsLayer pixelsPerFoot={pxPerFt} snapFeet={scale.snapFeet} toolActive={activeTool} />
        <WallOutlineLayer pixelsPerFoot={pxPerFt} />
        <WallCornerLayer pixelsPerFoot={pxPerFt} snapFeet={scale.snapFeet} />
        <DimensionLayer
          dimensions={project.mode === 'detail' ? (project.detailDimensions ?? []) : resolveDimensions(project.dimensions,project.elements)}
          selectedDimIds={selectedDimIds}
          pixelsPerFoot={pxPerFt}
          mode={project.mode}
          onSelect={(id, multi) => selectDim(id, multi)}
          onOffsetDrag={(id, off) => updateDimension(id, { offset: off })}
          preview={
            activeTool === 'dimension' && dimStart && dimCursor
              ? { x1: dimStart.x, y1: dimStart.y, x2: dimCursor.x, y2: dimCursor.y }
              : undefined
          }
          previewOffset={DEFAULT_DIM_OFFSET}
        />
        {activeTool === 'dimension' && !dimStart && dimCursor && (
          <Layer listening={false}>
            <Group>
              <Circle x={dimCursor.x * pxPerFt} y={dimCursor.y * pxPerFt} radius={6} stroke="#4F9EFF" strokeWidth={1.5} />
              <Line points={[dimCursor.x * pxPerFt - 10, dimCursor.y * pxPerFt, dimCursor.x * pxPerFt + 10, dimCursor.y * pxPerFt]} stroke="#4F9EFF" strokeWidth={1} />
              <Line points={[dimCursor.x * pxPerFt, dimCursor.y * pxPerFt - 10, dimCursor.x * pxPerFt, dimCursor.y * pxPerFt + 10]} stroke="#4F9EFF" strokeWidth={1} />
            </Group>
          </Layer>
        )}
        {activeBloxId && previewPos && (
          <PreviewLayer
            bloxId={activeBloxId}
            xFeet={wallSnap ? wallSnap.x : previewPos.x}
            yFeet={wallSnap ? wallSnap.y : previewPos.y}
            pixelsPerFoot={pxPerFt}
            widthOverride={wallSnap?.widthOverride ?? pendingBloxWidth ?? undefined}
            heightOverride={wallSnap?.heightOverride}
            rotation={wallSnap?.rotation}
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
                    text={project.mode === 'detail' ? formatInches(lenFt) : formatFeet(lenFt)}
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

        {/* Diagonal wall preview */}
        {(diagWallPreview || diagWallStartDot) && (
          <Layer listening={false}>
            {diagWallPreview && (
              <>
                <Rect
                  x={diagWallPreview.cx}
                  y={diagWallPreview.cy}
                  width={diagWallPreview.lenPx}
                  height={diagWallPreview.tPx}
                  offsetX={diagWallPreview.lenPx / 2}
                  offsetY={diagWallPreview.tPx / 2}
                  rotation={diagWallPreview.angleDeg}
                  fill="rgba(60,60,60,0.45)"
                  stroke="#3C3C3C"
                  strokeWidth={1}
                />
                <KText
                  text={`${project.mode === 'detail' ? formatInches(diagWallPreview.lenFt) : formatFeet(diagWallPreview.lenFt)} @ ${diagWallPreview.dispAngle}°`}
                  x={diagWallPreview.cx}
                  y={diagWallPreview.cy - 20 / stageScale}
                  offsetX={30 / stageScale}
                  fontSize={Math.max(10, 13 / stageScale)}
                  fontFamily="sans-serif"
                  fill="#4F9EFF"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={2 / stageScale}
                  fillAfterStrokeEnabled
                  listening={false}
                />
              </>
            )}
            {diagWallStartDot && (
              <>
                <Line
                  points={[diagWallStartDot.x - 8 / stageScale, diagWallStartDot.y, diagWallStartDot.x + 8 / stageScale, diagWallStartDot.y]}
                  stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
                />
                <Line
                  points={[diagWallStartDot.x, diagWallStartDot.y - 8 / stageScale, diagWallStartDot.x, diagWallStartDot.y + 8 / stageScale]}
                  stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
                />
              </>
            )}
          </Layer>
        )}

        {/* Conduit preview — same mechanic as diagonal wall, electrical-gold to distinguish */}
        {(conduitPreview || conduitStartDot) && (
          <Layer listening={false}>
            {conduitPreview && (
              <>
                <Rect
                  x={conduitPreview.cx}
                  y={conduitPreview.cy}
                  width={conduitPreview.lenPx}
                  height={conduitPreview.tPx}
                  offsetX={conduitPreview.lenPx / 2}
                  offsetY={conduitPreview.tPx / 2}
                  rotation={conduitPreview.angleDeg}
                  fill="rgba(184,134,11,0.35)"
                  stroke="#B8860B"
                  strokeWidth={1}
                />
                <KText
                  text={`${project.mode === 'detail' ? formatInches(conduitPreview.lenFt) : formatFeet(conduitPreview.lenFt)} @ ${conduitPreview.dispAngle}°`}
                  x={conduitPreview.cx}
                  y={conduitPreview.cy - 20 / stageScale}
                  offsetX={30 / stageScale}
                  fontSize={Math.max(10, 13 / stageScale)}
                  fontFamily="sans-serif"
                  fill="#B8860B"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={2 / stageScale}
                  fillAfterStrokeEnabled
                  listening={false}
                />
              </>
            )}
            {conduitStartDot && (
              <>
                <Line
                  points={[conduitStartDot.x - 8 / stageScale, conduitStartDot.y, conduitStartDot.x + 8 / stageScale, conduitStartDot.y]}
                  stroke="#B8860B" strokeWidth={1.5 / stageScale}
                />
                <Line
                  points={[conduitStartDot.x, conduitStartDot.y - 8 / stageScale, conduitStartDot.x, conduitStartDot.y + 8 / stageScale]}
                  stroke="#B8860B" strokeWidth={1.5 / stageScale}
                />
              </>
            )}
          </Layer>
        )}

        {/* Circuit wire preview — curved dashed line, matching the placed-element render */}
        {(circuitWirePreview || circuitWireStartDot) && (
          <Layer listening={false}>
            {circuitWirePreview && (
              <Group
                x={circuitWirePreview.cx}
                y={circuitWirePreview.cy}
                rotation={circuitWirePreview.angleDeg}
              >
                <Shape
                  sceneFunc={(ctx, shape) => {
                    const halfLen = circuitWirePreview.lenPx / 2
                    const halfT = circuitWirePreview.tPx / 2
                    ctx.beginPath()
                    ctx.moveTo(-halfLen, halfT * 0.7)
                    ctx.quadraticCurveTo(0, -halfT, halfLen, halfT * 0.7)
                    ctx.strokeShape(shape)
                  }}
                  stroke="#B8860B"
                  strokeWidth={1.5 / stageScale}
                  dash={[6 / stageScale, 4 / stageScale]}
                />
                <KText
                  text={`${project.mode === 'detail' ? formatInches(circuitWirePreview.lenFt) : formatFeet(circuitWirePreview.lenFt)} @ ${circuitWirePreview.dispAngle}°`}
                  x={0}
                  y={-circuitWirePreview.tPx / 2 - 20 / stageScale}
                  offsetX={30 / stageScale}
                  fontSize={Math.max(10, 13 / stageScale)}
                  fontFamily="sans-serif"
                  fill="#B8860B"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={2 / stageScale}
                  fillAfterStrokeEnabled
                  listening={false}
                />
              </Group>
            )}
            {circuitWireStartDot && (
              <>
                <Line
                  points={[circuitWireStartDot.x - 8 / stageScale, circuitWireStartDot.y, circuitWireStartDot.x + 8 / stageScale, circuitWireStartDot.y]}
                  stroke="#B8860B" strokeWidth={1.5 / stageScale}
                />
                <Line
                  points={[circuitWireStartDot.x, circuitWireStartDot.y - 8 / stageScale, circuitWireStartDot.x, circuitWireStartDot.y + 8 / stageScale]}
                  stroke="#B8860B" strokeWidth={1.5 / stageScale}
                />
              </>
            )}
          </Layer>
        )}

        {/* Polygon draw preview */}
        {polyPreviewPts && (
          <Layer listening={false}>
            {/* Outline line through all verts + cursor */}
            <Line
              points={polyPreviewPts.pts}
              stroke="#3C3C3C"
              strokeWidth={1.5 / stageScale}
              dash={[6 / stageScale, 3 / stageScale]}
              listening={false}
            />
            {/* Close indicator: circle at first vertex when snapping to close */}
            <Circle
              x={polyPreviewPts.firstPx.x}
              y={polyPreviewPts.firstPx.y}
              radius={(polyPreviewPts.nearClose ? 8 : 4) / stageScale}
              stroke="#4F9EFF"
              strokeWidth={1.5 / stageScale}
              fill={polyPreviewPts.nearClose ? 'rgba(79,158,255,0.3)' : 'transparent'}
              listening={false}
            />
            {/* Vertex dots */}
            {polyPreviewPts.vertDots.slice(1).map((v, i) => (
              <Circle
                key={i}
                x={v.x} y={v.y}
                radius={3 / stageScale}
                fill="#4F9EFF"
                listening={false}
              />
            ))}
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
              text={`${project.mode === 'detail' ? formatInches(rectPreview.wFt) : formatFeet(rectPreview.wFt)} × ${project.mode === 'detail' ? formatInches(rectPreview.hFt) : formatFeet(rectPreview.hFt)}`}
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

        {/* Arc wall drawing preview */}
        {activeTool === 'arc-wall' && arcWallPhase > 0 && arcWallCenter && (
          <Layer listening={false}>
            {/* Center crosshair */}
            <Line
              points={[arcWallCenter.x * pxPerFt - 8 / stageScale, arcWallCenter.y * pxPerFt, arcWallCenter.x * pxPerFt + 8 / stageScale, arcWallCenter.y * pxPerFt]}
              stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
            />
            <Line
              points={[arcWallCenter.x * pxPerFt, arcWallCenter.y * pxPerFt - 8 / stageScale, arcWallCenter.x * pxPerFt, arcWallCenter.y * pxPerFt + 8 / stageScale]}
              stroke="#4F9EFF" strokeWidth={1.5 / stageScale}
            />

            {/* Phase 1: radius rubber-band line */}
            {arcWallPhase === 1 && arcWallCursor && (() => {
              const radiusFt = Math.hypot(arcWallCursor.x - arcWallCenter.x, arcWallCursor.y - arcWallCenter.y)
              return (
                <>
                  <Line
                    points={[arcWallCenter.x * pxPerFt, arcWallCenter.y * pxPerFt, arcWallCursor.x * pxPerFt, arcWallCursor.y * pxPerFt]}
                    stroke="#4F9EFF" strokeWidth={1 / stageScale} dash={[4 / stageScale, 2 / stageScale]}
                  />
                  <KText
                    text={`R = ${formatFeet(radiusFt)}`}
                    x={arcWallCursor.x * pxPerFt + 10 / stageScale}
                    y={arcWallCursor.y * pxPerFt - 8 / stageScale}
                    fontSize={Math.max(10, 12 / stageScale)}
                    fill="#4F9EFF"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={2 / stageScale}
                    fillAfterStrokeEnabled
                    listening={false}
                  />
                </>
              )
            })()}

            {/* Phase 2: arc wall shape preview */}
            {arcWallPhase === 2 && arcWallStart && arcWallCursor && (() => {
              const radius = Math.hypot(arcWallStart.x - arcWallCenter.x, arcWallStart.y - arcWallCenter.y)
              const startAngle = Math.atan2(arcWallStart.y - arcWallCenter.y, arcWallStart.x - arcWallCenter.x)
              const endAngle = Math.atan2(arcWallCursor.y - arcWallCenter.y, arcWallCursor.x - arcWallCenter.x)
              const outerR = (radius + 0.25) * pxPerFt
              const innerR = Math.max(0, (radius - 0.25) * pxPerFt)
              const cx = arcWallCenter.x * pxPerFt
              const cy = arcWallCenter.y * pxPerFt
              return (
                <>
                  <Circle
                    x={arcWallStart.x * pxPerFt} y={arcWallStart.y * pxPerFt}
                    radius={4 / stageScale} fill="#4F9EFF"
                  />
                  <Shape
                    sceneFunc={(ctx, shape) => {
                      ctx.beginPath()
                      ctx.arc(cx, cy, outerR, startAngle, endAngle, false)
                      ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
                      ctx.closePath()
                      ctx.fillStrokeShape(shape)
                    }}
                    fill="rgba(60,60,60,0.45)"
                    stroke="#3C3C3C"
                    strokeWidth={1}
                    listening={false}
                  />
                </>
              )
            })()}
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
        <PlanNotesLayer project={project} legend={useStore.getState().showLegend}/>
      </Stage>
      <ZoomControl stageScale={stageScale} onSetZoom={setZoomAbsolute} onFit={() => { void fitView() }} />
      <div
        ref={cursorReadoutRef}
        style={{
          display: 'none',
          position: 'absolute', bottom: 70, right: 18,
          background: 'rgba(0,0,0,0.72)', color: '#fff',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: 11, padding: '4px 8px', borderRadius: 4,
          pointerEvents: 'none', zIndex: 10, lineHeight: 1.5
        }}
      />
    </div>
  )
}
