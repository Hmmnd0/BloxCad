/// <reference types="vite/client" />

interface Window {
  api: {
    saveProject: (data: string, defaultName: string) => Promise<{ success: boolean; filePath?: string }>
    openProject: () => Promise<{ success: boolean; data?: string; filePath?: string }>
    exportPNG: (dataUrl: string, defaultName: string) => Promise<{ success: boolean }>
    exportPDF: (dataUrl: string, imgWidth: number, imgHeight: number, defaultName: string) => Promise<{ success: boolean }>
  }
}
