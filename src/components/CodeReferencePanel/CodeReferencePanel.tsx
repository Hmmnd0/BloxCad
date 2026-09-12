import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CODE_REFERENCE, CODE_REFERENCE_DISCLAIMER, CodeRefItem } from '../../data/indianapolisResidentialCode'

export function CodeReferencePanel() {
  const { setShowCodeRefPanel } = useStore()
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['planning']))

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return CODE_REFERENCE
    return CODE_REFERENCE
      .map(g => ({
        ...g,
        items: g.items.filter((it: CodeRefItem) =>
          it.section.toLowerCase().includes(q) ||
          it.title.toLowerCase().includes(q) ||
          it.summary.toLowerCase().includes(q),
        ),
      }))
      .filter(g => g.items.length > 0)
  }, [q])

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalItems = CODE_REFERENCE.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="reference-panel utility-panel w-80 bg-sidebar border-l border-gray-700 flex flex-col shrink-0 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="font-semibold text-gray-200">
          Code Reference
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-700 text-gray-400">{totalItems}</span>
        </span>
        <button onClick={() => setShowCodeRefPanel(false)} aria-label="Close code reference" title="Close code reference" className="text-gray-500 hover:text-gray-300"><X size={16} strokeWidth={1.6} /></button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-700">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search sections (e.g. egress, R310, setback)…"
          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-[11px] placeholder-gray-600"
        />
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-gray-600">No matching sections</div>
        )}
        {filtered.map(group => {
          const isOpen = q.length > 0 || openGroups.has(group.key)
          return (
            <div key={group.key} className="border-b border-gray-800">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-800"
              >
                <span className="font-semibold text-gray-200">{group.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-600">{group.items.length}</span>
                  <span className="text-gray-500">{isOpen ? '▾' : '▸'}</span>
                </span>
              </button>
              {isOpen && (
                <div className="pb-2">
                  <div className="px-3 pb-1.5 text-[9px] text-gray-600 italic">{group.source}</div>
                  {group.items.map(item => (
                    <div key={item.id} className="px-3 py-1.5 hover:bg-gray-800/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] text-blue-400 shrink-0">{item.section}</span>
                        <span className="font-medium text-gray-200 leading-tight">{item.title}</span>
                      </div>
                      <div className="text-gray-400 leading-snug mt-0.5">{item.summary}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-2 border-t border-gray-700 text-[9px] text-gray-600 leading-snug">
        {CODE_REFERENCE_DISCLAIMER}
      </div>
    </div>
  )
}
