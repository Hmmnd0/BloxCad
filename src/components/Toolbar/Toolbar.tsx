import React, { useState, useRef, useEffect } from 'react'
import { PermitSheetDialog } from '../Dialogs/PermitSheetDialog'
import { useStore } from '../../store/useStore'
import { SCALES } from '../../types'
import { exportAsPNG, exportAsPDF } from '../../utils/exportManager'
import { exportAsSVG } from '../../utils/svgExport'
import { Undo2, Redo2, FlipHorizontal2, FlipVertical2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Tags, AlignStartVertical, AlignEndVertical, AlignStartHorizontal, AlignEndHorizontal, AlignCenterVertical, AlignCenterHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Trash2, Crosshair, FilePlus2, FolderOpen, Save, Download, RotateCw, type LucideIcon } from 'lucide-react'

const ACTION_ICONS: Record<string, LucideIcon> = {
  '↩': Undo2, '↪': Redo2, '⇄': FlipHorizontal2, '⇅': FlipVertical2,
  '↑': ArrowUp, '↓': ArrowDown, '←': ArrowLeft, '→': ArrowRight, '⊙': Tags,
  '⊣': AlignStartVertical, '⊢': AlignEndVertical, '⊤': AlignStartHorizontal, '⊥': AlignEndHorizontal,
  '↔': AlignCenterVertical, '↕': AlignCenterHorizontal,
  '⋯': AlignHorizontalDistributeCenter, '⋮': AlignVerticalDistributeCenter,
  '✕': Trash2, '⌖': Crosshair,
}

