import React from 'react'
import { useStore, getActiveElements, getActiveDimensions } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'
import { SCALES, Scale } from '../../types'
import { formatFeet } from '../../utils/scale'

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
      const dist = isHoriz ? Math.abs(dim.x2 - dim.x1) : Math.abs(dim.y2 - dim.y1)
      return (
        <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
          <span className="font-semibold text-gray-200">Dimension</span>
          <span className="text-gray-400">{isHoriz ? 'Horizontal' : 'Vertical'} · {formatFeet(dist)}</span>
          <label className="flex items-center gap-1">
            <span className="text-gray-500">Offset</span>
            <input
              type="number"
              value={dim.offset.toFixed(2)}
              step={0.5}
              min={0.5}
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

  if (!project || selectedElementIds.length === 0) {
    return (
      <div className="h-8 flex items-center px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-500">
        V select · H hand · W wall · D dim · S rect · R rotate · ⌘A select all · ⌘=/- zoom · ⌘0 fit · Arrows nudge · ⌘Z/⇧Z undo/redo · Del delete
      </div>
    )
  }

  const count = selectedElementIds.length

  if (count > 1) {
    return (
      <div className="h-8 flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-400">
        <span>{count} elements selected</span>
        <button onClick={deleteSelectedElements} className="text-red-400 hover:text-red-300">Delete all</button>
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
  if (el.bloxId === 'annotation-door-tag') {
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200 shrink-0">Door Tag</span>
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
    const panes = typeof el.properties.paneCount === 'number' ? el.properties.paneCount : 2
    return (
      <div className="flex items-center gap-3 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
        <span className="font-semibold text-gray-200">Multi-Pane Window</span>
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
    const steps = typeof el.properties.stepCount === 'number' ? el.properties.stepCount : 10
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

  return (
    <div className="flex items-center gap-4 px-4 bg-toolbar border-t border-gray-700 text-xs text-gray-300 h-9 shrink-0">
      <span className="font-semibold text-gray-200">{def?.name ?? el.bloxId}</span>

      <label className="flex items-center gap-1">
        <span className="text-gray-500">W</span>
        <input
          type="number"
          value={el.width.toFixed(2)}
          step={0.5}
          min={def?.minWidth ?? 0.5}
          onChange={e => updateElement(id, { width: parseFloat(e.target.value) || el.width })}
          className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
        />
        <span className="text-gray-600">ft</span>
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
        <input
          type="number"
          value={el.height.toFixed(2)}
          step={0.25}
          min={def?.minHeight ?? 0.25}
          onChange={e => updateElement(id, { height: parseFloat(e.target.value) || el.height })}
          className="w-16 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
        />
        <span className="text-gray-600">ft</span>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-gray-500">∠</span>
        <input
          type="number"
          value={el.rotation}
          step={15}
          onChange={e => updateElement(id, { rotation: parseFloat(e.target.value) % 360 })}
          className="w-14 bg-gray-800 text-white px-1.5 py-0.5 rounded border border-gray-600 text-xs"
        />
        <span className="text-gray-600">°</span>
      </label>

      <span className="text-gray-600">
        ({formatFeet(el.x)}, {formatFeet(el.y)})
      </span>

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
      <button
        onClick={() => updateElement(id, { properties: { ...el.properties, flipH: !el.properties.flipH } })}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${el.properties.flipH ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
        title="Flip Horizontal"
      >⇄ H</button>
      <button
        onClick={() => updateElement(id, { properties: { ...el.properties, flipV: !el.properties.flipV } })}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${el.properties.flipV ? 'bg-blue-800 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
        title="Flip Vertical"
      >⇅ V</button>

      <button
        onClick={() => updateElement(id, { locked: !el.locked })}
        className={`text-xs px-2 py-0.5 rounded ${el.locked ? 'bg-yellow-800 text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        {el.locked ? '🔒 Locked' : 'Lock'}
      </button>

      <button
        onClick={deleteSelectedElements}
        className="text-red-500 hover:text-red-400 ml-2"
      >
        Delete
      </button>
    </div>
  )
}
