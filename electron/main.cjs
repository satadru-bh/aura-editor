const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

let mainWindow;
let isForceClose = false;

function extractFilePathFromArgs(args, workingDir = process.cwd()) {
  if (!args || !Array.isArray(args)) return null;
  for (let i = 1; i < args.length; i++) {
    const raw = args[i];
    if (!raw || raw.startsWith('--') || raw.startsWith('-')) continue;
    // Strip surrounding quotes
    const cleaned = raw.replace(/^["']|["']$/g, '').trim();
    if (!cleaned || cleaned === '.' || cleaned.endsWith('main.cjs') || cleaned.endsWith('electron.exe') || cleaned.endsWith('electron')) continue;
    const resolved = path.isAbsolute(cleaned) ? cleaned : path.resolve(workingDir, cleaned);
    try {
      if (fsSync.existsSync(resolved) && fsSync.statSync(resolved).isFile()) {
        return resolved;
      }
    } catch (e) { }
  }
  return null;
}

let initialFilePath = extractFilePathFromArgs(process.argv);

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', async (_event, commandLine, workingDirectory) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      const targetPath = extractFilePathFromArgs(commandLine, workingDirectory);
      if (targetPath) {
        try {
          const content = await fs.readFile(targetPath, 'utf-8');
          const fileName = path.basename(targetPath);
          mainWindow.webContents.send('file:opened', { fileName, filePath: targetPath, content });
        } catch (e) {
          console.error('Failed to open file from second-instance:', e);
        }
      }
    }
  });
}

// macOS open-file event support
app.on('open-file', async (event, filePath) => {
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      mainWindow.webContents.send('file:opened', { fileName, filePath, content });
    } catch (e) {
      console.error('Failed to open file from macOS open-file:', e);
    }
  } else {
    initialFilePath = filePath;
  }
});

function getWindowState() {
  const fsSync = require('fs');
  const stateFile = path.join(app.getPath('userData'), 'window-state.json');
  try {
    if (fsSync.existsSync(stateFile)) {
      const data = JSON.parse(fsSync.readFileSync(stateFile, 'utf-8'));
      if (data && typeof data.width === 'number' && typeof data.height === 'number') {
        if (typeof data.x === 'number' && typeof data.y === 'number') {
          const { screen } = require('electron');
          const displays = screen.getAllDisplays();
          const isVisible = displays.some((d) => {
            const b = d.bounds;
            return (
              data.x >= b.x - 50 &&
              data.x <= b.x + b.width - 50 &&
              data.y >= b.y - 50 &&
              data.y <= b.y + b.height - 50
            );
          });
          if (isVisible) return data;
        }
        return { width: data.width, height: data.height, isMaximized: !!data.isMaximized };
      }
    }
  } catch (e) { }
  return { width: 1080, height: 780, isMaximized: false };
}

let saveStateTimer = null;
function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const isMax = mainWindow.isMaximized();
      const bounds = isMax ? mainWindow.getNormalBounds() : mainWindow.getBounds();
      const state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: isMax,
      };
      const fsSync = require('fs');
      const stateFile = path.join(app.getPath('userData'), 'window-state.json');
      fsSync.writeFileSync(stateFile, JSON.stringify(state), 'utf-8');
    } catch (e) { }
  }, 400);
}

function createWindow() {
  const fsSync = require('fs');
  const logoPngPath = path.join(__dirname, '../public/logo.png');
  const distLogoPath = path.join(__dirname, '../dist/logo.png');
  const buildIcoPath = path.join(__dirname, '../build/icon.ico');
  const buildPngPath = path.join(__dirname, '../build/icon.png');
  const iconPath = fsSync.existsSync(logoPngPath)
    ? logoPngPath
    : fsSync.existsSync(distLogoPath)
      ? distLogoPath
      : fsSync.existsSync(buildIcoPath)
        ? buildIcoPath
        : fsSync.existsSync(buildPngPath)
          ? buildPngPath
          : path.join(__dirname, '../public/aura-icon.svg');

  const winState = getWindowState();

  mainWindow = new BrowserWindow({
    width: winState.width || 1080,
    height: winState.height || 780,
    x: winState.x,
    y: winState.y,
    minWidth: 480,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#FAF8F5',
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (winState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1000);

  mainWindow.on('close', (event) => {
    if (!isForceClose) {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:request-close');
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const isDev = process.env.ELECTRON_DEV === '1';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle files passed via command line (e.g. double click .md in Windows Explorer)
  if (initialFilePath) {
    const targetPath = initialFilePath;
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const content = await fs.readFile(targetPath, 'utf-8');
          const fileName = path.basename(targetPath);
          mainWindow?.webContents?.send('file:opened', { fileName, filePath: targetPath, content });
        } catch (e) {
          console.error('Failed to open file from initialFilePath:', e);
        }
      }, 350);
    });
  }
}

