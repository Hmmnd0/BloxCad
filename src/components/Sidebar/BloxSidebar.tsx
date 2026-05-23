import React, { useState } from 'react'
import { BLOX_DEFINITIONS, BLOX_CATEGORIES } from '../../blox/definitions'
import { BloxCategory } from '../../types'
import { BloxItem } from './BloxItem'
import { LayersPanel } from './LayersPanel'

const CATEGORY_ICONS: Record<string, string> = {
  Walls: '▪',
  Openings: '⊡',
  Stairs: '≡',
  Fixtures: '⌂',
  Furniture: '⊞',
  Casework: '▭',
  Structural: '◉',
  Annotations: '✎',
  'Fire/Safety': '🔥'
}

function CategorySection({ category }: { category: BloxCategory }) {
  const [open, setOpen] = useState(true)
  const items = BLOX_DEFINITIONS.filter(d => d.category === category)
  if (items.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        <span className="text-sm">{CATEGORY_ICONS[category] ?? '▸'}</span>
        <span>{category}</span>
        <span className="ml-auto">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-1 space-y-0.5">
          {items.map(def => (
            <BloxItem key={def.id} def={def} />
          ))}
        </div>
      )}
    </div>
  )
}

type SidebarTab = 'library' | 'layers'

export function BloxSidebar() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<SidebarTab>('library')

  const filtered = search.trim()
    ? BLOX_DEFINITIONS.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div className="w-60 flex flex-col bg-sidebar border-l border-gray-700 select-none">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 shrink-0">
        {(['library', 'layers'] as SidebarTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              tab === t ? 'text-gray-200 border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'library' ? 'Library' : 'Layers'}
          </button>
        ))}
      </div>

      {tab === 'layers' ? (
        <LayersPanel />
      ) : (
        <>
          {/* Search */}
          <div className="px-3 py-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search blox..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs px-2 py-1.5 rounded border border-gray-600 focus:border-accent focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Shortcut hint */}
          <div className="px-3 py-1 text-[10px] text-gray-600 border-b border-gray-700">
            Click to select · Click canvas to place · ESC to cancel · R to rotate
          </div>

          {/* Blox list */}
          <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
            {filtered ? (
              <div className="px-1 space-y-0.5">
                {filtered.length === 0
                  ? <p className="text-gray-500 text-xs px-2 py-4 text-center">No results</p>
                  : filtered.map(def => <BloxItem key={def.id} def={def} />)
                }
              </div>
            ) : (
              BLOX_CATEGORIES.map(cat => (
                <CategorySection key={cat} category={cat as BloxCategory} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
