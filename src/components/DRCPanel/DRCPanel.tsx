import React, { useMemo, useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { PlacedElement } from '../../types'

interface Violation {
  id: string
  severity: 'error' | 'warning'
  message: string
  elementId?: string
}

const MIN_DOOR_WIDTH_FT    = 2.83  // 34" clear — ADA
const MIN_EGRESS_WIDTH_FT  = 3.0   // 36" egress door
const MIN_STAIR_WIDTH_FT   = 3.0   // IBC minimum

function overlaps(a: PlacedElement, b: PlacedElement): boolean {
  return !(
    a.x + a.width  <= b.x || b.x + b.width  <= a.x ||
    a.y + a.height <= b.y || b.y + b.height <= a.y
  )
}

function runDRC(elements: PlacedElement[]): Violation[] {
  const v: Violation[] = []

  const doors        = elements.filter(el => el.bloxId === 'door-single')
  const doubleDoors  = elements.filter(el => el.bloxId === 'door-double')
  const slidingDoors = elements.filter(el => el.bloxId === 'door-sliding')
  const allDoors     = [...doors, ...doubleDoors, ...slidingDoors]
  const stairs       = elements.filter(el => el.bloxId === 'stairs-straight')
  const walls        = elements.filter(el => el.bloxId.startsWith('wall-'))
  const fixtures     = elements.filter(el => el.bloxId.startsWith('fixture-'))
  const windows      = elements.filter(el => el.bloxId.startsWith('window-'))
  const toilets      = elements.filter(el => el.bloxId === 'fixture-toilet')
  const lavSinks     = elements.filter(el => el.bloxId === 'fixture-sink-lav')
  const kitchenSinks = elements.filter(el => el.bloxId === 'fixture-sink-kitchen')
  const ranges       = elements.filter(el => el.bloxId === 'fixture-range')
  const fridges      = elements.filter(el => el.bloxId === 'fixture-refrigerator')
  const smokeDetectors = elements.filter(el => el.bloxId === 'smoke-detector')
  const exitSigns    = elements.filter(el => el.bloxId === 'exit-sign')
  const handrails    = elements.filter(el => el.bloxId === 'handrail')

  // ── Egress ────────────────────────────────────────────────────────────────
  if (allDoors.length === 0 && elements.length > 0) {
    v.push({ id: 'no-egress', severity: 'error', message: 'No doors placed — egress path required' })
  }

  const hasEgressDoor = allDoors.some(d => d.width >= MIN_EGRESS_WIDTH_FT || d.bloxId === 'door-sliding')
  if (allDoors.length > 0 && !hasEgressDoor) {
    v.push({ id: 'no-egress-door', severity: 'error', message: `No egress door — at least one door must be ≥ ${(MIN_EGRESS_WIDTH_FT * 12).toFixed(0)}"` })
  }

  // ── Door widths ───────────────────────────────────────────────────────────
  for (const door of doors) {
    if (door.width < MIN_DOOR_WIDTH_FT) {
      v.push({
        id: `door-narrow-${door.id}`,
        severity: 'error',
        elementId: door.id,
        message: `Single door is ${(door.width * 12).toFixed(0)}" wide — ADA minimum is ${(MIN_DOOR_WIDTH_FT * 12).toFixed(0)}"`
      })
    }
  }

  // ── Stairs ────────────────────────────────────────────────────────────────
  for (const stair of stairs) {
    const w = Math.min(stair.width, stair.height)
    if (w < MIN_STAIR_WIDTH_FT) {
      v.push({
        id: `stair-narrow-${stair.id}`,
        severity: 'warning',
        elementId: stair.id,
        message: `Stair run is ${(w * 12).toFixed(0)}" wide — IBC minimum is ${(MIN_STAIR_WIDTH_FT * 12).toFixed(0)}"`
      })
    }
    if (exitSigns.length === 0) {
      v.push({ id: `stair-no-exit-sign-${stair.id}`, severity: 'warning', message: 'Stairs placed but no Exit Sign found' })
    }
    if (handrails.length === 0) {
      v.push({ id: `stair-no-handrail-${stair.id}`, severity: 'error', message: 'Stairs placed but no handrail found — IRC R311.7.8 requires a handrail on all stairways' })
    }
  }

  // ── Fixtures without walls ────────────────────────────────────────────────
  if (fixtures.length > 0 && walls.length === 0) {
    v.push({ id: 'fixtures-no-walls', severity: 'warning', message: 'Fixtures placed without any walls — add exterior walls to define the floor plan' })
  }

  // ── Windows ───────────────────────────────────────────────────────────────
  if (walls.filter(w => w.bloxId === 'wall-exterior').length > 0 && windows.length === 0) {
    v.push({ id: 'no-windows', severity: 'warning', message: 'Exterior walls placed but no windows — natural light and ventilation required' })
  }

  // ── Bathroom completeness ─────────────────────────────────────────────────
  if (toilets.length > 0 && lavSinks.length === 0) {
    v.push({ id: 'toilet-no-lav', severity: 'warning', message: 'Toilet placed but no lavatory sink — each bathroom requires a hand-washing sink' })
  }
  if (lavSinks.length > 0 && toilets.length === 0) {
    v.push({ id: 'lav-no-toilet', severity: 'warning', message: 'Lavatory sink placed but no toilet found' })
  }

  // ── Kitchen completeness ──────────────────────────────────────────────────
  const hasKitchenAppliance = ranges.length > 0 || fridges.length > 0
  if (hasKitchenAppliance && kitchenSinks.length === 0) {
    v.push({ id: 'kitchen-no-sink', severity: 'warning', message: 'Kitchen appliances placed but no kitchen sink found' })
  }

  // ── Smoke detectors ───────────────────────────────────────────────────────
  const roomLabels = elements.filter(el => el.bloxId === 'room-label')
  if (roomLabels.length >= 2 && smokeDetectors.length === 0) {
    v.push({ id: 'no-smoke-detectors', severity: 'warning', message: 'Multiple rooms detected but no smoke detectors placed' })
  }

  // ── Overlapping elements (non-wall) ───────────────────────────────────────
  const nonWall = elements.filter(el => !el.bloxId.startsWith('wall-') && !el.bloxId.startsWith('window-') && !el.bloxId.startsWith('door-') && el.bloxId !== 'cased-opening')
  for (let i = 0; i < nonWall.length; i++) {
    for (let j = i + 1; j < nonWall.length; j++) {
      const a = nonWall[i], b = nonWall[j]
      if (overlaps(a, b)) {
        v.push({
          id: `overlap-${a.id}-${b.id}`,
          severity: 'warning',
          elementId: a.id,
          message: `Overlapping elements detected — check placement`
        })
        break
      }
    }
    if (v.some(x => x.id.startsWith(`overlap-${nonWall[i].id}`))) break
  }

  return v
}

const CHECKLIST_CATEGORIES = ['Pre-Design', 'Design', 'Documents', 'Code']

export function DRCPanel() {
  const { project, setShowDRCPanel, selectElement, toggleChecklistItem, addChecklistItem, removeChecklistItem } = useStore()
  const [tab, setTab] = useState<'checks' | 'checklist'>('checks')
  const [newItemText, setNewItemText] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('Design')
  const inputRef = useRef<HTMLInputElement>(null)

  const violations = useMemo(() => {
    if (!project) return []
    return runDRC(project.elements)
  }, [project])

  if (!project) return null

  const errors   = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')
  const checklist = project.checklist ?? []
  const doneCount = checklist.filter(i => i.checked).length

  return (
    <div className="w-72 bg-sidebar border-l border-gray-700 flex flex-col shrink-0 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="font-semibold text-gray-200">
          Design Review
          {tab === 'checks' && violations.length > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${errors.length > 0 ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {violations.length}
            </span>
          )}
          {tab === 'checklist' && checklist.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-700 text-gray-400">
              {doneCount}/{checklist.length}
            </span>
          )}
        </span>
        <button onClick={() => setShowDRCPanel(false)} className="text-gray-500 hover:text-gray-300">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setTab('checks')}
          className={`flex-1 py-1.5 text-[11px] transition-colors ${tab === 'checks' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Automated Checks
          {errors.length > 0 && <span className="ml-1 text-red-400">({errors.length})</span>}
        </button>
        <button
          onClick={() => setTab('checklist')}
          className={`flex-1 py-1.5 text-[11px] transition-colors ${tab === 'checklist' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Checklist
          {doneCount === checklist.length && checklist.length > 0
            ? <span className="ml-1 text-green-400">✓</span>
            : checklist.length > 0
            ? <span className="ml-1 text-gray-600">({doneCount}/{checklist.length})</span>
            : null}
        </button>
      </div>

      {/* Automated checks tab */}
      {tab === 'checks' && (
        <>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="text-2xl mb-2">✓</div>
                <div>No issues found</div>
              </div>
            ) : (
              violations.map(v => (
                <div
                  key={v.id}
                  onClick={() => v.elementId && selectElement(v.elementId)}
                  className={`p-2 rounded border text-[11px] leading-tight ${v.elementId ? 'cursor-pointer hover:opacity-80' : ''} ${v.severity === 'error' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-yellow-950 border-yellow-800 text-yellow-300'}`}
                >
                  <span className="font-bold mr-1">{v.severity === 'error' ? '✕' : '⚠'}</span>
                  {v.message}
                  {v.elementId && <div className="text-[9px] opacity-60 mt-0.5">Click to select</div>}
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-gray-700 text-[10px] text-gray-600">
            {errors.length} error{errors.length !== 1 ? 's' : ''} · {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* Checklist tab */}
      {tab === 'checklist' && (
        <>
          <div className="flex-1 overflow-y-auto">
            {CHECKLIST_CATEGORIES.map(cat => {
              const items = checklist.filter(i => i.category === cat)
              return (
                <div key={cat}>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{cat}</div>
                  {items.length === 0 && (
                    <div className="px-3 pb-2 text-[10px] text-gray-600 italic">No items</div>
                  )}
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-800 group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="mt-0.5 accent-blue-500 shrink-0"
                      />
                      <span className={`flex-1 leading-tight ${item.checked ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 text-[10px] shrink-0"
                        title="Remove"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Custom items not in standard categories */}
            {checklist.filter(i => !CHECKLIST_CATEGORIES.includes(i.category)).length > 0 && (
              <div>
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Other</div>
                {checklist.filter(i => !CHECKLIST_CATEGORIES.includes(i.category)).map(item => (
                  <div key={item.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-800 group">
                    <input type="checkbox" checked={item.checked} onChange={() => toggleChecklistItem(item.id)} className="mt-0.5 accent-blue-500 shrink-0" />
                    <span className={`flex-1 leading-tight ${item.checked ? 'line-through text-gray-600' : 'text-gray-300'}`}>{item.text}</span>
                    <button onClick={() => removeChecklistItem(item.id)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 text-[10px] shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add item */}
          <div className="border-t border-gray-700 p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-1 py-0.5 text-[10px]"
              >
                {CHECKLIST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newItemText.trim()) {
                    addChecklistItem(newItemText.trim(), newItemCategory)
                    setNewItemText('')
                  }
                }}
                placeholder="Add checklist item…"
                className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-1.5 py-0.5 text-[10px] placeholder-gray-600"
              />
              <button
                onClick={() => {
                  if (newItemText.trim()) {
                    addChecklistItem(newItemText.trim(), newItemCategory)
                    setNewItemText('')
                    inputRef.current?.focus()
                  }
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 text-[10px]"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
