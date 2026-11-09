import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Lock,
  Unlock,
  Search,
  Settings,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  Minus,
  Square,
  X,
  Columns,
  Keyboard,
  FileText,
  Edit2,
  Check,
} from 'lucide-react';
import { FileItem, EditorSettings } from '../types';

interface TitleBarProps {
  currentFile: FileItem | null;
  isDirty?: boolean;
  settings: EditorSettings;
  wordCount?: number;
  onToggleSidebar: () => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onOpenCommandPalette: () => void;
  onOpenImportExport: () => void;
  onOpenSettings: () => void;
  onOpenAudio: () => void;
  onOpenLockModal: () => void;
  onToggleSplit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleMinimalMode: () => void;
  onRequestClose?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentFile,
  isDirty = false,
  settings,
  onToggleSidebar,
  onRenameFile,
  onOpenCommandPalette,
  onOpenImportExport,
  onOpenSettings,
  onOpenAudio,
  onOpenLockModal,
  onToggleSplit,
  isFullscreen,
  onToggleFullscreen,
  onToggleMinimalMode,
  onRequestClose,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  useEffect(() => {
    if (isRenaming) {
      isSubmittingRef.current = false;
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }
  }, [isRenaming]);

  // Cancel rename when active file changes
  useEffect(() => {
    setIsRenaming(false);
    isSubmittingRef.current = false;
  }, [currentFile?.id]);

  const handleStartRename = (file: FileItem, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    isSubmittingRef.current = false;
    setRenameInput(file.name.replace(/\.md$/i, ''));
    setIsRenaming(true);
  };

  const handleFinishRename = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsRenaming(false);
    if (!currentFile) return;
    const trimmed = renameInput.trim();
    if (trimmed) {
      const finalName = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
      if (finalName !== currentFile.name) {
        onRenameFile(currentFile.id, finalName);
      }
    }
  };

  const handleCancelRename = () => {
    isSubmittingRef.current = true;
    setIsRenaming(false);
  };

  return (
    <header className="h-10 border-b border-[var(--border-color)] bg-[var(--surface-color)] select-none flex items-center justify-between px-3 text-xs relative transition-colors duration-150 z-30">
      {/* Draggable background surface for moving the window in Electron */}
      <div
        className="absolute inset-0 z-0 pointer-events-auto"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* LEFT: Burger Menu Button */}
      <div
        className="relative z-10 flex items-center gap-2 flex-shrink-0 no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Menu & Documents (Ctrl+Shift+E)"
          className="no-drag p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-all cursor-pointer flex items-center justify-center active:scale-95"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* CENTER: Document Title & Aesthetic Inline Rename (Strictly Centered in Viewport) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center max-w-[46%] z-20 no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div
          className="no-drag"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {isRenaming ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="no-drag flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface-color)] border border-[var(--text-color)]/30 shadow-xs animate-scaleUp"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <input
                ref={renameInputRef}
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onBlur={handleFinishRename}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFinishRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelRename();
                  }
                }}
                placeholder="Document name"
                className="no-drag bg-transparent text-xs font-medium text-[var(--text-color)] outline-none text-center min-w-[130px] max-w-[240px] tracking-tight select-text"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              />
              <span className="text-[11px] text-[var(--muted-color)] font-mono select-none">.md</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFinishRename();
                }}
                className="no-drag ml-1 p-0.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-color)] cursor-pointer transition-colors"
                title="Save Name (Enter)"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={(e) => currentFile && handleStartRename(currentFile, e)}
              onDoubleClick={(e) => currentFile && handleStartRename(currentFile, e)}
              onMouseDown={(e) => e.stopPropagation()}
              title={currentFile ? `${currentFile.name} • Click to rename` : 'Untitled.md'}
              className="no-drag flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--hover-bg)]/50 hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-[var(--text-color)]/30 text-xs font-medium text-[var(--text-color)] transition-all duration-150 shadow-xs group select-none cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              {currentFile?.isEncrypted ? (
                <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[var(--muted-color)] group-hover:text-[var(--text-color)] transition-colors flex-shrink-0" />
              )}
              <span className="truncate tracking-tight max-w-[200px] sm:max-w-[280px]">
                {currentFile ? currentFile.name : 'Untitled.md'}
              </span>
              {isDirty && (
                <span
                  title="Unsaved changes"
                  className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0"
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentFile) handleStartRename(currentFile, e);
                }}
                className="p-0.5 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                title="Rename document"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Action Controls & Window Buttons */}
      <div
        className="flex items-center gap-0.5 px-1 z-10 relative flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl+K)"
          className="px-1.5 py-1 rounded hover:bg-[var(--hover-bg)] active:scale-95 transition-all text-[10.5px] font-mono text-[var(--muted-color)] hover:text-[var(--text-color)] flex items-center gap-1 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Ctrl+K</span>
        </button>

        <button
          type="button"
          onClick={onOpenLockModal}
          title={currentFile?.isEncrypted ? 'Document Encrypted & Locked' : 'Encrypt Document (AES-256)'}
          className={`p-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${
            currentFile?.isEncrypted
              ? 'text-[var(--text-color)] bg-[var(--hover-bg)] ring-1 ring-[var(--border-color)]'
              : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          {currentFile?.isEncrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 opacity-60" />}
        </button>

        <button
          type="button"
          onClick={onToggleSplit}
          title={settings.split?.mode !== 'none' ? 'Close Split Editor (Ctrl+\\)' : 'Split Editor Side-by-Side (Ctrl+\\)'}
          className={`p-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${
            settings.split?.mode !== 'none'
              ? 'text-[var(--text-color)] bg-[var(--hover-bg)] ring-1 ring-[var(--border-color)]'
              : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenAudio}
          title="Keyboard Typing Acoustics"
          className={`p-1.5 rounded-md transition-all active:scale-95 relative flex items-center justify-center cursor-pointer ${
            settings.audio?.keystrokeEnabled && settings.audio?.keystrokeSound !== 'none'
              ? 'text-[var(--text-color)] bg-[var(--hover-bg)] ring-1 ring-[var(--border-color)]'
              : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          {settings.audio?.keystrokeEnabled && settings.audio?.keystrokeSound !== 'none' && (
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5 rounded-full bg-[var(--text-color)]"></span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleMinimalMode}
          title={settings.minimalMode ? 'Exit Minimal Mode (Alt+Z)' : 'Minimal Writing Mode (Alt+Z)'}
          className={`p-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${
            settings.minimalMode
              ? 'text-[var(--text-color)] bg-[var(--hover-bg)] ring-1 ring-[var(--border-color)]'
              : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter True Fullscreen (F11)'}
          className={`p-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${
            isFullscreen
              ? 'text-[var(--text-color)] bg-[var(--hover-bg)] ring-1 ring-[var(--border-color)]'
              : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onOpenImportExport}
          title="Import & Export Hub (Ctrl+Shift+I)"
          className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] active:scale-95 transition-all text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Preferences (Ctrl+,)"
          className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] active:scale-95 transition-all text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Native Electron Window Controls */}
        {isElectron && (
          <div className="flex items-center ml-1 border-l border-[var(--border-color)] pl-1">
            <button
              type="button"
              onClick={() => (window as any).electronAPI?.minimizeWindow()}
              className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded cursor-pointer"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => (window as any).electronAPI?.maximizeWindow()}
              className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded cursor-pointer"
              title="Maximize"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onRequestClose) {
                  onRequestClose();
                } else {
                  (window as any).electronAPI?.closeWindow();
                }
              }}
              className="p-1.5 hover:bg-red-500 hover:text-white text-[var(--muted-color)] rounded cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
