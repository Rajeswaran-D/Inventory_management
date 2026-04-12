const { contextBridge, ipcMain } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => window.api.invoke('get-version'),
  getAppPath: () => window.api.invoke('get-app-path'),
  isDev: process.env.NODE_ENV === 'development'
});

// Create the IPC bridge for debugging
const ipcRenderer = require('electron').ipcRenderer;

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  }
});
