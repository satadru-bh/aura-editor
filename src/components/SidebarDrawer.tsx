import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  FolderOpen,
  Folder,
  ChevronRight,
  RotateCw,
  Star,
  Trash2,
  Copy,
  Edit2,
  X,
  Search,
  HardDrive,
  UploadCloud,
  Lock,
  ListTree,
  Hash,
  CheckSquare,
  Square,
  Check,
  Download,
  Link2,
  ArrowUpRight,
} from 'lucide-react';
import { FileItem, OutlineItem } from '../types';
import { WorkspaceNode } from '../services/WorkspaceService';
import { findWikiLinks } from '../editor/WikiLinkPlugin';

interface SidebarDrawerProps {
  isOpen: boolean;
  activeTab: 'files' | 'vault' | 'outline' | 'links';
  onTabChange: (tab: 'files' | 'vault' | 'outline' | 'links') => void;
  files: FileItem[];
  activeFileId: string | null;
  activeFilePath?: string | null;
  outline: OutlineItem[];
  currentOffset: number;
  workspacePath?: string | null;
  workspaceName?: string | null;
  workspaceTree?: WorkspaceNode[];
  onOpenWorkspaceDialog?: () => void;
  onRefreshWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  onOpenFileByPath?: (filePath: string) => void;
  onOpenWikiLink?: (target: string) => void;
  onSelectFile: (file: FileItem) => void;
  onNewFile: () => void;
  onOpenFileFromDisk: () => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (file: FileItem) => void;
  onToggleFavorite: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onBatchDeleteFiles?: (fileIds: string[]) => void;
  onBatchToggleFavorite?: (fileIds: string[], favorite: boolean) => void;
  onBatchExportFiles?: (fileIds: string[]) => void;
  onImportFiles: (files: FileList) => void;
  onJumpToPos: (pos: number) => void;
  onClose: () => void;
}

