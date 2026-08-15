import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRunner, electronPing, isElectronAvailable, listLogs, readLog } from './winkam'

describe('winkam api (web/mock mode - no window.winkam bridge)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it('isElectronAvailable is falsy without a bridge', () => {
    // hasElectronBridge() short-circuits on `window.winkam &&`, so the
    // result is `undefined` rather than a strict `false` when unset.
    expect(isElectronAvailable()).toBeFalsy()
  })

  it('electronPing resolves a mock ok response', async () => {
    const res = await electronPing()
    expect(res).toEqual({ ok: true, elevated: false })
  })

  it('listLogs resolves mock log files', async () => {
    const res = await listLogs()
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.files)).toBe(true)
    expect(res.files.length).toBeGreaterThan(0)
  })

  it('readLog resolves mock content containing the requested name', async () => {
    const res = await readLog('sample.log')
    expect(res.ok).toBe(true)
    expect(res.content).toContain('sample.log')
  })

  it('createRunner mock run() reports chunks then exits with code 0', async () => {
    const chunks = []
    let exitInfo = null
    const runner = createRunner({
      onChunk: (data) => chunks.push(data.chunk),
      onExit: (data) => {
        exitInfo = data
      },
    })

    const id = await runner.run('clean', { mode: 'dry-run' })
    expect(typeof id).toBe('string')

    await vi.waitFor(
      () => {
        expect(exitInfo).not.toBeNull()
      },
      { timeout: 3000 },
    )

    expect(exitInfo.code).toBe(0)
    expect(chunks.join('')).toContain('clean')
    runner.dispose()
  })

  it('createRunner stops emitting after dispose() is called', async () => {
    vi.useFakeTimers()
    const onChunk = vi.fn()
    const runner = createRunner({ onChunk, onExit: vi.fn() })
    runner.run('repair', {})
    runner.dispose()
    await vi.advanceTimersByTimeAsync(2000)
    expect(onChunk).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('winkam api (electron bridge present)', () => {
  let invoke
  let listeners

  beforeEach(() => {
    invoke = vi.fn()
    listeners = {}
    window.winkam = {
      invoke,
      on: vi.fn((channel, cb) => {
        listeners[channel] = cb
        return vi.fn()
      }),
    }
  })

  afterEach(() => {
    delete window.winkam
  })

  it('isElectronAvailable is true when the bridge is fully present', () => {
    expect(isElectronAvailable()).toBe(true)
  })

  it('isElectronAvailable is false when invoke/on are missing', () => {
    window.winkam = { invoke: 'not a function' }
    expect(isElectronAvailable()).toBe(false)
  })

  it('electronPing calls the winkam:ping IPC channel', async () => {
    invoke.mockResolvedValue({ ok: true, pid: 123, elevated: true })
    const res = await electronPing()
    expect(invoke).toHaveBeenCalledWith('winkam:ping')
    expect(res.elevated).toBe(true)
  })

  it('listLogs calls the winkam:logs:list IPC channel', async () => {
    invoke.mockResolvedValue({ ok: true, files: [] })
    await listLogs()
    expect(invoke).toHaveBeenCalledWith('winkam:logs:list')
  })

  it('readLog calls winkam:logs:read with the file name', async () => {
    invoke.mockResolvedValue({ ok: true, content: 'log body' })
    await readLog('WinKam_Log_20260814_0900.txt')
    expect(invoke).toHaveBeenCalledWith('winkam:logs:read', { name: 'WinKam_Log_20260814_0900.txt' })
  })

  it('createRunner subscribes to output/exit channels and forwards to callbacks', () => {
    const onChunk = vi.fn()
    const onExit = vi.fn()
    createRunner({ onChunk, onExit })

    expect(window.winkam.on).toHaveBeenCalledWith('winkam:output', expect.any(Function))
    expect(window.winkam.on).toHaveBeenCalledWith('winkam:exit', expect.any(Function))

    listeners['winkam:output']({ id: '1', chunk: 'hello' })
    listeners['winkam:exit']({ id: '1', code: 0 })

    expect(onChunk).toHaveBeenCalledWith({ id: '1', chunk: 'hello' })
    expect(onExit).toHaveBeenCalledWith({ id: '1', code: 0 })
  })

  it('createRunner.run() invokes winkam:start with cmd and args', async () => {
    invoke.mockResolvedValue('run-id-123')
    const runner = createRunner({ onChunk: vi.fn(), onExit: vi.fn() })

    const id = await runner.run('backup', { target: 'D' })

    expect(invoke).toHaveBeenCalledWith('winkam:start', { cmd: 'backup', args: { target: 'D' } })
    expect(id).toBe('run-id-123')
  })

  it('createRunner.dispose() unsubscribes both listeners', () => {
    const unsubOut = vi.fn()
    const unsubExit = vi.fn()
    window.winkam.on = vi.fn().mockReturnValueOnce(unsubOut).mockReturnValueOnce(unsubExit)

    const runner = createRunner({ onChunk: vi.fn(), onExit: vi.fn() })
    runner.dispose()

    expect(unsubOut).toHaveBeenCalled()
    expect(unsubExit).toHaveBeenCalled()
  })
})
