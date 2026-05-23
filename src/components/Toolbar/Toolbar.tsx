import React from 'react'
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

export function Toolbar() {
  const {
    project, isDirty, selectedElementIds, selectedDimIds,
    deleteSelectedElements, deleteSelectedDims, rotateSelected,
    resetView, setShowNewProjectDialog,
    past, future, undo, redo,
    showDRCPanel, setShowDRCPanel,
    showTitleBlock, setShowTitleBlock,
    autoDimSelected, alignSelected, distributeSelected
  } = useStore()

  const handleNew = () => setShowNewProjectDialog(true)

  const handleSave = async () => {
    if (!project) return
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
    await exportAsPNG(project.name)
  }

  const handleExportPDF = async () => {
    if (!project) return
    await exportAsPDF(project.name)
  }

  const hasSelection = selectedElementIds.length > 0 || selectedDimIds.length > 0
  const canRotate = selectedElementIds.length > 0

  return (
    <div className="drag-region flex items-center gap-1 h-10 pl-[78px] pr-3 bg-toolbar border-b border-gray-700 shrink-0">
      {/* File ops */}
      <ToolBtn label="New" title="New project" onClick={handleNew} />
      <ToolBtn label="Open" title="Open project" onClick={handleOpen} />
      <ToolBtn
        label={isDirty ? 'Save •' : 'Save'}
        title="Save project"
        onClick={handleSave}
      />

      <Divider />

      {/* Undo / Redo */}
      <ToolBtn label="↩ Undo" title="Undo (⌘Z)" disabled={past.length === 0} onClick={undo} />
      <ToolBtn label="↪ Redo" title="Redo (⌘⇧Z)" disabled={future.length === 0} onClick={redo} />

      <Divider />

      {/* Context-sensitive selection actions */}
      {hasSelection && (
        <>
          {canRotate && (
            <ToolBtn label="↻ Rotate" title="Rotate 90° (R)" onClick={() => rotateSelected(90)} />
          )}
          {selectedElementIds.length === 1 && (
            <>
              <ToolBtn label="⊢ Dim Out" title="Add dimension lines outside element" onClick={() => autoDimSelected('outside')} />
              <ToolBtn label="⊣ Dim In" title="Add dimension lines inside element" onClick={() => autoDimSelected('inside')} />
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

      {/* View */}
      <ToolBtn label="⌖ Fit" title="Reset view to origin" onClick={resetView} />

      {/* Export */}
      {project && (
        <>
          <Divider />
          <ToolBtn label="⬇ PNG" title="Export as PNG image" onClick={handleExportPNG} />
          <ToolBtn label="⬇ PDF" title="Export as PDF" onClick={handleExportPDF} />
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
          </span>
        </div>
      )}
    </div>
  )
}
