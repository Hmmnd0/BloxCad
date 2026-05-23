import React, { useRef, useState, useEffect, useCallback } from 'react'
import { MousePointer2, Hand, PenLine, Ruler, Square, ChevronRight } from 'lucide-react'
import { Tool, WallType } from '../../types'
import { useStore } from '../../store/useStore'

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
  { id: 'wall',      label: 'Wall',      shortcut: 'W', icon: <PenLine       size={18} strokeWidth={1.5} /> },
  { id: 'dimension', label: 'Dimension', shortcut: 'D', icon: <Ruler         size={18} strokeWidth={1.5} /> },
  { id: 'rect',      label: 'Rectangle', shortcut: 'S', icon: <Square        size={18} strokeWidth={1.5} /> },
]

const LONG_PRESS_MS = 500

interface WallFlyoutProps {
  activeWallType: WallType
  onSelect: (type: WallType) => void
  onClose: () => void
}

function WallFlyout({ activeWallType, onSelect, onClose }: WallFlyoutProps) {
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
          onClick={() => { onSelect(opt.type); onClose() }}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors
            ${activeWallType === opt.type
              ? 'bg-accent text-white'
              : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            }
          `}
        >
          <PenLine size={14} strokeWidth={1.5} className="shrink-0" />
          <div>
            <div className="font-medium leading-tight">{opt.label}</div>
            <div className="text-[10px] opacity-60 leading-tight">{opt.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

interface ToolButtonProps {
  tool: ToolDef
  active: boolean
  activeWallType: WallType
  onClick: () => void
  onWallSelect: (type: WallType) => void
}

function ToolButton({ tool, active, activeWallType, onClick, onWallSelect }: ToolButtonProps) {
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const openFlyout = useCallback(() => setFlyoutOpen(true), [])
  const closeFlyout = useCallback(() => setFlyoutOpen(false), [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (tool.id !== 'wall') return
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      openFlyout()
    }, LONG_PRESS_MS)
  }, [tool.id, openFlyout])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (tool.id !== 'wall') return
    e.preventDefault()
    openFlyout()
  }, [tool.id, openFlyout])

  const handleClick = useCallback(() => {
    if (didLongPress.current) { didLongPress.current = false; return }
    onClick()
  }, [onClick])

  const wallLabel = tool.id === 'wall'
    ? WALL_OPTIONS.find(o => o.type === activeWallType)?.label ?? 'Wall'
    : tool.label

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={handleContextMenu}
        title={tool.id === 'wall'
          ? `${wallLabel} (${tool.shortcut}) — right-click or hold for wall types`
          : `${tool.label} (${tool.shortcut})`
        }
        className={`
          relative flex flex-col items-center justify-center w-9 h-9 rounded transition-all
          ${active
            ? 'bg-accent text-white'
            : 'text-gray-400 hover:bg-sidebar-hover hover:text-gray-200'
          }
        `}
      >
        {tool.icon}
        {tool.id === 'wall' && (
          <ChevronRight
            size={7}
            className="absolute bottom-0.5 left-0.5 opacity-50"
            strokeWidth={2.5}
          />
        )}
        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-60">
          {tool.shortcut}
        </span>
      </button>

      {tool.id === 'wall' && flyoutOpen && (
        <WallFlyout
          activeWallType={activeWallType}
          onSelect={onWallSelect}
          onClose={closeFlyout}
        />
      )}
    </div>
  )
}

export function LeftToolbar() {
  const { activeTool, activeWallType, setActiveTool, setActiveWallType } = useStore()

  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1 w-11 bg-sidebar border-r border-gray-700 shrink-0">
      {TOOLS.map(tool => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={activeTool === tool.id}
          activeWallType={activeWallType}
          onClick={() => setActiveTool(tool.id)}
          onWallSelect={(type) => setActiveWallType(type)}
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
