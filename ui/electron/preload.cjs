const { contextBridge, ipcRenderer } = require('electron')

// A more secure ipc pattern
// Renderer -> Main (one-way or two-way)
const invoke = (channel, ...args) => {
    const validChannels = ['winkam:ping', 'winkam:logs:list', 'winkam:logs:read', 'winkam:start']
    if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
    }
    return Promise.reject(new Error(`Invalid invoke channel: ${channel}`))
}

// Main -> Renderer (one-way)
const on = (channel, callback) => {
    const validChannels = ['winkam:output', 'winkam:exit']
    if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        const subscription = (_event, ...args) => callback(...args)
        ipcRenderer.on(channel, subscription)
            // Return a function to unsubscribe
        return () => {
            ipcRenderer.removeListener(channel, subscription)
        }
    }
    // Return a no-op function for invalid channels
    return () => {}
}

// Expose the protected methods to the renderer process
contextBridge.exposeInMainWorld('winkam', {
    invoke,
    on,
})