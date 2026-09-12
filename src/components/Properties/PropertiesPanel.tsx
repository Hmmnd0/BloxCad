import React from 'react'
import { LengthInput } from './LengthInput'
import { OpeningScheduleFields } from './OpeningScheduleFields'
import { CanvasBloxPreview, DRAWING_PREVIEW_CATEGORIES } from '../Sidebar/CanvasBloxPreview'
import { AnnotationTargetField } from './AnnotationTargetField'
import { DEMOLITION_IDS } from '../../utils/demolitionGeometry'
import { DemolitionPreview } from '../Sidebar/DemolitionPreview'
import { Box, MousePointer2, FlipHorizontal2, FlipVertical2, LockKeyhole, UnlockKeyhole, Trash2 } from 'lucide-react'
import { FurniturePreview } from '../Sidebar/FurniturePreview'
import { REFINED_FURNITURE } from '../../utils/furnitureGeometry'
import { REFINED_CASEWORK } from '../../utils/caseworkGeometry'
import { REFINED_FIXTURES } from '../../utils/fixtureGeometry'
import { CirculationPreview } from '../Sidebar/CirculationPreview'
import { WallPreview } from '../Sidebar/WallPreview'
import { REFINED_WALLS } from '../../utils/wallGeometry'
import { REFINED_STRUCTURAL } from '../../utils/structuralGeometry'
import { REFINED_ELECTRICAL } from '../../utils/electricalGeometry'
import { ElectricalPreview } from '../Sidebar/ElectricalPreview'
import { REFINED_EQUIPMENT } from '../../utils/equipmentGeometry'
import { REFINED_SITE } from '../../utils/siteGeometry'
import { EquipmentPreview } from '../Sidebar/EquipmentPreview'
import { StairDesignFields } from './StairDesignFields'
import { stairRisers } from '../../utils/stairReview'
import { REFINED_CIRCULATION, circulationDirection, boundedCount } from '../../utils/circulationGeometry'
import { useStore, getActiveElements, getActiveDimensions } from '../../store/useStore'
import { dimensionLayout } from '../../utils/dimensionLayout'
import { attachDimension } from '../../utils/dimensionAnchors'
import { getBloxById } from '../../blox/definitions'
import { SCALES, Scale } from '../../types'
import { formatFeet, formatInches } from '../../utils/scale'
import { CoordinateInput } from './CoordinateInput'

function fmtPreset(ft: number): string {
  const wholeFt = Math.floor(ft)
  const inches = Math.round((ft - wholeFt) * 12)
  if (inches === 0) return `${wholeFt}'`
  if (wholeFt === 0) return `${inches}"`
  return `${wholeFt}'${inches}"`
}

