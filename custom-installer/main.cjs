const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const rawFs = process.versions.electron ? require('original-fs') : require('fs');
const rawFsPromises = rawFs.promises;
const { spawn, exec } = require('child_process');

let mainWindow = null;

function createWindow() {
  const iconPath = path.resolve(__dirname, '../build/icon.ico');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 540,
    frame: false,
    resizable: false,
    maximizable: false,
    backgroundColor: '#0F0F11',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Window controls
ipcMain.on('installer:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.on('installer:close', () => {
  app.quit();
});

// Default install path (%LOCALAPPDATA%\Programs\Aura Editor)
ipcMain.handle('installer:getDefaultPath', () => {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local');
  return path.join(localAppData, 'Programs', 'Aura Editor');
});

// Folder browser dialog
ipcMain.handle('installer:browseFolder', async (_event, defaultPath) => {
  if (!mainWindow) return defaultPath;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Aura Editor Installation Folder',
    defaultPath: defaultPath || undefined,
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    let chosen = result.filePaths[0];
    if (!chosen.toLowerCase().endsWith('aura editor')) {
      chosen = path.join(chosen, 'Aura Editor');
    }
    return chosen;
  }
  return defaultPath;
});

// Helper: Resolve GitHub repo name
function getRepoName() {
  if (process.env.AURA_GITHUB_REPO) return process.env.AURA_GITHUB_REPO;
  try {
    const pkgPath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.repository?.url) {
        const match = pkg.repository.url.match(/github\.com[/:]([^/]+\/[^/.]+)/);
        if (match) return match[1].replace(/\.git$/, '');
      }
      if (pkg.build?.publish?.owner && pkg.build?.publish?.repo) {
        return `${pkg.build.publish.owner}/${pkg.build.publish.repo}`;
      }
    }
  } catch (e) {}
  return 'satadru-bh/aura-editor';
}

// Helper: Semver comparison (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const clean1 = String(v1).replace(/^v/, '').trim();
  const clean2 = String(v2).replace(/^v/, '').trim();
  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

// Helper: Query Windows Registry Value safely
function queryRegistryValue(key, valueName) {
  return new Promise((resolve) => {
    exec(`reg query "${key}" /v "${valueName}"`, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      const regex = new RegExp(`${valueName}\\s+REG_SZ\\s+(.+)`, 'i');
      const match = stdout.match(regex);
      resolve(match && match[1] ? match[1].trim() : null);
    });
  });
}

// Helper: Kill any running instances of an image (e.g. Aura Editor.exe)
function killProcess(imageName) {
  return new Promise((resolve) => {
    exec(`taskkill /F /IM "${imageName}"`, () => resolve());
  });
}

// Helper: Detect whether Aura Editor is already installed on the system
async function detectInstallation() {
  const uninstallRegKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AuraEditor';
  let installDir = await queryRegistryValue(uninstallRegKey, 'InstallLocation');
  let installedVersion = await queryRegistryValue(uninstallRegKey, 'DisplayVersion');

  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local');
  const defaultDir = path.join(localAppData, 'Programs', 'Aura Editor');

  if (installDir && fs.existsSync(path.join(installDir, 'Aura Editor.exe'))) {
    return {
      isInstalled: true,
      installDir,
      installedVersion: installedVersion || '1.0.0',
    };
  }

  if (fs.existsSync(path.join(defaultDir, 'Aura Editor.exe'))) {
    return {
      isInstalled: true,
      installDir: defaultDir,
      installedVersion: installedVersion || '1.0.0',
    };
  }

  return {
    isInstalled: false,
    installDir: defaultDir,
    installedVersion: null,
  };
}

// Helper: Fetch latest release asset info from GitHub Releases
function getLatestReleaseAsset(repo) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Aura-Custom-Installer/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          return getLatestReleaseAsset(repo).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`GitHub API returned HTTP ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const assets = release.assets || [];
            // Look for windows zip asset (e.g. Aura-Editor-1.0.0-win.zip or *.zip)
            const zipAsset =
              assets.find(
                (a) =>
                  a.name.toLowerCase().endsWith('.zip') &&
                  (a.name.toLowerCase().includes('win') || a.name.toLowerCase().includes('aura'))
              ) || assets.find((a) => a.name.toLowerCase().endsWith('.zip'));

            if (!zipAsset) {
              return reject(
                new Error(
                  `No Windows package (.zip) found in GitHub release ${release.tag_name || ''}. Available assets: ${assets.map((a) => a.name).join(', ') || 'none'}`
                )
              );
            }

            resolve({
              version: release.tag_name,
              name: zipAsset.name,
              downloadUrl: zipAsset.browser_download_url,
              size: zipAsset.size || 0,
            });
          } catch (e) {
            reject(new Error(`Failed to parse GitHub release data: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GitHub connection timed out.'));
    });
  });
}

