import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Lock, Key, EyeOff, UploadCloud, AlertTriangle } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { Editor, EditorHandle } from './components/Editor';
import { CommandPalette } from './components/CommandPalette';
import { FindReplace } from './components/FindReplace';
import { SidebarDrawer } from './components/SidebarDrawer';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { FloatingToolbar } from './components/FloatingToolbar';
import { ContextMenu } from './components/ContextMenu';
import { AudioModal } from './components/AudioModal';
import { SplitPane } from './components/SplitPane';
import { SourceLiveSplitPane } from './components/SourceLiveSplitPane';
import { FloatingEditorWindow } from './components/FloatingEditorWindow';
import { LockModal } from './components/LockModal';
import { TableModal } from './components/TableModal';
import { ConfirmCloseModal } from './components/ConfirmCloseModal';
import { LoadingScreen } from './components/LoadingScreen';
import { fileSystem } from './services/FileSystemService';
import { autosaveService, RevisionSnapshot } from './services/AutosaveService';
import { workspaceService, WorkspaceState } from './services/WorkspaceService';
import { ImportExportService } from './services/ImportExportService';
import { CryptoService } from './services/CryptoService';
import { calculateDocumentStats, extractDocumentOutline } from './utils/markdownStats';
import { SAMPLE_DOCUMENT } from './utils/sampleDocument';
import { toggleWrap, toggleLinePrefix } from './editor/Keymaps';
import { DEFAULT_WORD_TRIGGERS } from './editor/WordTriggerPlugin';
import {
  FileItem,
  EditorSettings,
  EditorViewMode,
  DocumentStats,
  OutlineItem,
  ThemeId,
  FontId,
  FloatingWindow,
} from './types';

const STORAGE_KEY_SETTINGS = 'aura_editor_settings_v1';

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'dark',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.75,
  contentWidth: '980px',
  typewriterMode: false,
  minimalMode: false,
  focusMode: false,
  bionicReading: false,
  hemingwayMode: false,
  showTitleBar: true,
  showTabBar: false, // Hidden by default
  showStatusBar: true,
  showLineNumbers: false,
  spellcheck: true,
  liveMarkdown: true,
  editorMode: 'live',
  syntaxFade: true,
  vimMode: false,
  tabSize: 2,
  autosaveInterval: 2000,
  audio: {
    ambientSound: 'none',
    ambientVolume: 0.4,
    ambientPlaying: false,
    keystrokeSound: 'none',
    keystrokeVolume: 0.5,
    keystrokeEnabled: false,
  },
  split: {
    mode: 'none',
    splitFileId: null,
    ratio: 50,
    syncScroll: false,
  },
  wordTriggers: DEFAULT_WORD_TRIGGERS,
};

