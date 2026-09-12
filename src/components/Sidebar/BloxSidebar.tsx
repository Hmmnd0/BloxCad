import React, { useState } from 'react'
import { BLOX_DEFINITIONS, BLOX_CATEGORIES, FLOORPLAN_CATEGORIES, ELEVATION_CATEGORIES, DETAIL_CATEGORIES } from '../../blox/definitions'
import { BloxCategory } from '../../types'
import { BloxItem } from './BloxItem'
import { LayersPanel } from './LayersPanel'
import { UnderlayPanel } from './UnderlayPanel'
import { useStore } from '../../store/useStore'
import { Search, Library, ChevronDown, ChevronRight } from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  Walls: '▪',
  Openings: '⊡',
  Stairs: '≡',
  Fixtures: '⌂',
  Furniture: '⊞',
  Casework: '▭',
  Structural: '◉',
  Details: '⊟',
  Annotations: '✎',
  'Fire/Safety': '🔥',
  Elevation: '▭',
  Site: '🌳',
}

function CategorySection({ category }: { category: BloxCategory }) {
  const [open, setOpen] = useState(true)
  const items = BLOX_DEFINITIONS.filter(d => d.category === category)
  if (items.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="library-category w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        <span>{category}</span>
        <span className="category-count">{items.length}</span>
        <span className="ml-auto">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      </button>
      {open && (
        <div className="library-grid">
          {items.map(def => (
            <BloxItem key={def.id} def={def} />
          ))}
        </div>
      )}
    </div>
  )
}

type SidebarTab = 'library' | 'layers' | 'underlay'

// Related blox shown after placing a specific blox
const NEXT_SUGGESTIONS: Record<string, { bloxId: string; label: string }[]> = {
  'detail-rafter':          [{ bloxId: 'detail-pitched-layer', label: 'Plywood sheathing' }, { bloxId: 'detail-vent-baffle', label: 'Vent baffle' }],
  'detail-pitched-layer':   [{ bloxId: 'detail-pitched-layer', label: 'Felt underlayment' }, { bloxId: 'detail-pitched-layer', label: 'Shingles' }, { bloxId: 'detail-flashing', label: 'Drip edge' }],
  'detail-stud-2x4':        [{ bloxId: 'insulation-batt', label: 'Batt insulation' }, { bloxId: 'detail-drywall', label: 'Drywall' }],
  'detail-stud-2x6':        [{ bloxId: 'insulation-batt', label: 'Batt insulation' }, { bloxId: 'detail-drywall', label: 'Drywall' }],
  'detail-stud-2x4-face':   [{ bloxId: 'detail-plywood', label: 'Wall sheathing' }, { bloxId: 'detail-brick-veneer', label: 'Brick veneer' }],
  'detail-stud-2x6-face':   [{ bloxId: 'detail-plywood', label: 'Wall sheathing' }, { bloxId: 'detail-rigid-insulation', label: 'Rigid insulation' }],
  'insulation-batt':        [{ bloxId: 'detail-drywall', label: 'Drywall' }, { bloxId: 'detail-plywood', label: 'Sheathing' }],
  'detail-soffit-panel':    [{ bloxId: 'detail-gutter', label: 'Gutter' }, { bloxId: 'detail-stud-2x4', label: 'Frieze board' }],
  'detail-flashing':        [{ bloxId: 'detail-gutter', label: 'Gutter' }],
  'detail-plywood':         [{ bloxId: 'detail-rigid-insulation', label: 'Rigid insulation' }, { bloxId: 'detail-felt', label: 'Felt underlayment' }],
  'wall-exterior':          [{ bloxId: 'door-single', label: 'Door' }, { bloxId: 'window-single', label: 'Window' }],
  'wall-interior':          [{ bloxId: 'door-single', label: 'Door' }, { bloxId: 'cased-opening', label: 'Cased opening' }],
}

function SuggestionBanner() {
  const lastPlacedBloxId = useStore(s => s.lastPlacedBloxId)
  const clearLastPlaced = useStore(s => s.clearLastPlaced)
  const setActiveBlox = useStore(s => s.setActiveBlox)
  const suggestions = lastPlacedBloxId ? (NEXT_SUGGESTIONS[lastPlacedBloxId] ?? []) : []
  if (suggestions.length === 0) return null
  return (
    <div className="mx-2 my-1.5 p-2 rounded bg-accent/10 border border-accent/30 text-[10px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-accent font-semibold">Add next →</span>
        <button onClick={clearLastPlaced} className="text-gray-500 hover:text-gray-300 text-xs leading-none">✕</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map(s => (
          <button
            key={s.bloxId + s.label}
            onClick={() => { setActiveBlox(s.bloxId); clearLastPlaced() }}
            className="px-2 py-0.5 rounded bg-gray-700 hover:bg-accent text-gray-300 hover:text-white transition-colors text-[10px]"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BloxSidebar() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tab, setTab] = useState<SidebarTab>('library')
  const project = useStore(s => s.project)
  const mode = project?.mode ?? 'floorplan'
  const activeCategories: readonly BloxCategory[] = mode === 'elevation' ? ELEVATION_CATEGORIES : mode === 'detail' ? DETAIL_CATEGORIES : FLOORPLAN_CATEGORIES

  const filtered = search.trim()
    ? BLOX_DEFINITIONS.filter(d =>
        activeCategories.includes(d.category) &&
        (categoryFilter === 'all' || !activeCategories.includes(categoryFilter as BloxCategory) || d.category === categoryFilter) &&
        (d.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        d.description.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : null

  return (
    <aside className="blox-library flex flex-col bg-sidebar border-l border-gray-700 select-none" aria-label="Blox library">
      <div className="library-heading"><Library size={18} /><div><h2>Design library</h2><p>Every detail starts here.</p></div></div>
      {/* Tabs */}
      <div className="flex border-b border-gray-700 shrink-0">
        {(['library', 'layers', 'underlay'] as SidebarTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              tab === t ? 'text-gray-200 border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'library' ? 'Library' : t === 'layers' ? 'Layers' : 'Underlay'}
          </button>
        ))}
      </div>

      {tab === 'layers' ? (
        <LayersPanel />
      ) : tab === 'underlay' ? (
        <UnderlayPanel />
      ) : (
        <>
          {/* Search */}
          <div className="library-search px-3 py-2">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search walls, doors, fixtures…"
              aria-label="Search blox"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-xs px-2 py-1.5 rounded border border-gray-600 focus:border-accent focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Shortcut hint */}
          <div className="library-filter">
            <label htmlFor="library-category">Category</label>
            <select id="library-category" value={activeCategories.includes(categoryFilter as BloxCategory) ? categoryFilter : 'all'} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {activeCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="library-hint">
            Select a blox, then place it on your plan.<br /><kbd>Esc</kbd> Cancel <kbd>R</kbd> Rotate
          </div>

          {/* Blox list */}
          <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
            {filtered ? (
              <div className="library-grid">
                {filtered.length === 0
                  ? <p className="text-gray-500 text-xs px-2 py-4 text-center">No results</p>
                  : filtered.map(def => <BloxItem key={def.id} def={def} />)
                }
              </div>
            ) : (
              activeCategories.filter(cat => categoryFilter === 'all' || !activeCategories.includes(categoryFilter as BloxCategory) || cat === categoryFilter).map(cat => (
                <CategorySection key={cat} category={cat as BloxCategory} />
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