// IPC: Check installation status and compare with GitHub latest release
ipcMain.handle('installer:checkInstallation', async () => {
  const detection = await detectInstallation();
  const repo = getRepoName();
  let latestInfo = null;

  try {
    latestInfo = await getLatestReleaseAsset(repo);
  } catch (err) {
    console.warn('Could not fetch latest GitHub release info:', err.message);
  }

  let mode = 'install';
  let hasUpdate = false;
  const latestVersion = latestInfo ? latestInfo.version.replace(/^v/, '') : null;
  const installedVersion = detection.installedVersion ? detection.installedVersion.replace(/^v/, '') : null;

  if (detection.isInstalled) {
    if (latestVersion && installedVersion && compareVersions(latestVersion, installedVersion) > 0) {
      mode = 'update';
      hasUpdate = true;
    } else {
      mode = 'repair';
      hasUpdate = false;
    }
  } else {
    mode = 'install';
    hasUpdate = false;
  }

  return {
    isInstalled: detection.isInstalled,
    installDir: detection.installDir,
    installedVersion: detection.installedVersion,
    latestVersion: latestInfo ? latestInfo.version : (installedVersion || '1.0.0'),
    hasUpdate,
    mode, // 'install' | 'update' | 'repair'
    releaseAsset: latestInfo,
  };
});

// Helper: Download file with redirect handling and streaming progress
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    function fetchUrl(currentUrl, redirects = 0) {
      if (redirects > 10) {
        file.close();
        return reject(new Error('Too many HTTP redirects'));
      }

      const client = currentUrl.startsWith('https') ? https : http;
      const req = client.get(
        currentUrl,
        {
          headers: {
            'User-Agent': 'Aura-Custom-Installer/1.0',
            'Accept': 'application/octet-stream',
          },
          timeout: 45000,
        },
        (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            return fetchUrl(res.headers.location, redirects + 1);
          }

          if (res.statusCode !== 200) {
            file.close();
            return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let receivedBytes = 0;

          res.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0 && onProgress) {
              const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              onProgress(percent, receivedBytes, totalBytes);
            }
          });

          res.pipe(file);

          file.on('finish', () => {
            file.close(() => resolve(destPath));
          });
          file.on('error', (err) => {
            try { fs.unlinkSync(destPath); } catch (e) {}
            reject(err);
          });
        }
      );

      req.on('error', (err) => {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(new Error('Download timed out'));
      });
    }

    fetchUrl(url);
  });
}

// Helper: Extract zip file using native Windows tar or PowerShell
function extractZip(zipPath, targetDir) {
  return new Promise((resolve, reject) => {
    const tarCmd = `tar -xf "${zipPath}" -C "${targetDir}"`;
    exec(tarCmd, (err) => {
      if (!err) {
        return resolve();
      }
      const psCmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${targetDir}' -Force"`;
      exec(psCmd, (psErr) => {
        if (!psErr) {
          return resolve();
        }
        reject(new Error(`Extraction failed: ${psErr.message || err.message}`));
      });
    });
  });
}

// Helper: If extracted zip created a root subfolder, flatten to targetDir
async function normalizeExtractedFolder(targetDir) {
  const rootExe = path.join(targetDir, 'Aura Editor.exe');
  if (fs.existsSync(rootExe)) return targetDir;

  const entries = await rawFsPromises.readdir(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(targetDir, entry.name);
      const subExe = path.join(subDir, 'Aura Editor.exe');
      if (fs.existsSync(subExe)) {
        const subFiles = await rawFsPromises.readdir(subDir);
        for (const f of subFiles) {
          const from = path.join(subDir, f);
          const to = path.join(targetDir, f);
          await rawFsPromises.rename(from, to);
        }
        try { await rawFsPromises.rmdir(subDir); } catch (e) {}
        return targetDir;
      }
    }
  }
  return targetDir;
}

