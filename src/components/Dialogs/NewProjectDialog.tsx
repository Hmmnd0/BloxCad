import React, { useState, useMemo } from 'react'
import { Scale, DrawingMode, SCALES } from '../../types'
import { useStore } from '../../store/useStore'

const AUTOSAVE_KEY = 'bloxcad_autosave'

const SCALE_OPTIONS: { value: Scale; label: string; description: string }[] = [
  {
    value: 'eighth',
    label: SCALES.eighth.label,
    description: 'Site maps, large floor plans — 1 foot = 12px on screen'
  },
  {
    value: 'quarter',
    label: SCALES.quarter.label,
    description: 'Standard floor plans, typical residential — 1 foot = 24px on screen'
  },
  {
    value: 'half',
    label: SCALES.half.label,
    description: 'Detail drawings, small rooms — 1 foot = 48px on screen'
  }
]

const MODE_DEFAULT_SCALE: Record<DrawingMode, Scale> = {
  floorplan: 'quarter',
  elevation: 'quarter',
  detail:    'half',
}

const MODE_OPTIONS: { value: DrawingMode; label: string; description: string; icon: string }[] = [
  { value: 'floorplan', label: 'Floor Plan',  description: 'Top-down plan view — rooms, walls, fixtures', icon: '⊞' },
  { value: 'elevation', label: 'Elevation',   description: 'Building face view — height, facade, materials', icon: '▭' },
  { value: 'detail',    label: 'Detail',      description: 'Large-scale section — wall assemblies, 1 unit = 1 inch', icon: '⊟' },
]

export function NewProjectDialog() {
  const { showNewProjectDialog, project, createProject, loadProject, setShowNewProjectDialog } = useStore()
  const [name, setName] = useState('Untitled Project')
  const [scale, setScale] = useState<Scale>('quarter')
  const [mode, setMode] = useState<DrawingMode>('floorplan')

  const autosave = useMemo(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed?.project?.id) return parsed
    } catch {}
    return null
  }, [])

  if (!showNewProjectDialog) return null

  const handleCreate = () => {
    if (!name.trim()) return
    createProject(name.trim(), scale, mode)
  }

  const handleResume = () => {
    if (!autosave) return
    loadProject(autosave.project, autosave.stageX, autosave.stageY, autosave.stageScale)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-[520px] max-w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-700">
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">bloxCAD</h1>
            <p className="text-gray-400 text-sm">Architectural Drawing Tool</p>
          </div>
          {project && (
            <button
              onClick={() => setShowNewProjectDialog(false)}
              className="text-gray-500 hover:text-gray-300 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Resume last session — shown when autosave exists */}
          {autosave && !project && (
            <div className="rounded border border-teal-700/60 bg-teal-900/20 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-teal-300 text-sm font-semibold">
                  Continue working on "{autosave.project?.name ?? 'Untitled'}"
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  Restore your last session exactly where you left off
                </div>
              </div>
              <button
                onClick={handleResume}
                className="shrink-0 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded transition-colors"
              >
                Resume
              </button>
            </div>
          )}

          {/* Drawing type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Drawing Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`
                    flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors
                    ${mode === opt.value ? 'border-accent bg-accent/10' : 'border-gray-600 hover:border-gray-500'}
                  `}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={() => {
                      setMode(opt.value)
                      setScale(MODE_DEFAULT_SCALE[opt.value])
                    }}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <div className="text-white text-sm font-semibold flex items-center gap-1.5">
                      <span>{opt.icon}</span> {opt.label}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Project name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-accent focus:outline-none"
              autoFocus
            />
          </div>

          {/* Scale selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Drawing Scale
            </label>
            <div className="space-y-2">
              {SCALE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`
                    flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors
                    ${scale === opt.value
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="scale"
                    value={opt.value}
                    checked={scale === opt.value}
                    onChange={() => setScale(opt.value)}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <div className="text-white text-sm font-semibold font-mono">{opt.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          {project && (
            <button
              onClick={() => setShowNewProjectDialog(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-6 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}
