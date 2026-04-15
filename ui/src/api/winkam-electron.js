import { invoke as mockInvoke } from './winkam'

function hasElectronBridge() {
  return typeof window !== 'undefined' && window.winkam?.start
}

export function isElectronAvailable() {
  return hasElectronBridge()
}

export async function electronPing() {
  try {
    if (!hasElectronBridge() || !window.winkam?.ping) return { ok: false }
    return await window.winkam.ping()
  } catch {
    return { ok: false }
  }
}

export async function listLogs() {
  if (!hasElectronBridge() || !window.winkam?.listLogs) return { ok: false, files: [] }
  return await window.winkam.listLogs()
}

export async function readLog(name) {
  if (!hasElectronBridge() || !window.winkam?.readLog) return { ok: false, content: '' }
  return await window.winkam.readLog(name)
}

export function createRunner({ onChunk, onExit }) {
  if (!hasElectronBridge()) {
    // Web/dev mock runner
    return {
      async run(command, args) {
        const res = await mockInvoke(command, args)
        onChunk?.({ id: 'mock', chunk: res.output })
        onExit?.({ id: 'mock', code: res.ok ? 0 : 1 })
        return 'mock'
      },
    }
  }

  const unsubOut = window.winkam.onOutput((data) => onChunk?.(data))
  const unsubExit = window.winkam.onExit((data) => onExit?.(data))

  return {
    async run(cmd, args) {
      return await window.winkam.start({ cmd, args })
    },
    dispose() {
      unsubOut?.()
      unsubExit?.()
    },
  }
}