// `compact` shrinks padding/font for icon-only buttons (a single glyph, no
// word) — the toolbar used to spell out every action ("↩ Undo", "✕ Delete")
// which is what made it overflow off-screen as soon as anything was
// selected; the glyph plus the `title` tooltip carries the same meaning in
// roughly half the width.
function ToolBtn({ label, title, active, disabled, onClick, compact }: {
  label: string; title: string; active?: boolean; disabled?: boolean; onClick: () => void; compact?: boolean
}) {
  const Icon = ACTION_ICONS[label]
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={`
        action-button no-drag ${compact ? 'px-2 text-sm' : 'px-3 text-xs'} py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0
        ${disabled ? 'text-gray-600 cursor-default' :
          active ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'}
      `}
    >
      {Icon ? <Icon size={16} strokeWidth={1.6} aria-hidden="true" /> : <>{(label === '90°' || label === '45°') && <RotateCw size={14} strokeWidth={1.6} aria-hidden="true" />}{label}</>}
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="no-drag text-[10px] uppercase tracking-wide text-gray-500 shrink-0 select-none">{children}</span>
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
    showCodeRefPanel, setShowCodeRefPanel,
    showTitleBlock, setShowTitleBlock,
    showLegend, setShowLegend,
    autoDimSelected, autoCallout, alignSelected, distributeSelected,
    mirrorSelected, snapModuleFt, setSnapModule,
    setDrawingMode
  } = useStore()

  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const [permitSheetOpen,setPermitSheetOpen]=useState(false)
  const saveMenuRef = useRef<HTMLDivElement>(null)
  const [panelsMenuOpen, setPanelsMenuOpen] = useState(false)
  const panelsMenuRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (!panelsMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (panelsMenuRef.current && !panelsMenuRef.current.contains(e.target as Node)) {
        setPanelsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelsMenuOpen])

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
    try {await exportAsPNG(project.name)} catch(error) {alert(`PNG export failed: ${error instanceof Error?error.message:String(error)}`)}
  }

  const handleExportPDF = async () => {
    if (!project) return
    setSaveMenuOpen(false)
    try {await exportAsPDF(project.name)} catch(error) {alert(`PDF export failed: ${error instanceof Error?error.message:String(error)}`)}
  }

  const handleExportSVG = async () => {
    if (!project) return
    setSaveMenuOpen(false)
    try {await exportAsSVG(project.name)} catch(error) {alert(`SVG export failed: ${error instanceof Error?error.message:String(error)}`)}
  }

  const hasSelection = selectedElementIds.length > 0 || selectedDimIds.length > 0
  const canRotate = selectedElementIds.length > 0

  return (
    <div className="workspace-toolbar flex items-center gap-1 h-10 px-4 bg-toolbar border-b border-gray-700 shrink-0">
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
              <FilePlus2 size={16} strokeWidth={1.6} /> New Project
            </button>
            <button onClick={handleOpen}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
              <FolderOpen size={16} strokeWidth={1.6} /> Open Project
            </button>
            <div className="my-1 border-t border-gray-700" />
            <button onClick={handleSave}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
              <Save size={16} strokeWidth={1.6} /> Save Project
            </button>
            {project && (
              <>
                <div className="my-1 border-t border-gray-700" />
                <button onClick={handleExportPNG}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <Download size={16} strokeWidth={1.6} /> Export PNG
                </button>
                <button onClick={handleExportPDF}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <Download size={16} strokeWidth={1.6} /> Export PDF
                </button>
                <button onClick={handleExportSVG}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <Download size={16} strokeWidth={1.6} /> Export SVG
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* Undo / Redo */}
      <ToolBtn compact label="↩" title="Undo (⌘Z)" disabled={past.length === 0} onClick={undo} />
      <ToolBtn compact label="↪" title="Redo (⌘⇧Z)" disabled={future.length === 0} onClick={redo} />

      <Divider />

      {/* Context-sensitive selection actions */}
      {hasSelection && (
        <>
          {canRotate && (
            <div className="toolbar-action-group" role="group" aria-label="Transform selection">
              <ToolBtn compact label="90°" title="Rotate 90° (R)" onClick={() => rotateSelected(90)} />
              <ToolBtn compact label="45°" title="Rotate 45° (⇧R)" onClick={() => rotateSelected(45)} />
              <ToolBtn compact label="⇄" title="Mirror horizontally (duplicate + flip)" onClick={() => mirrorSelected('h')} />
              <ToolBtn compact label="⇅" title="Mirror vertically (duplicate + flip)" onClick={() => mirrorSelected('v')} />
            </div>
          )}
          {selectedElementIds.length === 1 && (
            <div className="toolbar-action-group" role="group" aria-label="Dimension selection">
              <GroupLabel>Dim</GroupLabel>
              <ToolBtn compact label="↑" title="Add dimension above" onClick={() => autoDimSelected('up')} />
              <ToolBtn compact label="↓" title="Add dimension below" onClick={() => autoDimSelected('down')} />
              <ToolBtn compact label="←" title="Add dimension to the left" onClick={() => autoDimSelected('left')} />
              <ToolBtn compact label="→" title="Add dimension to the right" onClick={() => autoDimSelected('right')} />
              <ToolBtn compact label="⊙" title="Auto-generate material callout labels for all selected elements" onClick={autoCallout} />
            </div>
          )}
          {selectedElementIds.length >= 2 && (
            <div className="toolbar-action-group" role="group" aria-label="Align selection">
              <ToolBtn compact label="⊣" title="Align Left" onClick={() => alignSelected('left')} />
              <ToolBtn compact label="⊢" title="Align Right" onClick={() => alignSelected('right')} />
              <ToolBtn compact label="⊤" title="Align Top" onClick={() => alignSelected('top')} />
              <ToolBtn compact label="⊥" title="Align Bottom" onClick={() => alignSelected('bottom')} />
              <ToolBtn compact label="↔" title="Center Horizontally" onClick={() => alignSelected('centerH')} />
              <ToolBtn compact label="↕" title="Center Vertically" onClick={() => alignSelected('centerV')} />
            </div>
          )}
          {selectedElementIds.length >= 3 && (
            <>
              <ToolBtn compact label="⋯" title="Distribute Horizontally" onClick={() => distributeSelected('h')} />
              <ToolBtn compact label="⋮" title="Distribute Vertically" onClick={() => distributeSelected('v')} />
            </>
          )}
          <Divider />
          <ToolBtn
            compact label="✕" title="Delete selected (Del)"
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
      <ToolBtn compact label="⌖" title="Reset view to origin" onClick={resetView} />

      {/* Panels dropdown — was 4 always-visible text buttons (Title Block,
          DRC, Code Ref, Legend); collapsed into one menu since none of them
          need to be glanceable, just reachable. */}
      {project && (
        <>
          <Divider />
          <div ref={panelsMenuRef} className="relative no-drag">
            <button
              onClick={() => setPanelsMenuOpen(o => !o)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                panelsMenuOpen || showTitleBlock || showDRCPanel || showCodeRefPanel || showLegend
                  ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
              title="Panels"
            >
              Panels ▾
            </button>
            {panelsMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-600 rounded shadow-lg min-w-[180px] py-1">
                <button onClick={() => setShowTitleBlock(!showTitleBlock)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span className="w-3 text-accent">{showTitleBlock ? '✓' : ''}</span> Title Block
                </button>
                <button onClick={() => setShowDRCPanel(!showDRCPanel)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span className="w-3 text-accent">{showDRCPanel ? '✓' : ''}</span> Design Rule Check
                </button>
                <button onClick={() => setShowCodeRefPanel(!showCodeRefPanel)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span className="w-3 text-accent">{showCodeRefPanel ? '✓' : ''}</span> Code Reference
                </button>
                <button onClick={() => setShowLegend(!showLegend)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                  <span className="w-3 text-accent">{showLegend ? '✓' : ''}</span> Legend
                </button>
                <button onClick={()=>{setPermitSheetOpen(true);setPanelsMenuOpen(false)}} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700">Permit Sheet & Schedules</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Spacer */}
      {project&&permitSheetOpen&&<PermitSheetDialog onClose={()=>setPermitSheetOpen(false)}/>}
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
