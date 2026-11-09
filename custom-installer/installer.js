document.addEventListener('DOMContentLoaded', async () => {
  const { installerAPI } = window;

  // Window Controls
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const titlebarText = document.getElementById('titlebar-text');

  // Navigation Buttons
  const btnBack = document.getElementById('btn-back');
  const btnCancel = document.getElementById('btn-cancel');
  const btnNext = document.getElementById('btn-next');
  const btnBrowseFolder = document.getElementById('btn-browse-folder');
  const btnOpenFolder = document.getElementById('btn-open-folder');

  // Mode Views & Cards
  const viewInstall = document.getElementById('view-mode-install');
  const viewUpdate = document.getElementById('view-mode-update');
  const viewRepair = document.getElementById('view-mode-repair');
  const lblInstalledVersion = document.getElementById('lbl-installed-version');
  const lblLatestVersion = document.getElementById('lbl-latest-version');
  const lblCurrentVersion = document.getElementById('lbl-current-version');

  // Maintenance Buttons
  const btnMaintLaunch = document.getElementById('btn-maint-launch');
  const btnMaintRepair = document.getElementById('btn-maint-repair');
  const btnMaintUninstall = document.getElementById('btn-maint-uninstall');

  // Inputs & Options
  const inputInstallPath = document.getElementById('input-install-path');
  const chkDesktop = document.getElementById('chk-desktop');
  const chkStartMenu = document.getElementById('chk-startmenu');
  const chkAssoc = document.getElementById('chk-assoc');
  const chkLaunch = document.getElementById('chk-launch');

  // Screens
  const screens = [
    document.getElementById('screen-welcome'),
    document.getElementById('screen-location'),
    document.getElementById('screen-options'),
    document.getElementById('screen-installing'),
    document.getElementById('screen-complete'),
  ];

  // Stepper Elements
  const stepItems = document.querySelectorAll('.step-item');
  const stepLbl3 = document.getElementById('step-lbl-3');

  // Progress Elements
  const installTitle = document.getElementById('install-title');
  const installDetail = document.getElementById('install-detail');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const progressBadge = document.getElementById('progress-badge');

  // Complete Screen Elements
  const completeTitle = document.getElementById('complete-title');
  const completeDesc = document.getElementById('complete-desc');
  const completeBadgeIcon = document.getElementById('complete-badge-icon');

  let currentStep = 0;
  let activeMode = 'install'; // 'install' | 'update' | 'repair' | 'uninstall'
  let installedTargetDir = '';
  let installState = null;

  // --------------------------------------------------------------------------
  // Theme Toggle Logic (Light / Dark mode with persistence)
  // --------------------------------------------------------------------------
  const THEME_STORAGE_KEY = 'aura_installer_theme_mode';
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  // --------------------------------------------------------------------------
  // Setup Window Controls
  // --------------------------------------------------------------------------
  if (installerAPI) {
    btnMinimize?.addEventListener('click', () => installerAPI.minimizeWindow());
    btnClose?.addEventListener('click', () => installerAPI.closeWindow());

    // Browse folder
    btnBrowseFolder?.addEventListener('click', async () => {
      const chosen = await installerAPI.browseFolder(inputInstallPath.value);
      if (chosen) {
        inputInstallPath.value = chosen;
        installedTargetDir = chosen;
      }
    });

    // Open install folder in Explorer
    btnOpenFolder?.addEventListener('click', () => {
      if (installedTargetDir) {
        installerAPI.openFolder(installedTargetDir);
      }
    });

    // Real-time progress updates from worker
    installerAPI.onProgress(({ percent, status, detail }) => {
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressPercent) progressPercent.textContent = `${percent}%`;
      if (status && installTitle) installTitle.textContent = status;
      if (detail && installDetail) installDetail.textContent = detail;
    });
  }

  // --------------------------------------------------------------------------
  // Detect Installation & Set UI Mode
  // --------------------------------------------------------------------------
  if (installerAPI) {
    try {
      installState = await installerAPI.checkInstallation();
      activeMode = installState.mode;
      installedTargetDir = installState.installDir;

      if (inputInstallPath) {
        inputInstallPath.value = installedTargetDir;
      }

      // Configure Screen based on mode
      if (activeMode === 'update') {
        if (titlebarText) titlebarText.textContent = 'Aura.md Updater';
        if (viewInstall) viewInstall.classList.add('hidden');
        if (viewRepair) viewRepair.classList.add('hidden');
        if (viewUpdate) viewUpdate.classList.remove('hidden');

        if (lblInstalledVersion) lblInstalledVersion.textContent = `v${installState.installedVersion || '1.0.0'}`;
        if (lblLatestVersion) lblLatestVersion.textContent = `${installState.latestVersion || 'v1.0.1'}`;
        if (stepLbl3) stepLbl3.textContent = 'Updating';
      } else if (activeMode === 'repair') {
        if (titlebarText) titlebarText.textContent = 'Aura.md Maintenance';
        if (viewInstall) viewInstall.classList.add('hidden');
        if (viewUpdate) viewUpdate.classList.add('hidden');
        if (viewRepair) viewRepair.classList.remove('hidden');

        if (lblCurrentVersion) lblCurrentVersion.textContent = `v${installState.installedVersion || '1.0.0'}`;
        if (stepLbl3) stepLbl3.textContent = 'Repairing';
      } else {
        // Fresh install
        activeMode = 'install';
        if (titlebarText) titlebarText.textContent = 'Aura.md Setup';
        if (viewInstall) viewInstall.classList.remove('hidden');
        if (viewUpdate) viewUpdate.classList.add('hidden');
        if (viewRepair) viewRepair.classList.add('hidden');
        if (stepLbl3) stepLbl3.textContent = 'Installing';
      }
    } catch (e) {
      console.warn('Installation check error:', e);
      const defaultPath = await installerAPI.getDefaultPath();
      installedTargetDir = defaultPath;
      if (inputInstallPath) inputInstallPath.value = defaultPath;
    }
  }

  // --------------------------------------------------------------------------
  // Maintenance Mode Action Buttons
  // --------------------------------------------------------------------------
  btnMaintLaunch?.addEventListener('click', () => {
    if (installerAPI) {
      installerAPI.launchApp(installedTargetDir);
    }
  });

  btnMaintRepair?.addEventListener('click', () => {
    activeMode = 'repair';
    runInstallationFlow();
  });

  btnMaintUninstall?.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to uninstall Aura.md from your computer?');
    if (!confirmed) return;

    activeMode = 'uninstall';
    setStep(3);
    if (installTitle) installTitle.textContent = 'Uninstalling Aura.md...';
    if (installDetail) installDetail.textContent = 'Removing application components...';
    if (progressBadge) progressBadge.textContent = 'Uninstalling';

    try {
      const res = await installerAPI.uninstall(installedTargetDir);
      if (res.success) {
        if (completeTitle) completeTitle.textContent = 'Uninstall Complete';
        if (completeDesc) completeDesc.textContent = 'Aura.md has been cleanly uninstalled from your PC.';
        if (btnOpenFolder) btnOpenFolder.classList.add('hidden');
        setStep(4);
      } else {
        if (installTitle) installTitle.textContent = 'Uninstallation issue';
        if (installDetail) installDetail.textContent = res.error || 'Could not remove some files.';
        btnCancel.classList.remove('hidden');
      }
    } catch (err) {
      if (installTitle) installTitle.textContent = 'Uninstallation failed';
      if (installDetail) installDetail.textContent = err.message || 'Unknown error occurred.';
      btnCancel.classList.remove('hidden');
    }
  });

  // --------------------------------------------------------------------------
  // Stepper & Screen Navigation
  // --------------------------------------------------------------------------
  function setStep(stepIndex) {
    currentStep = stepIndex;

    // Update screen visibility
    screens.forEach((screen, idx) => {
      if (screen) {
        screen.classList.toggle('active', idx === stepIndex);
      }
    });

    // Update left stepper dots and labels
    stepItems.forEach((item, idx) => {
      item.classList.remove('active', 'completed');
      if (idx === stepIndex) {
        item.classList.add('active');
      } else if (idx < stepIndex) {
        item.classList.add('completed');
      }
    });

    // Update Footer Buttons depending on step & mode
    if (stepIndex === 0) {
      // Welcome
      btnBack.classList.add('hidden');
      btnCancel.classList.remove('hidden');

      if (activeMode === 'repair') {
        btnNext.classList.add('hidden');
      } else if (activeMode === 'update') {
        btnNext.classList.remove('hidden');
        btnNext.textContent = 'Update Now →';
      } else {
        btnNext.classList.remove('hidden');
        btnNext.textContent = 'Next →';
      }
    } else if (stepIndex === 1) {
      // Install Location
      btnBack.classList.remove('hidden');
      btnCancel.classList.remove('hidden');
      btnNext.classList.remove('hidden');
      btnNext.textContent = 'Next →';
    } else if (stepIndex === 2) {
      // Options
      btnBack.classList.remove('hidden');
      btnCancel.classList.remove('hidden');
      btnNext.classList.remove('hidden');
      btnNext.textContent = activeMode === 'update' ? 'Update →' : 'Install →';
    } else if (stepIndex === 3) {
      // Installing / Updating / Repairing
      btnBack.classList.add('hidden');
      btnCancel.classList.add('hidden');
      btnNext.classList.add('hidden');
    } else if (stepIndex === 4) {
      // Complete
      btnBack.classList.add('hidden');
      btnCancel.classList.add('hidden');
      btnNext.classList.remove('hidden');

      if (activeMode === 'uninstall') {
        btnNext.textContent = 'Close';
      } else {
        btnNext.textContent = chkLaunch?.checked ? 'Launch Aura.md' : 'Finish';
      }
    }
  }

  // --------------------------------------------------------------------------
  // Action Button Listeners
  // --------------------------------------------------------------------------
  btnBack?.addEventListener('click', () => {
    if (currentStep > 0 && currentStep <= 2) {
      setStep(currentStep - 1);
    }
  });

  btnCancel?.addEventListener('click', () => {
    if (installerAPI) {
      installerAPI.closeWindow();
    } else {
      window.close();
    }
  });

  btnNext?.addEventListener('click', async () => {
    if (currentStep === 0) {
      if (activeMode === 'update') {
        // Direct one-click update
        runInstallationFlow();
      } else {
        // Welcome -> Location
        setStep(1);
      }
    } else if (currentStep === 1) {
      // Location -> Options
      installedTargetDir = inputInstallPath.value.trim();
      if (!installedTargetDir) return;
      setStep(2);
    } else if (currentStep === 2) {
      // Options -> Start Installation
      runInstallationFlow();
    } else if (currentStep === 4) {
      // Finish / Launch
      if (activeMode === 'uninstall') {
        installerAPI?.closeWindow();
      } else if (chkLaunch?.checked && installerAPI) {
        installerAPI.launchApp(installedTargetDir);
      } else if (installerAPI) {
        installerAPI.closeWindow();
      }
    }
  });

  // --------------------------------------------------------------------------
  // Core Installation / Update / Repair Execution
  // --------------------------------------------------------------------------
  async function runInstallationFlow() {
    setStep(3);

    const verb = activeMode === 'update' ? 'Updating' : activeMode === 'repair' ? 'Repairing' : 'Installing';
    if (installTitle) installTitle.textContent = `${verb} Aura.md...`;
    if (installDetail) installDetail.textContent = 'Connecting to GitHub Releases...';
    if (progressBadge) progressBadge.textContent = verb;

    const options = {
      targetDir: installedTargetDir || inputInstallPath.value.trim(),
      createDesktopShortcut: chkDesktop ? chkDesktop.checked : true,
      createStartMenuShortcut: chkStartMenu ? chkStartMenu.checked : true,
      associateFiles: chkAssoc ? chkAssoc.checked : true,
      launchOnFinish: chkLaunch ? chkLaunch.checked : true,
      mode: activeMode,
    };

    try {
      const result = installerAPI ? await installerAPI.startInstall(options) : { success: true };
      if (result.success) {
        // Update complete screen text
        if (activeMode === 'update') {
          if (completeTitle) completeTitle.textContent = 'Update Complete';
          if (completeDesc) completeDesc.textContent = 'Aura.md has been successfully updated with all your data preserved.';
        } else if (activeMode === 'repair') {
          if (completeTitle) completeTitle.textContent = 'Repair Complete';
          if (completeDesc) completeDesc.textContent = 'Aura.md core engine and system shortcuts have been restored.';
        } else {
          if (completeTitle) completeTitle.textContent = 'Setup Complete';
          if (completeDesc) completeDesc.textContent = 'Aura.md is installed and ready to elevate your writing experience.';
        }

        setTimeout(() => {
          setStep(4);
        }, 600);
      } else {
        if (installTitle) installTitle.textContent = `${verb} encountered an issue`;
        if (installDetail) installDetail.textContent = result.error || 'Please check folder permissions or internet connection.';
        btnCancel.classList.remove('hidden');
      }
    } catch (err) {
      if (installTitle) installTitle.textContent = `${verb} Failed`;
      if (installDetail) installDetail.textContent = err.message || 'Unknown error occurred.';
      btnCancel.classList.remove('hidden');
    }
  }

  // Initialize on Step 0
  setStep(0);
});
