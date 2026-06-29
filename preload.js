const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePDF: (filename) => ipcRenderer.invoke('save-invoice-pdf', filename),
  printViaPDF: () => ipcRenderer.invoke('print-invoice-via-pdf'),
});
