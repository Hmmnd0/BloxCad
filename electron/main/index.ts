import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync } from 'fs'

function buildImagePDF(jpegBuf: Buffer, imgW: number, imgH: number): Buffer {
  // Scale image to fill Letter landscape (792 x 612 pt) while preserving aspect ratio
  const pageW = 792
  const pageH = 612
  const scale = Math.min(pageW / imgW, pageH / imgH)
  const drawW = Math.round(imgW * scale)
  const drawH = Math.round(imgH * scale)
  const offsetX = Math.round((pageW - drawW) / 2)
  const offsetY = Math.round((pageH - drawH) / 2)

  const parts: Buffer[] = []
  const offsets: number[] = []
  let pos = 0

  function emit(s: string | Buffer) {
    const buf = typeof s === 'string' ? Buffer.from(s) : s
    parts.push(buf)
    pos += buf.length
  }

  emit('%PDF-1.4\n')

  offsets.push(pos)
  emit('1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n')

  offsets.push(pos)
  emit('2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n')

  offsets.push(pos)
  emit(`3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources <</XObject <</Im0 5 0 R>>>>>>\nendobj\n`)

  const stream = `q ${drawW} 0 0 ${drawH} ${offsetX} ${offsetY} cm /Im0 Do Q`
  offsets.push(pos)
  emit(`4 0 obj\n<</Length ${stream.length}>>\nstream\n${stream}\nendstream\nendobj\n`)

  offsets.push(pos)
  emit(`5 0 obj\n<</Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuf.length}>>\nstream\n`)
  emit(jpegBuf)
  emit('\nendstream\nendobj\n')

  const xrefPos = pos
  const xref = ['xref', `0 ${offsets.length + 1}`, '0000000000 65535 f ']
  offsets.forEach(o => xref.push(o.toString().padStart(10, '0') + ' 00000 n '))
  emit(xref.join('\n') + '\n')
  emit(`trailer\n<</Size ${offsets.length + 1} /Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`)

  return Buffer.concat(parts)
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1A1D23',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bloxcad.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('save-project', async (_, { data, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${defaultName}.bloxcad`,
      filters: [{ name: 'bloxCAD Project', extensions: ['bloxcad'] }]
    })
    if (!canceled && filePath) {
      writeFileSync(filePath, data, 'utf-8')
      return { success: true, filePath }
    }
    return { success: false }
  })

  ipcMain.handle('export-png', async (_, { dataUrl, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${defaultName}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })
    if (!canceled && filePath) {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
      writeFileSync(filePath, Buffer.from(base64, 'base64'))
      return { success: true }
    }
    return { success: false }
  })

  ipcMain.handle('export-pdf', async (_, { dataUrl, imgWidth, imgHeight, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${defaultName}.pdf`,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false }

    const base64 = (dataUrl as string).replace(/^data:image\/jpeg;base64,/, '')
    const jpegBuf = Buffer.from(base64, 'base64')
    const pdfBuf = buildImagePDF(jpegBuf, imgWidth as number, imgHeight as number)
    writeFileSync(filePath, pdfBuf)
    return { success: true }
  })

  ipcMain.handle('open-project', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'bloxCAD Project', extensions: ['bloxcad'] }],
      properties: ['openFile']
    })
    if (!canceled && filePaths[0]) {
      const data = readFileSync(filePaths[0], 'utf-8')
      return { success: true, data, filePath: filePaths[0] }
    }
    return { success: false }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
