import { app, BrowserWindow, shell, ipcMain, dialog, globalShortcut, Menu } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { randomUUID } from 'crypto'

// ── Claude Desktop integration ────────────────────────────────────────────────

function getClaudeConfigPath(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? homedir(), 'Claude', 'claude_desktop_config.json')
  }
  return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
}

function findNodePath(): string | null {
  // Try shell which/where first
  try {
    const cmd = process.platform === 'win32' ? 'where node' : 'which node'
    const found = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0].trim()
    if (found) return found
  } catch { /* fall through */ }

  // Check common install locations on macOS/Linux
  const candidates = [
    '/opt/homebrew/bin/node',   // M-series Homebrew
    '/usr/local/bin/node',      // Intel Homebrew / nvm default
    '/usr/bin/node',
    join(homedir(), '.volta', 'bin', 'node'),
    join(homedir(), '.nvm', 'versions', 'node'),  // nvm — partial, will refine below
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

function getMcpServerPath(): string {
  if (is.dev) {
    return join(__dirname, '../../mcp-server/index.mjs')
  }
  return join(process.resourcesPath, 'mcp-server', 'index.mjs')
}

async function configureClaudeDesktop(): Promise<{ success: boolean; configPath: string; error?: string }> {
  const configPath = getClaudeConfigPath()
  const nodePath = findNodePath()
  if (!nodePath) {
    return {
      success: false,
      configPath,
      error: 'Node.js was not found on this machine.\n\nInstall Node.js from nodejs.org (LTS version), then try again.'
    }
  }

  const mcpPath = getMcpServerPath()
  if (!existsSync(mcpPath)) {
    return { success: false, configPath, error: `MCP server not found at:\n${mcpPath}` }
  }

  let config: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, 'utf-8')) } catch { config = {} }
  }

  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    config.mcpServers = {}
  }
  ;(config.mcpServers as Record<string, unknown>).bloxcad = {
    command: nodePath,
    args: [mcpPath]
  }

  const configDir = join(configPath, '..')
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

  return { success: true, configPath }
}

function getClaudeStatus(): { configured: boolean; configPath: string; mcpServerPath: string } {
  const configPath = getClaudeConfigPath()
  const mcpServerPath = getMcpServerPath()
  let configured = false
  if (existsSync(configPath)) {
    try {
      const cfg = JSON.parse(readFileSync(configPath, 'utf-8'))
      configured = !!(cfg?.mcpServers?.bloxcad)
    } catch { /* */ }
  }
  return { configured, configPath, mcpServerPath }
}

function buildAppMenu(win: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' as const },
    { role: 'editMenu' as const },
    { role: 'viewMenu' as const },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Connect to Claude Desktop',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+K' : 'Ctrl+Shift+K',
          click: async () => {
            const result = await configureClaudeDesktop()
            if (result.success) {
              dialog.showMessageBox(win, {
                type: 'info',
                title: 'Connected',
                message: 'bloxCAD has been added to Claude Desktop.',
                detail: `Config saved to:\n${result.configPath}\n\nRestart Claude Desktop to activate.`,
                buttons: ['OK']
              })
            } else {
              dialog.showMessageBox(win, {
                type: 'error',
                title: 'Setup Failed',
                message: 'Could not configure Claude Desktop.',
                detail: result.error,
                buttons: ['OK']
              })
            }
          }
        },
        {
          label: 'Claude Connection Status',
          click: () => {
            const s = getClaudeStatus()
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Claude Connection Status',
              message: s.configured ? 'Claude Desktop is configured.' : 'Claude Desktop is not yet configured.',
              detail: s.configured
                ? `MCP server registered at:\n${s.mcpServerPath}\n\nConfig file:\n${s.configPath}`
                : `No bloxcad entry found in:\n${s.configPath}\n\nUse Help → Connect to Claude Desktop to set it up.`,
              buttons: ['OK']
            })
          }
        },
        { type: 'separator' as const },
        ...(process.platform !== 'darwin' ? [{ role: 'about' as const }] : [])
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── MCP bridge ────────────────────────────────────────────────────────────────
const MCP_PORT = 57489
const pendingMcpRequests = new Map<string, (result: unknown) => void>()

ipcMain.on('mcp-response', (_evt, { requestId, result }) => {
  const resolve = pendingMcpRequests.get(requestId)
  if (resolve) { pendingMcpRequests.delete(requestId); resolve(result) }
})

function sendMcpAction(win: BrowserWindow, action: string, payload: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    const requestId = randomUUID()
    pendingMcpRequests.set(requestId, resolve)
    win.webContents.send('mcp-action', { requestId, action, payload })
    setTimeout(() => {
      if (pendingMcpRequests.has(requestId)) {
        pendingMcpRequests.delete(requestId)
        resolve({ error: 'renderer timeout' })
      }
    }, 7000)
  })
}

function startMcpBridge(win: BrowserWindow) {
  const srv = createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/mcp') {
      res.writeHead(404); res.end(); return
    }
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', async () => {
      try {
        const { action, payload } = JSON.parse(body)
        const result = await sendMcpAction(win, action, payload)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: String(e) }))
      }
    })
  })
  srv.listen(MCP_PORT, '127.0.0.1', () => {
    console.log(`[bloxCAD] MCP bridge listening on localhost:${MCP_PORT}`)
  })
  srv.on('error', (e) => console.error('[bloxCAD] MCP bridge error:', e.message))
}

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

function createWindow(): BrowserWindow {
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
    if (is.dev) {
      globalShortcut.register('CommandOrControl+Alt+I', () => {
        mainWindow.webContents.toggleDevTools()
      })
    }
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

  return mainWindow
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

  ipcMain.handle('configure-claude', () => configureClaudeDesktop())
  ipcMain.handle('get-claude-status', () => getClaudeStatus())

  const win = createWindow()
  startMcpBridge(win)
  buildAppMenu(win)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