// Helper: recursively collect all files in a directory
async function getFilesRecursively(dir) {
  const entries = await rawFsPromises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.endsWith('.asar')) {
      files.push(...(await getFilesRecursively(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// Helper: create Windows shortcut (.lnk) using Windows Script Host
function createShortcut(shortcutPath, targetPath, iconLocation, description) {
  return new Promise((resolve) => {
    const vbsPath = path.join(app.getPath('temp'), `create_shortcut_${Date.now()}.vbs`);
    const vbsContent = [
      'Set oWS = WScript.CreateObject("WScript.Shell")',
      `sLinkFile = "${shortcutPath.replace(/"/g, '""')}"`,
      'Set oLink = oWS.CreateShortcut(sLinkFile)',
      `oLink.TargetPath = "${targetPath.replace(/"/g, '""')}"`,
      `oLink.WorkingDirectory = "${path.dirname(targetPath).replace(/"/g, '""')}"`,
      `oLink.IconLocation = "${(iconLocation || targetPath).replace(/"/g, '""')}"`,
      `oLink.Description = "${(description || 'Aura Editor').replace(/"/g, '""')}"`,
      'oLink.Save',
    ].join('\r\n');

    fs.writeFile(vbsPath, vbsContent, () => {
      exec(`cscript //nologo "${vbsPath}"`, () => {
        try { fs.unlinkSync(vbsPath); } catch (e) {}
        resolve();
      });
    });
  });
}

// Helper: execute reg.exe command safely
function runRegCommand(command) {
  return new Promise((resolve) => {
    exec(command, () => resolve());
  });
}

// Installation worker (Handles Install, Update, and Repair)
ipcMain.handle('installer:startInstall', async (event, options) => {
  const {
    targetDir,
    createDesktopShortcut = true,
    createStartMenuShortcut = true,
    associateFiles = true,
    mode = 'install', // 'install' | 'update' | 'repair'
  } = options;

  const sendProgress = (percent, status, detail = '') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('installer:progress', { percent, status, detail });
    }
  };

  try {
    // Step 0: Ensure any running instance of Aura Editor is terminated before writing files
    sendProgress(5, 'Preparing system...', 'Ensuring previous instances are closed...');
    await killProcess('Aura Editor.exe');

    sendProgress(8, 'Preparing destination directory...', targetDir);
    await rawFsPromises.mkdir(targetDir, { recursive: true });

    let installedVersionTag = '1.0.0';

    // Check if offline/local payload exists (development/fallback)
    let localSourceDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app-payload')
      : path.resolve(__dirname, '../installer-out/win-unpacked');

    if (!fs.existsSync(localSourceDir)) {
      localSourceDir = path.join(__dirname, 'payload');
    }

    if (fs.existsSync(localSourceDir)) {
      sendProgress(12, 'Scanning application components...');
      const allFiles = await getFilesRecursively(localSourceDir);
      const totalFiles = allFiles.length;

      sendProgress(15, mode === 'update' ? 'Updating Aura Editor...' : 'Extracting Aura Editor core engine...');
      let copiedCount = 0;
      for (const srcFile of allFiles) {
        const relPath = path.relative(localSourceDir, srcFile);
        const destFile = path.join(targetDir, relPath);
        const destFileDir = path.dirname(destFile);

        await rawFsPromises.mkdir(destFileDir, { recursive: true });
        await rawFsPromises.copyFile(srcFile, destFile);

        copiedCount++;
        const pct = Math.round(15 + (copiedCount / totalFiles) * 65);
        if (copiedCount % 10 === 0 || copiedCount === totalFiles) {
          sendProgress(pct, mode === 'update' ? 'Updating components...' : 'Extracting application components...', relPath);
        }
      }
    } else {
      // Online Installer / Updater / Repairer: Fetch directly from GitHub Releases
      const repo = getRepoName();
      sendProgress(10, 'Connecting to GitHub Releases...', `Checking latest release on ${repo}`);

      const releaseAsset = await getLatestReleaseAsset(repo);
      installedVersionTag = releaseAsset.version.replace(/^v/, '');
      const tempZipPath = path.join(app.getPath('temp'), `aura-release-${Date.now()}.zip`);

      const mbTotal = (releaseAsset.size / (1024 * 1024)).toFixed(1);
      const actionVerb = mode === 'update' ? 'Updating to' : mode === 'repair' ? 'Repairing with' : 'Downloading';
      sendProgress(15, `${actionVerb} Aura Editor (${releaseAsset.version})...`, `${releaseAsset.name} (~${mbTotal} MB)`);

      await downloadFile(releaseAsset.downloadUrl, tempZipPath, (dlPercent, received, total) => {
        const overallPct = Math.round(15 + (dlPercent / 100) * 60);
        const mbReceived = (received / (1024 * 1024)).toFixed(1);
        sendProgress(
          overallPct,
          `${actionVerb} Aura Editor ${releaseAsset.version} (${mbReceived} MB / ${mbTotal} MB)...`,
          `${dlPercent}% complete`
        );
      });

      sendProgress(76, 'Extracting application components...', 'Unpacking release archive...');
      await extractZip(tempZipPath, targetDir);

      try {
        fs.unlinkSync(tempZipPath);
      } catch (e) {}

      await normalizeExtractedFolder(targetDir);
    }

    const exePath = path.join(targetDir, 'Aura Editor.exe');
    const icoPath = path.join(targetDir, 'Aura Editor.exe,0');

    // Create / Update Shortcuts
    if (createDesktopShortcut) {
      sendProgress(82, 'Updating Desktop shortcut...');
      const desktopDir = (app && app.getPath ? app.getPath('desktop') : null) || path.join(process.env.USERPROFILE || 'C:\\', 'Desktop');
      const desktopShortcut = path.join(desktopDir, 'Aura Editor.lnk');
      await createShortcut(desktopShortcut, exePath, icoPath, 'Aura Editor - Live Markdown Workspace');
    }

    if (createStartMenuShortcut) {
      sendProgress(87, 'Updating Start Menu shortcut...');
      const appDataDir = (app && app.getPath ? app.getPath('appData') : null) || process.env.APPDATA || 'C:\\';
      const startMenuDir = path.join(
        appDataDir,
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs'
      );
      await rawFsPromises.mkdir(startMenuDir, { recursive: true });
      const startMenuShortcut = path.join(startMenuDir, 'Aura Editor.lnk');
      await createShortcut(startMenuShortcut, exePath, icoPath, 'Aura Editor - Live Markdown Workspace');
    }

    // Windows Shell File Associations
    if (associateFiles) {
      sendProgress(91, 'Configuring Windows file associations...');
      const regCmds = [
        // .md & .markdown ProgId
        `reg add "HKCU\\Software\\Classes\\.md" /ve /d "AuraEditor.md" /f`,
        `reg add "HKCU\\Software\\Classes\\.md\\OpenWithProgids" /v "AuraEditor.md" /t REG_NONE /f`,
        `reg add "HKCU\\Software\\Classes\\.markdown" /ve /d "AuraEditor.md" /f`,
        `reg add "HKCU\\Software\\Classes\\.markdown\\OpenWithProgids" /v "AuraEditor.md" /t REG_NONE /f`,
        // .txt ProgId
        `reg add "HKCU\\Software\\Classes\\.txt\\OpenWithProgids" /v "AuraEditor.txt" /t REG_NONE /f`,
        `reg add "HKCU\\Software\\Classes\\AuraEditor.txt" /ve /d "Text Document" /f`,
        `reg add "HKCU\\Software\\Classes\\AuraEditor.txt\\DefaultIcon" /ve /d "${exePath},0" /f`,
        `reg add "HKCU\\Software\\Classes\\AuraEditor.txt\\shell\\open\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"%1\\"" /f`,
        // AuraEditor.md ProgId
        `reg add "HKCU\\Software\\Classes\\AuraEditor.md" /ve /d "Markdown Document" /f`,
        `reg add "HKCU\\Software\\Classes\\AuraEditor.md\\DefaultIcon" /ve /d "${exePath},0" /f`,
        `reg add "HKCU\\Software\\Classes\\AuraEditor.md\\shell\\open\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"%1\\"" /f`,
        // Applications\\Aura Editor.exe (Required for Windows "Open With" and Settings Default App)
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe" /v "FriendlyAppName" /d "Aura Editor" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\DefaultIcon" /ve /d "${exePath},0" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\shell\\open\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"%1\\"" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\SupportedTypes" /v ".md" /t REG_SZ /d "" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\SupportedTypes" /v ".markdown" /t REG_SZ /d "" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\SupportedTypes" /v ".txt" /t REG_SZ /d "" /f`,
        `reg add "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe\\SupportedTypes" /v ".text" /t REG_SZ /d "" /f`,
      ];
      for (const cmd of regCmds) {
        await runRegCommand(cmd);
      }
    }

    // Register Uninstaller in Windows Add or Remove Programs
    sendProgress(95, 'Registering application in Windows settings...');
    const uninstallCmdPath = path.join(targetDir, 'Uninstall.cmd');
    const uninstallScript = `@echo off
echo Uninstalling Aura Editor...
taskkill /F /IM "Aura Editor.exe" >nul 2>&1
del "%USERPROFILE%\\Desktop\\Aura Editor.lnk" >nul 2>&1
del "%USERPROFILE%\\OneDrive\\Desktop\\Aura Editor.lnk" >nul 2>&1
del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Aura Editor.lnk" >nul 2>&1
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AuraEditor" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\AuraEditor.md" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\AuraEditor.txt" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\.md" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\.markdown" /f >nul 2>&1
reg delete "HKCU\\Software\\Classes\\.txt\\OpenWithProgids" /v "AuraEditor.txt" /f >nul 2>&1
echo Done.
start "" cmd /c "timeout /t 1 >nul & rmdir /s /q \\"%~dp0\\""
exit
`;
    await rawFsPromises.writeFile(uninstallCmdPath, uninstallScript, 'utf-8');

    const uninstallRegKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AuraEditor';
    const unregCmds = [
      `reg add "${uninstallRegKey}" /v "DisplayName" /d "Aura Editor" /f`,
      `reg add "${uninstallRegKey}" /v "DisplayVersion" /d "${installedVersionTag}" /f`,
      `reg add "${uninstallRegKey}" /v "Publisher" /d "Aura Team" /f`,
      `reg add "${uninstallRegKey}" /v "DisplayIcon" /d "${exePath}" /f`,
      `reg add "${uninstallRegKey}" /v "InstallLocation" /d "${targetDir}" /f`,
      `reg add "${uninstallRegKey}" /v "UninstallString" /d "\\"${uninstallCmdPath}\\"" /f`,
      `reg add "${uninstallRegKey}" /v "QuietUninstallString" /d "\\"${uninstallCmdPath}\\"" /f`,
    ];
    for (const cmd of unregCmds) {
      await runRegCommand(cmd);
    }

    const doneMessage =
      mode === 'update'
        ? 'Update complete!'
        : mode === 'repair'
        ? 'Repair complete!'
        : 'Installation complete!';

    sendProgress(100, doneMessage, 'Ready to launch.');
    return { success: true, targetDir, exePath, mode };
  } catch (err) {
    console.error('INSTALLATION ERROR:', err);
    return { success: false, error: err.message };
  }
});

// Uninstaller worker
ipcMain.handle('installer:uninstall', async (_event, targetDir) => {
  const sendProgress = (percent, status, detail = '') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('installer:progress', { percent, status, detail });
    }
  };

  try {
    sendProgress(15, 'Stopping active Aura Editor processes...', 'Terminating instances...');
    await killProcess('Aura Editor.exe');

    sendProgress(35, 'Removing shortcuts...', 'Desktop & Start Menu...');
    const desktopDir = (app && app.getPath ? app.getPath('desktop') : null) || path.join(process.env.USERPROFILE || 'C:\\', 'Desktop');
    const oneDriveDesktop = path.join(process.env.USERPROFILE || 'C:\\', 'OneDrive', 'Desktop');
    const appDataDir = (app && app.getPath ? app.getPath('appData') : null) || process.env.APPDATA || 'C:\\';
    const startMenuDir = path.join(appDataDir, 'Microsoft', 'Windows', 'Start Menu', 'Programs');

    const shortcuts = [
      path.join(desktopDir, 'Aura Editor.lnk'),
      path.join(oneDriveDesktop, 'Aura Editor.lnk'),
      path.join(startMenuDir, 'Aura Editor.lnk'),
    ];

    for (const sc of shortcuts) {
      try {
        if (fs.existsSync(sc)) fs.unlinkSync(sc);
      } catch (e) {}
    }

    sendProgress(60, 'Cleaning Windows registry entries...', 'Removing file associations and uninstaller...');
    await runRegCommand('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AuraEditor" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\AuraEditor.md" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\AuraEditor.txt" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\Applications\\Aura Editor.exe" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\.md" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\.markdown" /f');
    await runRegCommand('reg delete "HKCU\\Software\\Classes\\.txt\\OpenWithProgids" /v "AuraEditor.txt" /f');

    sendProgress(80, 'Removing application files...', targetDir);
    if (targetDir && fs.existsSync(targetDir)) {
      try {
        await rawFsPromises.rm(targetDir, { recursive: true, force: true });
      } catch (err) {
        exec(`cmd /c "timeout /t 1 >nul & rmdir /s /q \\"${targetDir}\\""`);
      }
    }

    sendProgress(100, 'Uninstallation Complete', 'Aura Editor has been successfully removed from your PC.');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Launch installed app
ipcMain.handle('installer:launchApp', (_event, targetDir) => {
  const exePath = path.join(targetDir, 'Aura Editor.exe');
  if (fs.existsSync(exePath)) {
    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    setTimeout(() => app.quit(), 400);
    return true;
  }
  return false;
});

// Open installation folder in Explorer
ipcMain.handle('installer:openFolder', (_event, folderPath) => {
  shell.openPath(folderPath);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
