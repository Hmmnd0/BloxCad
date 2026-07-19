import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { SCALES } from '../../types'
import { exportAsPNG, exportAsPDF } from '../../utils/exportManager'

function ToolBtn({ label, title, active, disabled, onClick }: {
  label: string; title: string; active?: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        no-drag px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap
        ${disabled ? 'text-gray-600 cursor-default' :
          active ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'}
      `}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-600 mx-1 shrink-0" />
}

export function Toolbar({ onOpenClaudeSetup }: { onOpenClaudeSetup?: () => void }) {
  const {
    project, isDirty, selectedElementIds, selectedDimIds,
    deleteSelectedElements, deleteSelectedDims, rotateSelected,
    resetView, setShowNewProjectDialog,
    past, future, undo, redo,
    showDRCPanel, setShowDRCPanel,
    showTitleBlock, setShowTitleBlock,
    showLegend, setShowLegend,
    autoDimSelected, autoCallout, alignSelected, distributeSelected,
    mirrorSelected, snapModuleFt, setSnapModule,
    setDrawingMode
  } = useStore()

  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const saveMenuRef = useRef<HTMLDivElement>(null)
  const [claudeConfigured, setClaudeConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    window.api?.getClaudeStatus?.().then(s => setClaudeConfigured(s.configured)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!saveMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [saveMenuOpen])

  const handleNew = () => setShowNewProjectDialog(true)

  const handleSave = async () => {
    if (!project) return
    setSaveMenuOpen(false)
    const data = JSON.stringify(project, null, 2)
    await window.api?.saveProject(data, project.name)
  }

  const handleOpen = async () => {
    const result = await window.api?.openProject()
    if (result?.success && result.data) {
      try {
        const loaded = JSON.parse(result.data)
        useStore.getState().loadProject(loaded)
      } catch {
        alert('Failed to open project file.')
      }
    }
  }

  const handleExportPNG = async () => {
    if (!project) return
    setSaveMenuOpen(false)
    await exportAsPNG(project.name)
  }

  const handleExportPDF = async () => {
    if (!project) return
    setSaveMenuOpen(false)
    await exportAsPDF(project.name)
  }

  const hasSelection = selectedElementIds.length > 0 || selectedDimIds.length > 0
  const canRotate = selectedElementIds.length > 0

  return (
    <div className="drag-region flex items-center gap-1 h-10 pl-[78px] pr-3 bg-toolbar border-b border-gray-700 shrink-0">
      {/* File dropdown — New / Open / Save / Export */}
      <div ref={saveMenuRef} className="relative no-drag">
        <button
          onClick={() => setSaveMenuOpen(o => !o)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            saveMenuOpen ? 'bg-accent text-white' : isDirty ? 'text-yellow-300 hover:bg-gray-600 hover:text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
          title="File menu"
        >
          {isDirty ? 'File • ▾' : 'File ▾'}
        </button>
        {saveMenuOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-600 rounded shadow-lg min-w-[140px] py-1">
            <button onClick={handleNew}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
              <span>✦</span> New Project
            </button>
            <button onClick={handleOpen}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
              <span>📂</span> Open Project
            </button>
            <div className="my-1 border-t border-gray-700" />
            <button onClick={handleSave}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
              <span>💾</span> Save Project
            </button>
            {project && (
              <>
                <div className="my-1 border-t border-gray-700" />
                <button onClick={handleExportPNG}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span>⬇</span> Export PNG
                </button>
                <button onClick={handleExportPDF}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span>⬇</span> Export PDF
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* Undo / Redo */}
      <ToolBtn label="↩ Undo" title="Undo (⌘Z)" disabled={past.length === 0} onClick={undo} />
      <ToolBtn label="↪ Redo" title="Redo (⌘⇧Z)" disabled={future.length === 0} onClick={redo} />

      <Divider />

      {/* Context-sensitive selection actions */}
      {hasSelection && (
        <>
          {canRotate && (
            <>
              <ToolBtn label="↻ 90°" title="Rotate 90° (R)" onClick={() => rotateSelected(90)} />
              <ToolBtn label="↻ 45°" title="Rotate 45° (⇧R)" onClick={() => rotateSelected(45)} />
              <ToolBtn label="⇄ Mirror" title="Mirror horizontally (duplicate + flip)" onClick={() => mirrorSelected('h')} />
              <ToolBtn label="⇅ Mirror" title="Mirror vertically (duplicate + flip)" onClick={() => mirrorSelected('v')} />
            </>
          )}
          {selectedElementIds.length === 1 && (
            <>
              <ToolBtn label="↑ Dim" title="Add dimension above" onClick={() => autoDimSelected('up')} />
              <ToolBtn label="↓ Dim" title="Add dimension below" onClick={() => autoDimSelected('down')} />
              <ToolBtn label="← Dim" title="Add dimension to the left" onClick={() => autoDimSelected('left')} />
              <ToolBtn label="→ Dim" title="Add dimension to the right" onClick={() => autoDimSelected('right')} />
<ToolBtn label="⊙ Callout" title="Auto-generate material callout labels for all selected elements" onClick={autoCallout} />
            </>
          )}
          {selectedElementIds.length >= 2 && (
            <>
              <Divider />
              <ToolBtn label="⊣" title="Align Left" onClick={() => alignSelected('left')} />
              <ToolBtn label="⊢" title="Align Right" onClick={() => alignSelected('right')} />
              <ToolBtn label="⊤" title="Align Top" onClick={() => alignSelected('top')} />
              <ToolBtn label="⊥" title="Align Bottom" onClick={() => alignSelected('bottom')} />
              <ToolBtn label="↔" title="Center Horizontally" onClick={() => alignSelected('centerH')} />
              <ToolBtn label="↕" title="Center Vertically" onClick={() => alignSelected('centerV')} />
            </>
          )}
          {selectedElementIds.length >= 3 && (
            <>
              <ToolBtn label="⋯" title="Distribute Horizontally" onClick={() => distributeSelected('h')} />
              <ToolBtn label="⋮" title="Distribute Vertically" onClick={() => distributeSelected('v')} />
            </>
          )}
          <Divider />
          <ToolBtn
            label="✕ Delete" title="Delete selected (Del)"
            onClick={() => { deleteSelectedElements(); deleteSelectedDims() }}
          />
          <Divider />
        </>
      )}

      {/* Snap module */}
      {project && (
        <label className="no-drag flex items-center gap-1 text-xs text-gray-400">
          <span>Snap</span>
          <select
            value={snapModuleFt ?? ''}
            onChange={e => setSnapModule(e.target.value ? parseFloat(e.target.value) : null)}
            className="bg-gray-700 text-gray-200 text-xs px-1 py-0.5 rounded border border-gray-600"
          >
            <option value="">Auto</option>
            {(project.mode ?? 'floorplan') === 'detail' ? (
              <>
                <option value="0.125">⅛"</option>
                <option value="0.25">¼"</option>
                <option value="0.5">½"</option>
                <option value="1">1"</option>
                <option value="2">2"</option>
              </>
            ) : (
              <>
                <option value="0.25">3"</option>
                <option value="0.5">6"</option>
                <option value="1">1'</option>
                <option value="2">2'</option>
                <option value="4">4' (Wright)</option>
              </>
            )}
          </select>
        </label>
      )}

      {/* View */}
      <ToolBtn label="⌖ Fit" title="Reset view to origin" onClick={resetView} />

      {/* View toggles */}
      {project && (
        <>
          <Divider />
          <ToolBtn
            label="Title Block"
            title="Toggle title block"
            active={showTitleBlock}
            onClick={() => setShowTitleBlock(!showTitleBlock)}
          />
          <ToolBtn
            label="DRC"
            title="Design rule check"
            active={showDRCPanel}
            onClick={() => setShowDRCPanel(!showDRCPanel)}
          />
          <ToolBtn
            label="Legend"
            title="Toggle drawing legend"
            active={showLegend}
            onClick={() => setShowLegend(!showLegend)}
          />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Project info */}
      {project && (
        <div className="flex items-center gap-3 no-drag">
          <span className="text-gray-400 text-xs truncate max-w-[160px]">{project.name}</span>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded font-mono shrink-0">
            {SCALES[project.scale].label}
            {(project.mode ?? 'floorplan') === 'detail' && <span className="ml-1 text-yellow-400">in</span>}
          </span>
          {(() => {
            const mode = project.mode ?? 'floorplan'
            const next = mode === 'floorplan' ? 'elevation' : mode === 'elevation' ? 'detail' : 'floorplan'
            const icons = { floorplan: '⊞', elevation: '▭', detail: '⊟' }
            const labels = { floorplan: 'Floor Plan', elevation: 'Elevation', detail: 'Detail' }
            return (
              <button
                onClick={() => setDrawingMode(next)}
                title="Switch drawing mode"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold transition-colors bg-gray-700 hover:bg-gray-600 shrink-0"
              >
                <span>{icons[mode]}</span>
                <span className="text-gray-200">{labels[mode]}</span>
              </button>
            )
          })()}
        </div>
      )}

      {/* Claude connection — always visible, far right */}
      <div className="ml-auto flex items-center shrink-0 no-drag">
        {claudeConfigured === false ? (
          <button
            onClick={onOpenClaudeSetup}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 transition-colors text-white text-xs font-medium"
            title="Connect bloxCAD to Claude Desktop"
          >
            <span className="w-2 h-2 rounded-full bg-white/60" />
            Connect to Claude
          </button>
        ) : (
          <button
            onClick={onOpenClaudeSetup}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            title={claudeConfigured ? 'Claude Desktop connected' : 'Checking…'}
          >
            <span className={`w-2 h-2 rounded-full ${claudeConfigured ? 'bg-green-500' : 'bg-gray-600'}`} />
            <span>Claude</span>
          </button>
        )}
      </div>
    </div>
  )
}
