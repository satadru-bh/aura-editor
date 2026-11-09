const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', defaultName, content),
  saveFile: (filePath, content) => ipcRenderer.invoke('fs:saveFile', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  renameFile: (oldPath, newName) => ipcRenderer.invoke('fs:renameFile', oldPath, newName),
  getZoomFactor: () => webFrame.getZoomFactor(),
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
  exportPDF: (html) => ipcRenderer.invoke('export:pdf', html),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  closeWindow: () => ipcRenderer.send('window:close'),
  forceClose: () => ipcRenderer.send('window:force-close'),
  onRequestClose: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('app:request-close', handler);
    return () => ipcRenderer.removeListener('app:request-close', handler);
  },
  getInitialFile: () => ipcRenderer.invoke('app:getInitialFile'),
  onFileOpened: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('file:opened', handler);
    return () => ipcRenderer.removeListener('file:opened', handler);
  },
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  onUpdateAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('app:update-available', handler);
    return () => ipcRenderer.removeListener('app:update-available', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('app:update-downloaded', handler);
    return () => ipcRenderer.removeListener('app:update-downloaded', handler);
  },
  watchFile: (filePath) => ipcRenderer.invoke('fs:watchFile', filePath),
  unwatchFile: (filePath) => ipcRenderer.invoke('fs:unwatchFile', filePath),
  onExternalFileChange: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('file:external-change', handler);
    return () => ipcRenderer.removeListener('file:external-change', handler);
  },
});
