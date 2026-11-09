document.addEventListener('DOMContentLoaded', async () => {
  const { installerAPI } = window;

  // Window Controls
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  // Navigation Buttons
  const btnBack = document.getElementById('btn-back');
  const btnCancel = document.getElementById('btn-cancel');
  const btnNext = document.getElementById('btn-next');
  const btnBrowseFolder = document.getElementById('btn-browse-folder');
  const btnOpenFolder = document.getElementById('btn-open-folder');

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

  // Progress Elements
  const installTitle = document.getElementById('install-title');
  const installDetail = document.getElementById('install-detail');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');

  let currentStep = 0;
  let installedTargetDir = '';

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

    // Fetch initial default install path
    const defaultPath = await installerAPI.getDefaultPath();
    if (inputInstallPath) {
      inputInstallPath.value = defaultPath;
    }
    installedTargetDir = defaultPath;

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
      installerAPI.openFolder(installedTargetDir);
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

    // Update Footer Buttons depending on step
    if (stepIndex === 0) {
      // Welcome
      btnBack.classList.add('hidden');
      btnCancel.classList.remove('hidden');
      btnNext.classList.remove('hidden');
      btnNext.textContent = 'Next →';
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
      btnNext.textContent = 'Install →';
    } else if (stepIndex === 3) {
      // Installing
      btnBack.classList.add('hidden');
      btnCancel.classList.add('hidden');
      btnNext.classList.add('hidden');
    } else if (stepIndex === 4) {
      // Complete
      btnBack.classList.add('hidden');
      btnCancel.classList.add('hidden');
      btnNext.classList.remove('hidden');
      btnNext.textContent = chkLaunch?.checked ? 'Launch Aura.md' : 'Finish';
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
      // Welcome -> Location
      setStep(1);
    } else if (currentStep === 1) {
      // Location -> Options
      installedTargetDir = inputInstallPath.value.trim();
      if (!installedTargetDir) return;
      setStep(2);
    } else if (currentStep === 2) {
      // Options -> Start Installation
      setStep(3);

      const options = {
        targetDir: installedTargetDir,
        createDesktopShortcut: chkDesktop ? chkDesktop.checked : true,
        createStartMenuShortcut: chkStartMenu ? chkStartMenu.checked : true,
        associateFiles: chkAssoc ? chkAssoc.checked : true,
        launchOnFinish: chkLaunch ? chkLaunch.checked : true,
      };

      try {
        const result = installerAPI ? await installerAPI.startInstall(options) : { success: true };
        if (result.success) {
          setTimeout(() => {
            setStep(4);
          }, 600);
        } else {
          if (installTitle) installTitle.textContent = 'Installation encountered an issue';
          if (installDetail) installDetail.textContent = result.error || 'Please check folder permissions or try again.';
          btnCancel.classList.remove('hidden');
        }
      } catch (err) {
        if (installTitle) installTitle.textContent = 'Installation Failed';
        if (installDetail) installDetail.textContent = err.message || 'Unknown error occurred.';
        btnCancel.classList.remove('hidden');
      }
    } else if (currentStep === 4) {
      // Finish / Launch
      if (chkLaunch?.checked && installerAPI) {
        installerAPI.launchApp(installedTargetDir);
      } else if (installerAPI) {
        installerAPI.closeWindow();
      }
    }
  });

  // Initialize on Step 0
  setStep(0);
});