// IPC Handlers
ipcMain.handle('app:getInitialFile', async () => {
  if (initialFilePath) {
    const targetPath = initialFilePath;
    initialFilePath = null;
    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      const fileName = path.basename(targetPath);
      return { fileName, filePath: targetPath, content };
    } catch (e) {
      console.error('Failed to read initial file:', e);
      return null;
    }
  }
  return null;
});
ipcMain.handle('dialog:openFile', async () => {
  try {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Open Document',
      filters: [
        { name: 'Markdown & Text Files', extensions: ['md', 'markdown', 'txt', 'text', 'html'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return {
      canceled: false,
      filePath,
      fileName,
      content,
    };
  } catch (err) {
    console.error('dialog:openFile error:', err);
    return { canceled: true, error: err.message };
  }
});

const activeFileWatchers = new Map();
const lastSelfSaves = new Map();

ipcMain.handle('dialog:saveFile', async (_event, defaultName, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Document As',
    defaultPath: defaultName || 'Untitled.md',
    filters: [
      { name: 'Markdown Document', extensions: ['md'] },
      { name: 'Plain Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  lastSelfSaves.set(filePath, Date.now());
  await fs.writeFile(filePath, content, 'utf-8');
  const fileName = path.basename(filePath);

  return {
    canceled: false,
    filePath,
    fileName,
  };
});

ipcMain.handle('fs:saveFile', async (_event, filePath, content) => {
  lastSelfSaves.set(filePath, Date.now());
  await fs.writeFile(filePath, content, 'utf-8');
  return { success: true };
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:renameFile', async (_event, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    if (oldPath !== newPath) {
      if (fsSync.existsSync(oldPath)) {
        // Close watcher on old path before rename to prevent Windows file locking
        const wasWatched = activeFileWatchers.has(oldPath);
        if (wasWatched) {
          try {
            activeFileWatchers.get(oldPath).close();
          } catch (e) { }
          activeFileWatchers.delete(oldPath);
        }
        await fs.rename(oldPath, newPath);
      }
    }
    return { success: true, newPath };
  } catch (err) {
    console.error('Failed to rename file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:watchFile', (_event, filePath) => {
  if (!filePath) return { success: false };
  const fsSync = require('fs');

  if (activeFileWatchers.has(filePath)) {
    try {
      activeFileWatchers.get(filePath).close();
    } catch (e) { }
    activeFileWatchers.delete(filePath);
  }

  if (!fsSync.existsSync(filePath)) return { success: false };

  let debounceTimer = null;
  try {
    const watcher = fsSync.watch(filePath, (eventType) => {
      if (eventType !== 'change') return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const lastSave = lastSelfSaves.get(filePath) || 0;
          if (Date.now() - lastSave < 2000) {
            return; // Ignore our own recent save
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            const stats = fsSync.statSync(filePath);
            mainWindow.webContents.send('file:external-change', {
              filePath,
              mtime: stats.mtimeMs,
            });
          }
        } catch (e) { }
      }, 350);
    });

    activeFileWatchers.set(filePath, watcher);
    return { success: true };
  } catch (e) {
    console.warn('Failed to watch file:', filePath, e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:unwatchFile', (_event, filePath) => {
  if (filePath && activeFileWatchers.has(filePath)) {
    try {
      activeFileWatchers.get(filePath).close();
    } catch (e) { }
    activeFileWatchers.delete(filePath);
  }
  return { success: true };
});

// Workspace / Folder Vault Support
let activeWorkspaceWatcher = null;
let workspaceDebounceTimer = null;

async function buildWorkspaceTree(dir, depth = 0) {
  if (depth > 6) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  const ignored = new Set(['node_modules', '.git', '.vscode', '.idea', 'dist', 'dist-installer', 'installer-out', 'build']);

  for (const entry of entries) {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const children = await buildWorkspaceTree(fullPath, depth + 1);
      result.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
        children,
      });
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.md', '.markdown', '.txt', '.text'].includes(ext)) {
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false,
          extension: ext,
        });
      }
    }
  }

  result.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }
    return a.isDirectory ? -1 : 1;
  });

  return result;
}

