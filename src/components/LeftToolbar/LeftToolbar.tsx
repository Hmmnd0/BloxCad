import React from 'react'
import { Tool } from '../../types'
import { useStore } from '../../store/useStore'

interface ToolDef {
  id: Tool
  label: string
  shortcut: string
  icon: React.ReactNode
}

const TOOLS: ToolDef[] = [
  {
    id: 'select',
    label: 'Select',
    shortcut: 'V',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 2 L4 15 L7.5 11.5 L10 17.5 L12 16.5 L9.5 10.5 L14 10.5 Z" />
      </svg>
    )
  },
  {
    id: 'hand',
    label: 'Pan',
    shortcut: 'H',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect x="7" y="8" width="2.5" height="7" rx="1.25" />
        <rect x="10" y="6" width="2.5" height="9" rx="1.25" />
        <rect x="13" y="7" width="2.5" height="8" rx="1.25" />
        <rect x="4" y="10" width="2.5" height="5" rx="1.25" />
        <rect x="4" y="14" width="11.5" height="3" rx="1.5" />
      </svg>
    )
  },
  {
    id: 'wall',
    label: 'Wall',
    shortcut: 'W',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* Horizontal wall band */}
        <rect x="2" y="8" width="16" height="4" fill="currentColor" opacity="0.6" stroke="none" rx="0.5" />
        {/* Click-point dots */}
        <circle cx="2" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="18" cy="10" r="1.5" fill="currentColor" stroke="none" />
        {/* Hatch lines */}
        <line x1="5" y1="8" x2="7" y2="12" strokeWidth="0.8" stroke="white" opacity="0.5" />
        <line x1="9" y1="8" x2="11" y2="12" strokeWidth="0.8" stroke="white" opacity="0.5" />
        <line x1="13" y1="8" x2="15" y2="12" strokeWidth="0.8" stroke="white" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'dimension',
    label: 'Dimension',
    shortcut: 'D',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="7" x2="3" y2="13" />
        <line x1="17" y1="7" x2="17" y2="13" />
        <line x1="3" y1="14" x2="3" y2="17" strokeDasharray="1.5 1" />
        <line x1="17" y1="14" x2="17" y2="17" strokeDasharray="1.5 1" />
        <rect x="3" y="17" width="14" height="1.5" fill="currentColor" stroke="none" rx="0.5" />
      </svg>
    )
  },
  {
    id: 'rect',
    label: 'Rectangle',
    shortcut: 'S',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="14" height="10" rx="0.5" />
      </svg>
    )
  }
]

interface ToolButtonProps {
  tool: ToolDef
  active: boolean
  onClick: () => void
}

function ToolButton({ tool, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${tool.label} (${tool.shortcut})`}
      className={`
        relative flex flex-col items-center justify-center w-9 h-9 rounded transition-all
        ${active
          ? 'bg-accent text-white'
          : 'text-gray-400 hover:bg-sidebar-hover hover:text-gray-200'
        }
      `}
    >
      {tool.icon}
      <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-60">
        {tool.shortcut}
      </span>
    </button>
  )
}

export function LeftToolbar() {
  const { activeTool, setActiveTool } = useStore()

  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1 w-11 bg-sidebar border-r border-gray-700 shrink-0">
      {TOOLS.map(tool => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
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
