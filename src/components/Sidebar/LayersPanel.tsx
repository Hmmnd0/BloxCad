import React, { useState } from 'react'
import { useStore, getActiveElements } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'
import { Layer, ElementGroup, PlacedElement, ArcWall } from '../../types'

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

function fmtDim(ft: number): string {
  const wholeFt = Math.floor(ft)
  const inches = Math.round((ft - wholeFt) * 12)
  if (inches === 0) return `${wholeFt}'`
  if (wholeFt === 0) return `${inches}"`
  return `${wholeFt}'${inches}"`
}

function GroupRow({ group, layerElements }: { group: ElementGroup; layerElements: PlacedElement[] }) {
  const { selectedElementIds, selectElement, clearSelection, enterGroup, activeGroupId, renameGroup, selectMany } = useStore()
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(group.name)

  const groupElements = layerElements.filter(el => el.groupId === group.id)
  const isActive = activeGroupId === group.id
  const allGroupIds = groupElements.map(e => e.id)
  const anySelected = allGroupIds.some(id => selectedElementIds.includes(id))

  const commitName = () => {
    if (draft.trim()) renameGroup(group.id, draft.trim())
    else setDraft(group.name)
    setEditing(false)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer group/grp transition-colors ${
          isActive ? 'bg-teal-900/40 border border-teal-700/50' :
          anySelected ? 'bg-blue-900/30 border border-transparent' :
          'hover:bg-gray-700/50 border border-transparent'
        }`}
        onClick={e => { e.stopPropagation(); selectMany(allGroupIds) }}
        onDoubleClick={e => { e.stopPropagation(); enterGroup(group.id); selectMany(allGroupIds) }}
      >
        <button
          className="text-gray-500 hover:text-gray-300 shrink-0 w-3 text-center text-[10px]"
          onClick={e => { e.stopPropagation(); setExpanded(o => !o) }}
        >
          {expanded ? '▾' : '▸'}
        </button>

        {/* Group icon */}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2DD4BF" strokeWidth="1.5" className="shrink-0">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setDraft(group.name); setEditing(false) } }}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 bg-gray-800 text-white text-[10px] px-1 py-0 rounded border border-teal-500 outline-none"
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-[10px] text-teal-300 truncate select-none"
            onDoubleClick={e => { e.stopPropagation(); setDraft(group.name); setEditing(true) }}
          >
            {group.name}
            <span className="ml-1 text-gray-600 text-[9px]">({groupElements.length})</span>
          </span>
        )}

        {isActive && <span className="text-[8px] text-teal-400 shrink-0">●</span>}
      </div>

      {expanded && groupElements.length > 0 && (
        <div className="ml-8 mb-0.5">
          {groupElements.map(el => {
            const def = getBloxById(el.bloxId)
            const isSelected = selectedElementIds.includes(el.id)
            return (
              <div
                key={el.id}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-[10px] transition-colors ${
                  isSelected ? 'bg-blue-800/50 text-blue-200' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }`}
                onClick={e => {
                  e.stopPropagation()
                  if (e.shiftKey || e.metaKey) selectElement(el.id, true)
                  else { clearSelection(); selectElement(el.id) }
                }}
                title={`${def?.name ?? el.bloxId} — ${fmtDim(el.width)} × ${fmtDim(el.height)}`}
              >
                <span className="truncate flex-1">{def?.name ?? el.bloxId}</span>
                <span className="text-gray-600 shrink-0">{fmtDim(el.width)}×{fmtDim(el.height)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LayerRow({ layer, isActive }: { layer: Layer; isActive: boolean }) {
  const { updateLayer, deleteLayer, setActiveLayer, selectedElementIds, selectedArcWallIds, setElementsLayer, selectElement, selectArcWall, clearSelection, project } = useStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(layer.name)
  const [expanded, setExpanded] = useState(true)

  const elements = getActiveElements(useStore.getState()).filter(
    el => (el.layerId ?? DEFAULT_LAYER_ID) === layer.id
  )
  const arcWalls = (project?.arcWalls ?? []).filter(
    w => (w.layerId ?? DEFAULT_LAYER_ID) === layer.id
  )

  const commitName = () => {
    if (draft.trim()) updateLayer(layer.id, { name: draft.trim() })
    else setDraft(layer.name)
    setEditing(false)
  }

  return (
    <div>
      {/* Layer header row */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group transition-colors ${
          isActive ? 'bg-blue-900/40 border border-blue-700/50' : 'hover:bg-gray-700/50 border border-transparent'
        }`}
        onClick={() => setActiveLayer(layer.id)}
      >
        {/* Expand toggle */}
        <button
          className="text-gray-500 hover:text-gray-300 shrink-0 w-3 text-center text-[10px]"
          onClick={e => { e.stopPropagation(); setExpanded(o => !o) }}
        >
          {expanded ? '▾' : '▸'}
        </button>

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
              {(elements.length + arcWalls.length) > 0 && (
                <span className="ml-1 text-gray-600 text-[9px]">({elements.length + arcWalls.length})</span>
              )}
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

      {/* Elements in this layer — groups first, then ungrouped, then arc walls */}
      {expanded && (elements.length > 0 || arcWalls.length > 0) && (() => {
        const groups = project?.groups ?? []
        const layerGroups = groups.filter(g => elements.some(el => el.groupId === g.id))
        const ungrouped = elements.filter(el => !el.groupId)
        return (
          <div className="ml-3 mb-0.5">
            {layerGroups.map(group => (
              <GroupRow key={group.id} group={group} layerElements={elements} />
            ))}
            {ungrouped.map(el => {
              const def = getBloxById(el.bloxId)
              const isSelected = selectedElementIds.includes(el.id)
              return (
                <div
                  key={el.id}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-[10px] transition-colors ${
                    isSelected ? 'bg-blue-800/50 text-blue-200' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                  onClick={e => {
                    e.stopPropagation()
                    if (e.shiftKey || e.metaKey) selectElement(el.id, true)
                    else { clearSelection(); selectElement(el.id) }
                  }}
                  title={`${def?.name ?? el.bloxId} — ${fmtDim(el.width)} × ${fmtDim(el.height)}`}
                >
                  <span className="truncate flex-1">{def?.name ?? el.bloxId}</span>
                  <span className="text-gray-600 shrink-0">{fmtDim(el.width)}×{fmtDim(el.height)}</span>
                </div>
              )
            })}
            {arcWalls.map(wall => {
              const isSelected = selectedArcWallIds.includes(wall.id)
              const radiusLabel = `R=${fmtDim(wall.radius)}`
              return (
                <div
                  key={wall.id}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-[10px] transition-colors ${
                    isSelected ? 'bg-blue-800/50 text-blue-200' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                  onClick={e => {
                    e.stopPropagation()
                    selectArcWall(wall.id, e.shiftKey || e.metaKey)
                  }}
                  title={`Arc Wall — ${radiusLabel}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
                    <path d="M1 8 C3 2 7 2 9 8" />
                  </svg>
                  <span className="truncate flex-1">Arc Wall</span>
                  <span className="text-gray-600 shrink-0">{radiusLabel}</span>
                </div>
              )
            })}
          </div>
        )
      })()}
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
        Click layer to activate · Click element to select · ⇧/⌘ multi-select · Double-click name to rename
      </div>

      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1">
        {layers.map(layer => (
          <LayerRow key={layer.id} layer={layer} isActive={layer.id === activeLayerId} />
        ))}
      </div>
    </div>
  )
}
