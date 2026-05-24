import React from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { LeftToolbar } from './components/LeftToolbar/LeftToolbar'
import { DrawingCanvas } from './components/Canvas/DrawingCanvas'
import { BloxSidebar } from './components/Sidebar/BloxSidebar'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { NewProjectDialog } from './components/Dialogs/NewProjectDialog'
import { DRCPanel } from './components/DRCPanel/DRCPanel'
import { TitleBlock } from './components/TitleBlock/TitleBlock'
import { useStore } from './store/useStore'
import { useMcpBridge } from './hooks/useMcpBridge'

export default function App() {
  const { project, showNewProjectDialog, showDRCPanel, showTitleBlock } = useStore()
  useMcpBridge()

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <Toolbar />

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
    </div>
  )
}
