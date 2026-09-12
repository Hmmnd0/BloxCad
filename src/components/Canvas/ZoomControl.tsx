import React, { useEffect, useRef, useState } from 'react'
import { Minus, Plus, ChevronDown, Scan } from 'lucide-react'

interface ZoomControlProps {
  stageScale: number
  onSetZoom: (scale: number) => void
  onFit: () => void
}
const PRESETS = [0.5, 1, 1.5, 2]
export function ZoomControl({ stageScale, onSetZoom, onFit }: ZoomControlProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  return <div ref={root} className="zoom-dock" data-testid="canvas-zoom-dock" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }}>
    {open && <div className="zoom-popover" aria-label="Zoom presets">
      {PRESETS.map(p => <button key={p} aria-pressed={Math.abs(stageScale - p) < .001} onClick={() => { onSetZoom(p); setOpen(false) }}>{Math.round(p * 100)}%</button>)}
      <button onClick={() => { onFit(); setOpen(false) }}><Scan size={14} /> Fit to screen</button>
    </div>}
    <button aria-label="Zoom out" title="Zoom out" onClick={() => onSetZoom(Math.max(.1, stageScale / 1.2))}><Minus size={15} /></button>
    <button className="zoom-value" aria-label="Zoom options" aria-expanded={open} onClick={() => setOpen(v => !v)}>{Math.round(stageScale * 100)}%<ChevronDown size={12} /></button>
    <button aria-label="Zoom in" title="Zoom in" onClick={() => onSetZoom(Math.min(5, stageScale * 1.2))}><Plus size={15} /></button>
    <span className="zoom-divider" />
    <button aria-label="Fit to screen" title="Fit to screen" onClick={onFit}><Scan size={15} /></button>
  </div>
}
