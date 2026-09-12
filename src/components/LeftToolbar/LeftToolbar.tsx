import React, { useRef, useState, useEffect, useCallback } from 'react'
import { MousePointer2, Hand, PenLine, Ruler, Square, ChevronRight, Pentagon, Slash, Zap, Spline } from 'lucide-react'
import { Tool, WallType } from '../../types'
import { useStore } from '../../store/useStore'
import { CadToolIcon } from './CadToolIcon'

const ArcIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 14 C5 3 13 3 16 14" />
    <path d="M4.5 14 C6.5 6 11.5 6 13.5 14" />
  </svg>
)

interface ToolDef {
  id: Tool
  label: string
  shortcut: string
  icon: React.ReactNode
}

const WALL_OPTIONS: { type: WallType; label: string; description: string }[] = [
  { type: 'wall-exterior', label: 'Exterior Wall', description: '6" framed' },
  { type: 'wall-interior', label: 'Interior Wall', description: '4½" framed' },
  { type: 'wall-cmu',      label: 'CMU Wall',      description: '8" block' },
]

const TOOLS: ToolDef[] = [
  { id: 'select',    label: 'Select',    shortcut: 'V', icon: <MousePointer2 size={18} strokeWidth={1.5} /> },
  { id: 'hand',      label: 'Pan',       shortcut: 'H', icon: <Hand          size={18} strokeWidth={1.5} /> },
  { id: 'wall',      label: 'Wall',      shortcut: 'W', icon: <CadToolIcon kind="wall" /> },
  { id: 'conduit',   label: 'Conduit',   shortcut: 'K', icon: <CadToolIcon kind="conduit" /> },
  { id: 'circuit-wire', label: 'Circuit Wire', shortcut: 'L', icon: <CadToolIcon kind="circuit" /> },
  { id: 'polygon',   label: 'Polygon',   shortcut: 'P', icon: <Pentagon      size={18} strokeWidth={1.5} /> },
  { id: 'dimension', label: 'Dimension', shortcut: 'D', icon: <CadToolIcon kind="dimension" /> },
  { id: 'rect',      label: 'Rectangle', shortcut: 'S', icon: <Square        size={18} strokeWidth={1.5} /> },
]

const LONG_PRESS_MS = 500

interface WallFlyoutProps {
  activeWallType: WallType
  isDiagonalMode: boolean
  isArcMode: boolean
  onSelectType: (type: WallType) => void
  onSelectDiagonal: () => void
  onSelectArc: () => void
  onClose: () => void
}

