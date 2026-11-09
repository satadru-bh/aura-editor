const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installerAPI', {
  getDefaultPath: () => ipcRenderer.invoke('installer:getDefaultPath'),
  browseFolder: (currentPath) => ipcRenderer.invoke('installer:browseFolder', currentPath),
  startInstall: (options) => ipcRenderer.invoke('installer:startInstall', options),
  launchApp: (targetDir) => ipcRenderer.invoke('installer:launchApp', targetDir),
  openFolder: (folderPath) => ipcRenderer.invoke('installer:openFolder', folderPath),
  minimizeWindow: () => ipcRenderer.send('installer:minimize'),
  closeWindow: () => ipcRenderer.send('installer:close'),
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('installer:progress', handler);
    return () => ipcRenderer.removeListener('installer:progress', handler);
  },
});