export const App: React.FC = () => {
  // Settings State
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          editorMode: parsed.editorMode || (parsed.liveMarkdown ? 'live' : 'source'),
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Files State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Metrics & Outline
  const [stats, setStats] = useState<DocumentStats>(() => calculateDocumentStats(''));
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, offset: 0 });

  // UI Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'vault' | 'outline'>('files');
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => workspaceService.getState());
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Track open modal state in a ref to avoid stale closures in global key capture
  const openModalsRef = useRef({
    isCommandPaletteOpen,
    isFindOpen,
    isSettingsOpen,
    isStatsOpen,
    isShortcutsOpen,
    isImportExportOpen,
    isAudioOpen,
    isLockModalOpen,
    isTableModalOpen,
    isSidebarOpen,
    minimalMode: settings.minimalMode,
  });
  openModalsRef.current = {
    isCommandPaletteOpen,
    isFindOpen,
    isSettingsOpen,
    isStatsOpen,
    isShortcutsOpen,
    isImportExportOpen,
    isAudioOpen,
    isLockModalOpen,
    isTableModalOpen,
    isSidebarOpen,
    minimalMode: settings.minimalMode,
  };

  const [isDragOverWindow, setIsDragOverWindow] = useState(false);
  const dragCounterRef = useRef(0);
  const [confirmCloseState, setConfirmCloseState] = useState<{
    isOpen: boolean;
    target: 'app' | { type: 'tab'; fileId: string };
    file: FileItem | null;
  }>({
    isOpen: false,
    target: 'app',
    file: null,
  });

  // Open Tabs State
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aura_open_tabs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Floating Detached Windows State
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindow[]>([]);
  const [tabBarBounds, setTabBarBounds] = useState<DOMRect | null>(null);
  const [highestZIndex, setHighestZIndex] = useState<number>(100);

  // Session-unlocked files
  const [unlockedFileIds, setUnlockedFileIds] = useState<Set<string>>(new Set());

  // True Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!document.fullscreenElement;
    }
    return false;
  });

  const toggleTrueFullscreen = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.toggleFullscreen) {
        const isFs = await (window as any).electronAPI.toggleFullscreen();
        setIsFullscreen(isFs);
        return;
      }

      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.error('Fullscreen toggle failed:', e);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleToggleMinimalMode = useCallback(() => {
    setSettings((s) => ({ ...s, minimalMode: !s.minimalMode }));
  }, []);

  const handleToggleTitleBar = useCallback(() => {
    setSettings((s) => ({ ...s, showTitleBar: !s.showTitleBar }));
  }, []);

  const handleToggleTabBar = useCallback(() => {
    setSettings((s) => ({ ...s, showTabBar: !s.showTabBar }));
  }, []);

  // Ref to Editors
  const editorRef = useRef<EditorHandle>(null);
  const editorRefB = useRef<EditorHandle>(null);
  const editorRefLive = useRef<EditorHandle>(null);
  const autosaveTimerRef = useRef<any>(null);
  const metricsTimerRef = useRef<any>(null);
  const filesSaveTimerRef = useRef<any>(null);
  const isOpeningFileRef = useRef<boolean>(false);

  // External File Conflict & Version State
  const [externalConflict, setExternalConflict] = useState<{ filePath: string; fileName: string } | null>(null);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  // Notifications removed per user request (clean no-op callback preserves API contract)
  const showToast = useCallback((_message?: string, _type?: any, _action?: any) => {}, []);

  // Zoom State & Management (Supports Ctrl+, Ctrl-, Ctrl 0 across Electron & Web)
  const [zoomFactor, setZoomFactorState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aura_zoom_factor');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 2.5) return val;
      }
    } catch (e) {}
    return 1.0;
  });

  const zoomFactorRef = useRef(zoomFactor);
  zoomFactorRef.current = zoomFactor;

  const applyZoom = useCallback((factor: number) => {
    const clamped = Math.round(Math.min(2.5, Math.max(0.5, factor)) * 10) / 10;
    setZoomFactorState(clamped);
    zoomFactorRef.current = clamped;
    try {
      localStorage.setItem('aura_zoom_factor', clamped.toString());
    } catch (e) {}

    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI?.setZoomFactor) {
        (window as any).electronAPI.setZoomFactor(clamped);
      } else {
        (document.documentElement.style as any).zoom = `${clamped}`;
      }
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    applyZoom(zoomFactorRef.current + 0.1);
  }, [applyZoom]);

  const handleZoomOut = useCallback(() => {
    applyZoom(zoomFactorRef.current - 0.1);
  }, [applyZoom]);

  const handleZoomReset = useCallback(() => {
    applyZoom(1.0);
  }, [applyZoom]);

  useEffect(() => {
    if (zoomFactor !== 1.0) {
      applyZoom(zoomFactor);
    }
  }, []);

  const handleCycleEditorMode = useCallback(() => {
    setSettings((s) => {
      const current = s.editorMode || (s.liveMarkdown ? 'live' : 'source');
      let next: EditorViewMode = 'live';
      if (current === 'live') next = 'source';
      else if (current === 'source') next = 'split';
      else if (current === 'split') next = 'live';

      return { ...s, editorMode: next, liveMarkdown: next !== 'source' };
    });
  }, []);

  const handleReloadFromDisk = useCallback(async () => {
    if (!externalConflict) return;
    const { filePath } = externalConflict;
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
        const res = await (window as any).electronAPI.readFile(filePath);
        if (res?.success && typeof res.content === 'string') {
          setContent(res.content);
          setIsDirty(false);
          isDirtyRef.current = false;
          contentRef.current = res.content;
          editorRef.current?.setText(res.content);
          editorRefLive.current?.setText(res.content);
          setFiles((prev) =>
            prev.map((f) => (f.path === filePath ? { ...f, content: res.content, lastModified: Date.now() } : f))
          );
          setExternalConflict(null);
          showToast('Reloaded latest version from disk', 'success');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to reload file from disk:', e);
    }
    setExternalConflict(null);
    showToast('Failed to reload file from disk', 'error');
  }, [externalConflict, showToast]);

  const handleCheckForUpdates = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdates) {
      showToast('Checking for updates...', 'info');
      try {
        const res = await (window as any).electronAPI.checkForUpdates();
        if (res?.updateAvailable) {
          showToast(`Update v${res.latestVersion} available! Click to download.`, 'info', {
            label: 'Download',
            onClick: () => {
              if (res.releaseUrl) window.open(res.releaseUrl, '_blank');
            },
          });
        } else {
          showToast(`You are up to date (v${appVersion})`, 'success');
        }
      } catch (e) {
        showToast('Unable to check for updates right now', 'error');
      }
    } else {
      showToast(`Aura v${appVersion} is up to date`, 'info');
    }
  }, [appVersion, showToast]);

  // Synchronized state refs to eliminate race conditions
  const activeFileIdRef = useRef<string | null>(activeFileId);
  const isDirtyRef = useRef<boolean>(isDirty);
  const contentRef = useRef<string>(content);
  const filesRef = useRef<FileItem[]>(files);
  const activeFileRef = useRef<FileItem | null>(null);
  const openFileItemRef = useRef<((name: string, fileContent: string, filePath?: string, fileHandle?: any) => void) | null>(null);

  activeFileIdRef.current = activeFileId;
  isDirtyRef.current = isDirty;
  contentRef.current = content;
  filesRef.current = files;
  activeFileRef.current = files.find((f) => f.id === activeFileId) || null;

  // Flush any pending unsaved drafts & state on page hide or window close
  useEffect(() => {
    const handleFlushOnExit = () => {
      const currentId = activeFileIdRef.current;
      if (currentId) {
        localStorage.setItem('aura_active_file_id_v1', currentId);
        if (isDirtyRef.current) {
          localStorage.setItem(`aura_draft_content_${currentId}`, contentRef.current);
          localStorage.setItem(`aura_draft_dirty_${currentId}`, 'true');
        }
      }
      if (filesRef.current.length > 0) {
        fileSystem.saveAllFiles(filesRef.current);
      }
    };

    window.addEventListener('beforeunload', handleFlushOnExit);
    window.addEventListener('pagehide', handleFlushOnExit);
    return () => {
      window.removeEventListener('beforeunload', handleFlushOnExit);
      window.removeEventListener('pagehide', handleFlushOnExit);
    };
  }, []);

  // Apply theme to HTML body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const allThemeClasses = [
      'theme-paper',
      'theme-white',
      'theme-dark',
      'theme-oled',
      'theme-slate',
      'theme-sepia',
      'theme-nord',
      'theme-dracula',
      'theme-solarizedLight',
      'theme-solarizedDark',
      'theme-forest',
      'theme-coffee',
      'theme-terracotta',
      'theme-lavender',
      'theme-matrix',
      'theme-rosePine',
      'theme-hcLight',
      'theme-hcDark',
    ];
    root.classList.remove(...allThemeClasses);
    root.classList.add(`theme-${settings.theme}`);

    const isDark = [
      'dark',
      'oled',
      'slate',
      'nord',
      'dracula',
      'solarizedDark',
      'forest',
      'coffee',
      'terracotta',
      'lavender',
      'matrix',
      'rosePine',
      'hcDark',
    ].includes(settings.theme);

    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Load initial files on mount with background warm-up
  useEffect(() => {
    const initializeFiles = async () => {
      const startTime = Date.now();
      let loadedFiles = await fileSystem.loadAllFiles();
      if (loadedFiles.length === 0) {
        // Create initial sample document
        const initialDoc: FileItem = {
          id: `doc-welcome`,
          name: 'Welcome to Aura.md',
          content: SAMPLE_DOCUMENT,
          lastModified: Date.now(),
          createdAt: Date.now(),
          isFavorite: true,
          isRecent: true,
        };
        loadedFiles = [initialDoc];
        await fileSystem.saveAllFiles(loadedFiles);
      } else {
        // Update any existing welcome document if it contains legacy test text
        const welcomeDoc = loadedFiles.find(
          (f) => f.name === 'Welcome to Aura.md' || f.id === 'doc-welcome'
        );
        if (
          welcomeDoc &&
          (welcomeDoc.content.includes('THE ULTIMATE MARKDOWN SPECIFICATION') ||
            welcomeDoc.content.includes('Typography \\& Inline Elements') ||
            welcomeDoc.content.includes('Deterministic Finite Automaton') ||
            welcomeDoc.content.includes('Aura is a **100% offline**') ||
            welcomeDoc.content.includes('distraction-free, privacy-first writing environment') ||
            welcomeDoc.content.includes('Click **☰**') ||
            welcomeDoc.content.includes('\n---\n') ||
            !welcomeDoc.content.includes('Three Steps to Mastery') ||
            welcomeDoc.content.trim() === '')
        ) {
          welcomeDoc.content = SAMPLE_DOCUMENT;
          localStorage.removeItem(`aura_draft_content_${welcomeDoc.id}`);
          localStorage.removeItem(`aura_draft_dirty_${welcomeDoc.id}`);
          await fileSystem.saveAllFiles(loadedFiles);
        }
      }

      // Check for any unsaved local drafts for each file
      const filesWithDrafts = loadedFiles.map((f) => {
        const draft = localStorage.getItem(`aura_draft_content_${f.id}`);
        if (draft !== null) {
          if (
            draft.includes('THE ULTIMATE MARKDOWN SPECIFICATION') ||
            draft.includes('Typography \\& Inline Elements') ||
            draft.includes('Deterministic Finite Automaton') ||
            draft.includes('Aura is a **100% offline**') ||
            draft.includes('distraction-free, privacy-first writing environment')
          ) {
            localStorage.removeItem(`aura_draft_content_${f.id}`);
            localStorage.removeItem(`aura_draft_dirty_${f.id}`);
            return f;
          }
          return { ...f, content: draft };
        }
        return f;
      });

      filesRef.current = filesWithDrafts;
      setFiles(filesWithDrafts);

      const savedActiveId = fileSystem.getActiveFileId();
      const active =
        filesWithDrafts.find((f) => f.id === savedActiveId) || filesWithDrafts[0];

      const isUnsaved = localStorage.getItem(`aura_draft_dirty_${active.id}`) === 'true';
      setActiveFileId(active.id);
      setContent(active.content);
      setIsDirty(isUnsaved);
      setStats(calculateDocumentStats(active.content));
      setOutline(extractDocumentOutline(active.content));

      setOpenTabIds((prev) => {
        const valid = prev.filter((id) => filesWithDrafts.some((f) => f.id === id));
        if (!valid.includes(active.id)) {
          valid.push(active.id);
        }
        localStorage.setItem('aura_open_tabs_v1', JSON.stringify(valid));
        return valid;
      });

      // Check if Electron was launched with an initial file from disk (e.g. double click .md or .txt)
      if (typeof window !== 'undefined' && (window as any).electronAPI?.getInitialFile) {
        try {
          const initFile = await (window as any).electronAPI.getInitialFile();
          if (initFile && initFile.fileName && typeof initFile.content === 'string') {
            openFileItemRef.current?.(initFile.fileName, initFile.content, initFile.filePath);
          }
        } catch (e) {
          console.warn('Failed to retrieve initial file from Electron:', e);
        }
      }

      // Warm up layout and fonts in the background before fading out the loading screen
      const minSplashTime = 550;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(60, minSplashTime - elapsed);

          if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
            document.fonts.ready
              .then(() => {
                setTimeout(() => setIsAppReady(true), remainingTime);
              })
              .catch(() => {
                setTimeout(() => setIsAppReady(true), remainingTime);
              });
          } else {
            setTimeout(() => setIsAppReady(true), remainingTime);
          }
        });
      });
    };

    initializeFiles();
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || (files.length > 0 ? files[0] : null);
  const isDocumentLocked = !!(activeFile?.isEncrypted && !unlockedFileIds.has(activeFile.id));

  // Open files list for tabs - follows openTabIds sequence so new tabs open to the right
  const openFiles = useMemo(() => {
    return openTabIds
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is FileItem => !!f);
  }, [files, openTabIds]);

  const dirtyFileIds = useMemo(() => {
    const set = new Set<string>();
    if (isDirty && activeFileId) set.add(activeFileId);
    return set;
  }, [isDirty, activeFileId]);

  // Query App Version from Electron
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getAppVersion) {
      (window as any).electronAPI.getAppVersion().then((ver: string) => {
        if (ver) setAppVersion(ver);
      }).catch(() => {});
    }
  }, []);

  // Listen for External File Modifications on Disk
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onExternalFileChange) {
      const unsub = (window as any).electronAPI.onExternalFileChange((data: { filePath: string }) => {
        if (!data?.filePath) return;
        const currentFile = filesRef.current.find((f) => f.id === activeFileIdRef.current);
        if (currentFile && currentFile.path === data.filePath) {
          setExternalConflict({ filePath: data.filePath, fileName: currentFile.name });
        }
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  // Listen for File Open events from Electron (e.g. double clicking .md or .txt while app is open)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onFileOpened) {
      const unsub = (window as any).electronAPI.onFileOpened(
        (data: { fileName: string; filePath: string; content: string }) => {
          if (data && data.fileName && typeof data.content === 'string') {
            openFileItemRef.current?.(data.fileName, data.content, data.filePath);
          }
        }
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  // Watch currently active file on disk
  useEffect(() => {
    const curPath = activeFile?.path;
    if (typeof window !== 'undefined' && (window as any).electronAPI?.watchFile && curPath) {
      (window as any).electronAPI.watchFile(curPath);
      return () => {
        (window as any).electronAPI.unwatchFile(curPath);
      };
    }
  }, [activeFile?.path]);

  // Subscribe to local Workspace / Folder Vault updates
  useEffect(() => {
    return workspaceService.subscribe((state) => {
      setWorkspaceState(state);
    });
  }, []);

  const handleOpenWorkspace = useCallback(async () => {
    const success = await workspaceService.openWorkspaceDialog();
    if (success) {
      setSidebarTab('vault');
      setIsSidebarOpen(true);
      showToast('Vault folder opened', 'success');
    }
  }, [showToast]);

  const handleOpenFileByPath = useCallback(async (filePath: string) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
      try {
        const content = await (window as any).electronAPI.readFile(filePath);
        const parts = filePath.split(/[/\\]/);
        const name = parts[parts.length - 1] || 'Document.md';
        openFileItemRef.current?.(name, content, filePath);
      } catch (err: any) {
        showToast(`Failed to open file: ${err.message || 'Disk error'}`, 'error');
      }
    }
  }, [showToast]);

  // Update stats & outline when content changes
  const handleContentChange = (newContent: string) => {
    const currentId = activeFileIdRef.current;
    if (!currentId) return;

    contentRef.current = newContent;
    isDirtyRef.current = true;
    setContent(newContent);
    if (!isDirtyRef.current) {
      setIsDirty(true);
    }

    // Immediate lightweight synchronous draft persistence to localStorage for active file
    localStorage.setItem(`aura_draft_content_${currentId}`, newContent);
    localStorage.setItem(`aura_draft_dirty_${currentId}`, 'true');

    // Debounce stats & outline calculation to keep keystrokes 120 FPS
    if (metricsTimerRef.current) clearTimeout(metricsTimerRef.current);
    metricsTimerRef.current = setTimeout(() => {
      setStats(calculateDocumentStats(newContent));
      setOutline(extractDocumentOutline(newContent));
    }, 200);

    // Debounce updating entire files collection and saving filesystem to disk
    if (filesSaveTimerRef.current) clearTimeout(filesSaveTimerRef.current);
    filesSaveTimerRef.current = setTimeout(() => {
      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === currentId
            ? { ...f, content: newContent, lastModified: Date.now(), isRecent: true }
            : f
        );
        fileSystem.saveAllFiles(updated);
        return updated;
      });
    }, 500);

    // Debounced revision snapshots
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const cur = filesRef.current.find((f) => f.id === currentId);
      if (cur) {
        autosaveService.saveSnapshot(currentId, cur.name, newContent);
      }
    }, 1000);
  };

  // Cursor change handler
  const handleCursorChange = (pos: { line: number; col: number; offset: number }) => {
    setCursorPos(pos);
  };

  // Document Operations
  const handleNewFile = () => {
    const newDoc: FileItem = {
      id: `doc-${Date.now()}`,
      name: `Untitled ${files.length + 1}.md`,
      content: '',
      lastModified: Date.now(),
      createdAt: Date.now(),
      isRecent: true,
    };

    const updated = [newDoc, ...files];
    setFiles(updated);
    fileSystem.saveAllFiles(updated);

    activeFileIdRef.current = newDoc.id;
    contentRef.current = '';
    isDirtyRef.current = false;

    setActiveFileId(newDoc.id);
    fileSystem.setActiveFileId(newDoc.id);
    setContent('');
    setIsDirty(false);
    setStats(calculateDocumentStats(''));
    setOutline([]);

    setOpenTabIds((prev) => {
      const next = prev.includes(newDoc.id) ? prev : [...prev, newDoc.id];
      localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
      return next;
    });

    editorRef.current?.setText('');
    editorRef.current?.focus();
    showToast('Created new document', 'success');
  };

  const handleLoadShowcase = () => {
    const existingWelcome = files.find((f) => f.name === 'Welcome to Aura.md');
    if (existingWelcome) {
      handleSelectFile(existingWelcome);
      showToast('Opened Welcome to Aura Guide', 'info');
      return;
    }

    const showcaseDoc: FileItem = {
      id: `doc-welcome-${Date.now()}`,
      name: 'Welcome to Aura.md',
      content: SAMPLE_DOCUMENT,
      lastModified: Date.now(),
      createdAt: Date.now(),
      isFavorite: true,
      isRecent: true,
    };

    const updated = [showcaseDoc, ...files];
    setFiles(updated);
    fileSystem.saveAllFiles(updated);

    activeFileIdRef.current = showcaseDoc.id;
    contentRef.current = SAMPLE_DOCUMENT;
    isDirtyRef.current = false;

    setActiveFileId(showcaseDoc.id);
    fileSystem.setActiveFileId(showcaseDoc.id);
    setContent(SAMPLE_DOCUMENT);
    setIsDirty(false);
    setStats(calculateDocumentStats(SAMPLE_DOCUMENT));
    setOutline(extractDocumentOutline(SAMPLE_DOCUMENT));

    setOpenTabIds((prev) => {
      const next = prev.includes(showcaseDoc.id) ? prev : [...prev, showcaseDoc.id];
      localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
      return next;
    });

    editorRef.current?.setText(SAMPLE_DOCUMENT);
    editorRef.current?.focus();
    showToast('Loaded Welcome to Aura Guide', 'success');
  };

  const handleSelectFile = (file: FileItem) => {
    const prevId = activeFileIdRef.current;
    // Save previous active file if dirty before switching
    if (prevId && isDirtyRef.current && prevId !== file.id) {
      localStorage.setItem(`aura_draft_content_${prevId}`, contentRef.current);
      localStorage.setItem(`aura_draft_dirty_${prevId}`, 'true');
      const prevFile = filesRef.current.find((f) => f.id === prevId);
      if (prevFile) {
        autosaveService.saveSnapshot(prevId, prevFile.name, contentRef.current);
      }
    }

    // Determine target content (check if there is a draft)
    const draftContent = localStorage.getItem(`aura_draft_content_${file.id}`);
    const isDraftUnsaved = localStorage.getItem(`aura_draft_dirty_${file.id}`) === 'true';
    const targetContent = draftContent !== null ? draftContent : file.content;

    // Immediately update active refs BEFORE setting CodeMirror text
    activeFileIdRef.current = file.id;
    contentRef.current = targetContent;
    isDirtyRef.current = isDraftUnsaved;

    setActiveFileId(file.id);
    fileSystem.setActiveFileId(file.id);
    setContent(targetContent);
    setIsDirty(isDraftUnsaved);
    setStats(calculateDocumentStats(targetContent));
    setOutline(extractDocumentOutline(targetContent));

    setOpenTabIds((prev) => {
      if (!prev.includes(file.id)) {
        const next = [...prev, file.id];
        localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
        return next;
      }
      return prev;
    });

    editorRef.current?.setText(targetContent);
    editorRefLive.current?.setText(targetContent);
    editorRef.current?.focus();

    // If file is backed by disk path and not dirty, check if disk content was modified
    if (file.path && !isDraftUnsaved && typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
      (window as any).electronAPI.readFile(file.path).then((res: any) => {
        if (res?.success && typeof res.content === 'string' && res.content !== targetContent) {
          if (activeFileIdRef.current === file.id) {
            contentRef.current = res.content;
            setContent(res.content);
            setStats(calculateDocumentStats(res.content));
            setOutline(extractDocumentOutline(res.content));
            editorRef.current?.setText(res.content);
            editorRefLive.current?.setText(res.content);
            setFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, content: res.content, lastModified: Date.now() } : f))
            );
          }
        }
      }).catch(() => {});
    }
  };

  const handleCloseTabDirect = (fileId: string) => {
    const remaining = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(remaining);
    localStorage.setItem('aura_open_tabs_v1', JSON.stringify(remaining));

    if (activeFileId === fileId) {
      if (remaining.length > 0) {
        const nextFile = files.find((f) => f.id === remaining[remaining.length - 1]);
        if (nextFile) {
          handleSelectFile(nextFile);
        }
      } else {
        handleNewFile();
      }
    }
  };

  const handleRequestCloseTab = (fileId: string) => {
    const isTabDirty =
      (fileId === activeFileIdRef.current && isDirtyRef.current) ||
      localStorage.getItem(`aura_draft_dirty_${fileId}`) === 'true';

    if (isTabDirty) {
      const targetFile = filesRef.current.find((f) => f.id === fileId) || null;
      setConfirmCloseState({
        isOpen: true,
        target: { type: 'tab', fileId },
        file: targetFile,
      });
    } else {
      handleCloseTabDirect(fileId);
    }
  };

  // Floating Windows and Tab Drag Handlers
  const handleDetachTab = (fileId: string, position: { x: number; y: number }) => {
    if (floatingWindows.some((w) => w.fileId === fileId)) return;
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);

    const newWindow: FloatingWindow = {
      fileId,
      x: Math.max(10, Math.min(window.innerWidth - 420, position.x)),
      y: Math.max(10, Math.min(window.innerHeight - 320, position.y)),
      width: Math.min(600, Math.max(380, window.innerWidth - 80)),
      height: Math.min(460, Math.max(280, window.innerHeight - 100)),
      zIndex: newZ,
      isMinimized: false,
    };

    setFloatingWindows((prev) => [...prev, newWindow]);

    setOpenTabIds((prev) => {
      const next = prev.filter((id) => id !== fileId);
      localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
      return next;
    });

    if (activeFileId === fileId) {
      const remaining = openTabIds.filter((id) => id !== fileId);
      if (remaining.length > 0) {
        const next = files.find((f) => f.id === remaining[0]);
        if (next) handleSelectFile(next);
      }
    }

    showToast(`Detached "${targetFile.name}" as floating window`, 'info');
  };

  const handleRemergeWindow = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    setFloatingWindows((prev) => prev.filter((w) => w.fileId !== fileId));

    setOpenTabIds((prev) => {
      const next = prev.includes(fileId) ? prev : [...prev, fileId];
      localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
      return next;
    });

    if (targetFile) {
      handleSelectFile(targetFile);
      showToast(`Docked "${targetFile.name}" back into Tab Bar`, 'success');
    }
  };

  const handleCloseFloatingWindow = (fileId: string) => {
    setFloatingWindows((prev) => prev.filter((w) => w.fileId !== fileId));
  };

  const handleUpdateFloatingWindow = (fileId: string, updates: Partial<FloatingWindow>) => {
    setFloatingWindows((prev) =>
      prev.map((w) => (w.fileId === fileId ? { ...w, ...updates } : w))
    );
  };

  const handleBringToFront = (fileId: string) => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    setFloatingWindows((prev) =>
      prev.map((w) => (w.fileId === fileId ? { ...w, zIndex: newZ } : w))
    );
  };

  const handleFloatingContentChange = (fileId: string, newContent: string) => {
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === fileId ? { ...f, content: newContent, lastModified: Date.now(), isRecent: true } : f
      );
      fileSystem.saveAllFiles(updated);
      return updated;
    });

    localStorage.setItem(`aura_draft_content_${fileId}`, newContent);
    localStorage.setItem(`aura_draft_dirty_${fileId}`, 'true');

    if (activeFileId === fileId) {
      setContent(newContent);
      setIsDirty(true);
      setStats(calculateDocumentStats(newContent));
      setOutline(extractDocumentOutline(newContent));
    }
  };

  const handleReorderTabs = (fromIndex: number, toIndex: number) => {
    setOpenTabIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
      return next;
    });
  };

  // Encryption Operations
  const handleLockDocument = async (passphrase: string): Promise<boolean> => {
    if (!activeFile) return false;
    try {
      const payload = await CryptoService.encrypt(content, passphrase);
      const updated = files.map((f) =>
        f.id === activeFile.id
          ? { ...f, isEncrypted: true, encryptedData: payload, content: '' }
          : f
      );
      setFiles(updated);
      await fileSystem.saveAllFiles(updated);
      setUnlockedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(activeFile.id);
        return next;
      });
      setContent('');
      setIsDirty(false);
      showToast('Document encrypted with AES-256', 'success');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleUnlockDocument = async (passphrase: string): Promise<boolean> => {
    if (!activeFile?.encryptedData) return false;
    try {
      const decrypted = await CryptoService.decrypt(activeFile.encryptedData, passphrase);
      setContent(decrypted);
      editorRef.current?.setText(decrypted);
      setStats(calculateDocumentStats(decrypted));
      setOutline(extractDocumentOutline(decrypted));
      setUnlockedFileIds((prev) => new Set(prev).add(activeFile.id));
      showToast('Document unlocked', 'success');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleRemoveLock = async (): Promise<boolean> => {
    if (!activeFile) return false;
    const updated = files.map((f) =>
      f.id === activeFile.id
        ? { ...f, isEncrypted: false, encryptedData: undefined, content }
        : f
    );
    setFiles(updated);
    await fileSystem.saveAllFiles(updated);
    showToast('Encryption removed', 'info');
    return true;
  };

  const openFileItem = useCallback(
    (name: string, fileContent: string, filePath?: string, fileHandle?: any) => {
      const currentFiles = filesRef.current;
      const existing = filePath
        ? currentFiles.find((f) => f.path === filePath)
        : currentFiles.find((f) => f.name === name);

      if (existing) {
        // Save previous active file if dirty before switching
        const prevId = activeFileIdRef.current;
        if (prevId && isDirtyRef.current && prevId !== existing.id) {
          localStorage.setItem(`aura_draft_content_${prevId}`, contentRef.current);
          localStorage.setItem(`aura_draft_dirty_${prevId}`, 'true');
          const prevFile = currentFiles.find((f) => f.id === prevId);
          if (prevFile) {
            autosaveService.saveSnapshot(prevId, prevFile.name, contentRef.current);
          }
        }

        // Update existing file content and metadata
        const updated = currentFiles.map((f) =>
          f.id === existing.id
            ? {
                ...f,
                content: fileContent,
                name: name || f.name,
                path: filePath || f.path,
                fileHandle: fileHandle || f.fileHandle,
                lastModified: Date.now(),
                isRecent: true,
              }
            : f
        );
        filesRef.current = updated;
        setFiles(updated);
        fileSystem.saveAllFiles(updated);

        // Clear draft for this file as it was explicitly reloaded from disk
        localStorage.removeItem(`aura_draft_content_${existing.id}`);
        localStorage.removeItem(`aura_draft_dirty_${existing.id}`);

        activeFileIdRef.current = existing.id;
        contentRef.current = fileContent;
        isDirtyRef.current = false;

        setActiveFileId(existing.id);
        fileSystem.setActiveFileId(existing.id);
        setContent(fileContent);
        setIsDirty(false);
        setStats(calculateDocumentStats(fileContent));
        setOutline(extractDocumentOutline(fileContent));

        setOpenTabIds((prev) => {
          const next = prev.includes(existing.id) ? prev : [...prev, existing.id];
          localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
          return next;
        });

        editorRef.current?.setText(fileContent);
        editorRefLive.current?.setText(fileContent);
        editorRef.current?.focus();
        showToast(`Opened ${name || existing.name}`, 'success');
        return;
      }

      // Create new file item
      const newDoc: FileItem = {
        id: `doc-${Date.now()}`,
        name: name || 'Untitled.md',
        path: filePath,
        content: fileContent,
        lastModified: Date.now(),
        createdAt: Date.now(),
        isRecent: true,
        fileHandle,
      };

      const updated = [newDoc, ...currentFiles];
      filesRef.current = updated;
      setFiles(updated);
      fileSystem.saveAllFiles(updated);

      // Save previous active file if dirty before switching
      const prevId = activeFileIdRef.current;
      if (prevId && isDirtyRef.current) {
        localStorage.setItem(`aura_draft_content_${prevId}`, contentRef.current);
        localStorage.setItem(`aura_draft_dirty_${prevId}`, 'true');
        const prevFile = currentFiles.find((f) => f.id === prevId);
        if (prevFile) {
          autosaveService.saveSnapshot(prevId, prevFile.name, contentRef.current);
        }
      }

      activeFileIdRef.current = newDoc.id;
      contentRef.current = fileContent;
      isDirtyRef.current = false;

      setActiveFileId(newDoc.id);
      fileSystem.setActiveFileId(newDoc.id);
      setContent(fileContent);
      setIsDirty(false);
      setStats(calculateDocumentStats(fileContent));
      setOutline(extractDocumentOutline(fileContent));

      setOpenTabIds((prev) => {
        const next = prev.includes(newDoc.id) ? prev : [...prev, newDoc.id];
        localStorage.setItem('aura_open_tabs_v1', JSON.stringify(next));
        return next;
      });

      editorRef.current?.setText(fileContent);
      editorRefLive.current?.setText(fileContent);
      editorRef.current?.focus();
      showToast(`Opened ${newDoc.name}`, 'success');
    },
    [showToast]
  );

  openFileItemRef.current = openFileItem;

  const handleOpenFileFromDisk = async () => {
    if (isOpeningFileRef.current) return;
    isOpeningFileRef.current = true;
    try {
      const result = await fileSystem.openFileFromDisk();
      if (result) {
        openFileItem(result.name, result.content, result.path, result.handle);
      }
    } finally {
      isOpeningFileRef.current = false;
    }
  };

  const handleSaveSpecificFile = async (
    targetFile: FileItem,
    forceSaveAs: boolean = false
  ): Promise<boolean> => {
    const currentText =
      targetFile.id === activeFileIdRef.current
        ? editorRef.current
          ? editorRef.current.getText()
          : contentRef.current
        : localStorage.getItem(`aura_draft_content_${targetFile.id}`) ?? targetFile.content;

    const fileToSave: FileItem = {
      ...targetFile,
      content: currentText,
      lastModified: Date.now(),
    };

    const res = await fileSystem.saveFileToDisk(fileToSave, forceSaveAs);
    if (res.success) {
      const updatedDoc: FileItem = {
        ...fileToSave,
        name: res.name || fileToSave.name,
        path: res.path || fileToSave.path,
        fileHandle: res.handle || fileToSave.fileHandle,
      };

      setFiles((prev) => {
        const updatedList = prev.map((f) => (f.id === targetFile.id ? updatedDoc : f));
        fileSystem.saveAllFiles(updatedList);
        return updatedList;
      });

      if (targetFile.id === activeFileIdRef.current) {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
      localStorage.removeItem(`aura_draft_dirty_${targetFile.id}`);
      showToast(`Saved ${updatedDoc.name}`, 'success');
      return true;
    } else {
      showToast('Save canceled or failed', 'warning');
      return false;
    }
  };

  const handleSaveFile = async (forceSaveAs: boolean = false): Promise<boolean> => {
    if (!activeFile) return false;
    return handleSaveSpecificFile(activeFile, forceSaveAs);
  };

  const getDirtyFile = (): FileItem | null => {
    if (isDirtyRef.current && activeFileRef.current) {
      return activeFileRef.current;
    }
    const currentId = activeFileIdRef.current;
    if (currentId && localStorage.getItem(`aura_draft_dirty_${currentId}`) === 'true') {
      const f = filesRef.current.find((x) => x.id === currentId);
      if (f) return f;
    }
    for (const tabId of openTabIds) {
      if (localStorage.getItem(`aura_draft_dirty_${tabId}`) === 'true') {
        const f = filesRef.current.find((x) => x.id === tabId);
        if (f) return f;
      }
    }
    return null;
  };

  const handleRequestCloseApp = useCallback(() => {
    const dirtyFile = getDirtyFile();
    if (dirtyFile) {
      setConfirmCloseState({
        isOpen: true,
        target: 'app',
        file: dirtyFile,
      });
    } else {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.forceClose) {
        (window as any).electronAPI.forceClose();
      } else if (typeof window !== 'undefined' && (window as any).electronAPI?.closeWindow) {
        (window as any).electronAPI.closeWindow();
      }
    }
  }, [openTabIds]);

  const handleConfirmCloseSave = async () => {
    const { target, file } = confirmCloseState;
    if (file) {
      const saved = await handleSaveSpecificFile(file);
      if (!saved) {
        return;
      }
    }

    setConfirmCloseState({ isOpen: false, target: 'app', file: null });

    if (target === 'app') {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.forceClose) {
        (window as any).electronAPI.forceClose();
      }
    } else if (typeof target === 'object' && target.type === 'tab') {
      handleCloseTabDirect(target.fileId);
    }
  };

  const handleConfirmCloseDiscard = () => {
    const { target, file } = confirmCloseState;
    if (file) {
      localStorage.removeItem(`aura_draft_dirty_${file.id}`);
      if (file.id === activeFileIdRef.current) {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
    }

    setConfirmCloseState({ isOpen: false, target: 'app', file: null });

    if (target === 'app') {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.forceClose) {
        (window as any).electronAPI.forceClose();
      }
    } else if (typeof target === 'object' && target.type === 'tab') {
      handleCloseTabDirect(target.fileId);
    }
  };

  const handleConfirmCloseCancel = () => {
    setConfirmCloseState({ isOpen: false, target: 'app', file: null });
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    const targetFile = filesRef.current.find((f) => f.id === fileId);
    let newPath = targetFile?.path;

    if (targetFile?.path && typeof window !== 'undefined' && (window as any).electronAPI?.renameFile) {
      try {
        const res = await (window as any).electronAPI.renameFile(targetFile.path, newName);
        if (res?.success && res.newPath) {
          newPath = res.newPath;
        }
      } catch (err) {
        console.error('Failed to rename disk file:', err);
      }
    }

    const updated = filesRef.current.map((f) => (f.id === fileId ? { ...f, name: newName, path: newPath, lastModified: Date.now() } : f));
    filesRef.current = updated;
    setFiles(updated);
    await fileSystem.saveAllFiles(updated);
    showToast(`Renamed to ${newName}`, 'info');
  };

  const handleDeleteFile = (fileId: string) => {
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    fileSystem.saveAllFiles(remaining);
    autosaveService.clearSnapshotsForFile(fileId);
    localStorage.removeItem(`aura_draft_content_${fileId}`);
    localStorage.removeItem(`aura_draft_dirty_${fileId}`);

    if (activeFileId === fileId) {
      const next = remaining[0] || null;
      if (next) {
        handleSelectFile(next);
      } else {
        handleNewFile();
      }
    }
    showToast('Document deleted', 'info');
  };

  const handleBatchDeleteFiles = (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    const idsSet = new Set(fileIds);
    let remaining = files.filter((f) => !idsSet.has(f.id));
    if (remaining.length === 0) {
      const newDoc: FileItem = {
        id: `doc-${Date.now()}`,
        name: 'Untitled.md',
        content: '',
        lastModified: Date.now(),
        createdAt: Date.now(),
      };
      remaining = [newDoc];
    }
    setFiles(remaining);
    fileSystem.saveAllFiles(remaining);
    fileIds.forEach((id) => {
      autosaveService.clearSnapshotsForFile(id);
      localStorage.removeItem(`aura_draft_content_${id}`);
      localStorage.removeItem(`aura_draft_dirty_${id}`);
    });

    if (activeFileId && idsSet.has(activeFileId)) {
      handleSelectFile(remaining[0]);
    }
    showToast(`Deleted ${fileIds.length} document${fileIds.length > 1 ? 's' : ''}`, 'info');
  };

  const handleBatchToggleFavorite = (fileIds: string[], favorite: boolean) => {
    const idsSet = new Set(fileIds);
    const updated = files.map((f) => (idsSet.has(f.id) ? { ...f, isFavorite: favorite } : f));
    setFiles(updated);
    fileSystem.saveAllFiles(updated);
    showToast(
      `${favorite ? 'Favorited' : 'Unfavorited'} ${fileIds.length} document${fileIds.length > 1 ? 's' : ''}`,
      'info'
    );
  };

  const handleBatchExportFiles = (fileIds: string[]) => {
    const idsSet = new Set(fileIds);
    const targetFiles = files.filter((f) => idsSet.has(f.id));
    if (targetFiles.length === 0) return;
    if (targetFiles.length === 1) {
      ImportExportService.exportMarkdown(targetFiles[0].name.replace(/\.md$/i, ''), targetFiles[0].content);
      showToast(`Exported ${targetFiles[0].name}`, 'success');
    } else {
      ImportExportService.exportWorkspaceZip(targetFiles);
      showToast(`Exported ${targetFiles.length} documents as ZIP`, 'success');
    }
  };

  const handleDuplicateFile = (file: FileItem) => {
    const baseName = file.name.replace(/\.md$/i, '');
    const copyDoc: FileItem = {
      id: `doc-${Date.now()}`,
      name: `${baseName} (Copy).md`,
      content: file.content,
      lastModified: Date.now(),
      createdAt: Date.now(),
      isRecent: true,
    };
    const updated = [copyDoc, ...files];
    setFiles(updated);
    fileSystem.saveAllFiles(updated);
    showToast(`Created duplicate: ${copyDoc.name}`, 'success');
  };

  const handleToggleFavorite = (fileId: string) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f
    );
    setFiles(updated);
    fileSystem.saveAllFiles(updated);
  };

  const handleImportFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);
      for (let i = 0; i < filesArray.length; i++) {
        const f = filesArray[i];
        try {
          const parsed = await ImportExportService.parseImportedFile(f);
          const filePath = (f as any).path || undefined;
          openFileItem(parsed.name, parsed.content, filePath);
        } catch (err) {
          console.error('Failed to parse dropped file:', f.name, err);
        }
      }
    },
    [openFileItem]
  );

  // Global Drag & Drop Window Listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDragOverWindow(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragOverWindow(false);
        }
      }
    };

    const handleDrop = async (e: DragEvent) => {
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragOverWindow(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await handleImportFiles(e.dataTransfer.files);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleImportFiles]);

  const handleRestoreSnapshot = (snapshot: RevisionSnapshot) => {
    setContent(snapshot.content);
    editorRef.current?.setText(snapshot.content);
    setIsDirty(true);
    showToast('Revision restored', 'success');
  };

  // Toggle unified sidebar drawer
  const handleToggleSidebar = useCallback((tab?: 'files' | 'vault' | 'outline') => {
    setIsSidebarOpen((prev) => {
      if (!prev && tab) {
        setSidebarTab(tab);
        return true;
      }
      if (prev && tab && tab !== sidebarTab) {
        setSidebarTab(tab);
        return true;
      }
      if (tab) {
        setSidebarTab(tab);
      }
      return !prev;
    });
  }, [sidebarTab]);

  // Jump to character position in editor
  const handleJumpToPos = (pos: number) => {
    editorRef.current?.jumpToPos(pos);
    if (settings.editorMode === 'split') {
      editorRefLive.current?.jumpToPos(pos);
    }
  };

  // Listen for Electron window close requests
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onRequestClose) {
      const unsubscribe = (window as any).electronAPI.onRequestClose(() => {
        handleRequestCloseApp();
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [handleRequestCloseApp]);

  // Standard web browser beforeunload alert when dirty
  useEffect(() => {
    const handleBeforeUnloadPrompt = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnloadPrompt);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnloadPrompt);
    };
  }, []);

  // Global Keyboard Shortcuts (Overrides native browser shortcuts in web & app)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isStandardInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // If user is inside an input/textarea, allow normal typing, text editing, and clipboard keys
      if (isStandardInput) {
        if (!mod && e.key !== 'Escape' && e.key !== 'F10' && e.key !== 'F11') {
          return;
        }
        // Allow standard text editing shortcuts inside input fields
        if (mod && !e.shiftKey && (key === 'a' || key === 'c' || key === 'v' || key === 'x' || key === 'z' || key === 'y')) {
          return;
        }
      }

      let handled = false;

      // 1. Command Palette: Ctrl + K
      if (mod && key === 'k') {
        handled = true;
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // 2. Save File: Ctrl + S
      else if (mod && key === 's' && !e.shiftKey) {
        handled = true;
        handleSaveFile(false);
      }
      // 3. Save File As: Ctrl + Shift + S
      else if (mod && key === 's' && e.shiftKey) {
        handled = true;
        handleSaveFile(true);
      }
      // 4. New Document: Ctrl + N
      else if (mod && key === 'n') {
        handled = true;
        handleNewFile();
      }
      // 5. Open Document from Disk: Ctrl + O
      else if (mod && key === 'o' && !e.shiftKey) {
        handled = true;
        handleOpenFileFromDisk();
      }
      // 6. Structure Outline: Ctrl + Shift + O
      else if (mod && e.shiftKey && key === 'o') {
        handled = true;
        handleToggleSidebar('outline');
      }
      // 7. Documents Drawer: Ctrl + Shift + E
      else if (mod && e.shiftKey && key === 'e') {
        handled = true;
        handleToggleSidebar('files');
      }
      // Open Workspace Vault Folder: Ctrl + Shift + O
      else if (mod && e.shiftKey && key === 'o') {
        handled = true;
        handleOpenWorkspace();
      }
      // 8. Import / Export Hub: Ctrl + Shift + I
      else if (mod && e.shiftKey && key === 'i') {
        handled = true;
        setIsImportExportOpen((prev) => !prev);
      }
      // 9. Find in Document: Ctrl + F
      else if (mod && key === 'f' && !e.shiftKey) {
        handled = true;
        setIsFindOpen(true);
        setIsReplaceMode(false);
      }
      // 10. Find & Replace: Ctrl + H
      else if (mod && key === 'h') {
        handled = true;
        setIsFindOpen(true);
        setIsReplaceMode(true);
      }
      // 11. Quick Print / Export: Ctrl + P
      else if (mod && key === 'p') {
        handled = true;
        setIsImportExportOpen(true);
      }
      // 12. True Fullscreen: F11
      else if (e.key === 'F11') {
        handled = true;
        toggleTrueFullscreen();
      }
      // 13. Minimal Zen Mode: Alt + Z or Ctrl + Shift + M
      else if ((mod && e.shiftKey && key === 'm') || (e.altKey && key === 'z')) {
        handled = true;
        handleToggleMinimalMode();
      }
      // 14. Title Bar Toggle: Ctrl + Alt + T
      else if (mod && e.altKey && key === 't') {
        handled = true;
        handleToggleTitleBar();
      }
      // 15. Table Insertion Modal: Ctrl + Shift + T
      else if (mod && e.shiftKey && key === 't') {
        handled = true;
        setIsTableModalOpen((prev) => !prev);
      }
      // 16. Split Pane Toggle: Ctrl + \ or Ctrl + |
      else if (mod && (e.key === '\\' || e.key === '|')) {
        handled = true;
        handleToggleSplit();
      }
      // 17. Close Active Tab: Ctrl + W
      else if (mod && key === 'w') {
        handled = true;
        if (activeFileId) handleRequestCloseTab(activeFileId);
      }
      // 18. Encrypt & Lock Document: Ctrl + L
      else if (mod && key === 'l') {
        handled = true;
        setIsLockModalOpen(true);
      }
      // 19. Focus Mode: Ctrl + Shift + F or F10
      else if ((mod && e.shiftKey && key === 'f') || e.key === 'F10') {
        handled = true;
        setSettings((s) => ({ ...s, focusMode: !s.focusMode }));
      }
      // 20. Cycle Editor Modes: Ctrl + Shift + U
      else if (mod && e.shiftKey && key === 'u') {
        handled = true;
        handleCycleEditorMode();
      }
      // 21. Preferences: Ctrl + ,
      else if (mod && e.key === ',') {
        handled = true;
        setIsSettingsOpen((prev) => !prev);
      }
      // 22. Shortcuts Cheat Sheet: Ctrl + /
      else if (mod && e.key === '/') {
        handled = true;
        setIsShortcutsOpen((prev) => !prev);
      }
      // 23. Zoom In: Ctrl + / Ctrl =
      else if (mod && (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        handled = true;
        handleZoomIn();
      }
      // 24. Zoom Out: Ctrl -
      else if (mod && (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        handled = true;
        handleZoomOut();
      }
      // 25. Zoom Reset: Ctrl 0
      else if (mod && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        handled = true;
        handleZoomReset();
      }
      // 26. Escape
      else if (e.key === 'Escape') {
        const m = openModalsRef.current;
        if (m.isCommandPaletteOpen) {
          handled = true;
          setIsCommandPaletteOpen(false);
        } else if (m.isFindOpen) {
          handled = true;
          setIsFindOpen(false);
        } else if (m.isSettingsOpen) {
          handled = true;
          setIsSettingsOpen(false);
        } else if (m.isStatsOpen) {
          handled = true;
          setIsStatsOpen(false);
        } else if (m.isShortcutsOpen) {
          handled = true;
          setIsShortcutsOpen(false);
        } else if (m.isImportExportOpen) {
          handled = true;
          setIsImportExportOpen(false);
        } else if (m.isAudioOpen) {
          handled = true;
          setIsAudioOpen(false);
        } else if (m.isLockModalOpen) {
          handled = true;
          setIsLockModalOpen(false);
        } else if (m.isTableModalOpen) {
          handled = true;
          setIsTableModalOpen(false);
        } else if (m.minimalMode && !m.isSidebarOpen) {
          handled = true;
          setSettings((prev) => ({ ...prev, minimalMode: false }));
        }
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [
    files,
    activeFileId,
    content,
    isDirty,
    settings.minimalMode,
    isSidebarOpen,
    toggleTrueFullscreen,
    handleToggleMinimalMode,
    handleToggleTitleBar,
    handleToggleSidebar,
    handleCycleEditorMode,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  ]);

  // Listen to Electron external file opening (e.g. double click .md in Windows Explorer)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onFileOpened) {
      const unsub = (window as any).electronAPI.onFileOpened((data: { fileName: string; filePath: string; content: string }) => {
        if (!data || !data.fileName) return;
        openFileItem(data.fileName, data.content, data.filePath);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [openFileItem]);

  // Formatting helper
  const getActiveEditorView = () => {
    const viewB = editorRefB.current?.getEditorView();
    if (viewB && (viewB.dom.contains(document.activeElement) || viewB.hasFocus)) {
      return viewB;
    }
    return editorRef.current?.getEditorView() || null;
  };

  const executeEditorAction = (action: (view: any) => void) => {
    const view = getActiveEditorView();
    if (view) {
      action(view);
      view.focus();
    }
  };

  // Split pane target file
  const splitFile = files.find((f) => f.id === settings.split?.splitFileId) || null;

  const handleToggleSplit = () => {
    setSettings((s) => ({
      ...s,
      split: {
        ...s.split,
        mode: s.split?.mode === 'none' ? 'vertical' : 'none',
      },
    }));
  };

  const handleContentChangeB = (newContent: string) => {
    if (splitFile) {
      const updated = files.map((f) =>
        f.id === splitFile.id ? { ...f, content: newContent, lastModified: Date.now() } : f
      );
      setFiles(updated);
      fileSystem.saveAllFiles(updated);
    } else {
      handleContentChange(newContent);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-150 relative">
      {/* Minimal Mode Floating Exit Button - Theme-morphic & Ultra Subtle */}
      {settings.minimalMode && (
        <div className="fixed top-3 right-4 z-40 flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setSettings((s) => ({ ...s, minimalMode: false }))}
            title="Exit Minimal Writing Mode (Esc or Alt+Z)"
            className="px-3.5 py-1.5 rounded-full bg-[var(--surface-color)]/80 text-[var(--muted-color)] hover:text-[var(--text-color)] backdrop-blur-md text-[11px] font-medium flex items-center gap-1.5 shadow-sm border border-[var(--border-color)] hover:border-[var(--text-color)]/30 hover:scale-105 transition-all"
          >
            <EyeOff className="w-3 h-3 text-[var(--text-color)]" />
            <span>Exit Minimal Mode</span>
          </button>
        </div>
      )}

      {/* Subtle Top Reveal Strip when TitleBar is Hidden */}
      {!settings.minimalMode && !settings.showTitleBar && (
        <div
          onClick={() => setSettings((s) => ({ ...s, showTitleBar: true }))}
          title="Click to show Title Bar (Ctrl+Alt+T)"
          className="h-1.5 w-full bg-transparent hover:bg-[var(--hover-bg)] group relative flex justify-center z-30 transition-all cursor-pointer"
        >
          <div className="opacity-0 group-hover:opacity-100 absolute top-1.5 px-3 py-0.5 rounded-full bg-[var(--surface-color)]/95 text-[var(--text-color)] text-[10px] font-medium shadow-md border border-[var(--border-color)] transition-opacity flex items-center gap-1 pointer-events-none backdrop-blur-md">
            <span>Show Title Bar (Ctrl+Alt+T)</span>
          </div>
        </div>
      )}

      {/* Unified Top Navigation Bar (with Centered Filename & Burger Menu) */}
      {!settings.minimalMode && settings.showTitleBar && (
        <TitleBar
          currentFile={activeFile}
          isDirty={dirtyFileIds.has(activeFileId || '')}
          settings={settings}
          wordCount={stats.words}
          onToggleSidebar={() => handleToggleSidebar()}
          onRenameFile={(fileId, newName) => handleRenameFile(fileId, newName)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAudio={() => setIsAudioOpen(true)}
          onOpenLockModal={() => setIsLockModalOpen(true)}
          onToggleSplit={handleToggleSplit}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleTrueFullscreen}
          onToggleMinimalMode={handleToggleMinimalMode}
          onRequestClose={handleRequestCloseApp}
        />
      )}

      {/* Floating Detached Document Windows */}
      {floatingWindows.map((win) => {
        const file = files.find((f) => f.id === win.fileId);
        if (!file) return null;
        return (
          <FloatingEditorWindow
            key={win.fileId}
            windowState={win}
            file={file}
            settings={settings}
            files={files}
            tabBarBounds={tabBarBounds}
            onUpdateWindow={handleUpdateFloatingWindow}
            onCloseWindow={handleCloseFloatingWindow}
            onRemergeWindow={handleRemergeWindow}
            onContentChange={handleFloatingContentChange}
            onBringToFront={handleBringToFront}
          />
        );
      })}

      {/* Main Writing Container */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-row items-stretch">
        {/* Inline Responsive Companion Sidebar (Documents, Vault & Structure Outline) */}
        <SidebarDrawer
          isOpen={isSidebarOpen}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          files={files}
          activeFileId={activeFileId}
          activeFilePath={activeFile?.path}
          outline={outline}
          currentOffset={cursorPos.offset}
          workspacePath={workspaceState.folderPath}
          workspaceName={workspaceState.folderName}
          workspaceTree={workspaceState.tree}
          onOpenWorkspaceDialog={handleOpenWorkspace}
          onRefreshWorkspace={() => workspaceService.refreshTree()}
          onCloseWorkspace={() => workspaceService.clearWorkspace()}
          onOpenFileByPath={handleOpenFileByPath}
          onSelectFile={handleSelectFile}
          onNewFile={handleNewFile}
          onOpenFileFromDisk={handleOpenFileFromDisk}
          onDeleteFile={handleDeleteFile}
          onDuplicateFile={handleDuplicateFile}
          onToggleFavorite={handleToggleFavorite}
          onRenameFile={handleRenameFile}
          onBatchDeleteFiles={handleBatchDeleteFiles}
          onBatchToggleFavorite={handleBatchToggleFavorite}
          onBatchExportFiles={handleBatchExportFiles}
          onImportFiles={handleImportFiles}
          onJumpToPos={handleJumpToPos}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 h-full relative overflow-hidden flex flex-col items-stretch min-w-0">
          {/* External File Conflict Banner */}
          {externalConflict && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 border border-amber-400/40 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
                <span>
                  <strong>{externalConflict.fileName}</strong> was modified externally on disk.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReloadFromDisk}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                >
                  Reload from Disk
                </button>
                <button
                  type="button"
                  onClick={() => setExternalConflict(null)}
                  className="px-2 py-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors text-[11px] cursor-pointer"
                >
                  Keep Mine
                </button>
              </div>
            </div>
          )}

          {isDocumentLocked ? (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 select-none text-center">
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 animate-bounce">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
                This document is encrypted
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-5">
                Protected with zero-knowledge AES-GCM-256 encryption. Enter your secret passphrase to unlock and edit.
              </p>
              <button
                onClick={() => setIsLockModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Unlock Document</span>
              </button>
            </div>
          ) : settings.split?.mode !== 'none' ? (
            <SplitPane
              files={files}
              activeFile={activeFile}
              splitFile={splitFile}
              settings={settings}
              splitSettings={settings.split}
              editorRefA={editorRef}
              editorRefB={editorRefB}
              onContentChangeA={handleContentChange}
              onContentChangeB={handleContentChangeB}
              onCursorChangeA={handleCursorChange}
              onCursorChangeB={() => {}}
              onSelectSplitFile={(fileId) =>
                setSettings((s) => ({ ...s, split: { ...s.split, splitFileId: fileId } }))
              }
              onUpdateSplit={(newSplit) =>
                setSettings((s) => ({ ...s, split: { ...s.split, ...newSplit } }))
              }
              onCloseSplit={handleToggleSplit}
              onSave={() => handleSaveFile(false)}
              onOpen={handleOpenFileFromDisk}
              onNew={handleNewFile}
              onFind={() => {
                setIsFindOpen(true);
                setIsReplaceMode(false);
              }}
              onReplace={() => {
                setIsFindOpen(true);
                setIsReplaceMode(true);
              }}
              onCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleOutline={() => handleToggleSidebar('outline')}
              onToggleFocus={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
              onDropImage={(name) => showToast(`Image inserted: ${name}`, 'info')}
              onDropFiles={handleImportFiles}
            />
          ) : settings.editorMode === 'split' ? (
            <SourceLiveSplitPane
              activeFile={activeFile}
              settings={settings}
              files={files}
              editorRefSource={editorRef}
              editorRefLive={editorRefLive}
              onContentChange={handleContentChange}
              onCursorChange={handleCursorChange}
              onCloseSplit={handleCycleEditorMode}
              onSave={() => handleSaveFile(false)}
              onOpen={handleOpenFileFromDisk}
              onNew={handleNewFile}
              onFind={() => {
                setIsFindOpen(true);
                setIsReplaceMode(false);
              }}
              onReplace={() => {
                setIsFindOpen(true);
                setIsReplaceMode(true);
              }}
              onCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleOutline={() => handleToggleSidebar('outline')}
              onToggleFocus={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
              onDropImage={(name) => showToast(`Image inserted: ${name}`, 'info')}
              onDropFiles={handleImportFiles}
            />
          ) : (
            <Editor
              ref={editorRef}
              initialContent={content}
              fileId={activeFile?.id}
              settings={settings}
              files={files}
              onChange={handleContentChange}
              onCursorChange={handleCursorChange}
              onSave={() => handleSaveFile(false)}
              onOpen={handleOpenFileFromDisk}
              onNew={handleNewFile}
              onFind={() => {
                setIsFindOpen(true);
                setIsReplaceMode(false);
              }}
              onReplace={() => {
                setIsFindOpen(true);
                setIsReplaceMode(true);
              }}
              onCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleOutline={() => handleToggleSidebar('outline')}
              onToggleFocus={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
              onDropImage={(name) => showToast(`Image inserted: ${name}`, 'info')}
              onDropFiles={handleImportFiles}
            />
          )}

          {/* Floating Bubble Toolbar on Selection */}
          <FloatingToolbar view={editorRef.current?.getEditorView() || null} />
          {settings.split?.mode !== 'none' && (
            <FloatingToolbar view={editorRefB.current?.getEditorView() || null} />
          )}

          {/* Custom Context Menu on Right Click */}
          <ContextMenu
            view={editorRef.current?.getEditorView() || null}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenFindReplace={() => {
              setIsFindOpen(true);
              setIsReplaceMode(false);
            }}
            onOpenTableModal={() => setIsTableModalOpen(true)}
          />
          {settings.split?.mode !== 'none' && (
            <ContextMenu
              view={editorRefB.current?.getEditorView() || null}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenFindReplace={() => {
                setIsFindOpen(true);
                setIsReplaceMode(false);
              }}
              onOpenTableModal={() => setIsTableModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar
        stats={stats}
        cursorPos={cursorPos}
        isDirty={isDirty}
        isVisible={!settings.minimalMode && settings.showStatusBar}
        liveMarkdown={settings.liveMarkdown}
        editorMode={settings.editorMode}
        focusMode={settings.focusMode}
        bionicReading={settings.bionicReading}
        hemingwayMode={settings.hemingwayMode}
        onOpenStats={() => setIsStatsOpen(true)}
        onToggleLiveMarkdown={handleCycleEditorMode}
        onToggleFocusMode={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
        onToggleBionicReading={() => setSettings((s) => ({ ...s, bionicReading: !s.bionicReading }))}
        onToggleHemingwayMode={() => setSettings((s) => ({ ...s, hemingwayMode: !s.hemingwayMode }))}
      />

      {/* Floating Find & Replace */}
      <FindReplace
        isOpen={isFindOpen}
        isReplaceMode={isReplaceMode}
        editorView={editorRef.current?.getEditorView() || null}
        onClose={() => setIsFindOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFileFromDisk}
        onOpenWorkspace={handleOpenWorkspace}
        onSaveFile={() => handleSaveFile(false)}
        onSaveFileAs={() => handleSaveFile(true)}
        onLoadShowcase={handleLoadShowcase}
        onToggleFocusMode={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
        onToggleBionicReading={() => setSettings((s) => ({ ...s, bionicReading: !s.bionicReading }))}
        onToggleHemingwayMode={() => setSettings((s) => ({ ...s, hemingwayMode: !s.hemingwayMode }))}
        onToggleMinimalMode={handleToggleMinimalMode}
        onToggleTitleBar={handleToggleTitleBar}
        onToggleTrueFullscreen={toggleTrueFullscreen}
        onDetachActiveTab={() => {
          if (activeFileId) {
            handleDetachTab(activeFileId, {
              x: Math.max(50, window.innerWidth / 2 - 270),
              y: Math.max(60, window.innerHeight / 2 - 200),
            });
          }
        }}
        onRemergeAllFloating={() => {
          floatingWindows.forEach((w) => handleRemergeWindow(w.fileId));
        }}
        onToggleOutline={() => handleToggleSidebar('outline')}
        onToggleTypewriter={() => setSettings((s) => ({ ...s, typewriterMode: !s.typewriterMode }))}
        onToggleStatusBar={() => setSettings((s) => ({ ...s, showStatusBar: !s.showStatusBar }))}
        onToggleLineNumbers={() => setSettings((s) => ({ ...s, showLineNumbers: !s.showLineNumbers }))}
        onToggleLiveMarkdown={handleCycleEditorMode}
        editorMode={settings.editorMode}
        onSetEditorMode={(mode) =>
          setSettings((s) => ({ ...s, editorMode: mode, liveMarkdown: mode !== 'source' }))
        }
        onCheckForUpdates={handleCheckForUpdates}
        appVersion={appVersion}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAudio={() => setIsAudioOpen(true)}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        onToggleSplit={handleToggleSplit}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onChangeTheme={(theme) => setSettings((s) => ({ ...s, theme }))}
        onChangeFont={(font) => setSettings((s) => ({ ...s, font }))}
        onFormatBold={() => executeEditorAction((v) => toggleWrap(v, '**'))}
        onFormatItalic={() => executeEditorAction((v) => toggleWrap(v, '*'))}
        onFormatCode={() => executeEditorAction((v) => toggleWrap(v, '`'))}
        onFormatQuote={() => executeEditorAction((v) => toggleLinePrefix(v, '> '))}
        onFormatTask={() => executeEditorAction((v) => toggleLinePrefix(v, '- [ ] '))}
        onFormatHighlight={() => executeEditorAction((v) => toggleWrap(v, '=='))}
        onInsertCallout={(type) => {
          const sample = `\n> [!${type}]\n> Enter ${type.toLowerCase()} content here...\n\n`;
          editorRef.current?.insertText(sample);
        }}
        onInsertCodeBlock={(lang) => {
          const sample = `\n\`\`\`${lang}\n// ${lang} code here\n\`\`\`\n`;
          editorRef.current?.insertText(sample);
        }}
        onInsertMath={() => executeEditorAction((v) => toggleWrap(v, '$$'))}
        onInsertTable={() => setIsTableModalOpen(true)}
        onExportMarkdown={() => {
          if (activeFile) ImportExportService.exportMarkdown(activeFile.name, content);
        }}
        onExportPlainText={() => {
          if (activeFile) ImportExportService.exportPlainText(activeFile.name, content);
        }}
        onExportHTML={async () => {
          if (activeFile) await ImportExportService.exportHTML(activeFile.name, content, settings.theme);
        }}
        onExportPDF={async () => {
          if (activeFile) {
            try {
              await ImportExportService.exportPDF(activeFile.name, content, settings);
              showToast('Exported PDF document', 'success');
            } catch (e) {
              console.error(e);
              showToast('Failed to export PDF', 'error');
            }
          }
        }}
        onCopyRichText={async () => {
          const success = await ImportExportService.copyRichText(content);
          if (success) showToast('Rich text copied to clipboard', 'success');
        }}
        onPrint={() => window.print()}
      />

      {/* Custom Table Generator Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={(tableMarkdown) => {
          executeEditorAction((v) => {
            const selection = v.state.selection.main;
            v.dispatch({
              changes: { from: selection.from, to: selection.to, insert: tableMarkdown },
              selection: { anchor: selection.from + tableMarkdown.length },
            });
          });
          showToast('Inserted custom table', 'success');
        }}
      />

      {/* Import & Export Hub Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        activeFile={activeFile}
        files={files}
        theme={settings.theme}
        settings={settings}
        onImportFiles={handleImportFiles}
        onShowToast={showToast}
        onClose={() => setIsImportExportOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        activeFile={activeFile}
        appVersion={appVersion}
        onCheckForUpdates={handleCheckForUpdates}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        onRestoreSnapshot={handleRestoreSnapshot}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Statistics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        stats={stats}
        fileName={activeFile ? activeFile.name : 'Untitled'}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Audio & Soundscapes Modal */}
      <AudioModal
        isOpen={isAudioOpen}
        audio={settings.audio}
        onUpdateAudio={(newAudio) =>
          setSettings((s) => ({ ...s, audio: { ...s.audio, ...newAudio } }))
        }
        onClose={() => setIsAudioOpen(false)}
      />

      {/* Zero-Knowledge Encryption Lock Modal */}
      <LockModal
        isOpen={isLockModalOpen}
        isCurrentlyEncrypted={!!activeFile?.isEncrypted}
        fileName={activeFile?.name || 'Untitled.md'}
        onLock={handleLockDocument}
        onUnlock={handleUnlockDocument}
        onRemoveLock={handleRemoveLock}
        onClose={() => setIsLockModalOpen(false)}
      />

      {/* Unsaved Changes Confirmation Modal on Close */}
      <ConfirmCloseModal
        isOpen={confirmCloseState.isOpen}
        fileName={confirmCloseState.file?.name || 'Untitled.md'}
        onSave={handleConfirmCloseSave}
        onDiscard={handleConfirmCloseDiscard}
        onCancel={handleConfirmCloseCancel}
      />

      {/* Global Drag & Drop New Files Visual Overlay */}
      {isDragOverWindow && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--surface-color)]/95 backdrop-blur-md border-2 border-dashed border-[var(--border-color)] m-3 rounded-3xl animate-fadeIn pointer-events-none select-none shadow-2xl">
          <div className="p-5 rounded-2xl bg-[var(--hover-bg)] text-[var(--text-color)] border border-[var(--border-color)] mb-4 animate-bounce">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">
            Drop files here to open
          </h2>
          <p className="text-xs text-[var(--muted-color)] max-w-sm text-center">
            Supports Markdown (.md), Plain Text (.txt), HTML, JSON, and source code files.
          </p>
        </div>
      )}

      {/* App Initialization Loading Screen with Logo Animation */}
      <LoadingScreen isReady={isAppReady} />
    </div>
  );
};
