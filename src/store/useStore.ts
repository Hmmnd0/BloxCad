import { create } from 'zustand'
import {coordinateOpeningTags,updateOpeningTag} from '../utils/openingTags'
import { v4 as uuid } from 'uuid'
import { Project, PlacedElement, DimensionLine, Scale, Tool, WallType, DrawingMode, SCALES, TitleBlock, ChecklistItem, Layer, ElementGroup, Underlay, UnderlayCalibration, ArcWall } from '../types'
import { getBloxById, WALL_BLOX_IDS } from '../blox/definitions'
import { getWallTrim } from '../utils/wallGraph'
import { attachDimension, resolveDimensions, wallOverallDimension } from '../utils/dimensionAnchors'
import { hostOpening, reconcileOpenings } from '../utils/hostedOpenings'
import { moveWallJunction, WallEnd, WallPoint } from '../utils/wallJunctions'

const LAYER_COLORS = ['#4F9EFF', '#2ECC71', '#E74C3C', '#F1C40F', '#9B59B6', '#E67E22', '#1ABC9C', '#95A5A6']
const DEFAULT_LAYER_ID = 'layer-default'

function makeDefaultLayer(): Layer {
  return { id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false, color: '#95A5A6' }
}

const MAX_HISTORY = 50
const MIN_WALL_SEGMENT = 0.1 // feet — shorter remnants are dropped

function splitWall(wall: PlacedElement, opening: PlacedElement): PlacedElement[] {
  const segs: PlacedElement[] = []
  const isHoriz = wall.width > wall.height

  if (isHoriz) {
    const leftW = opening.x - wall.x
    const rightX = opening.x + opening.width
    const rightW = (wall.x + wall.width) - rightX
    if (leftW >= MIN_WALL_SEGMENT)  segs.push({ ...wall, id: uuid(), width: leftW })
    if (rightW >= MIN_WALL_SEGMENT) segs.push({ ...wall, id: uuid(), x: rightX, width: rightW })
  } else {
    const topH = opening.y - wall.y
    const botY = opening.y + opening.height
    const botH = (wall.y + wall.height) - botY
    if (topH >= MIN_WALL_SEGMENT)  segs.push({ ...wall, id: uuid(), height: topH })
    if (botH >= MIN_WALL_SEGMENT)  segs.push({ ...wall, id: uuid(), y: botY, height: botH })
  }

  return segs
}

interface Clipboard {
  elements: PlacedElement[]
  dims: DimensionLine[]
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { category: 'Pre-Design',  text: 'Site survey received',                    checked: false },
  { category: 'Pre-Design',  text: 'Zoning and land use verified',             checked: false },
  { category: 'Pre-Design',  text: 'Client program requirements confirmed',    checked: false },
  { category: 'Design',      text: 'Schematic floor plan approved by client',  checked: false },
  { category: 'Design',      text: 'Plumbing chase locations confirmed',       checked: false },
  { category: 'Design',      text: 'HVAC routing coordinated',                 checked: false },
  { category: 'Documents',   text: 'All dimensions verified',                  checked: false },
  { category: 'Documents',   text: 'Door and window schedule complete',        checked: false },
  { category: 'Documents',   text: 'Wall types and materials noted',           checked: false },
  { category: 'Documents',   text: 'North arrow placed',                       checked: false },
  { category: 'Code',        text: 'Egress paths confirmed',                   checked: false },
  { category: 'Code',        text: 'ADA accessibility reviewed',               checked: false },
  { category: 'Code',        text: 'Fire rating requirements noted',           checked: false },
]

function makeDefaultChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map(item => ({ ...item, id: uuid() }))
}

interface AppState {
  project: Project | null
  activeTool: Tool
  activeWallType: WallType
  activeBloxId: string | null
  selectedElementIds: string[]
  selectedDimIds: string[]
  showNewProjectDialog: boolean
  showDRCPanel: boolean
  showCodeRefPanel: boolean
  showTitleBlock: boolean
  showLegend: boolean
  showUnderlayPanel: boolean
  underlayCalibrationMode: 'none' | 'two-point-picking'
  underlayCalibrationPoints: { x: number; y: number }[]
  underlayCalibrationReferenceFt: number | null
  stageX: number
  stageY: number
  stageScale: number
  isDirty: boolean
  past: Project[]
  future: Project[]
  clipboard: Clipboard | null
  pendingBloxWidth: number | null
  activeLayerId: string
  snapModuleFt: number | null
  activeGroupId: string | null
  selectedArcWallIds: string[]