function WallFlyout({ activeWallType, isDiagonalMode, isArcMode, onSelectType, onSelectDiagonal, onSelectArc, onClose }: WallFlyoutProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-full top-0 ml-1 z-50 bg-sidebar border border-gray-600 rounded shadow-xl py-1 min-w-[160px]"
    >
      {WALL_OPTIONS.map(opt => (
        <button
          key={opt.type}
          onClick={() => { onSelectType(opt.type); onClose() }}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
            ${!isDiagonalMode && activeWallType === opt.type
              ? 'bg-accent text-white'
              : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            }
          `}
        >
          <CadToolIcon kind="wall" />
          <div>
            <div className="font-medium leading-tight">{opt.label}</div>
            <div className="text-[10px] opacity-60 leading-tight">{opt.description}</div>
          </div>
        </button>
      ))}
      <div className="my-1 border-t border-gray-700" />
      <button
        onClick={() => { onSelectDiagonal(); onClose() }}
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
          ${isDiagonalMode ? 'bg-accent text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}
        `}
      >
        <Slash size={14} strokeWidth={1.5} className="shrink-0" />
        <div>
          <div className="font-medium leading-tight">Free Angle</div>
          <div className="text-[10px] opacity-60 leading-tight">Any angle (A)</div>
        </div>
      </button>
      <button
        onClick={() => { onSelectArc(); onClose() }}
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
          ${isArcMode ? 'bg-accent text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}
        `}
      >
        <ArcIcon />
        <div>
          <div className="font-medium leading-tight">Arc Wall</div>
          <div className="text-[10px] opacity-60 leading-tight">3-click curved wall (C)</div>
        </div>
      </button>
    </div>
  )
}

interface ToolButtonProps {
  tool: ToolDef
  active: boolean
  activeWallType: WallType
  isDiagonalMode: boolean
  isArcMode: boolean
  onClick: () => void
  onWallSelectType: (type: WallType) => void
  onWallSelectDiagonal: () => void
  onWallSelectArc: () => void
}

function ToolButton({ tool, active, activeWallType, isDiagonalMode, isArcMode, onClick, onWallSelectType, onWallSelectDiagonal, onWallSelectArc }: ToolButtonProps) {
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const openFlyout = useCallback(() => setFlyoutOpen(true), [])
  const closeFlyout = useCallback(() => setFlyoutOpen(false), [])

  const isWall = tool.id === 'wall'

  const handlePointerDown = useCallback(() => {
    if (!isWall) return
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      openFlyout()
    }, LONG_PRESS_MS)
  }, [isWall, openFlyout])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isWall) return
    e.preventDefault()
    openFlyout()
  }, [isWall, openFlyout])

  const handleClick = useCallback(() => {
    if (didLongPress.current) { didLongPress.current = false; return }
    onClick()
  }, [onClick])

  const wallLabel = isWall
    ? isArcMode
      ? 'Arc Wall'
      : isDiagonalMode
      ? `Diagonal ${WALL_OPTIONS.find(o => o.type === activeWallType)?.label ?? 'Wall'}`
      : WALL_OPTIONS.find(o => o.type === activeWallType)?.label ?? 'Wall'
    : tool.label

  const icon = isWall && isArcMode
    ? <ArcIcon />
    : isWall && isDiagonalMode
    ? <Slash size={18} strokeWidth={1.5} />
    : tool.icon

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        aria-label={`${wallLabel} (${isArcMode && isWall ? 'C' : tool.shortcut})`}
        aria-pressed={active}
        onKeyDown={e => { if (isWall && e.key === 'ArrowRight') { e.preventDefault(); openFlyout() } if (e.key === 'Escape') closeFlyout() }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={handleContextMenu}
        title={isWall
          ? `${wallLabel}${isArcMode ? ' (C)' : ` (${tool.shortcut})`} — right-click or hold for wall types`
          : `${tool.label} (${tool.shortcut})`
        }
        className={`
          cad-tool-button relative flex flex-col items-center justify-center w-9 h-9 rounded transition-all
          ${active
            ? 'bg-accent text-white'
            : 'text-gray-400 hover:bg-sidebar-hover hover:text-gray-200'
          }
        `}
      >
        {icon}
        {isWall && (
          <ChevronRight size={7} className="absolute bottom-0.5 left-0.5 opacity-50" strokeWidth={2.5} />
        )}
        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-60">
          {tool.shortcut}
        </span>
      </button>

      {isWall && flyoutOpen && (
        <WallFlyout
          activeWallType={activeWallType}
          isDiagonalMode={isDiagonalMode}
          isArcMode={isArcMode}
          onSelectType={onWallSelectType}
          onSelectDiagonal={onWallSelectDiagonal}
          onSelectArc={onWallSelectArc}
          onClose={closeFlyout}
        />
      )}
    </div>
  )
}

export function LeftToolbar() {
  const { activeTool, activeWallType, setActiveTool, setActiveWallType, project } = useStore()
  const isDiagonalMode = activeTool === 'diagonal-wall'
  const isArcMode = activeTool === 'arc-wall'
  const isElevation = (project?.mode ?? 'floorplan') === 'elevation'
  const visibleTools = isElevation ? TOOLS.filter(t => t.id !== 'wall' && t.id !== 'conduit' && t.id !== 'circuit-wire') : TOOLS

  return (
    <div className="drawing-tools flex flex-col items-center gap-1 py-2 px-1 w-11 bg-sidebar border-r border-gray-700 shrink-0" aria-label="Drawing tools">
      {visibleTools.map(tool => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={activeTool === tool.id || (tool.id === 'wall' && (isDiagonalMode || isArcMode))}
          activeWallType={activeWallType}
          isDiagonalMode={isDiagonalMode}
          isArcMode={isArcMode}
          onClick={() => setActiveTool(tool.id)}
          onWallSelectType={(type) => setActiveWallType(type)}
          onWallSelectDiagonal={() => setActiveTool('diagonal-wall')}
          onWallSelectArc={() => setActiveTool('arc-wall')}
        />
      ))}

      <div className="w-7 h-px bg-gray-700 my-1" />

      <div className="text-[9px] text-gray-600 text-center leading-tight">
        <div>Scroll</div>
        <div>zoom</div>
      </div>
    </div>
  )
}