const FolderTreeItem: React.FC<{
  node: WorkspaceNode;
  level: number;
  activeFilePath?: string | null;
  onSelect?: (path: string) => void;
}> = ({ node, level, activeFilePath, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isDirectory) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-[var(--hover-bg)] text-[var(--text-color)] text-left cursor-pointer w-full text-xs"
          style={{ paddingLeft: `${6 + level * 12}px` }}
        >
          <ChevronRight className={`w-3 h-3 text-[var(--muted-color)] transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />
          <Folder className="w-3.5 h-3.5 text-[var(--muted-color)] flex-shrink-0" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <FolderTreeItem
                key={child.path}
                node={child}
                level={level + 1}
                activeFilePath={activeFilePath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isCurrent = activeFilePath && node.path.toLowerCase() === activeFilePath.toLowerCase();

  return (
    <button
      type="button"
      onClick={() => onSelect?.(node.path)}
      className={`flex items-center gap-2 py-1 pr-2 rounded-md transition-colors text-left cursor-pointer w-full text-xs ${
        isCurrent
          ? 'bg-[var(--hover-bg)] text-[var(--text-color)] font-medium border border-[var(--border-color)]'
          : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]/60'
      }`}
      style={{ paddingLeft: `${20 + level * 12}px` }}
    >
      <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-75" />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  files,
  activeFileId,
  activeFilePath,
  outline,
  currentOffset,
  workspacePath,
  workspaceName,
  workspaceTree = [],
  onOpenWorkspaceDialog,
  onRefreshWorkspace,
  onCloseWorkspace,
  onOpenFileByPath,
  onOpenWikiLink,
  onSelectFile,
  onNewFile,
  onOpenFileFromDisk,
  onDeleteFile,
  onDuplicateFile,
  onToggleFavorite,
  onRenameFile,
  onBatchDeleteFiles,
  onBatchToggleFavorite,
  onBatchExportFiles,
  onImportFiles,
  onJumpToPos,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const lastSelectedIdxRef = useRef<number | null>(null);

  // Filter files
  const filteredFiles = files.filter((f) => {
    if (fileFilter === 'favorites' && !f.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleRowClick = (file: FileItem, idx: number, e: React.MouseEvent) => {
    if (isMultiSelectMode || e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!isMultiSelectMode) setIsMultiSelectMode(true);

      if (e.shiftKey && lastSelectedIdxRef.current !== null) {
        const start = Math.min(lastSelectedIdxRef.current, idx);
        const end = Math.max(lastSelectedIdxRef.current, idx);
        setSelectedFileIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            if (filteredFiles[i]) next.add(filteredFiles[i].id);
          }
          return next;
        });
      } else {
        lastSelectedIdxRef.current = idx;
        toggleSelectFile(file.id);
      }
    } else {
      onSelectFile(file);
    }
  };

  const handleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedFileIds.size === 0) return;
    const count = selectedFileIds.size;
    if (confirm(`Delete ${count} selected document${count > 1 ? 's' : ''}?`)) {
      onBatchDeleteFiles?.(Array.from(selectedFileIds));
      setSelectedFileIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleBatchFavorite = () => {
    if (selectedFileIds.size === 0) return;
    const selectedList = files.filter((f) => selectedFileIds.has(f.id));
    const anyUnfavorited = selectedList.some((f) => !f.isFavorite);
    onBatchToggleFavorite?.(Array.from(selectedFileIds), anyUnfavorited);
  };

  const handleBatchExport = () => {
    if (selectedFileIds.size === 0) return;
    onBatchExportFiles?.(Array.from(selectedFileIds));
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isSubmittingRenameRef = useRef(false);

  const handleStartRename = (f: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    isSubmittingRenameRef.current = false;
    setRenamingId(f.id);
    setRenameInput(f.name.replace(/\.md$/i, ''));
  };

  const handleFinishRename = (fileId: string) => {
    if (isSubmittingRenameRef.current) return;
    isSubmittingRenameRef.current = true;
    setRenamingId(null);
    const trimmed = renameInput.trim();
    if (trimmed) {
      const finalName = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
      onRenameFile(fileId, finalName);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getWordCount = (text: string) => {
    const match = text.trim().match(/[\p{L}\p{N}_\-]+/gu);
    return match ? match.length : 0;
  };

  return (
    <aside
      className={`h-full flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] flex flex-col overflow-hidden text-xs select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${
        isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'
      }`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="w-72 h-full flex flex-col overflow-hidden flex-shrink-0">
        {/* Top Tab Switcher Header */}
        <div className="h-10 px-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--hover-bg)]/30 flex-shrink-0">
          <div className="flex items-center gap-1 bg-[var(--hover-bg)] p-0.5 rounded-lg">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange('files');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-[var(--surface-color)] text-[var(--text-color)] shadow-xs border border-[var(--border-color)]'
                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Notes</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange('vault');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-[var(--surface-color)] text-[var(--text-color)] shadow-xs border border-[var(--border-color)]'
                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              <span>Vault</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange('outline');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'outline'
                  ? 'bg-[var(--surface-color)] text-[var(--text-color)] shadow-xs border border-[var(--border-color)]'
                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <ListTree className="w-3 h-3" />
              <span>Outline</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange('links');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-[var(--surface-color)] text-[var(--text-color)] shadow-xs border border-[var(--border-color)]'
                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <Link2 className="w-3 h-3" />
              <span>Links</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] active:scale-90 transition-all cursor-pointer"
            title="Collapse Sidebar (Ctrl+Shift+E)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TAB 1: DOCUMENTS (FILES) */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick action buttons */}
            <div className="p-2.5 grid grid-cols-2 gap-2 border-b border-[var(--border-color)]">
              <button
                type="button"
                onClick={onNewFile}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] font-medium text-xs transition-colors cursor-pointer text-[var(--text-color)]"
              >
                <Plus className="w-3 h-3 text-[var(--text-color)]" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={onOpenFileFromDisk}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] font-medium text-xs transition-colors cursor-pointer text-[var(--text-color)]"
              >
                <FolderOpen className="w-3 h-3 text-[var(--muted-color)]" />
                <span>Open Disk</span>
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-2.5">
              <div className="flex items-center gap-1.5 bg-[var(--hover-bg)] rounded-lg px-2.5 py-1.5 border border-[var(--border-color)]">
                <Search className="w-3.5 h-3.5 text-[var(--muted-color)]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full bg-transparent outline-none text-xs text-[var(--text-color)] placeholder:text-[var(--muted-color)] select-text"
                />
              </div>
            </div>

            {/* Filter Pills: All / Recent / Favorites + Multi-Select Toggle */}
            <div className="flex items-center justify-between px-3 pt-2.5 border-b border-[var(--border-color)] pb-2 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFileFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    fileFilter === 'all'
                      ? 'bg-[var(--hover-bg)] font-medium text-[var(--text-color)] border border-[var(--border-color)]'
                      : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('recent')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    fileFilter === 'recent'
                      ? 'bg-[var(--hover-bg)] font-medium text-[var(--text-color)] border border-[var(--border-color)]'
                      : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                  }`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('favorites')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    fileFilter === 'favorites'
                      ? 'bg-[var(--hover-bg)] font-medium text-[var(--text-color)] border border-[var(--border-color)]'
                      : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                  }`}
                >
                  Favorites
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextMode = !isMultiSelectMode;
                  setIsMultiSelectMode(nextMode);
                  if (!nextMode) {
                    setSelectedFileIds(new Set());
                  }
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  isMultiSelectMode
                    ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                    : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
                }`}
                title={isMultiSelectMode ? 'Exit Selection Mode' : 'Select multiple documents'}
              >
                <CheckSquare className="w-3 h-3" />
                <span>{isMultiSelectMode ? 'Done' : 'Select'}</span>
              </button>
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredFiles.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted-color)] text-xs">
                  No documents found.
                </div>
              ) : (
                filteredFiles.map((file, idx) => {
                  const isActive = file.id === activeFileId;
                  const isSelected = selectedFileIds.has(file.id);
                  const words = getWordCount(file.content);

                  return (
                    <div
                      key={file.id}
                      onClick={(e) => handleRowClick(file, idx, e)}
                      className={`group relative p-2 rounded-lg cursor-pointer flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'bg-[var(--hover-bg)] border border-[var(--text-color)]/30 shadow-2xs'
                          : isActive
                          ? 'bg-[var(--hover-bg)]/80 border border-[var(--border-color)] shadow-2xs'
                          : 'hover:bg-[var(--hover-bg)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {isMultiSelectMode ? (
                            <button
                              type="button"
                              onClick={(e) => toggleSelectFile(file.id, e)}
                              className={`p-0.5 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                isSelected
                                  ? 'text-[var(--text-color)]'
                                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Square className="w-3.5 h-3.5 opacity-60" />
                              )}
                            </button>
                          ) : file.isEncrypted ? (
                            <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[var(--muted-color)] flex-shrink-0" />
                          )}
                          {renamingId === file.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFinishRename(file.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 w-full"
                            >
                              <input
                                type="text"
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                onBlur={() => handleFinishRename(file.id)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Escape') {
                                    isSubmittingRenameRef.current = true;
                                    setRenamingId(null);
                                  }
                                }}
                                autoFocus
                                className="bg-[var(--surface-color)] text-[var(--text-color)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-xs outline-none w-full select-text"
                              />
                            </form>
                          ) : (
                            <span className="font-medium truncate text-xs text-[var(--text-color)]">
                              {file.name}
                            </span>
                          )}
                        </div>

                        {/* Actions on hover (hidden during multi-select mode) */}
                        {!isMultiSelectMode && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(file.id);
                              }}
                              className="p-1 hover:bg-[var(--hover-bg)] rounded cursor-pointer"
                              title={file.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  file.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-[var(--muted-color)]'
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(file, e)}
                              className="p-1 hover:bg-[var(--hover-bg)] rounded text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateFile(file);
                              }}
                              className="p-1 hover:bg-[var(--hover-bg)] rounded text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {files.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete "${file.name}"?`)) {
                                    onDeleteFile(file.id);
                                  }
                                }}
                                className="p-1 hover:bg-red-500/20 text-[var(--muted-color)] hover:text-red-500 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Metadata subtitle */}
                      <div className={`flex items-center justify-between text-[10px] text-[var(--muted-color)] ${isMultiSelectMode ? 'pl-6' : 'pl-5'}`}>
                        <span>{words} words</span>
                        <span>{formatTimeAgo(file.lastModified)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Batch Actions Bar */}
            {isMultiSelectMode && (
              <div className="p-2 border-t border-[var(--border-color)] bg-[var(--surface-color)] flex flex-col gap-2 flex-shrink-0 animate-slideUp">
                <div className="flex items-center justify-between text-[11px] text-[var(--muted-color)] px-1">
                  <span className="font-medium text-[var(--text-color)]">
                    {selectedFileIds.size} of {filteredFiles.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[var(--text-color)] hover:underline cursor-pointer font-medium"
                  >
                    {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={selectedFileIds.size === 0}
                    onClick={handleBatchFavorite}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] text-[11px] text-[var(--text-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Toggle Favorite"
                  >
                    <Star className="w-3 h-3 text-amber-500" />
                    <span>Star</span>
                  </button>
                  <button
                    type="button"
                    disabled={selectedFileIds.size === 0}
                    onClick={handleBatchExport}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] text-[11px] text-[var(--text-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Export selected as ZIP"
                  >
                    <Download className="w-3 h-3 text-[var(--text-color)]" />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    disabled={selectedFileIds.size === 0}
                    onClick={handleBatchDelete}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[11px] text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Delete selected documents"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Drop zone footer */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  onImportFiles(e.dataTransfer.files);
                }
              }}
              className="p-3 border-t border-[var(--border-color)] bg-[var(--hover-bg)]/20 text-center text-[11px] text-[var(--muted-color)] flex flex-col items-center gap-1 cursor-pointer hover:bg-[var(--hover-bg)]/40 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[var(--muted-color)]" />
              <span>Click to browse or drop files to import</span>
              <input
                type="file"
                multiple
                accept=".md,.markdown,.txt,.text,.html,.htm,.json"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onImportFiles(e.target.files);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* TAB 2: LOCAL VAULT (FOLDER TREE) */}
        {activeTab === 'vault' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!workspacePath ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <FolderOpen className="w-9 h-9 text-[var(--muted-color)] mb-3 opacity-50" />
                <h3 className="font-semibold text-xs text-[var(--text-color)] mb-1">No Local Vault Open</h3>
                <p className="text-[11px] text-[var(--muted-color)] mb-4 max-w-[210px] leading-relaxed">
                  Open any local folder on your computer to browse, manage, and edit Markdown files directly.
                </p>
                <button
                  type="button"
                  onClick={onOpenWorkspaceDialog}
                  className="py-1.5 px-3.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] font-medium text-xs text-[var(--text-color)] cursor-pointer transition-colors active:scale-95"
                >
                  Open Local Folder
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--hover-bg)]/40 flex-shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0" title={workspacePath}>
                    <Folder className="w-3.5 h-3.5 text-[var(--text-color)] flex-shrink-0" />
                    <span className="font-semibold text-xs text-[var(--text-color)] truncate">{workspaceName || 'Vault'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onRefreshWorkspace}
                      className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer active:scale-90 transition-transform"
                      title="Refresh Vault Folder"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={onCloseWorkspace}
                      className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer active:scale-90 transition-transform"
                      title="Close Vault"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {workspaceTree.length === 0 ? (
                    <div className="py-12 text-center text-[var(--muted-color)] text-xs px-4">
                      No markdown files found in this folder.<br />
                      <span className="text-[10px] opacity-75 mt-1 inline-block">
                        Create or add .md files to see them here.
                      </span>
                    </div>
                  ) : (
                    workspaceTree.map((item) => (
                      <FolderTreeItem
                        key={item.path}
                        node={item}
                        level={0}
                        activeFilePath={activeFilePath}
                        onSelect={onOpenFileByPath}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FILE STRUCTURE (DOCUMENT OUTLINE) */}
        {activeTab === 'outline' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2.5">
            <div className="text-[11px] font-medium text-[var(--muted-color)] px-2 py-1.5 border-b border-[var(--border-color)] flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="font-mono text-[10px]">{outline.length} sections</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
              {outline.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted-color)] text-xs px-4">
                  No headings found in current document.<br />
                  <span className="font-mono text-[10px] opacity-75 mt-1 inline-block">
                    Use #, ##, ### to create structured sections.
                  </span>
                </div>
              ) : (
                outline.map((item) => {
                  const isNear =
                    currentOffset >= item.from &&
                    (outline.find((next) => next.from > item.from)?.from || Infinity) >
                      currentOffset;

                  const paddingLeft = (item.level - 1) * 12 + 6;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onJumpToPos(item.from)}
                      style={{ paddingLeft: `${paddingLeft}px` }}
                      className={`w-full text-left py-1.5 pr-2 rounded-md flex items-center gap-2 truncate transition-colors cursor-pointer text-xs ${
                        isNear
                          ? 'bg-[var(--hover-bg)] text-[var(--text-color)] font-medium'
                          : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[var(--muted-color)] flex-shrink-0">
                        {'#'.repeat(item.level)}
                      </span>
                      <span className="truncate">{item.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2.5">
            {(() => {
              const activeDoc = files.find((f) => f.id === activeFileId);
              const activeTitle = activeDoc ? activeDoc.name.replace(/\.(md|txt)$/i, '') : 'Untitled';

              const incoming = files.filter(
                (f) =>
                  f.id !== activeFileId &&
                  activeTitle &&
                  (f.content.toLowerCase().includes(`[[${activeTitle.toLowerCase()}]]`) ||
                    f.content.toLowerCase().includes(`[[${activeTitle.toLowerCase()}|`))
              );

              const outgoing = activeDoc ? findWikiLinks(activeDoc.content) : [];

              return (
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  <div className="flex flex-col overflow-hidden">
                    <div className="text-[11px] font-semibold text-[var(--muted-color)] px-2 py-1.5 border-b border-[var(--border-color)] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 text-[var(--text-color)]" />
                        <span>Incoming Backlinks</span>
                      </span>
                      <span className="font-mono text-[10px]">{incoming.length}</span>
                    </div>

                    <div className="overflow-y-auto max-h-48 py-1.5 space-y-1">
                      {incoming.length === 0 ? (
                        <div className="py-4 text-center text-[var(--muted-color)] text-[11px] px-2 italic">
                          No other documents link to this note yet.
                        </div>
                      ) : (
                        incoming.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => onSelectFile(f)}
                            className="w-full text-left p-2 rounded-md hover:bg-[var(--hover-bg)] flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText className="w-3 h-3 text-[var(--muted-color)] group-hover:text-[var(--text-color)] shrink-0" />
                              <span className="text-xs truncate font-medium">{f.name.replace(/\.(md|txt)$/i, '')}</span>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-[var(--muted-color)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="text-[11px] font-semibold text-[var(--muted-color)] px-2 py-1.5 border-b border-[var(--border-color)] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3 h-3 text-[var(--text-color)]" />
                        <span>Outgoing References</span>
                      </span>
                      <span className="font-mono text-[10px]">{outgoing.length}</span>
                    </div>

                    <div className="overflow-y-auto flex-1 py-1.5 space-y-1">
                      {outgoing.length === 0 ? (
                        <div className="py-4 text-center text-[var(--muted-color)] text-[11px] px-2 italic">
                          No [[Note]] links in this document.<br />
                          <span className="font-mono text-[10px] opacity-75 mt-1 inline-block">
                            Type [[ to link other notes.
                          </span>
                        </div>
                      ) : (
                        outgoing.map((link, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onOpenWikiLink?.(link.target)}
                            className="w-full text-left p-2 rounded-md hover:bg-[var(--hover-bg)] flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                          >
                            <span className="text-xs truncate font-mono text-[var(--muted-color)] group-hover:text-[var(--text-color)]">
                              [[{link.target}]]
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-[var(--muted-color)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </aside>
  );
};