ipcMain.handle('workspace:openFolderDialog', async () => {
  try {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Open Workspace Folder',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }

    const folderPath = filePaths[0];
    const folderName = path.basename(folderPath);
    return { canceled: false, folderPath, folderName };
  } catch (err) {
    console.error('workspace:openFolderDialog error:', err);
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('workspace:readTree', async (_event, folderPath) => {
  try {
    if (!folderPath || !fsSync.existsSync(folderPath)) {
      return { success: false, error: 'Directory does not exist', tree: [] };
    }
    const tree = await buildWorkspaceTree(folderPath);
    return { success: true, tree };
  } catch (err) {
    return { success: false, error: err.message, tree: [] };
  }
});

ipcMain.handle('workspace:watch', (_event, folderPath) => {
  if (!folderPath || !fsSync.existsSync(folderPath)) return { success: false };
  if (activeWorkspaceWatcher) {
    try { activeWorkspaceWatcher.close(); } catch (e) {}
    activeWorkspaceWatcher = null;
  }
  try {
    activeWorkspaceWatcher = fsSync.watch(folderPath, { recursive: true }, () => {
      if (workspaceDebounceTimer) clearTimeout(workspaceDebounceTimer);
      workspaceDebounceTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('workspace:changed', { folderPath });
        }
      }, 350);
    });
    return { success: true };
  } catch (e) {
    console.warn('Failed to watch workspace folder:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('workspace:unwatch', () => {
  if (activeWorkspaceWatcher) {
    try { activeWorkspaceWatcher.close(); } catch (e) {}
    activeWorkspaceWatcher = null;
  }
  return { success: true };
});

// Native Asset Vault (Image auto-save & path resolution)
ipcMain.handle('asset:saveImage', async (_event, options) => {
  try {
    const { notePath, workspacePath, dataBuffer, dataUrl, fileName, mimeType = 'image/png' } = options;

    let targetDir;
    if (notePath && fsSync.existsSync(path.dirname(notePath))) {
      targetDir = path.join(path.dirname(notePath), 'assets');
    } else if (workspacePath && fsSync.existsSync(workspacePath)) {
      targetDir = path.join(workspacePath, 'assets');
    } else {
      targetDir = path.join(app.getPath('userData'), 'assets');
    }

    await fs.mkdir(targetDir, { recursive: true });

    let ext = '.png';
    if (fileName && path.extname(fileName)) {
      ext = path.extname(fileName);
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      ext = '.jpg';
    } else if (mimeType.includes('gif')) {
      ext = '.gif';
    } else if (mimeType.includes('svg')) {
      ext = '.svg';
    } else if (mimeType.includes('webp')) {
      ext = '.webp';
    }

    const cleanBaseName = fileName
      ? path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, '-').replace(/-+/g, '-')
      : 'pasted-image';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const finalName = `${cleanBaseName}-${timestamp}${ext}`;
    const targetFile = path.join(targetDir, finalName);

    let bufferToWrite;
    if (dataBuffer) {
      bufferToWrite = Buffer.from(dataBuffer);
    } else if (dataUrl) {
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      bufferToWrite = Buffer.from(base64Data, 'base64');
    } else {
      return { success: false, error: 'No image data provided' };
    }

    await fs.writeFile(targetFile, bufferToWrite);

    const relativePath = `./assets/${finalName}`;
    return {
      success: true,
      fullPath: targetFile,
      relativePath,
      fileName: finalName,
    };
  } catch (err) {
    console.error('asset:saveImage error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('asset:resolvePath', (_event, notePath, relativeSrc, workspacePath) => {
  try {
    if (!relativeSrc) return null;
    if (relativeSrc.startsWith('http://') || relativeSrc.startsWith('https://') || relativeSrc.startsWith('data:') || relativeSrc.startsWith('blob:') || relativeSrc.startsWith('file:///')) {
      return relativeSrc;
    }

    let absolutePath = relativeSrc;
    if (notePath && !path.isAbsolute(relativeSrc)) {
      const candidate = path.resolve(path.dirname(notePath), relativeSrc);
      if (fsSync.existsSync(candidate)) {
        absolutePath = candidate;
      } else if (workspacePath) {
        const wsCandidate = path.resolve(workspacePath, relativeSrc);
        if (fsSync.existsSync(wsCandidate)) {
          absolutePath = wsCandidate;
        } else {
          absolutePath = candidate;
        }
      } else {
        absolutePath = candidate;
      }
    } else if (workspacePath && !path.isAbsolute(relativeSrc)) {
      absolutePath = path.resolve(workspacePath, relativeSrc);
    }

    if (fsSync.existsSync(absolutePath)) {
      const normalized = absolutePath.replace(/\\/g, '/');
      return `file:///${encodeURI(normalized)}`;
    }
    return relativeSrc;
  } catch (e) {
    return relativeSrc;
  }
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

let autoUpdater = null;
try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
  if (autoUpdater) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:update-available', info);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:update-downloaded', info);
      }
    });

    autoUpdater.on('error', (err) => {
      console.warn('AutoUpdater background check info:', err?.message || err);
    });
  }
} catch (e) {
  console.warn('electron-updater not loaded:', e.message);
}

