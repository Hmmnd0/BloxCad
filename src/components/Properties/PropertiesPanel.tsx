import React from 'react'
import { useStore } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'
import { SCALES } from '../../types'
import { formatFeet } from '../../utils/scale'

function fmtPreset(ft: number): string {
  const wholeFt = Math.floor(ft)
  const inches = Math.round((ft - wholeFt) * 12)
  if (inches === 0) return `${wholeFt}'`
  if (wholeFt === 0) return `${inches}"`
  return `${wholeFt}'${inches}"`
}

export function PropertiesPanel() {
  const { project, selectedElementIds, selectedDimIds, activeBloxId, pendingBloxWidth, setPendingBloxWidth, updateElement, deleteSelectedElements, updateDimension, deleteSelectedDims } = useStore()

  // Show dimension properties when a dim is selected
  if (project && selectedDimIds.length === 1 && selectedElementIds.length === 0) {
    const dim = project.dimensions.find(d => d.id === selectedDimIds[0])
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
  const el = project.elements.find(e => e.id === id)
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
