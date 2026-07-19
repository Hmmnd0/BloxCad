import React, { useEffect, useState } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { LeftToolbar } from './components/LeftToolbar/LeftToolbar'
import { DrawingCanvas } from './components/Canvas/DrawingCanvas'
import { BloxSidebar } from './components/Sidebar/BloxSidebar'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { NewProjectDialog } from './components/Dialogs/NewProjectDialog'
import { ClaudeSetupDialog } from './components/Dialogs/ClaudeSetupDialog'
import { DRCPanel } from './components/DRCPanel/DRCPanel'
import { TitleBlock } from './components/TitleBlock/TitleBlock'
import { useStore } from './store/useStore'
import { useMcpBridge } from './hooks/useMcpBridge'

const AUTOSAVE_KEY = 'bloxcad_autosave'
const CLAUDE_SETUP_DISMISSED_KEY = 'bloxcad_claude_setup_dismissed'

// Restore autosaved project synchronously before first render to avoid flicker
try {
  const saved = localStorage.getItem(AUTOSAVE_KEY)
  if (saved && !useStore.getState().project) {
    const { project, stageX, stageY, stageScale } = JSON.parse(saved)
    if (project) {
      if (project.underlay?.imageData === '') delete project.underlay
      useStore.getState().loadProject(project, stageX, stageY, stageScale)
    }
  }
} catch {}

export default function App() {
  const { project, showNewProjectDialog, showDRCPanel, showTitleBlock } = useStore()
  const [showClaudeSetup, setShowClaudeSetup] = useState(false)
  useMcpBridge()

  // Show Claude setup dialog on first launch if not configured
  useEffect(() => {
    const dismissed = localStorage.getItem(CLAUDE_SETUP_DISMISSED_KEY)
    if (dismissed) return
    window.api?.getClaudeStatus?.().then(s => {
      if (!s.configured) setShowClaudeSetup(true)
    }).catch(() => {})
  }, [])

  // Auto-save debounced — avoids JSON.stringify on every store change (e.g. panning)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    return useStore.subscribe((state) => {
      if (!state.project || !state.isDirty) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const s = useStore.getState()
        if (!s.project || !s.isDirty) return
        const data = {
          project: s.project,
          stageX: s.stageX,
          stageY: s.stageY,
          stageScale: s.stageScale,
        }
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
        } catch {
          try {
            const stripped = {
              ...data,
              project: {
                ...data.project,
                underlay: data.project.underlay
                  ? { ...data.project.underlay, imageData: '' }
                  : undefined,
              },
            }
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(stripped))
          } catch {}
        }
      }, 600)
    })
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <Toolbar onOpenClaudeSetup={() => setShowClaudeSetup(true)} />

      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        {project ? (
          <>
            <DrawingCanvas />
            <BloxSidebar />
            {showDRCPanel && <DRCPanel />}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Create a new project to get started
          </div>
        )}
      </div>

      {project && showTitleBlock && <TitleBlock />}
      {project && <PropertiesPanel />}

      {showNewProjectDialog && <NewProjectDialog />}
      {showClaudeSetup && (
        <ClaudeSetupDialog onDismiss={() => {
          localStorage.setItem(CLAUDE_SETUP_DISMISSED_KEY, '1')
          setShowClaudeSetup(false)
        }} />
      )}
    </div>
  )
}
