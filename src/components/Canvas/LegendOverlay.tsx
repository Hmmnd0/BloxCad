import React from 'react'
import { useStore, getActiveElements } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'

function fmtDim(ft: number): string {
  const wholeFt = Math.floor(ft)
  const inches = Math.round((ft - wholeFt) * 12)
  if (inches === 0) return `${wholeFt}'`
  if (wholeFt === 0) return `${inches}"`
  return `${wholeFt}'${inches}"`
}

interface LegendEntry {
  key: string
  name: string
  size: string
  count: number
  category: string
}

export function LegendOverlay() {
  const { project, showLegend, setShowLegend } = useStore()

  if (!project || !showLegend) return null

  const elements = getActiveElements(useStore.getState())

  // Build entries grouped by bloxId + size
  const map = new Map<string, LegendEntry>()
  for (const el of elements) {
    if (el.bloxId === 'shape-polygon') continue
    const def = getBloxById(el.bloxId)
    const name = def?.name ?? el.bloxId
    const category = def?.category ?? 'Other'
    const size = `${fmtDim(el.width)} × ${fmtDim(el.height)}`
    const key = `${el.bloxId}|${el.width.toFixed(2)}|${el.height.toFixed(2)}`
    const existing = map.get(key)
    if (existing) {
      existing.count++
    } else {
      map.set(key, { key, name, size, count: 1, category })
    }
  }

  const entries = Array.from(map.values())

  // Group by category, sorted alphabetically within each group
  const byCategory = new Map<string, LegendEntry[]>()
  for (const entry of entries) {
    const list = byCategory.get(entry.category) ?? []
    list.push(entry)
    byCategory.set(entry.category, list)
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size))
  }
  const categories = Array.from(byCategory.keys()).sort()

  return (
    <div className="absolute top-4 left-4 z-30 bg-white border border-gray-300 rounded shadow-lg min-w-[230px] max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <span className="font-bold text-gray-700 uppercase tracking-wide text-[10px]">Legend</span>
        <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-700 text-sm leading-none ml-4">×</button>
      </div>

      {categories.length === 0 ? (
        <p className="px-3 py-3 text-xs text-gray-400 italic">No elements placed yet.</p>
      ) : (
        <div className="overflow-y-auto py-1">
          {categories.map(cat => (
            <div key={cat}>
              {/* Category header */}
              <div className="px-3 pt-2 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {cat}
              </div>
              {/* Entries */}
              {byCategory.get(cat)!.map(entry => (
                <div key={entry.key} className="flex items-baseline justify-between px-3 py-0.5 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 text-xs">{entry.name}</span>
                    <span className="text-gray-400 text-[10px] ml-1.5">{entry.size}</span>
                  </div>
                  <span className="text-gray-500 text-xs font-mono ml-3 shrink-0">×{entry.count}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
