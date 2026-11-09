import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Columns,
  Rows,
  X,
  Link,
  Unlink,
  FileText,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { Editor, EditorHandle } from './Editor';
import { FileItem, EditorSettings, SplitSettings } from '../types';

interface SplitPaneProps {
  files: FileItem[];
  activeFile: FileItem | null;
  splitFile: FileItem | null;
  settings: EditorSettings;
  splitSettings: SplitSettings;
  editorRefA: React.RefObject<EditorHandle | null>;
  editorRefB: React.RefObject<EditorHandle | null>;
  onContentChangeA: (content: string) => void;
  onContentChangeB: (content: string) => void;
  onCursorChangeA: (cursor: { line: number; col: number; offset: number }) => void;
  onCursorChangeB: (cursor: { line: number; col: number; offset: number }) => void;
  onSelectSplitFile: (fileId: string) => void;
  onUpdateSplit: (newSplit: Partial<SplitSettings>) => void;
  onCloseSplit: () => void;
  onSave: () => void;
  onOpen: () => void;
  onNew: () => void;
  onFind: () => void;
  onReplace: () => void;
  onCommandPalette: () => void;
  onToggleOutline: () => void;
  onToggleFocus: () => void;
  onDropImage: (name: string, dataUrl: string) => void;
  onDropFiles?: (files: FileList) => void;
  onOpenWikiLink?: (target: string) => void;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  files,
  activeFile,
  splitFile,
  settings,
  splitSettings,
  editorRefA,
  editorRefB,
  onContentChangeA,
  onContentChangeB,
  onCursorChangeA,
  onCursorChangeB,
  onSelectSplitFile,
  onUpdateSplit,
  onCloseSplit,
  onSave,
  onOpen,
  onNew,
  onFind,
  onReplace,
  onCommandPalette,
  onToggleOutline,
  onToggleFocus,
  onDropImage,
  onDropFiles,
  onOpenWikiLink,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileMenuOpenB, setFileMenuOpenB] = useState(false);

  const isVertical = splitSettings.mode === 'vertical';
  const ratio = splitSettings.ratio || 50;

  // Handle Dragging Divider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let newRatio: number;
      if (isVertical) {
        newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      }

      const clampedRatio = Math.max(20, Math.min(80, Math.round(newRatio)));
      onUpdateSplit({ ratio: clampedRatio });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isVertical, onUpdateSplit]);

  // Synchronized Scrolling
  useEffect(() => {
    if (!splitSettings.syncScroll) return;

    let isScrollingA = false;
    let isScrollingB = false;

    const viewA = editorRefA.current?.getEditorView();
    const viewB = editorRefB.current?.getEditorView();
    if (!viewA || !viewB) return;

    const domA = viewA.scrollDOM;
    const domB = viewB.scrollDOM;

    const onScrollA = () => {
      if (isScrollingB) return;
      isScrollingA = true;
      const maxScrollA = domA.scrollHeight - domA.clientHeight;
      const percentage = maxScrollA > 0 ? domA.scrollTop / maxScrollA : 0;
      const maxScrollB = domB.scrollHeight - domB.clientHeight;
      domB.scrollTop = percentage * maxScrollB;
      requestAnimationFrame(() => {
        isScrollingA = false;
      });
    };

    const onScrollB = () => {
      if (isScrollingA) return;
      isScrollingB = true;
      const maxScrollB = domB.scrollHeight - domB.clientHeight;
      const percentage = maxScrollB > 0 ? domB.scrollTop / maxScrollB : 0;
      const maxScrollA = domA.scrollHeight - domA.clientHeight;
      domA.scrollTop = percentage * maxScrollA;
      requestAnimationFrame(() => {
        isScrollingB = false;
      });
    };

    domA.addEventListener('scroll', onScrollA);
    domB.addEventListener('scroll', onScrollB);

    return () => {
      domA.removeEventListener('scroll', onScrollA);
      domB.removeEventListener('scroll', onScrollB);
    };
  }, [splitSettings.syncScroll, editorRefA, editorRefB]);

  const targetFileB = splitFile || activeFile;
  const isCloned = !splitFile || splitFile.id === activeFile?.id;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex overflow-hidden relative select-none ${
        isVertical ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Pane A (Primary Editor) */}
      <div
        style={{
          [isVertical ? 'width' : 'height']: `${ratio}%`,
        }}
        className="flex flex-col relative h-full overflow-hidden border-r border-[var(--border-color)]"
      >
        {/* Pane A Header Bar */}
        <div className="h-7 px-3 flex items-center justify-between bg-[var(--hover-bg)]/30 border-b border-[var(--border-color)] text-[11px] text-[var(--muted-color)] select-none">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <FileText className="w-3 h-3 text-[var(--text-color)]" />
            <span className="truncate text-[var(--text-color)]">{activeFile?.name || 'Primary Document'}</span>
          </div>
          <span className="text-[10px] font-mono opacity-60">Primary Pane</span>
        </div>

        {/* Editor A */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          <Editor
            ref={editorRefA as any}
            initialContent={activeFile?.content || ''}
            fileId={activeFile?.id}
            settings={settings}
            onChange={onContentChangeA}
            onCursorChange={onCursorChangeA}
            onSave={onSave}
            onOpen={onOpen}
            onNew={onNew}
            onFind={onFind}
            onReplace={onReplace}
            onCommandPalette={onCommandPalette}
            onToggleOutline={onToggleOutline}
            onToggleFocus={onToggleFocus}
            onDropImage={onDropImage}
            onDropFiles={onDropFiles}
            onOpenWikiLink={onOpenWikiLink}
          />
        </div>
      </div>

      {/* Draggable Split Divider */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onUpdateSplit({ ratio: 50 })}
        title="Drag to resize, double-click to center (50/50)"
        className={`group relative z-30 flex-shrink-0 flex items-center justify-center transition-colors cursor-${
          isVertical ? 'col-resize' : 'row-resize'
        } ${
          isVertical
            ? 'w-2 hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)]'
            : 'h-2 hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)]'
        }`}
      >
        <div
          className={`rounded-full bg-[var(--border-color)] group-hover:bg-[var(--text-color)]/50 transition-colors ${
            isVertical ? 'w-1 h-8' : 'h-1 w-8'
          }`}
        />
      </div>

      {/* Pane B (Secondary / Reference Editor) */}
      <div
        style={{
          [isVertical ? 'width' : 'height']: `${100 - ratio}%`,
        }}
        className="flex flex-col relative h-full overflow-hidden"
      >
        {/* Pane B Header Bar */}
        <div className="h-7 px-3 flex items-center justify-between bg-[var(--hover-bg)]/30 border-b border-[var(--border-color)] text-[11px] text-[var(--muted-color)] select-none">
          {/* File Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFileMenuOpenB(!fileMenuOpenB)}
              className="flex items-center gap-1.5 font-medium hover:text-[var(--text-color)] text-[var(--text-color)] transition-colors py-0.5 px-1.5 rounded hover:bg-[var(--hover-bg)] cursor-pointer"
            >
              {isCloned ? (
                <Copy className="w-3 h-3 text-[var(--muted-color)]" />
              ) : (
                <FileText className="w-3 h-3 text-[var(--text-color)]" />
              )}
              <span className="truncate max-w-[140px]">
                {isCloned ? `${activeFile?.name || 'Document'} (Clone)` : targetFileB?.name}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Menu Popover */}
            {fileMenuOpenB && (
              <div
                className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-[var(--surface-color)]/95 backdrop-blur-xl border border-[var(--border-color)] shadow-xl py-1 z-50 text-xs text-[var(--text-color)] animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setFileMenuOpenB(false)}
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-[var(--muted-color)]">
                  Select Document for Pane
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSplitFile(activeFile?.id || '')}
                  className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--hover-bg)] text-[var(--text-color)] font-medium cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-[var(--muted-color)]" />
                  <span>Clone Active Document</span>
                </button>
                <div className="h-px bg-[var(--border-color)] my-1" />
                {files
                  .filter((f) => f.id !== activeFile?.id)
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectSplitFile(f.id)}
                      className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--hover-bg)] text-[var(--text-color)] truncate cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-[var(--muted-color)]" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Pane Actions */}
          <div className="flex items-center gap-1">
            {/* Sync scroll toggle */}
            <button
              type="button"
              onClick={() => onUpdateSplit({ syncScroll: !splitSettings.syncScroll })}
              title={splitSettings.syncScroll ? 'Synchronized Scrolling: ON' : 'Synchronized Scrolling: OFF'}
              className={`p-1 rounded transition-colors cursor-pointer ${
                splitSettings.syncScroll
                  ? 'text-[var(--text-color)] bg-[var(--hover-bg)] font-semibold'
                  : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              {splitSettings.syncScroll ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
            </button>

            {/* Split Orientation Toggle */}
            <button
              type="button"
              onClick={() => onUpdateSplit({ mode: isVertical ? 'horizontal' : 'vertical' })}
              title={isVertical ? 'Switch to Horizontal Split' : 'Switch to Vertical Split'}
              className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
            >
              {isVertical ? <Rows className="w-3 h-3" /> : <Columns className="w-3 h-3" />}
            </button>

            {/* Close Split Pane */}
            <button
              type="button"
              onClick={onCloseSplit}
              title="Close Split View (Ctrl+\)"
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-[var(--muted-color)] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Editor B */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          <Editor
            ref={editorRefB as any}
            initialContent={targetFileB?.content || ''}
            fileId={targetFileB?.id}
            settings={settings}
            onChange={onContentChangeB}
            onCursorChange={onCursorChangeB}
            onSave={onSave}
            onOpen={onOpen}
            onNew={onNew}
            onFind={onFind}
            onReplace={onReplace}
            onCommandPalette={onCommandPalette}
            onToggleOutline={onToggleOutline}
            onToggleFocus={onToggleFocus}
            onDropImage={onDropImage}
            onDropFiles={onDropFiles}
            onOpenWikiLink={onOpenWikiLink}
          />
        </div>
      </div>
    </div>
  );
};