export function PropertiesPanel() {
  const { project, selectedElementIds, selectedDimIds, activeBloxId, pendingBloxWidth, setPendingBloxWidth, updateElement, deleteSelectedElements, updateDimension, deleteSelectedDims, selectedArcWallIds, updateArcWall, deleteSelectedArcWalls } = useStore()

  // Arc wall selected
  if (project && selectedArcWallIds.length === 1 && selectedElementIds.length === 0 && selectedDimIds.length === 0) {
    const wall = (project.arcWalls ?? []).find(w => w.id === selectedArcWallIds[0])
    if (wall) {
      return (
        <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
          <span className="font-semibold text-gray-200">Arc Wall</span>
          <span className="text-gray-400">R = {formatFeet(wall.radius)}</span>
          <label className="flex items-center gap-1">
            <span className="text-gray-500">Thickness</span>
            <input
              type="number"
              value={wall.thickness.toFixed(3)}
              step={0.125}
              min={0.125}
              onChange={e => updateArcWall(wall.id, { thickness: parseFloat(e.target.value) || wall.thickness })}
              className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
            />
            <span className="text-gray-600">ft</span>
          </label>
          <button onClick={deleteSelectedArcWalls} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
        </div>
      )
    }
  }

  // Show dimension properties when a dim is selected
  if (project && selectedDimIds.length === 1 && selectedElementIds.length === 0) {
    const dim = getActiveDimensions(useStore.getState()).find(d => d.id === selectedDimIds[0])
    if (dim) {
      const isHoriz = Math.abs(dim.x2 - dim.x1) >= Math.abs(dim.y2 - dim.y1)
      const dist = dimensionLayout(dim,1).value
      const attached=attachDimension({...dim,anchor1:undefined,anchor2:undefined,needsReview:false},getActiveElements(useStore.getState()).filter(e=>!project.layers?.some(l=>l.id===e.layerId&&!l.visible)))
      return (
        <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
          <span className="font-semibold text-gray-200">Dimension</span>
          <select aria-label="Dimension measurement" value={dim.measurement??(isHoriz?'horizontal':'vertical')} disabled={!!dim.overall}
            onChange={e=>updateDimension(dim.id,{measurement:e.target.value as 'horizontal'|'vertical'|'aligned'})}
            className="bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-600">
            <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="aligned">Aligned</option>
          </select>
          <span className={dim.needsReview?'text-amber-400':'text-gray-400'}>{dim.needsReview?'CHECK — reference changed':project.mode==='detail'?formatInches(dist):formatFeet(dist)}</span>
          <span className="text-gray-500">{dim.overall?'Selected walls · outer edges':dim.anchor1&&dim.anchor2?'Linked':dim.anchor1||dim.anchor2?'Partially linked':'Fixed points'}</span>
          {!dim.overall&&project.mode!=='detail'&&<button disabled={!attached.anchor1||!attached.anchor2} title="Both endpoints must match current joined wall corners to attach" onClick={()=>updateDimension(dim.id,attached)} className="text-blue-400 disabled:text-gray-600">Attach</button>}
          <label className="flex items-center gap-1">
            <span className="text-gray-500">Offset</span>
            <input
              type="number"
              value={dim.offset.toFixed(2)}
              step={0.5}
              onChange={e => updateDimension(dim.id, { offset: parseFloat(e.target.value) || dim.offset })}
              className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
            />
            <span className="text-gray-600">ft</span>
          </label>
          <button onClick={deleteSelectedDims} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
        </div>
      )
    }
  }

  // Pre-placement: show size selector when a blox is active but nothing placed yet
  if (activeBloxId && selectedElementIds.length === 0) {
    const def = getBloxById(activeBloxId)
    if (def?.widthPresets) {
      const currentW = pendingBloxWidth ?? def.defaultWidth
      return (
        <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
          <span className="font-semibold text-gray-200">{def.name}</span>
          <span className="text-gray-500">Width</span>
          <input
            type="number"
            value={currentW.toFixed(2)}
            step={0.5}
            min={def.minWidth ?? 0.5}
            onChange={e => setPendingBloxWidth(parseFloat(e.target.value) || currentW)}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
          />
          <span className="text-gray-600">ft</span>
          <div className="flex items-center gap-1">
            {def.widthPresets.map(p => (
              <button
                key={p}
                onClick={() => setPendingBloxWidth(p)}
                className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  Math.abs(currentW - p) < 0.01
                    ? 'bg-accent border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
                }`}
              >
                {fmtPreset(p)}
              </button>
            ))}
          </div>
          <span className="text-gray-500 ml-1">· Click canvas to place · Esc to cancel</span>
        </div>
      )
    }
  }

  if (!project || selectedElementIds.length + selectedDimIds.length + selectedArcWallIds.length === 0) {
    return (
      <div className="inspector-empty">
        <MousePointer2 size={18} aria-hidden="true" />
        <div><strong>Nothing selected</strong><span>Select an object to inspect its properties, or choose a blox to place.</span></div>
        <div className="inspector-shortcuts"><span><kbd>V</kbd> Select</span><span><kbd>W</kbd> Wall</span><span><kbd>D</kbd> Dimension</span><span><kbd>⌘0</kbd> Fit view</span></div>
      </div>
    )
  }

  const count = selectedElementIds.length + selectedDimIds.length + selectedArcWallIds.length

  if (count > 1) {
    return (
      <div className="inspector-multiple">
        <Box size={22} aria-hidden="true"/><div><strong>{count} objects selected</strong><span>Use the toolbar to align, distribute, or transform this selection.</span></div>
        <button onClick={()=>useStore.getState().clearSelection()} className="inspector-secondary">Clear selection</button>
        <button onClick={()=>{deleteSelectedElements();deleteSelectedDims();deleteSelectedArcWalls()}} className="inspector-danger"><Trash2 size={14}/> Delete selection</button>
      </div>
    )
  }

  const id = selectedElementIds[0]
  const el = getActiveElements(useStore.getState()).find(e => e.id === id)
  if (!el) return null
  const def = getBloxById(el.bloxId)

  // Fire rating label
  if (el.bloxId === 'fire-rating-label') {
    const ratings = ['1-HR', '2-HR', '3-HR', '4-HR']
    const current = (el.properties.rating as string) ?? '1-HR'
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Fire Rating Label</span>
        <span className="text-gray-500">Rating</span>
        {ratings.map(r => (
          <button key={r} onClick={() => updateElement(id, { properties: { ...el.properties, rating: r } })}
            className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
              current === r ? 'bg-red-700 border-red-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}>
            {r}
          </button>
        ))}
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Detail bubble — editable number and sheet reference
  if (el.bloxId === 'annotation-detail-bubble') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Detail Bubble</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Detail #</span>
          <input
            type="text"
            value={(el.properties.detailNum as string) ?? '1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, detailNum: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Sheet</span>
          <input
            type="text"
            value={(el.properties.sheetRef as string) ?? 'A-1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, sheetRef: e.target.value } })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Leader arrow — editable label
  if (el.bloxId === 'annotation-leader') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Leader Arrow</span>
        <AnnotationTargetField element={el}/>
        <label className="flex items-center gap-1 flex-1">
          <span className="text-gray-500">Label</span>
          <input
            type="text"
            value={(el.properties.label as string) ?? ''}
            placeholder="Callout text..."
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="flex-1 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Size</span>
          <input
            type="number"
            min={6}
            max={36}
            step={1}
            value={(el.properties.fontSize as number) ?? 12}
            onChange={e => updateElement(id, { properties: { ...el.properties, fontSize: Number(e.target.value) } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Section cut — editable label
  if (el.bloxId === 'annotation-section-cut') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Section Cut</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input
            type="text"
            value={(el.properties.label as string) ?? 'A'}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Grid bubble — editable label
  if (el.bloxId === 'annotation-grid-bubble') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Grid Bubble</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input
            type="text"
            value={(el.properties.label as string) ?? 'A'}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Drawing title — auto-fills from project data, overrideable
  if (el.bloxId === 'annotation-drawing-title') {
    const tb = project?.titleBlock
    const effectiveTitle      = (el.properties.title      as string | undefined) ?? tb?.drawingTitle ?? project?.name ?? 'DRAWING TITLE'
    const effectiveDrawingNum = (el.properties.drawingNum as string | undefined) ?? tb?.sheetNumber  ?? 'A-1'
    const effectiveScale      = (el.properties.scale      as string | undefined) ?? (project ? SCALES[project.scale as Scale]?.label : "1/4\" = 1'-0\"")
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0 min-w-0 overflow-x-auto">
        <span className="font-semibold text-gray-200 shrink-0">Drawing Title</span>
        <label className="flex items-center gap-1 shrink-0">
          <span className="text-gray-500">Title</span>
          <input type="text" value={effectiveTitle}
            onChange={e => updateElement(id, { properties: { ...el.properties, title: e.target.value } })}
            className="w-40 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <label className="flex items-center gap-1 shrink-0">
          <span className="text-gray-500">Dwg #</span>
          <input type="text" value={effectiveDrawingNum}
            onChange={e => updateElement(id, { properties: { ...el.properties, drawingNum: e.target.value } })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <label className="flex items-center gap-1 shrink-0">
          <span className="text-gray-500">Scale</span>
          <input type="text" value={effectiveScale}
            onChange={e => updateElement(id, { properties: { ...el.properties, scale: e.target.value } })}
            className="w-28 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Interior elevation target — view number, sheet ref, direction
  if (el.bloxId === 'annotation-elevation-target') {
    const dirs8 = ['right','ne','up','nw','left','sw','down','se']
    const icons8: Record<string, string> = { right:'→', ne:'↗', up:'↑', nw:'↖', left:'←', sw:'↙', down:'↓', se:'↘' }
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Elevation Target</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">View #</span>
          <input type="text" value={(el.properties.viewNum as string) ?? '1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, viewNum: e.target.value } })}
            className="w-10 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Sheet</span>
          <input type="text" value={(el.properties.sheetRef as string) ?? 'A-3'}
            onChange={e => updateElement(id, { properties: { ...el.properties, sheetRef: e.target.value } })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <span className="text-gray-500">Dir</span>
        <div className="flex items-center gap-0.5">
          {dirs8.map(d => (
            <button key={d} onClick={() => updateElement(id, { properties: { ...el.properties, direction: d } })}
              className={`w-6 h-6 flex items-center justify-center rounded border text-xs transition-colors ${
                (el.properties.direction ?? 'right') === d ? 'bg-accent border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
              }`}>{icons8[d]}</button>
          ))}
        </div>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Section reference bubble — section number + sheet
  if (el.bloxId === 'annotation-section-ref') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Section Ref</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Section #</span>
          <input type="text" value={(el.properties.secNum as string) ?? 'A'}
            onChange={e => updateElement(id, { properties: { ...el.properties, secNum: e.target.value } })}
            className="w-10 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Sheet</span>
          <input type="text" value={(el.properties.sheetRef as string) ?? 'A-2'}
            onChange={e => updateElement(id, { properties: { ...el.properties, sheetRef: e.target.value } })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Room tag — room name + number
  if (el.bloxId === 'annotation-room-tag') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Room Tag</span>
        <OpeningScheduleFields element={el}/>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Name</span>
          <input type="text" value={(el.properties.roomName as string) ?? 'ROOM NAME'}
            onChange={e => updateElement(id, { properties: { ...el.properties, roomName: e.target.value } })}
            className="w-32 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Number</span>
          <input type="text" value={(el.properties.roomNum as string) ?? '101'}
            onChange={e => updateElement(id, { properties: { ...el.properties, roomNum: e.target.value } })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Door tag — hexagon label
  if (el.bloxId === 'annotation-door-tag'||el.bloxId === 'annotation-window-tag') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">{el.bloxId==='annotation-window-tag'?'Window Tag':'Door Tag'}</span>
        <AnnotationTargetField element={el}/>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input type="text" aria-label="Opening tag mark" value={(el.properties.label as string) ?? ''}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <span className={el.properties.sourceMissing?'text-amber-400':'text-gray-500'}>{el.properties.sourceMissing?'Missing opening — relink tag':el.properties.targetId?'Mark shared with linked opening':'Link to an opening to coordinate its mark'}</span>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Column grid (horizontal) — label
  if (el.bloxId === 'annotation-column-grid-h') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Column Grid H</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input type="text" value={(el.properties.label as string) ?? 'A'}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Back reference target — ref number + sheet
  if (el.bloxId === 'annotation-back-reference') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Back Reference</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Ref #</span>
          <input type="text" value={(el.properties.refNum as string) ?? '1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, refNum: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Sheet</span>
          <input type="text" value={(el.properties.sheetRef as string) ?? 'A-2'}
            onChange={e => updateElement(id, { properties: { ...el.properties, sheetRef: e.target.value } })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Floor elevation marker — elevation value
  if (el.bloxId === 'annotation-floor-elevation') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Floor Elevation</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Elevation</span>
          <input type="text" value={(el.properties.elevation as string) ?? "± 0'-0\""}
            onChange={e => updateElement(id, { properties: { ...el.properties, elevation: e.target.value } })}
            className="w-24 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Revision delta — label
  if (el.bloxId === 'annotation-revision-delta') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Revision Delta</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input type="text" value={(el.properties.label as string) ?? '1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
      </div>
    )
  }

  // Elevation marker — editable label + direction
  if (el.bloxId === 'annotation-elevation-marker') {
    const dirs = ['right', 'up', 'left', 'down']
    const icons: Record<string, string> = { right: '→', up: '↑', left: '←', down: '↓' }
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Elevation Marker</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Label</span>
          <input
            type="text"
            value={(el.properties.label as string) ?? '1'}
            onChange={e => updateElement(id, { properties: { ...el.properties, label: e.target.value } })}
            className="w-10 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <span className="text-gray-500">Direction</span>
        <div className="flex items-center gap-1">
          {dirs.map(d => (
            <button key={d}
              onClick={() => updateElement(id, { properties: { ...el.properties, direction: d } })}
              className={`w-6 h-6 flex items-center justify-center rounded border text-xs transition-colors ${
                (el.properties.direction ?? 'right') === d ? 'bg-accent border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
              }`}
            >{icons[d]}</button>
          ))}
        </div>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Text note
  if (el.bloxId === 'text-note') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Text Note</span>
        <label className="flex items-center gap-1 flex-1">
          <span className="text-gray-500">Text</span>
          <input
            type="text"
            value={(el.properties.text as string) ?? ''}
            placeholder="Enter note text..."
            onChange={e => updateElement(id, { properties: { ...el.properties, text: e.target.value } })}
            className="flex-1 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Size</span>
          <input
            type="number"
            min={6}
            max={48}
            step={1}
            value={(el.properties.fontSize as number) ?? 11}
            onChange={e => updateElement(id, { properties: { ...el.properties, fontSize: Number(e.target.value) } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs text-center"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Room label: show name + area fields instead of geometry
  if (el.bloxId === 'room-label') {
    return (
      <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Room Label</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Name</span>
          <input
            type="text"
            value={(el.properties.roomName as string) ?? 'Room'}
            onChange={e => updateElement(id, { properties: { ...el.properties, roomName: e.target.value } })}
            className="w-28 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Area</span>
          <input
            type="text"
            placeholder="e.g. 120 sq ft"
            value={(el.properties.roomArea as string) ?? ''}
            onChange={e => updateElement(id, { properties: { ...el.properties, roomArea: e.target.value } })}
            className="w-24 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
          />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-2">Delete</button>
      </div>
    )
  }

  // Multi-pane window: show pane count controls
  if (el.bloxId === 'window-multi') {
    const panes = boundedCount(el.properties.paneCount,2,12,1)
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Multi-Pane Window</span>
        <OpeningScheduleFields element={el}/>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">W</span>
          <input type="number" value={el.width.toFixed(2)} step={0.5} min={1}
            onChange={e => {
              const newW = parseFloat(e.target.value) || el.width
              updateElement(id, { width: newW, properties: { ...el.properties, paneCount: Math.max(1, Math.min(12, Math.round(newW / 2))) } })
            }}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <span className="text-gray-500">Panes</span>
        <div className="flex items-center gap-1">
          <button onClick={() => updateElement(id, { properties: { ...el.properties, paneCount: Math.max(1, panes - 1) } })}
            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300">−</button>
          <span className="w-6 text-center text-gray-200">{panes}</span>
          <button onClick={() => updateElement(id, { properties: { ...el.properties, paneCount: Math.min(12, panes + 1) } })}
            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300">+</button>
        </div>
        <button onClick={() => updateElement(id, { properties: { ...el.properties, flipH: !el.properties.flipH } })}
          className={`text-xs px-2 py-0.5 rounded border ${el.properties.flipH ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}>⇄ H</button>
        <button onClick={() => updateElement(id, { properties: { ...el.properties, flipV: !el.properties.flipV } })}
          className={`text-xs px-2 py-0.5 rounded border ${el.properties.flipV ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}>⇅ V</button>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-auto">Delete</button>
      </div>
    )
  }

  // Stair elevation: show step count controls
  if (el.bloxId === 'stairs-elevation') {
    const steps = boundedCount(el.properties.stepCount,11,30)
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Stair Elevation</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">W</span>
          <input type="number" value={el.width.toFixed(2)} step={0.5} min={1}
            onChange={e => {
              const newW = parseFloat(e.target.value) || el.width
              updateElement(id, { width: newW, properties: { ...el.properties, stepCount: Math.max(3, Math.min(24, Math.round(newW / (11/12)))) } })
            }}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">H</span>
          <input type="number" value={el.height.toFixed(2)} step={0.5} min={1}
            onChange={e => updateElement(id, { height: parseFloat(e.target.value) || el.height })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <span className="text-gray-500">Steps</span>
        <div className="flex items-center gap-1">
          <button onClick={() => updateElement(id, { properties: { ...el.properties, stepCount: Math.max(2, steps - 1) } })}
            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300">−</button>
          <span className="w-6 text-center text-gray-200">{steps}</span>
          <button onClick={() => updateElement(id, { properties: { ...el.properties, stepCount: Math.min(30, steps + 1) } })}
            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300">+</button>
        </div>
        <button onClick={() => updateElement(id, { properties: { ...el.properties, flipH: !el.properties.flipH } })}
          className={`text-xs px-2 py-0.5 rounded border ${el.properties.flipH ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}>⇄ H</button>
        <button onClick={() => updateElement(id, { properties: { ...el.properties, flipV: !el.properties.flipV } })}
          className={`text-xs px-2 py-0.5 rounded border ${el.properties.flipV ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}>⇅ V</button>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-auto">Delete</button>
      </div>
    )
  }

  // Property line — front/side/rear role (drives the DRC setback check), bearing, length
  if (el.bloxId === 'site-property-line') {
    const types = ['front', 'side', 'rear'] as const
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Property Line</span>
        <span className="text-gray-500">Type</span>
        <div className="flex items-center gap-1">
          {types.map(t => (
            <button key={t}
              onClick={() => updateElement(id, { properties: { ...el.properties, lineType: t } })}
              className={`px-1.5 py-0.5 rounded text-[10px] border capitalize transition-colors ${
                (el.properties.lineType ?? 'side') === t ? 'bg-accent border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
              }`}
            >{t}</button>
          ))}
        </div>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Bearing</span>
          <input type="text" placeholder={`N00°00'00"E`} value={(el.properties.bearing as string) ?? ''}
            onChange={e => updateElement(id, { properties: { ...el.properties, bearing: e.target.value } })}
            className="w-24 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Length</span>
          <input type="number" value={el.width.toFixed(2)} step={0.5} min={def?.minWidth ?? 5}
            onChange={e => updateElement(id, { width: parseFloat(e.target.value) || el.width })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">∠</span>
          <input type="number" value={el.rotation} step={1}
            onChange={e => updateElement(id, { rotation: parseFloat(e.target.value) % 360 })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">°</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Font</span>
          <input type="number" min={5} max={24} value={(el.properties.fontSize as number) ?? 9}
            onChange={e => updateElement(id, { properties: { ...el.properties, fontSize: Math.max(5, Math.min(24, Number(e.target.value) || 9)) } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-auto">Delete</button>
      </div>
    )
  }

  // Setback line — required distance shown in its label
  if (el.bloxId === 'site-setback-line') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Setback Line</span>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Setback</span>
          <input type="number" min={0} value={(el.properties.setbackFt as number) ?? 10}
            onChange={e => updateElement(id, { properties: { ...el.properties, setbackFt: Math.max(0, Number(e.target.value) || 0) } })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Length</span>
          <input type="number" value={el.width.toFixed(2)} step={0.5} min={def?.minWidth ?? 5}
            onChange={e => updateElement(id, { width: parseFloat(e.target.value) || el.width })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">∠</span>
          <input type="number" value={el.rotation} step={1}
            onChange={e => updateElement(id, { rotation: parseFloat(e.target.value) % 360 })}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">°</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Font</span>
          <input type="number" min={5} max={24} value={(el.properties.fontSize as number) ?? 8}
            onChange={e => updateElement(id, { properties: { ...el.properties, fontSize: Math.max(5, Math.min(24, Number(e.target.value) || 8)) } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-auto">Delete</button>
      </div>
    )
  }

  // Easement — type + band width (height) + length (width)
  if (el.bloxId === 'site-easement') {
    const easementTypes = ['utility', 'drainage', 'access', 'sewer'] as const
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Easement</span>
        <div className="flex items-center gap-1">
          {easementTypes.map(t => (
            <button key={t}
              onClick={() => updateElement(id, { properties: { ...el.properties, easementType: t } })}
              className={`px-1.5 py-0.5 rounded text-[10px] border capitalize transition-colors ${
                (el.properties.easementType ?? 'utility') === t ? 'bg-accent border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'
              }`}
            >{t}</button>
          ))}
        </div>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Length</span>
          <input type="number" value={el.width.toFixed(2)} step={0.5} min={def?.minWidth ?? 5}
            onChange={e => updateElement(id, { width: parseFloat(e.target.value) || el.width })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Width</span>
          <input type="number" value={el.height.toFixed(2)} step={0.5} min={def?.minHeight ?? 2}
            onChange={e => updateElement(id, { height: parseFloat(e.target.value) || el.height })}
            className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
          <span className="text-gray-600">ft</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">Font</span>
          <input type="number" min={5} max={24} value={(el.properties.fontSize as number) ?? 8}
            onChange={e => updateElement(id, { properties: { ...el.properties, fontSize: Math.max(5, Math.min(24, Number(e.target.value) || 8)) } })}
            className="w-12 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs" />
        </label>
        <button onClick={deleteSelectedElements} className="text-red-500 hover:text-red-400 ml-auto">Delete</button>
      </div>
    )
  }

  return (
    <div className={`inspector-selection${el.bloxId==='stairs-straight'?' inspector-stair':''}`}>
      <OpeningScheduleFields element={el}/>
      <div className="inspector-identity">
        <div className="inspector-preview" aria-hidden="true">{DRAWING_PREVIEW_CATEGORIES.has(def?.category??'')?<CanvasBloxPreview id={el.bloxId}/>:DEMOLITION_IDS.has(el.bloxId)?<DemolitionPreview id={el.bloxId}/>:REFINED_SITE.has(el.bloxId)||REFINED_EQUIPMENT.has(el.bloxId)?<EquipmentPreview id={el.bloxId}/>:REFINED_ELECTRICAL.has(el.bloxId)?<ElectricalPreview id={el.bloxId}/>:REFINED_WALLS.has(el.bloxId)?<WallPreview id={el.bloxId}/>:REFINED_CIRCULATION.has(el.bloxId)?<CirculationPreview id={el.bloxId}/>:REFINED_STRUCTURAL.has(el.bloxId)||REFINED_FURNITURE.has(el.bloxId)||REFINED_CASEWORK.has(el.bloxId)||REFINED_FIXTURES.has(el.bloxId)?<FurniturePreview id={el.bloxId}/>:<Box size={22}/>}</div>
        <div><strong>{def?.name ?? el.bloxId}</strong><span>{def?.category ?? 'Object'}{el.locked?' · Locked':''}</span></div>
      </div>
      <fieldset className="inspector-group"><legend>Size & orientation</legend><div className="inspector-fields">

      <label className="flex items-center gap-1">
        <span className="text-gray-500">W</span>
        <LengthInput key={`${id}:width`} label="Width" value={el.width} onCommit={width=>updateElement(id,{width})}/>
      </label>

      {/* Width preset chips */}
      {def?.widthPresets && (
        <div className="flex items-center gap-1">
          {def.widthPresets.map(p => (
            <button
              key={p}
              onClick={() => updateElement(id, { width: p })}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                Math.abs(el.width - p) < 0.01
                  ? 'bg-accent border-blue-500 text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              }`}
            >
              {fmtPreset(p)}
            </button>
          ))}
        </div>
      )}

      <label className="flex items-center gap-1">
        <span className="text-gray-500">H</span>
        <LengthInput key={`${id}:height`} label="Height" value={el.height} onCommit={height=>updateElement(id,{height})}/>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-gray-500">∠</span>
        <input
          type="number"
          aria-label="Rotation"
          value={el.rotation}
          step={15}
          onChange={e => {const value=parseFloat(e.target.value);if(Number.isFinite(value)) updateElement(id, { rotation: value % 360 })}}
          className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
        />
        <span className="text-gray-600">°</span>
      </label>

      </div></fieldset>
      {(() => {
        const cue=circulationDirection(el)
        if(!cue) return null
        const isStair=el.bloxId==='stairs-straight'||el.bloxId==='stairs-hatch'
        const defaultSteps=Math.max(6,Math.min(32,Math.round(Math.max(el.width,el.height)/(Math.min(el.width,el.height)*.3))))
        return <fieldset className="inspector-group"><legend>Direction & detail</legend><div className="inspector-fields">
          <span aria-label="Direction cue" title="Drawing axes, not compass bearings">{cue.label} · {cue.direction}</span>
          {isStair&&!(el.bloxId==='stairs-straight'&&stairRisers(el.properties)!==null)&&<label title="Schematic divisions only; enter physical risers below for measured design">Steps <input aria-label="Stair step count" type="number" min={2} max={64} step={1}
            value={boundedCount(el.properties.stepCount,defaultSteps)}
            onChange={e=>{const count=e.target.valueAsNumber;if(Number.isFinite(count)) updateElement(id,{properties:{...el.properties,stepCount:boundedCount(count,defaultSteps)}})}}
            className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"/></label>}
        </div></fieldset>
      })()}
      {el.bloxId==='stairs-straight'&&<StairDesignFields element={el}/>}
      <fieldset className="inspector-group inspector-position"><legend>Position · feet</legend><div className="inspector-fields">
        <label className="flex items-center gap-1"><small>X</small><CoordinateInput value={el.x} label="X coordinate" disabled={!!el.locked} onCommit={x=>updateElement(id,{x})}/></label>
        <label className="flex items-center gap-1"><small>Y</small><CoordinateInput value={el.y} label="Y coordinate" disabled={!!el.locked} onCommit={y=>updateElement(id,{y})}/></label>
      </div></fieldset>

      {/* Fill pattern + color — shown for elevation surface blox and shapes */}
      {['elev-wall-face', 'elev-spandrel-panel', 'elev-parapet', 'elev-cantilever-slab', 'elev-pier', 'shape-rect', 'shape-polygon'].includes(el.bloxId) && (() => {
        const PATTERNS: { id: string; label: string; preview: string }[] = [
          { id: 'brick',       label: 'Brick',  preview: '▦' },
          { id: 'stone',       label: 'Stone',  preview: '▤' },
          { id: 'board-batten',label: 'Siding', preview: '▥' },
          { id: 'concrete',    label: 'Conc.',  preview: '·' },
          { id: 'plain',       label: 'Plain',  preview: '□' },
        ]
        const currentPattern = (el.properties.fillPattern as string) ?? (el.bloxId === 'elev-wall-face' ? 'brick' : 'plain')
        const currentColor = (el.properties.fillColor as string) ?? '#C8966C'
        return (
          <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
            <span className="text-gray-500 mr-1">Fill</span>
            <input
              type="color"
              value={currentColor.startsWith('#') ? currentColor : '#C8966C'}
              onChange={e => updateElement(id, { properties: { ...el.properties, fillColor: e.target.value } })}
              title="Fill color"
              className="w-6 h-5 rounded cursor-pointer border border-gray-600 bg-transparent p-0"
              style={{ padding: 0 }}
            />
            {PATTERNS.map(p => (
              <button
                key={p.id}
                title={p.label}
                onClick={() => updateElement(id, { properties: { ...el.properties, fillPattern: p.id } })}
                className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  currentPattern === p.id
                    ? 'bg-blue-800 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
                }`}
              >{p.preview} {p.label}</button>
            ))}
          </div>
        )
      })()}

      {/* Flip buttons — available on all elements */}
      <div className="inspector-actions" role="group" aria-label="Object actions">
      <button
        onClick={() => updateElement(id, { properties: { ...el.properties, flipH: !el.properties.flipH } })}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${el.properties.flipH ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
        title="Flip Horizontal"
        aria-label="Flip Horizontal" aria-pressed={!!el.properties.flipH}
      ><FlipHorizontal2 size={16}/></button>
      <button
        onClick={() => updateElement(id, { properties: { ...el.properties, flipV: !el.properties.flipV } })}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${el.properties.flipV ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
        title="Flip Vertical"
        aria-label="Flip Vertical" aria-pressed={!!el.properties.flipV}
      ><FlipVertical2 size={16}/></button>

      <button
        onClick={() => updateElement(id, { locked: !el.locked })}
        aria-label={el.locked?'Unlock object':'Lock object'} title={el.locked?'Unlock object':'Lock object'} aria-pressed={!!el.locked}
        className={`text-xs px-2 py-0.5 rounded ${el.locked ? 'bg-yellow-800 text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        {el.locked ? <LockKeyhole size={16}/> : <UnlockKeyhole size={16}/>}
      </button>

      <button
        onClick={deleteSelectedElements}
        className="text-red-500 hover:text-red-400 ml-2"
        aria-label="Delete object" title="Delete object"
      >
        <Trash2 size={16} aria-hidden="true"/>
      </button>
      </div>
    </div>
  )
}
