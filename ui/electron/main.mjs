import electron from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import isElevated from 'is-elevated'
import fs from 'node:fs/promises'

const { app, BrowserWindow, ipcMain } = electron

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    backgroundColor: '#0b0d12',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Diagnostics: surface renderer problems in terminal.
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    // eslint-disable-next-line no-console
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`)
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    // eslint-disable-next-line no-console
    console.log('[renderer] gone:', details)
  })
  win.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    // eslint-disable-next-line no-console
    console.log('[did-fail-load]', { errorCode, errorDescription, validatedURL })
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html')

  // In dev, try the Vite dev server; if it's not running, fall back to dist.
  if (devUrl) {
    win
      .loadURL(devUrl)
      .catch(() => {
        win.loadFile(distIndex).catch(() => {
          win.loadURL(
            'data:text/html;charset=utf-8,' +
              encodeURIComponent(
                `<html><body style="font-family:Segoe UI,Arial,sans-serif;background:#0b0d12;color:#fff;padding:24px">
                  <h2>WinKam UI</h2>
                  <p>Dev server baslatilamadi (<code>${devUrl}</code>).</p>
                  <p>Lutfen <code>npm run electron:dev</code> kullanin veya once <code>npm run build</code> alin.</p>
                </body></html>`,
              ),
          )
        })
      })
  } else {
    // Production / standalone: load built UI
    win.loadFile(distIndex)
  }

  if (process.env.WINKAM_DEVTOOLS === '1') {
    win.webContents.openDevTools({ mode: 'detach' })
  }
  return win
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/**
 * Streaming runner.
 * Renderer calls:
 *   id = winkam.start({ cmd, args })
 * and then receives:
 *   winkam:output { id, chunk }
 *   winkam:exit { id, code }
 */
ipcMain.handle('winkam:ping', async () => {
  let elevated = false
  try {
    elevated = await isElevated()
  } catch {
    elevated = false
  }
  return { ok: true, pid: process.pid, platform: process.platform, elevated }
})

ipcMain.handle('winkam:logs:list', async () => {
  const root = path.join(__dirname, '..', '..')
  const logsDir = path.join(root, 'logs')
  try {
    const entries = await fs.readdir(logsDir, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.txt'))
        .map(async (e) => {
          const full = path.join(logsDir, e.name)
          const st = await fs.stat(full)
          return { name: e.name, size: st.size, mtimeMs: st.mtimeMs }
        }),
    )
    files.sort((a, b) => b.mtimeMs - a.mtimeMs)
    return { ok: true, files }
  } catch (e) {
    return { ok: true, files: [] }
  }
})

ipcMain.handle('winkam:logs:read', async (_event, payload) => {
  const root = path.join(__dirname, '..', '..')
  const logsDir = path.join(root, 'logs')
  const name = String(payload?.name || '')
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return { ok: false, error: 'invalid_name' }
  }
  const full = path.join(logsDir, name)
  try {
    const content = await fs.readFile(full, 'utf-8')
    return { ok: true, content }
  } catch (e) {
    return { ok: false, error: 'read_failed' }
  }
})

ipcMain.handle('winkam:start', (event, payload) => {
  const webContents = event.sender
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`

  const { cmd, args } = payload || {}
  const argv = buildPythonArgs(cmd, args)

  const pythonCmd = resolvePythonCmd()

  let child
  try {
    child = spawn(pythonCmd, argv, {
      cwd: resolvePythonCwd(),
      windowsHide: true,
      env: {
        ...process.env,
        ...(app.isPackaged ? resolveBundledPythonEnv() : {}),
        PYTHONUNBUFFERED: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    })
  } catch (e) {
    webContents.send('winkam:output', { id, chunk: `Spawn error: ${e}\n` })
    webContents.send('winkam:exit', { id, code: 1 })
    return id
  }

  child.stdout.on('data', (buf) => {
    webContents.send('winkam:output', { id, chunk: buf.toString('utf-8') })
  })
  child.stderr.on('data', (buf) => {
    webContents.send('winkam:output', { id, chunk: buf.toString('utf-8') })
  })
  child.on('error', (err) => {
    webContents.send('winkam:output', { id, chunk: `Process error: ${err}\n` })
  })
  child.on('close', (code) => {
    webContents.send('winkam:exit', { id, code: code ?? 0 })
  })

  return id
})

function resolvePythonCmd() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'python.exe')
  }
  return 'python'
}

function resolvePythonCwd() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python')
  }
  return path.join(__dirname, '..', '..')
}

function resolveBundledPythonEnv() {
  const pythonDir = path.join(process.resourcesPath, 'python')
  return {
    PYTHONHOME: pythonDir,
    PYTHONPATH: pythonDir,
    PYTHONUTF8: '1',
  }
}

function buildPythonArgs(cmd, args) {
  // Always run module, to avoid PATH issues with "winkam" script.
  // -u: unbuffered stdout/stderr so UI can stream output live.
  const base = ['-u', '-m', 'winkam.cli']

  if (cmd === 'clean') {
    const mode = args?.mode || 'safe'
    return [...base, 'clean', '--mode', mode]
  }
  if (cmd === 'repair') return [...base, 'repair']
  if (cmd === 'network') return [...base, 'network']
  if (cmd === 'backup') {
    const out = [...base, 'backup']
    if (args?.target) out.push('--target', String(args.target))
    return out
  }

  return [...base, '--help']
}