  createProject: (name: string, scale: Scale, mode?: DrawingMode) => void
  setDrawingMode: (mode: DrawingMode) => void
  loadProject: (project: Project, savedStageX?: number, savedStageY?: number, savedStageScale?: number) => void
  placeElement: (bloxId: string, xFeet: number, yFeet: number, widthOverride?: number, heightOverride?: number, snapWallId?: string, initialRotation?: number) => void
  updateElement: (id: string, updates: Partial<PlacedElement>) => void
  moveElements: (moves: { id: string; x: number; y: number }[]) => void
  moveWallCorner: (id: string, end: WallEnd, target: WallPoint) => string | null
  deleteSelectedElements: () => void
  selectElement: (id: string, addToSelection?: boolean) => void
  clearSelection: () => void
  setActiveBlox: (bloxId: string | null) => void
  setActiveTool: (tool: Tool) => void
  setActiveWallType: (type: WallType) => void
  setStageTransform: (x: number, y: number, scale: number) => void
  setShowNewProjectDialog: (show: boolean) => void
  setShowDRCPanel: (show: boolean) => void
  setShowTitleBlock: (show: boolean) => void
  setShowLegend: (show: boolean) => void
  setShowUnderlayPanel: (show: boolean) => void
  setUnderlay: (u: Underlay) => void
  clearUnderlay: () => void
  setUnderlayOpacity: (opacity: number) => void
  setUnderlayVisible: (visible: boolean) => void
  setUnderlayCalibration: (cal: UnderlayCalibration | null) => void
  setUnderlayDescription: (description: string) => void
  setElevationDatum: (name: string, elevationFt: number) => void
  startUnderlayCalibration: (referenceFt?: number) => void
  addUnderlayCalibrationPoint: (pt: { x: number; y: number }) => void
  cancelUnderlayCalibration: () => void
  updateTitleBlock: (updates: Partial<TitleBlock>) => void
  updatePermitData: (data: NonNullable<Project['permitData']>) => void
  setZoningSetback: (which: 'front' | 'side' | 'rear', ft: number) => void
  setShowCodeRefPanel: (show: boolean) => void
  setPendingBloxWidth: (w: number | null) => void
  autoDimSelected: (direction: 'up' | 'down' | 'left' | 'right') => void
  rotateSelected: (degrees: number) => void
  alignSelected: (axis: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => void
  distributeSelected: (direction: 'h' | 'v') => void
  addLayer: (name?: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  deleteLayer: (id: string) => void
  setActiveLayer: (id: string) => void
  setElementsLayer: (elementIds: string[], layerId: string) => void
  resetView: () => void
  addDimension: (dim: Omit<DimensionLine, 'id'>) => void
  updateDimension: (id: string, updates: Partial<DimensionLine>) => void
  deleteSelectedDims: () => void
  selectDim: (id: string, addToSelection?: boolean) => void
  selectMany: (elementIds: string[], dimIds?: string[]) => void
  nudgeSelected: (dx: number, dy: number) => void
  undo: () => void
  redo: () => void
  copySelected: () => void
  pasteClipboard: () => void
  duplicateSelected: () => void
  toggleChecklistItem: (id: string) => void
  addChecklistItem: (text: string, category: string) => void
  removeChecklistItem: (id: string) => void
  cloneElementAt: (id: string, x: number, y: number) => void
  setSnapModule: (ft: number | null) => void
  mirrorSelected: (axis: 'h' | 'v') => void
  placePolygon: (verts: { x: number; y: number }[]) => void
  batchPlaceElements: (placements: Array<{ id: string; bloxId: string; x: number; y: number; width?: number; height?: number; rotation?: number; properties?: Record<string, unknown> }>) => void
  groupSelected: () => void
  ungroupSelected: () => void
  enterGroup: (groupId: string) => void
  exitGroup: () => void
  isolateElement: (id: string) => void
  renameGroup: (groupId: string, name: string) => void
  placeArcWall: (arcWall: Omit<ArcWall, 'id'>) => void
  updateArcWall: (id: string, updates: Partial<ArcWall>) => void
  deleteSelectedArcWalls: () => void
  selectArcWall: (id: string, add?: boolean) => void
  splitWallsForOpenings: (openingIds: string[]) => void
  pickPointResolver: ((pt: { x: number; y: number }) => void) | null
  setPendingPickPoint: (resolver: (pt: { x: number; y: number }) => void) => void
  clearPendingPickPoint: () => void
  autoCallout: () => void
  lastPlacedBloxId: string | null
  clearLastPlaced: () => void
}

function pushToHistory(past: Project[], project: Project): Project[] {
  return [...past.slice(-(MAX_HISTORY - 1)), project]
}

// Route element/dimension access to the active drawing mode's arrays
function getElements(project: Project): PlacedElement[] {
  return project.mode === 'detail' ? (project.detailElements ?? []) : project.elements
}
function setElements(project: Project, els: PlacedElement[]): Project {
  els=coordinateOpeningTags(els)
  if (project.mode === 'detail') return { ...project, detailElements: els }
  const elements = reconcileOpenings(project.elements, els)
  return { ...project, elements, dimensions: resolveDimensions(project.dimensions.map(d=>attachDimension(d,project.elements)),elements) }
}
function getDims(project: Project): DimensionLine[] {
  return project.mode === 'detail' ? (project.detailDimensions ?? []) : project.dimensions
}
function setDims(project: Project, dims: DimensionLine[]): Project {
  if (project.mode === 'detail') return { ...project, detailDimensions: dims }
  return { ...project, dimensions: dims }
}

export const useStore = create<AppState>((set, get) => ({
  project: null,
  activeTool: 'select',
  activeWallType: 'wall-exterior',
  activeBloxId: null,
  selectedElementIds: [],
  selectedDimIds: [],
  showNewProjectDialog: true,
  showDRCPanel: false,
  showCodeRefPanel: false,
  showTitleBlock: false,
  showLegend: true,
  showUnderlayPanel: false,
  underlayCalibrationMode: 'none',
  underlayCalibrationPoints: [],
  underlayCalibrationReferenceFt: null,
  stageX: 60,
  stageY: 60,
  stageScale: 1,
  isDirty: false,
  past: [],
  future: [],
  clipboard: null,
  pendingBloxWidth: null,
  activeLayerId: DEFAULT_LAYER_ID,
  snapModuleFt: null,
  activeGroupId: null,
  selectedArcWallIds: [],
  pickPointResolver: null,
  lastPlacedBloxId: null,

  createProject: (name, scale, mode = 'floorplan') => {
    const project: Project = { id: uuid(), name, scale, mode, elements: [], dimensions: [], detailElements: [], detailDimensions: [], checklist: makeDefaultChecklist(), layers: [makeDefaultLayer()], groups: [], arcWalls: [] }
    set({ project, showNewProjectDialog: false, isDirty: false, stageX: 60, stageY: 60, stageScale: 1, past: [], future: [], activeLayerId: DEFAULT_LAYER_ID, activeGroupId: null })
  },

  setDrawingMode: (mode) => {
    const { project, activeTool } = get()
    if (!project) return
    const wallTools = new Set(['wall', 'diagonal-wall', 'arc-wall', 'conduit', 'circuit-wire'])
    const tool = (mode === 'elevation' || mode === 'detail') && wallTools.has(activeTool) ? 'select' : activeTool
    set({ project: { ...project, mode }, activeTool: tool, isDirty: true })
  },

  loadProject: (project, savedStageX?, savedStageY?, savedStageScale?) => {
    const defaultLayer = makeDefaultLayer()
    const p = {
      ...project,
      dimensions: project.dimensions ?? [],
      detailElements: project.detailElements ?? [],
      detailDimensions: project.detailDimensions ?? [],
      checklist: project.checklist ?? makeDefaultChecklist(),
      layers: project.layers ?? [defaultLayer],
      groups: project.groups ?? [],
      arcWalls: project.arcWalls ?? []
    }
    const firstLayerId = p.layers[0]?.id ?? DEFAULT_LAYER_ID
    set({ project: p, showNewProjectDialog: false, isDirty: false, stageX: savedStageX ?? 60, stageY: savedStageY ?? 60, stageScale: savedStageScale ?? 1, past: [], future: [], activeLayerId: firstLayerId, activeGroupId: null })
  },

  placeElement: (bloxId, xFeet, yFeet, widthOverride, heightOverride, snapWallId?, initialRotation = 0) => {
    const { project, past, activeLayerId } = get()
    if (!project) return
    const def = getBloxById(bloxId)
    if (!def) return
    const w = widthOverride ?? def.defaultWidth
    const h = heightOverride ?? def.defaultHeight
    const autoProps: Record<string, unknown> = {}
    // Stairs elevation: auto-compute step count from width (11" standard tread)
    if (bloxId === 'stairs-elevation') {
      autoProps.stepCount = Math.max(3, Math.min(24, Math.round(w / (11 / 12))))
    }
    // Multi-pane window: auto-compute pane count from width (~1 pane per 2ft)
    if (bloxId === 'window-multi') {
      autoProps.paneCount = Math.max(1, Math.min(12, Math.round(w / 2)))
    }
    let element: PlacedElement = {
      id: uuid(), bloxId, x: xFeet, y: yFeet,
      width: w, height: h,
      rotation: initialRotation, properties: autoProps, locked: false,
      layerId: activeLayerId
    }
    let elements = getElements(project)
    if (snapWallId && project.mode !== 'detail') {
      const wall = elements.find(el => el.id === snapWallId)
      if (wall) {
        if (wall.locked || project.layers?.some(l => l.id === wall.layerId && l.locked)) return
        element = hostOpening(element, wall)
      }
    }
    set({
      project: setElements(project, [...elements, element]),
      selectedElementIds: [element.id],
      lastPlacedBloxId: bloxId,
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  moveWallCorner: (id, end, target) => {
    const { project, past } = get()
    if (!project || project.mode === 'detail') return 'Corner editing is available in plan view.'
    try {
      const elements = moveWallJunction(project.elements, project.layers ?? [], id, end, target)
      if (elements === project.elements) return null
      set({ project: { ...project, elements, dimensions:resolveDimensions(project.dimensions,elements) }, past: pushToHistory(past, project), future: [], isDirty: true })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Unable to move this corner.'
    }
  },

  moveElements: (moves) => {
    const { project, past } = get()
    if (!project) return
    const elements = getElements(project)
    const locked = (el: PlacedElement) => el.locked || project.layers?.some(l => l.id === el.layerId && l.locked)
    const updates = new Map(moves.map(move => [move.id, move]))
    const next = elements.map(el => {
      const move = updates.get(el.id)
      const host = el.wallHost && elements.find(w => w.id === el.wallHost?.wallId)
      if (!move || locked(el) || (host && locked(host))) return el
      return { ...el, x: move.x, y: move.y }
    })
    if (next.every((el, i) => el === elements[i])) return
    set({ project: setElements(project, next), past: pushToHistory(past, project), future: [], isDirty: true })
  },

  updateElement: (id, updates) => {
    const { project, past } = get()
    if (!project) return
    const current = getElements(project).find(el => el.id === id)
    if (!current) return
    const host = current.wallHost && getElements(project).find(el => el.id === current.wallHost?.wallId)
    if (project.layers?.some(l => l.locked && (l.id === current.layerId || l.id === host?.layerId))) return
    if (host?.locked || (current.locked && updates.locked !== false)) return
    set({
      project: setElements(project, updateOpeningTag(getElements(project),id,updates,el=>el.locked||!!project.layers?.some(l=>l.id===el.layerId&&l.locked))),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  deleteSelectedElements: () => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    const remaining = getElements(project).filter(el => !selectedElementIds.includes(el.id) ||
      el.locked || project.layers?.some(l => l.id === el.layerId && l.locked))
    const usedGroupIds = new Set(remaining.map(el => el.groupId).filter(Boolean) as string[])
    const newProject: Project = {
      ...setElements(project, remaining),
      groups: (project.groups ?? []).filter(g => usedGroupIds.has(g.id))
    }
    set({ project: newProject, selectedElementIds: [], past: pushToHistory(past, project), future: [], isDirty: true })
  },

  selectElement: (id, addToSelection = false) => {
    const { selectedElementIds, project, activeGroupId } = get()
    // In normal mode, clicking a group member selects the whole group
    if (!addToSelection && project) {
      const el = getElements(project).find(e => e.id === id)
      if (el?.groupId && activeGroupId === null) {
        const members = getElements(project).filter(e => e.groupId === el.groupId).map(e => e.id)
        set({ selectedElementIds: members, selectedDimIds: [] })
        return
      }
    }
    if (addToSelection) {
      set({
        selectedElementIds: selectedElementIds.includes(id)
          ? selectedElementIds.filter(i => i !== id)
          : [...selectedElementIds, id]
      })
    } else {
      set({ selectedElementIds: [id], selectedDimIds: [] })
    }
  },

  clearSelection: () => set({ selectedElementIds: [], selectedDimIds: [], selectedArcWallIds: [] }),

  addDimension: (dim) => {
    const { project, past } = get()
    if (!project) return
    const full: DimensionLine = project.mode==='detail'?{...dim,id:uuid()}:attachDimension({...dim,id:uuid()},getElements(project).filter(e=>!project.layers?.some(l=>l.id===e.layerId&&!l.visible)))
    set({
      project: setDims(project, [...getDims(project), full]),
      selectedDimIds: [full.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  updateDimension: (id, updates) => {
    const { project, past } = get()
    if (!project) return
    set({
      project: setDims(project, getDims(project).map(d => d.id === id ? { ...d, ...updates } : d)),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  deleteSelectedDims: () => {
    const { project, selectedDimIds, past } = get()
    if (!project || selectedDimIds.length === 0) return
    set({
      project: setDims(project, getDims(project).filter(d => !selectedDimIds.includes(d.id))),
      selectedDimIds: [],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  selectDim: (id, addToSelection = false) => {
    const { selectedDimIds } = get()
    set({
      selectedElementIds: [],
      selectedDimIds: addToSelection
        ? selectedDimIds.includes(id) ? selectedDimIds.filter(i => i !== id) : [...selectedDimIds, id]
        : [id]
    })
  },

  selectMany: (elementIds, dimIds = []) => {
    set({ selectedElementIds: elementIds, selectedDimIds: dimIds })
  },

  setActiveBlox: (bloxId) => set({ activeBloxId: bloxId, activeTool: 'select', pendingBloxWidth: null }),
  setPendingBloxWidth: (w) => set({ pendingBloxWidth: w }),
  setActiveTool: (tool) => set({ activeTool: tool, activeBloxId: null }),
  setActiveWallType: (type) => set({ activeWallType: type, activeTool: 'wall', activeBloxId: null }),
  setStageTransform: (x, y, scale) => set({ stageX: x, stageY: y, stageScale: scale }),
  setShowNewProjectDialog: (show) => set({ showNewProjectDialog: show }),
  setShowDRCPanel: (show) => set({ showDRCPanel: show }),
  setShowCodeRefPanel: (show) => set({ showCodeRefPanel: show }),
  setShowTitleBlock: (show) => set({ showTitleBlock: show }),
  setShowLegend: (show) => set({ showLegend: show }),
  setShowUnderlayPanel: (show) => set({ showUnderlayPanel: show }),

  setUnderlay: (u) => {
    const { project } = get()
    if (!project) return
    set({ project: { ...project, underlay: u }, isDirty: true })
  },
  clearUnderlay: () => {
    const { project } = get()
    if (!project) return
    const { underlay: _u, ...rest } = project
    set({ project: rest as Project, isDirty: true })
  },
  setUnderlayOpacity: (opacity) => {
    const { project } = get()
    if (!project?.underlay) return
    set({ project: { ...project, underlay: { ...project.underlay, opacity } }, isDirty: true })
  },
  setUnderlayVisible: (visible) => {
    const { project } = get()
    if (!project?.underlay) return
    set({ project: { ...project, underlay: { ...project.underlay, visible } }, isDirty: true })
  },
  setUnderlayCalibration: (cal) => {
    const { project } = get()
    if (!project?.underlay) return
    set({ project: { ...project, underlay: { ...project.underlay, calibration: cal } }, isDirty: true })
  },
  setUnderlayDescription: (description) => {
    const { project } = get()
    if (!project?.underlay) return
    set({ project: { ...project, underlay: { ...project.underlay, description } }, isDirty: true })
  },
  setElevationDatum: (name, elevationFt) => {
    const {project}=get(); if(!project||!name.trim()||!Number.isFinite(elevationFt)) return
    set({project:{...project,elevationDatums:{...(project.elevationDatums??{}),[name.trim()]:elevationFt}},isDirty:true})
  },
  startUnderlayCalibration: (referenceFt) => set({ underlayCalibrationMode: 'two-point-picking', underlayCalibrationPoints: [], underlayCalibrationReferenceFt: referenceFt ?? null }),
  addUnderlayCalibrationPoint: (pt) => {
    const s = get()
    const points = [...s.underlayCalibrationPoints, pt]
    if (points.length >= 2 && s.underlayCalibrationReferenceFt && s.project?.underlay) {
      set({
        project: { ...s.project, underlay: { ...s.project.underlay, calibration: { method: 'two-point', p1px: points[0], p2px: points[1], realDistFt: s.underlayCalibrationReferenceFt } } },
        underlayCalibrationMode: 'none', underlayCalibrationPoints: [], underlayCalibrationReferenceFt: null, isDirty: true
      })
    } else set({ underlayCalibrationPoints: points })
  },
  cancelUnderlayCalibration: () => set({ underlayCalibrationMode: 'none', underlayCalibrationPoints: [], underlayCalibrationReferenceFt: null }),

  updateTitleBlock: (updates) => {
    const { project } = get()
    if (!project) return
    const existing: TitleBlock = project.titleBlock ?? {
      address: '', drawingTitle: 'Floor Plan', drawnBy: '', checkedBy: '',
      projectDate: new Date().toLocaleDateString(), sheetNumber: 'A1.1', jobNumber: ''
    }
    set({ project: { ...project, titleBlock: { ...existing, ...updates } }, isDirty: true })
  },
  updatePermitData: (permitData) => {
    const {project,past}=get()
    if(!project)return
    set({project:{...project,permitData},past:pushToHistory(past,project),future:[],isDirty:true})
  },

  setZoningSetback: (which, ft) => {
    const { project } = get()
    if (!project) return
    const current = project.zoningSetbacks ?? {
      front: project.zoningSetbackFt ?? 10,
      side: project.zoningSetbackFt ?? 10,
      rear: project.zoningSetbackFt ?? 10,
    }
    set({ project: { ...project, zoningSetbacks: { ...current, [which]: ft } }, isDirty: true })
  },

  autoDimSelected: (direction) => {
    const { project, selectedElementIds, past } = get()
    if (!project || !selectedElementIds.length) return
    const overall=project.mode!=='detail'?wallOverallDimension(getElements(project).filter(e=>!project.layers?.some(l=>l.id===e.layerId&&!l.visible)),selectedElementIds,direction):undefined
    if(overall) {
      const dim={...overall,id:uuid()}
      set({project:setDims(project,[...getDims(project),dim]),past:pushToHistory(past,project),future:[],isDirty:true})
      return
    }
    if(selectedElementIds.length!==1) return
    const el = getElements(project).find(e => e.id === selectedElementIds[0])
    if (!el) return

    // Walls are stored extended by half their own thickness past both ends
    // unconditionally (so corners overlap correctly) — trim that back off
    // before dimensioning so a wall drawn as 20'-0" calls out as 20'-0", not
    // 20'-6". Only the wall's LENGTH axis is affected; its thickness axis
    // (the short dimension) was never part of the corner overlap.
    let x = el.x, y = el.y, w = el.width, h = el.height
    if (WALL_BLOX_IDS.has(el.bloxId)) {
      const isHoriz = el.width >= el.height
      const lengthAxisSelected = isHoriz ? (direction === 'up' || direction === 'down') : (direction === 'left' || direction === 'right')
      if (lengthAxisSelected) {
        const { startTrim, endTrim } = getWallTrim(el)
        if (isHoriz) { x += startTrim; w -= startTrim + endTrim }
        else { y += startTrim; h -= startTrim + endTrim }
      }
    }

    let dim: DimensionLine | null = null
    if (direction === 'up')    dim = { id: uuid(), x1: x, y1: y, x2: x + w, y2: y, offset: 1.5 }
    if (direction === 'down')  dim = { id: uuid(), x1: x, y1: y + h, x2: x + w, y2: y + h, offset: -1.5 }
    if (direction === 'left')  dim = { id: uuid(), x1: x, y1: y, x2: x, y2: y + h, offset: 1.5 }
    if (direction === 'right') dim = { id: uuid(), x1: x + w, y1: y, x2: x + w, y2: y + h, offset: -1.5 }
    if (!dim) return
    set({
      project: setDims(project, [...getDims(project), dim]),
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  rotateSelected: (degrees) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    set({
      project: setElements(project, getElements(project).map(el => {
          if (!selectedElementIds.includes(el.id)) return el
          const raw = (el.rotation + degrees) % 360
          const newRot = raw < 0 ? raw + 360 : raw

          // With offsetX/offsetY rendering, center is always (el.x + hw, el.y + hh)
          const hw = el.width / 2, hh = el.height / 2

          // On 90°/270°: swap width↔height for linear elements only (walls, detail strips).
          // Directional symbols preserve their rotation so their renderer gets correct proportions.
          const isLinear = el.bloxId.startsWith('wall-') ||
            (el.bloxId.startsWith('detail-') &&
              el.bloxId !== 'detail-rafter' &&
              el.bloxId !== 'detail-pitched-layer') ||
            el.bloxId === 'insulation-batt'
          if ((newRot === 90 || newRot === 270) && isLinear) {
            const newW = el.height, newH = el.width
            const cx = el.x + hw, cy = el.y + hh
            return { ...el, x: cx - newW / 2, y: cy - newH / 2, width: newW, height: newH, rotation: 0 }
          }

          // Other angles: just update rotation — center stays at (el.x + hw, el.y + hh)
          return { ...el, rotation: newRot }
        })),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  alignSelected: (axis) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length < 2) return
    const els = getElements(project).filter(el => selectedElementIds.includes(el.id) && !el.locked)
    if (els.length < 2) return
    const updated = els.map(el => {
      if (axis === 'left')    return { ...el, x: Math.min(...els.map(e => e.x)) }
      if (axis === 'right')   return { ...el, x: Math.max(...els.map(e => e.x + e.width)) - el.width }
      if (axis === 'top')     return { ...el, y: Math.min(...els.map(e => e.y)) }
      if (axis === 'bottom')  return { ...el, y: Math.max(...els.map(e => e.y + e.height)) - el.height }
      if (axis === 'centerH') {
        const cx = els.reduce((s, e) => s + e.x + e.width / 2, 0) / els.length
        return { ...el, x: cx - el.width / 2 }
      }
      // centerV
      const cy = els.reduce((s, e) => s + e.y + e.height / 2, 0) / els.length
      return { ...el, y: cy - el.height / 2 }
    })
    const map = new Map(updated.map(e => [e.id, e]))
    set({
      project: setElements(project, getElements(project).map(el => map.get(el.id) ?? el)),
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  distributeSelected: (direction) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length < 3) return
    const els = getElements(project).filter(el => selectedElementIds.includes(el.id) && !el.locked)
    if (els.length < 3) return
    let updated: PlacedElement[]
    if (direction === 'h') {
      const sorted = [...els].sort((a, b) => a.x - b.x)
      const totalW = sorted.reduce((s, e) => s + e.width, 0)
      const span = (sorted[sorted.length - 1].x + sorted[sorted.length - 1].width) - sorted[0].x
      const gap = (span - totalW) / (sorted.length - 1)
      let curX = sorted[0].x
      updated = sorted.map((el, i) => { const x = i === 0 ? el.x : curX; curX = x + el.width + gap; return { ...el, x } })
    } else {
      const sorted = [...els].sort((a, b) => a.y - b.y)
      const totalH = sorted.reduce((s, e) => s + e.height, 0)
      const span = (sorted[sorted.length - 1].y + sorted[sorted.length - 1].height) - sorted[0].y
      const gap = (span - totalH) / (sorted.length - 1)
      let curY = sorted[0].y
      updated = sorted.map((el, i) => { const y = i === 0 ? el.y : curY; curY = y + el.height + gap; return { ...el, y } })
    }
    const map = new Map(updated.map(e => [e.id, e]))
    set({
      project: setElements(project, getElements(project).map(el => map.get(el.id) ?? el)),
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  addLayer: (name) => {
    const { project } = get()
    if (!project) return
    const layers = project.layers ?? [makeDefaultLayer()]
    const color = LAYER_COLORS[layers.length % LAYER_COLORS.length]
    const newLayer: Layer = { id: uuid(), name: name ?? `Layer ${layers.length}`, visible: true, locked: false, color }
    set({ project: { ...project, layers: [...layers, newLayer] }, activeLayerId: newLayer.id, isDirty: true })
  },

  updateLayer: (id, updates) => {
    const { project } = get()
    if (!project) return
    const layers = (project.layers ?? [makeDefaultLayer()]).map(l => l.id === id ? { ...l, ...updates } : l)
    set({ project: { ...project, layers }, isDirty: true })
  },

  deleteLayer: (id) => {
    const { project, activeLayerId } = get()
    if (!project || id === DEFAULT_LAYER_ID) return
    const layers = (project.layers ?? []).filter(l => l.id !== id)
    const elements = project.elements.map(el => el.layerId === id ? { ...el, layerId: DEFAULT_LAYER_ID } : el)
    const detailElements = (project.detailElements ?? []).map(el => el.layerId === id ? { ...el, layerId: DEFAULT_LAYER_ID } : el)
    const arcWalls = (project.arcWalls ?? []).map(w => w.layerId === id ? { ...w, layerId: DEFAULT_LAYER_ID } : w)
    set({
      project: { ...project, layers, elements, detailElements, arcWalls },
      activeLayerId: activeLayerId === id ? DEFAULT_LAYER_ID : activeLayerId,
      isDirty: true
    })
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  setElementsLayer: (elementIds, layerId) => {
    const { project, past } = get()
    if (!project) return
    set({
      project: setElements(project, getElements(project).map(el => elementIds.includes(el.id) ? { ...el, layerId } : el)),
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  resetView: () => set({ stageX: 60, stageY: 60, stageScale: 1 }),

  undo: () => {
    const { past, future, project } = get()
    if (past.length === 0) return
    const prev = past[past.length - 1]
    set({
      project: prev,
      past: past.slice(0, -1),
      future: project ? [project, ...future].slice(0, MAX_HISTORY) : future,
      selectedElementIds: [],
      selectedDimIds: [],
      selectedArcWallIds: [],
      isDirty: true
    })
  },

  redo: () => {
    const { past, future, project } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      project: next,
      past: project ? [...past, project].slice(-MAX_HISTORY) : past,
      future: future.slice(1),
      selectedElementIds: [],
      selectedDimIds: [],
      selectedArcWallIds: [],
      isDirty: true
    })
  },

  copySelected: () => {
    const { project, selectedElementIds, selectedDimIds } = get()
    if (!project) return
    const elements = getElements(project).filter(el => selectedElementIds.includes(el.id))
    const dims = getDims(project).filter(d => selectedDimIds.includes(d.id))
    if (elements.length === 0 && dims.length === 0) return
    set({ clipboard: { elements, dims } })
  },

  pasteClipboard: () => {
    const { project, clipboard, past } = get()
    if (!project || !clipboard) return
    const PASTE_OFFSET = 1
    // Remap groupIds so pasted groups get fresh IDs
    const groupIdMap = new Map<string, string>()
    const elementIdMap = new Map(clipboard.elements.map(el => [el.id, uuid()]))
    const newElements = clipboard.elements.map(el => {
      let newGroupId = el.groupId
      if (el.groupId) {
        if (!groupIdMap.has(el.groupId)) groupIdMap.set(el.groupId, uuid())
        newGroupId = groupIdMap.get(el.groupId)
      }
      const wallHost = el.wallHost && elementIdMap.has(el.wallHost.wallId)
        ? { ...el.wallHost, wallId: elementIdMap.get(el.wallHost.wallId)! } : undefined
      const targetId = el.properties.targetId
      const properties = typeof targetId === 'string' && elementIdMap.has(targetId)
        ? { ...el.properties, targetId: elementIdMap.get(targetId)! } : { ...el.properties }
      return { ...el, properties, id: elementIdMap.get(el.id)!, x: el.x + PASTE_OFFSET, y: el.y + PASTE_OFFSET, groupId: newGroupId, wallHost }
    })
    const newDims = clipboard.dims.map(d => ({
      ...d, id: uuid(),
      x1: d.x1 + PASTE_OFFSET, y1: d.y1 + PASTE_OFFSET,
      x2: d.x2 + PASTE_OFFSET, y2: d.y2 + PASTE_OFFSET
    }))
    const pastedGroups: ElementGroup[] = Array.from(groupIdMap.entries()).map(([oldId, newId]) => {
      const existing = (project.groups ?? []).find(g => g.id === oldId)
      return { id: newId, name: existing?.name ?? 'Group' }
    })
    const p1 = setElements(project, [...getElements(project), ...newElements])
    const p2: Project = { ...setDims(p1, [...getDims(p1), ...newDims]), groups: [...(project.groups ?? []), ...pastedGroups] }
    set({
      project: p2,
      selectedElementIds: newElements.map(el => el.id),
      selectedDimIds: newDims.map(d => d.id),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  duplicateSelected: () => {
    get().copySelected()
    get().pasteClipboard()
  },

  nudgeSelected: (dx, dy) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    set({
      project: setElements(project, getElements(project).map(el =>
        selectedElementIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
      )),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  toggleChecklistItem: (id) => {
    const { project } = get()
    if (!project) return
    set({
      project: {
        ...project,
        checklist: (project.checklist ?? []).map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      },
      isDirty: true
    })
  },

  addChecklistItem: (text, category) => {
    const { project } = get()
    if (!project) return
    const newItem: ChecklistItem = { id: uuid(), text, checked: false, category }
    set({ project: { ...project, checklist: [...(project.checklist ?? []), newItem] }, isDirty: true })
  },

  removeChecklistItem: (id) => {
    const { project } = get()
    if (!project) return
    set({ project: { ...project, checklist: (project.checklist ?? []).filter(item => item.id !== id) }, isDirty: true })
  },

  cloneElementAt: (id, x, y) => {
    const { project, past } = get()
    if (!project) return
    const el = getElements(project).find(e => e.id === id)
    if (!el) return
    const copy: PlacedElement = { ...el, id: uuid(), x, y, wallHost: undefined }
    set({
      project: setElements(project, [...getElements(project), copy]),
      selectedElementIds: [copy.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  setSnapModule: (ft) => set({ snapModuleFt: ft }),

  batchPlaceElements: (placements) => {
    const { project, past, activeLayerId } = get()
    if (!project || placements.length === 0) return
    const newEls: PlacedElement[] = []
    for (const p of placements) {
      const def = getBloxById(p.bloxId)
      if (!def) continue
      const w = p.width ?? def.defaultWidth
      const h = p.height ?? def.defaultHeight
      const autoProps: Record<string, unknown> = {}
      if (p.bloxId === 'stairs-elevation') autoProps.stepCount = Math.max(3, Math.min(24, Math.round(w / (11 / 12))))
      if (p.bloxId === 'window-multi') autoProps.paneCount = Math.max(1, Math.min(12, Math.round(w / 2)))
      newEls.push({ id: p.id, bloxId: p.bloxId, x: p.x, y: p.y, width: w, height: h, rotation: p.rotation ?? 0, properties: { ...autoProps, ...(p.properties ?? {}) }, locked: false, layerId: activeLayerId })
    }
    if (newEls.length === 0) return
    set({ project: setElements(project, [...getElements(project), ...newEls]), selectedElementIds: newEls.map(e => e.id), past: pushToHistory(past, project), future: [], isDirty: true })
  },

  placePolygon: (verts) => {
    const { project, past, activeLayerId } = get()
    if (!project || verts.length < 3) return
    const xs = verts.map(v => v.x)
    const ys = verts.map(v => v.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const w = maxX - minX
    const h = maxY - minY
    if (w < 0.1 || h < 0.1) return
    const points = verts.map(v => ({ x: (v.x - minX) / w, y: (v.y - minY) / h }))
    const element: PlacedElement = {
      id: uuid(), bloxId: 'shape-polygon',
      x: minX, y: minY, width: w, height: h,
      rotation: 0, properties: { points }, locked: false, layerId: activeLayerId
    }
    set({
      project: setElements(project, [...getElements(project), element]),
      selectedElementIds: [element.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  mirrorSelected: (axis) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    const selected = getElements(project).filter(el => selectedElementIds.includes(el.id))
    if (selected.length === 0) return
    const minX = Math.min(...selected.map(el => el.x))
    const maxX = Math.max(...selected.map(el => el.x + el.width))
    const minY = Math.min(...selected.map(el => el.y))
    const maxY = Math.max(...selected.map(el => el.y + el.height))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const updated = getElements(project).map(el => {
      if (!selectedElementIds.includes(el.id)) return el
      if (axis === 'h') {
        return { ...el, x: 2 * cx - el.x - el.width, properties: { ...el.properties, flipH: !el.properties.flipH } }
      } else {
        return { ...el, y: 2 * cy - el.y - el.height, properties: { ...el.properties, flipV: !el.properties.flipV } }
      }
    })
    set({
      project: setElements(project, updated),
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  groupSelected: () => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length < 2) return
    const groupId = uuid()
    const groupName = `Group ${(project.groups?.length ?? 0) + 1}`
    const newGroup: ElementGroup = { id: groupId, name: groupName }
    const updatedEls = getElements(project).map(el =>
      selectedElementIds.includes(el.id) ? { ...el, groupId } : el
    )
    const newProject: Project = { ...setElements(project, updatedEls), groups: [...(project.groups ?? []), newGroup] }
    set({ project: newProject, past: pushToHistory(past, project), future: [], isDirty: true })
  },

  ungroupSelected: () => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    const els = getElements(project)
    const groupIdsToRemove = new Set(
      selectedElementIds.map(id => els.find(e => e.id === id)?.groupId).filter(Boolean) as string[]
    )
    if (groupIdsToRemove.size === 0) return
    const updatedEls = els.map(el =>
      el.groupId && groupIdsToRemove.has(el.groupId) ? { ...el, groupId: undefined } : el
    )
    const newProject: Project = {
      ...setElements(project, updatedEls),
      groups: (project.groups ?? []).filter(g => !groupIdsToRemove.has(g.id))
    }
    set({ project: newProject, past: pushToHistory(past, project), future: [], isDirty: true, activeGroupId: null })
  },

  enterGroup: (groupId) => set({ activeGroupId: groupId }),

  exitGroup: () => set({ activeGroupId: null, selectedElementIds: [] }),

  isolateElement: (id) => {
    const { project } = get()
    if (!project) return
    const el = getElements(project).find(e => e.id === id)
    if (!el?.groupId) return
    set({ activeGroupId: el.groupId, selectedElementIds: [id] })
  },

  renameGroup: (groupId, name) => {
    const { project } = get()
    if (!project) return
    const groups = (project.groups ?? []).map(g => g.id === groupId ? { ...g, name } : g)
    set({ project: { ...project, groups }, isDirty: true })
  },

  placeArcWall: (arcWall) => {
    const { project, past, activeLayerId } = get()
    if (!project) return
    const wall: ArcWall = { ...arcWall, id: uuid(), layerId: arcWall.layerId ?? activeLayerId }
    set({
      project: { ...project, arcWalls: [...(project.arcWalls ?? []), wall] },
      selectedArcWallIds: [wall.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  updateArcWall: (id, updates) => {
    const { project, past } = get()
    if (!project) return
    set({
      project: { ...project, arcWalls: (project.arcWalls ?? []).map(w => w.id === id ? { ...w, ...updates } : w) },
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  deleteSelectedArcWalls: () => {
    const { project, selectedArcWallIds, past } = get()
    if (!project || selectedArcWallIds.length === 0) return
    set({
      project: { ...project, arcWalls: (project.arcWalls ?? []).filter(w => !selectedArcWallIds.includes(w.id)) },
      selectedArcWallIds: [],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  selectArcWall: (id, add = false) => {
    if (add) {
      const { selectedArcWallIds } = get()
      set({
        selectedElementIds: [],
        selectedDimIds: [],
        selectedArcWallIds: selectedArcWallIds.includes(id)
          ? selectedArcWallIds.filter(i => i !== id)
          : [...selectedArcWallIds, id]
      })
    } else {
      set({ selectedElementIds: [], selectedDimIds: [], selectedArcWallIds: [id] })
    }
  },

  splitWallsForOpenings: (openingIds) => {
    const { project, past } = get()
    if (!project || openingIds.length === 0) return
    let elements = getElements(project)
    const openings = elements.filter(el => openingIds.includes(el.id))
    let changed = false
    for (const opening of openings) {
      const wall = elements.find(el =>
        WALL_BLOX_IDS.has(el.bloxId) &&
        el.rotation === 0 &&
        opening.x < el.x + el.width && opening.x + opening.width > el.x &&
        opening.y < el.y + el.height && opening.y + opening.height > el.y
      )
      if (!wall) continue
      const hosted = hostOpening(opening, wall)
      elements = elements.map(el => el.id === opening.id ? hosted : el)
      changed = true
    }
    if (!changed) return
    set({ project: setElements(project, elements), past: pushToHistory(past, project), future: [], isDirty: true })
  },

  setPendingPickPoint: (resolver) => set({ pickPointResolver: resolver }),
  clearPendingPickPoint: () => set({ pickPointResolver: null }),
  clearLastPlaced: () => set({ lastPlacedBloxId: null }),

  autoCallout: () => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    const els = getElements(project).filter(el => selectedElementIds.includes(el.id))
    if (els.length === 0) return
    const maxX = Math.max(...els.map(e => e.x + e.width))
    const labelW = project.mode === 'detail' ? 10 : 6
    const labelH = project.mode === 'detail' ? 2 : 1.2
    const newEls: PlacedElement[] = els.map(el => {
      const def = getBloxById(el.bloxId)
      return {
        id: uuid(), bloxId: 'annotation-leader',
        x: maxX + (project.mode === 'detail' ? 2 : 1),
        y: el.y + el.height / 2 - labelH / 2,
        width: labelW, height: labelH,
        rotation: 0,
        properties: { label: def?.name ?? el.bloxId, targetId:el.id },
        layerId: el.layerId, locked: false,
      }
    })
    set({ project: setElements(project, [...getElements(project), ...newEls]), past: pushToHistory(past, project), future: [], isDirty: true })
  },
}))

export function getPixelsPerFoot(state: AppState): number {
  if (!state.project) return SCALES.quarter.pixelsPerFoot
  return SCALES[state.project.scale].pixelsPerFoot
}

export function getSnapFeet(state: AppState): number {
  if (state.snapModuleFt !== null && state.snapModuleFt !== undefined) return state.snapModuleFt
  if (!state.project) return SCALES.quarter.snapFeet
  return SCALES[state.project.scale].snapFeet
}

export function getActiveElements(state: AppState): PlacedElement[] {
  if (!state.project) return []
  return state.project.mode === 'detail'
    ? (state.project.detailElements ?? [])
    : state.project.elements
}

export function getActiveDimensions(state: AppState): DimensionLine[] {
  if (!state.project) return []
  return state.project.mode === 'detail'
    ? (state.project.detailDimensions ?? [])
    : resolveDimensions(state.project.dimensions,state.project.elements)
}
