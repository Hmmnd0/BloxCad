import React, { useState } from 'react'
import { Scale, SCALES } from '../../types'
import { useStore } from '../../store/useStore'

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

const TEMPLATES = [
  { label: 'Blank', description: 'Empty canvas' },
  { label: 'Residential', description: 'Simple home layout hints' },
  { label: 'Commercial', description: 'Open office starting point' }
]

export function NewProjectDialog() {
  const { showNewProjectDialog, project, createProject, setShowNewProjectDialog } = useStore()
  const [name, setName] = useState('Untitled Project')
  const [scale, setScale] = useState<Scale>('quarter')

  if (!showNewProjectDialog) return null

  const handleCreate = () => {
    if (!name.trim()) return
    createProject(name.trim(), scale)
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
