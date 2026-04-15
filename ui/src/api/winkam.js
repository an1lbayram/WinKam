function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}

/**
 * Checks if the Electron context bridge has been successfully injected.
 */
function hasElectronBridge() {
    return (
        typeof window !== 'undefined' &&
        window.winkam &&
        typeof window.winkam.invoke === 'function' &&
        typeof window.winkam.on === 'function'
    )
}

export function isElectronAvailable() {
    return hasElectronBridge()
}

// --- API Functions ---

export async function electronPing() {
    if (hasElectronBridge()) {
        return await window.winkam.invoke('winkam:ping')
    }
    // Mock
    await sleep(200)
    return { ok: true, elevated: false }
}

export async function listLogs() {
    if (hasElectronBridge()) {
        return await window.winkam.invoke('winkam:logs:list')
    }
    // Mock
    await sleep(300)
    return {
        ok: true,
        files: [
            { name: 'winkam_mock_20231001.log', size: 1024 * 12 },
            { name: 'winkam_mock_20231002.log', size: 1024 * 5 },
        ],
    }
}

export async function readLog(name) {
    if (hasElectronBridge()) {
        return await window.winkam.invoke('winkam:logs:read', { name })
    }
    // Mock
    await sleep(300)
    return {
        ok: true,
        content: `[MOCK LOG] ${name}\n\nİşlem başarıyla simüle edildi.\nTemizlenen alan: 450 MB`,
    }
}

export function createRunner({ onChunk, onExit }) {
    if (hasElectronBridge()) {
        // --- Real Electron Runner ---
        const unsubOut = window.winkam.on('winkam:output', (data) => onChunk ?.(data))
        const unsubExit = window.winkam.on('winkam:exit', (data) => onExit ?.(data))

        return {
            async run(cmd, args) {
                // This calls the 'winkam:start' handler in main.mjs
                return await window.winkam.invoke('winkam:start', { cmd, args })
            },
            dispose() {
                unsubOut()
                unsubExit()
            },
        }
    }

    // --- Mock Runner for Web ---
    let active = true
    return {
        async run(cmd, args) {
            const id = Math.random().toString(36).slice(2)
            setTimeout(async() => {
                if (!active) return
                onChunk({ id, chunk: `[MOCK] ${cmd} başlatılıyor... Parametreler: ${JSON.stringify(args || {})}\n` })
                await sleep(500)
                if (!active) return
                onChunk({ id, chunk: `[MOCK] İşlem yürütülüyor...\n` })
                await sleep(500)
                if (!active) return
                onChunk({ id, chunk: `[MOCK] İşlem tamamlandı.\n` })
                onExit({ id, code: 0 })
            }, 100)
            return id
        },
        dispose() {
            active = false
        },
    }
}