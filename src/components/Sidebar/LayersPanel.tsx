import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Layer } from '../../types'

const DEFAULT_LAYER_ID = 'layer-default'

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6zm0 10a4 4 0 110-8 4 4 0 010 8z"/>
      <circle cx="10" cy="10" r="2"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" opacity={0.4}>
      <path d="M2 2l16 16M10 4C5 4 1 10 1 10s1.5 2.2 4 4M10 16c5 0 9-6 9-6s-1.5-2.2-4-4"/>
    </svg>
  )
}

function LockIcon({ locked }: { locked: boolean }) {
  return locked ? (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
      <rect x="4" y="9" width="12" height="10" rx="1"/>
      <path d="M7 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" opacity={0.35}>
      <rect x="4" y="9" width="12" height="10" rx="1"/>
      <path d="M7 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35"/>
    </svg>
  )
}

function LayerRow({ layer, isActive }: { layer: Layer; isActive: boolean }) {
  const { updateLayer, deleteLayer, setActiveLayer, selectedElementIds, setElementsLayer } = useStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(layer.name)

  const commitName = () => {
    if (draft.trim()) updateLayer(layer.id, { name: draft.trim() })
    else setDraft(layer.name)
    setEditing(false)
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group transition-colors ${
        isActive ? 'bg-blue-900/40 border border-blue-700/50' : 'hover:bg-gray-700/50 border border-transparent'
      }`}
      onClick={() => setActiveLayer(layer.id)}
    >
      {/* Visibility */}
      <button
        className="text-gray-400 hover:text-gray-200 shrink-0"
        onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        <EyeIcon visible={layer.visible} />
      </button>

      {/* Lock */}
      <button
        className="text-gray-400 hover:text-gray-200 shrink-0"
        onClick={e => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
      >
        <LockIcon locked={layer.locked} />
      </button>

      {/* Color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-gray-600"
        style={{ backgroundColor: layer.color }}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setDraft(layer.name); setEditing(false) } }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-gray-800 text-white text-xs px-1 py-0 rounded border border-accent outline-none"
          />
        ) : (
          <span
            className={`text-xs truncate block select-none ${layer.visible ? 'text-gray-200' : 'text-gray-500'}`}
            onDoubleClick={e => { e.stopPropagation(); setDraft(layer.name); setEditing(true) }}
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Assign selected */}
      {selectedElementIds.length > 0 && isActive === false && (
        <button
          className="hidden group-hover:block text-[9px] text-blue-400 hover:text-blue-300 shrink-0 px-0.5"
          onClick={e => { e.stopPropagation(); setElementsLayer(selectedElementIds, layer.id) }}
          title="Move selected elements to this layer"
        >
          ←
        </button>
      )}

      {/* Delete (not on default layer) */}
      {layer.id !== DEFAULT_LAYER_ID && (
        <button
          className="hidden group-hover:block text-red-500 hover:text-red-400 text-xs shrink-0"
          onClick={e => { e.stopPropagation(); deleteLayer(layer.id) }}
          title="Delete layer"
        >
          ×
        </button>
      )}
    </div>
  )
}

export function LayersPanel() {
  const { project, activeLayerId, addLayer } = useStore()
  const layers = project?.layers ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Layers</span>
        <button
          onClick={() => addLayer()}
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          title="Add layer"
        >+</button>
      </div>

      <div className="text-[9px] text-gray-600 px-3 py-1 border-b border-gray-700 shrink-0">
        Click to set active · Double-click name to rename · Hover to assign/delete
      </div>

      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1">
        {layers.map(layer => (
          <LayerRow key={layer.id} layer={layer} isActive={layer.id === activeLayerId} />
        ))}
      </div>
    </div>
  )
}