ipcMain.handle('app:installUpdate', () => {
  if (autoUpdater) {
    try {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (e) {
      console.error('Failed to quit and install update:', e);
      return { success: false, error: e.message };
    }
  }
  return { success: false, error: 'autoUpdater not initialized' };
});

ipcMain.handle('app:checkForUpdates', async () => {
  if (autoUpdater && !process.env.ELECTRON_DEV) {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (result && result.updateInfo) {
        const currentVersion = app.getVersion();
        const latestVersion = result.updateInfo.version;
        const hasUpdate = latestVersion !== currentVersion;
        return {
          success: true,
          currentVersion,
          latestVersion,
          hasUpdate,
          releaseUrl: `https://github.com/satadru-bh/aura-editor/releases/tag/v${latestVersion}`,
          notes: typeof result.updateInfo.releaseNotes === 'string' ? result.updateInfo.releaseNotes : '',
        };
      }
    } catch (updaterErr) {
      console.warn('electron-updater check failed, falling back to GitHub API:', updaterErr?.message || updaterErr);
    }
  }

  try {
    const https = require('https');
    return new Promise((resolve) => {
      const currentVersion = app.getVersion();
      const req = https.get(
        'https://api.github.com/repos/satadru-bh/aura-editor/releases/latest',
        {
          headers: {
            'User-Agent': `AuraEditor/${currentVersion}`,
          },
          timeout: 6000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const release = JSON.parse(data);
                const latestTag = release.tag_name ? release.tag_name.replace(/^v/, '') : currentVersion;
                const hasUpdate = latestTag !== currentVersion;
                resolve({
                  success: true,
                  currentVersion,
                  latestVersion: latestTag,
                  hasUpdate,
                  releaseUrl: release.html_url || 'https://github.com/satadru-bh/aura-editor/releases',
                  notes: release.body || '',
                });
              } else {
                resolve({
                  success: true,
                  currentVersion,
                  latestVersion: currentVersion,
                  hasUpdate: false,
                  message: 'You are running the latest version of Aura Editor.',
                });
              }
            } catch (e) {
              resolve({ success: false, currentVersion, error: e.message });
            }
          });
        }
      );

      req.on('error', (e) => {
        resolve({
          success: false,
          currentVersion: app.getVersion(),
          error: e.message || 'Unable to connect to update server',
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          currentVersion: app.getVersion(),
          error: 'Update check timed out',
        });
      });
    });
  } catch (err) {
    return { success: false, currentVersion: app.getVersion(), error: err.message };
  }
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.on('window:force-close', () => {
  isForceClose = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  } else {
    app.quit();
  }
});

ipcMain.handle('window:toggleFullscreen', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const isFs = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFs);
    return !isFs;
  }
  return false;
});

app.on('before-quit', () => {
  isForceClose = true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      isForceClose = false;
      createWindow();
    }
  });
});

// ==========================================
// PDF Export via hidden BrowserWindow + printToPDF
// ==========================================
ipcMain.handle('export:pdf', async (_event, htmlContent) => {
  let pdfWindow = null;
  let tmpFile = null;
  try {
    // Write HTML to a temp file to avoid data-URL size limits
    const os = require('os');
    tmpFile = path.join(os.tmpdir(), `aura-pdf-export-${Date.now()}.html`);
    await fs.writeFile(tmpFile, htmlContent, 'utf-8');

    pdfWindow = new BrowserWindow({
      width: 1024,
      height: 800,
      show: false,
      webPreferences: {
        offscreen: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load from temp file
    await pdfWindow.loadFile(tmpFile);

    // Wait for fonts and rendering to settle
    await pdfWindow.webContents.executeJavaScript(
      `new Promise(resolve => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => setTimeout(resolve, 500));
        } else {
          setTimeout(resolve, 800);
        }
      })`
    );

    // Generate the PDF — no headers or footers (no date, filename, url, or page numbers)
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      displayHeaderFooter: false,
      landscape: false,
      pageSize: 'A4',
      margins: {
        marginType: 'none',
      },
    });

    return { success: true, data: Array.from(pdfBuffer) };
  } catch (err) {
    console.error('PDF export error:', err);
    return { success: false, error: err.message };
  } finally {
    if (pdfWindow) {
      pdfWindow.destroy();
    }
    // Clean up temp file
    if (tmpFile) {
      fs.unlink(tmpFile).catch(() => { });
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
