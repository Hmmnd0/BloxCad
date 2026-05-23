import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { Project, PlacedElement, DimensionLine, Scale, Tool, WallType, SCALES, TitleBlock, ChecklistItem, Layer } from '../types'
import { getBloxById } from '../blox/definitions'

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
  showTitleBlock: boolean
  stageX: number
  stageY: number
  stageScale: number
  isDirty: boolean
  past: Project[]
  future: Project[]
  clipboard: Clipboard | null
  pendingBloxWidth: number | null
  activeLayerId: string

  createProject: (name: string, scale: Scale) => void
  loadProject: (project: Project) => void
  placeElement: (bloxId: string, xFeet: number, yFeet: number, widthOverride?: number, heightOverride?: number, snapWallId?: string) => void
  updateElement: (id: string, updates: Partial<PlacedElement>) => void
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
  updateTitleBlock: (updates: Partial<TitleBlock>) => void
  setPendingBloxWidth: (w: number | null) => void
  autoDimSelected: (side?: 'outside' | 'inside') => void
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
}

function pushToHistory(past: Project[], project: Project): Project[] {
  return [...past.slice(-(MAX_HISTORY - 1)), project]
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
  showTitleBlock: false,
  stageX: 60,
  stageY: 60,
  stageScale: 1,
  isDirty: false,
  past: [],
  future: [],
  clipboard: null,
  pendingBloxWidth: null,
  activeLayerId: DEFAULT_LAYER_ID,

  createProject: (name, scale) => {
    const project: Project = { id: uuid(), name, scale, elements: [], dimensions: [], checklist: makeDefaultChecklist(), layers: [makeDefaultLayer()] }
    set({ project, showNewProjectDialog: false, isDirty: false, stageX: 60, stageY: 60, stageScale: 1, past: [], future: [], activeLayerId: DEFAULT_LAYER_ID })
  },

  loadProject: (project) => {
    const defaultLayer = makeDefaultLayer()
    const p = { ...project, dimensions: project.dimensions ?? [], checklist: project.checklist ?? makeDefaultChecklist(), layers: project.layers ?? [defaultLayer] }
    const firstLayerId = p.layers[0]?.id ?? DEFAULT_LAYER_ID
    set({ project: p, showNewProjectDialog: false, isDirty: false, stageX: 60, stageY: 60, stageScale: 1, past: [], future: [], activeLayerId: firstLayerId })
  },

  placeElement: (bloxId, xFeet, yFeet, widthOverride, heightOverride, snapWallId?) => {
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
    const element: PlacedElement = {
      id: uuid(), bloxId, x: xFeet, y: yFeet,
      width: w, height: h,
      rotation: 0, properties: autoProps, locked: false,
      layerId: activeLayerId
    }
    let elements = project.elements
    if (snapWallId) {
      const wall = elements.find(el => el.id === snapWallId)
      if (wall) {
        const segs = splitWall(wall, element)
        elements = [...elements.filter(el => el.id !== snapWallId), ...segs]
      }
    }
    set({
      project: { ...project, elements: [...elements, element] },
      selectedElementIds: [element.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  updateElement: (id, updates) => {
    const { project, past } = get()
    if (!project) return
    set({
      project: { ...project, elements: project.elements.map(el => el.id === id ? { ...el, ...updates } : el) },
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  deleteSelectedElements: () => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    set({
      project: { ...project, elements: project.elements.filter(el => !selectedElementIds.includes(el.id)) },
      selectedElementIds: [],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  selectElement: (id, addToSelection = false) => {
    const { selectedElementIds } = get()
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

  clearSelection: () => set({ selectedElementIds: [], selectedDimIds: [] }),

  addDimension: (dim) => {
    const { project, past } = get()
    if (!project) return
    const full: DimensionLine = { ...dim, id: uuid() }
    set({
      project: { ...project, dimensions: [...project.dimensions, full] },
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
      project: { ...project, dimensions: project.dimensions.map(d => d.id === id ? { ...d, ...updates } : d) },
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  deleteSelectedDims: () => {
    const { project, selectedDimIds, past } = get()
    if (!project || selectedDimIds.length === 0) return
    set({
      project: { ...project, dimensions: project.dimensions.filter(d => !selectedDimIds.includes(d.id)) },
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
  setShowTitleBlock: (show) => set({ showTitleBlock: show }),

  updateTitleBlock: (updates) => {
    const { project } = get()
    if (!project) return
    const existing: TitleBlock = project.titleBlock ?? {
      address: '', drawingTitle: 'Floor Plan', drawnBy: '', checkedBy: '',
      projectDate: new Date().toLocaleDateString(), sheetNumber: 'A1.1', jobNumber: ''
    }
    set({ project: { ...project, titleBlock: { ...existing, ...updates } }, isDirty: true })
  },

  autoDimSelected: (side = 'outside') => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length !== 1) return
    const el = project.elements.find(e => e.id === selectedElementIds[0])
    if (!el) return
    const newDims: DimensionLine[] = []

    if (side === 'outside') {
      // Reference the bottom and right edges, push outward with negative offset
      // so dim lines appear clearly below and to the right of the element.
      if (el.width > 0.6) {
        newDims.push({ id: uuid(), x1: el.x, y1: el.y + el.height, x2: el.x + el.width, y2: el.y + el.height, offset: -1.5 })
      }
      if (el.height > 0.6) {
        newDims.push({ id: uuid(), x1: el.x + el.width, y1: el.y, x2: el.x + el.width, y2: el.y + el.height, offset: -1.5 })
      }
    } else {
      // Reference the top and left edges, push inward with negative offset
      // so dim lines sit just inside the element boundary.
      if (el.width > 0.6) {
        newDims.push({ id: uuid(), x1: el.x, y1: el.y, x2: el.x + el.width, y2: el.y, offset: -1.5 })
      }
      if (el.height > 0.6) {
        newDims.push({ id: uuid(), x1: el.x, y1: el.y, x2: el.x, y2: el.y + el.height, offset: -1.5 })
      }
    }
    set({
      project: { ...project, dimensions: [...project.dimensions, ...newDims] },
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  rotateSelected: (degrees) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length === 0) return
    set({
      project: {
        ...project,
        elements: project.elements.map(el => {
          if (!selectedElementIds.includes(el.id)) return el
          const raw = (el.rotation + degrees) % 360
          const newRot = raw < 0 ? raw + 360 : raw

          // With offsetX/offsetY rendering, center is always (el.x + hw, el.y + hh)
          const hw = el.width / 2, hh = el.height / 2

          // On 90°/270°: swap width↔height, normalize to rotation=0
          if (newRot === 90 || newRot === 270) {
            const newW = el.height, newH = el.width
            const cx = el.x + hw, cy = el.y + hh
            return { ...el, x: cx - newW / 2, y: cy - newH / 2, width: newW, height: newH, rotation: 0 }
          }

          // Other angles: just update rotation — center stays at (el.x + hw, el.y + hh)
          return { ...el, rotation: newRot }
        })
      },
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  },

  alignSelected: (axis) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length < 2) return
    const els = project.elements.filter(el => selectedElementIds.includes(el.id) && !el.locked)
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
      project: { ...project, elements: project.elements.map(el => map.get(el.id) ?? el) },
      past: pushToHistory(past, project), future: [], isDirty: true
    })
  },

  distributeSelected: (direction) => {
    const { project, selectedElementIds, past } = get()
    if (!project || selectedElementIds.length < 3) return
    const els = project.elements.filter(el => selectedElementIds.includes(el.id) && !el.locked)
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
      project: { ...project, elements: project.elements.map(el => map.get(el.id) ?? el) },
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
    set({
      project: { ...project, layers, elements },
      activeLayerId: activeLayerId === id ? DEFAULT_LAYER_ID : activeLayerId,
      isDirty: true
    })
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  setElementsLayer: (elementIds, layerId) => {
    const { project, past } = get()
    if (!project) return
    set({
      project: { ...project, elements: project.elements.map(el => elementIds.includes(el.id) ? { ...el, layerId } : el) },
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
      isDirty: true
    })
  },

  copySelected: () => {
    const { project, selectedElementIds, selectedDimIds } = get()
    if (!project) return
    const elements = project.elements.filter(el => selectedElementIds.includes(el.id))
    const dims = project.dimensions.filter(d => selectedDimIds.includes(d.id))
    if (elements.length === 0 && dims.length === 0) return
    set({ clipboard: { elements, dims } })
  },

  pasteClipboard: () => {
    const { project, clipboard, past } = get()
    if (!project || !clipboard) return
    const PASTE_OFFSET = 1
    const newElements = clipboard.elements.map(el => ({ ...el, id: uuid(), x: el.x + PASTE_OFFSET, y: el.y + PASTE_OFFSET }))
    const newDims = clipboard.dims.map(d => ({
      ...d, id: uuid(),
      x1: d.x1 + PASTE_OFFSET, y1: d.y1 + PASTE_OFFSET,
      x2: d.x2 + PASTE_OFFSET, y2: d.y2 + PASTE_OFFSET
    }))
    set({
      project: {
        ...project,
        elements: [...project.elements, ...newElements],
        dimensions: [...project.dimensions, ...newDims]
      },
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
      project: {
        ...project,
        elements: project.elements.map(el =>
          selectedElementIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
        )
      },
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
    const el = project.elements.find(e => e.id === id)
    if (!el) return
    const copy: PlacedElement = { ...el, id: uuid(), x, y }
    set({
      project: { ...project, elements: [...project.elements, copy] },
      selectedElementIds: [copy.id],
      past: pushToHistory(past, project),
      future: [],
      isDirty: true
    })
  }
}))

export function getPixelsPerFoot(state: AppState): number {
  if (!state.project) return SCALES.quarter.pixelsPerFoot
  return SCALES[state.project.scale].pixelsPerFoot
}

export function getSnapFeet(state: AppState): number {
  if (!state.project) return SCALES.quarter.snapFeet
  return SCALES[state.project.scale].snapFeet
}
