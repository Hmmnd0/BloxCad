import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  saveProject: (data: string, defaultName: string) =>
    ipcRenderer.invoke('save-project', { data, defaultName }),
  openProject: () =>
    ipcRenderer.invoke('open-project'),
  exportPNG: (dataUrl: string, defaultName: string) =>
    ipcRenderer.invoke('export-png', { dataUrl, defaultName }),
  exportPDF: (dataUrl: string, imgWidth: number, imgHeight: number, defaultName: string) =>
    ipcRenderer.invoke('export-pdf', { dataUrl, imgWidth, imgHeight, defaultName })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
