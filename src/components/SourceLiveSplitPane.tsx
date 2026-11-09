import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Code2,
  Eye,
  Link,
  Unlink,
  FileText,
  X,
  Columns2,
} from 'lucide-react';
import { Editor, EditorHandle } from './Editor';
import { FileItem, EditorSettings } from '../types';

interface SourceLiveSplitPaneProps {
  activeFile: FileItem | null;
  files: FileItem[];
  settings: EditorSettings;
  editorRefSource: React.RefObject<EditorHandle | null>;
  editorRefLive: React.RefObject<EditorHandle | null>;
  onContentChange: (content: string) => void;
  onCursorChange: (cursor: { line: number; col: number; offset: number }) => void;
  onCloseSplit: () => void;
  onSave: () => void;
  onOpen: () => void;
  onNew: () => void;
  onFind: () => void;
  onReplace: () => void;
  onCommandPalette: () => void;
  onToggleOutline: () => void;
  onToggleFocus: () => void;
  onDropImage: (name: string, dataUrl?: string) => void;
  onDropFiles?: (files: FileList | File[]) => void;
}

export const SourceLiveSplitPane: React.FC<SourceLiveSplitPaneProps> = ({
  activeFile,
  files,
  settings,
  editorRefSource,
  editorRefLive,
  onContentChange,
  onCursorChange,
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);

  const activeOriginRef = useRef<'source' | 'live' | null>(null);
  const isSyncingDocRef = useRef<boolean>(false);

  // Dragging split resizer
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedRatio = Math.max(25, Math.min(75, Math.round(newRatio)));
      setRatio(clampedRatio);
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
  }, [isDragging]);

  // Synchronized Scrolling between Source and Live panes
  useEffect(() => {
    if (!syncScroll) return;

    let isScrollingSource = false;
    let isScrollingLive = false;

    const viewSource = editorRefSource.current?.getEditorView();
    const viewLive = editorRefLive.current?.getEditorView();
    if (!viewSource || !viewLive) return;

    const domSource = viewSource.scrollDOM;
    const domLive = viewLive.scrollDOM;

    const onScrollSource = () => {
      if (isScrollingLive) return;
      isScrollingSource = true;
      const maxSource = domSource.scrollHeight - domSource.clientHeight;
      const percentage = maxSource > 0 ? domSource.scrollTop / maxSource : 0;
      const maxLive = domLive.scrollHeight - domLive.clientHeight;
      domLive.scrollTop = percentage * maxLive;
      requestAnimationFrame(() => {
        isScrollingSource = false;
      });
    };

    const onScrollLive = () => {
      if (isScrollingSource) return;
      isScrollingLive = true;
      const maxLive = domLive.scrollHeight - domLive.clientHeight;
      const percentage = maxLive > 0 ? domLive.scrollTop / maxLive : 0;
      const maxSource = domSource.scrollHeight - domSource.clientHeight;
      domSource.scrollTop = percentage * maxSource;
      requestAnimationFrame(() => {
        isScrollingLive = false;
      });
    };

    domSource.addEventListener('scroll', onScrollSource, { passive: true });
    domLive.addEventListener('scroll', onScrollLive, { passive: true });

    return () => {
      domSource.removeEventListener('scroll', onScrollSource);
      domLive.removeEventListener('scroll', onScrollLive);
    };
  }, [syncScroll, editorRefSource, editorRefLive]);

  // Bi-directional content synchronization
  const handleSourceChange = useCallback(
    (newContent: string) => {
      if (isSyncingDocRef.current) return;
      activeOriginRef.current = 'source';
      onContentChange(newContent);

      // Synchronize Live view
      const liveView = editorRefLive.current?.getEditorView();
      if (liveView && liveView.state.doc.toString() !== newContent) {
        isSyncingDocRef.current = true;
        const currentSel = liveView.state.selection;
        liveView.dispatch({
          changes: { from: 0, to: liveView.state.doc.length, insert: newContent },
          selection: currentSel.main.head <= newContent.length ? currentSel : undefined,
        });
        isSyncingDocRef.current = false;
      }
    },
    [onContentChange, editorRefLive]
  );

  const handleLiveChange = useCallback(
    (newContent: string) => {
      if (isSyncingDocRef.current) return;
      activeOriginRef.current = 'live';
      onContentChange(newContent);

      // Synchronize Source view
      const sourceView = editorRefSource.current?.getEditorView();
      if (sourceView && sourceView.state.doc.toString() !== newContent) {
        isSyncingDocRef.current = true;
        const currentSel = sourceView.state.selection;
        sourceView.dispatch({
          changes: { from: 0, to: sourceView.state.doc.length, insert: newContent },
          selection: currentSel.main.head <= newContent.length ? currentSel : undefined,
        });
        isSyncingDocRef.current = false;
      }
    },
    [onContentChange, editorRefSource]
  );

  const sourceSettings: EditorSettings = {
    ...settings,
    liveMarkdown: false,
    showLineNumbers: true,
  };

  const liveSettings: EditorSettings = {
    ...settings,
    liveMarkdown: true,
    showLineNumbers: false,
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-row overflow-hidden relative select-none bg-[var(--bg-color)]"
    >
      {/* Left Column: Source Mode */}
      <div
        style={{ width: `${ratio}%` }}
        className="source-pane flex flex-col relative h-full overflow-hidden border-r border-[var(--border-color)]"
        data-testid="source-pane"
      >
        {/* Source Pane Header */}
        <div className="h-7 px-3 flex items-center justify-between bg-[var(--surface-color)]/60 border-b border-[var(--border-color)] text-[11px] text-[var(--muted-color)] select-none flex-shrink-0">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <Code2 className="w-3.5 h-3.5 text-[var(--text-color)] flex-shrink-0" />
            <span className="text-[var(--text-color)] font-semibold">Source Mode</span>
            <span className="opacity-40">|</span>
            <span className="truncate opacity-75">{activeFile?.name || 'Document'}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--text-color)] border border-[var(--border-color)]">
            Raw Markdown
          </span>
        </div>

        {/* Source Editor Canvas */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          <Editor
            ref={editorRefSource as any}
            initialContent={activeFile?.content || ''}
            fileId={activeFile?.id}
            settings={sourceSettings}
            files={files}
            onChange={handleSourceChange}
            onCursorChange={onCursorChange}
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
          />
        </div>
      </div>

      {/* Center Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => setRatio(50)}
        title="Drag to adjust split ratio, double-click to center (50/50)"
        className="source-live-divider group relative z-30 w-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-col-resize hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)] bg-[var(--border-color)]/30"
      >
        <div className="w-1 h-8 rounded-full bg-[var(--border-color)] group-hover:bg-[var(--text-color)]/50 transition-colors" />
      </div>

      {/* Right Column: Live Mode */}
      <div
        style={{ width: `${100 - ratio}%` }}
        className="live-pane flex flex-col relative h-full overflow-hidden"
        data-testid="live-pane"
      >
        {/* Live Pane Header */}
        <div className="h-7 px-3 flex items-center justify-between bg-[var(--surface-color)]/60 border-b border-[var(--border-color)] text-[11px] text-[var(--muted-color)] select-none flex-shrink-0">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <Eye className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-[var(--text-color)] font-semibold">Live Mode</span>
            <span className="opacity-40">|</span>
            <span className="truncate opacity-75">Rendered Preview</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sync scroll toggle button */}
            <button
              type="button"
              onClick={() => setSyncScroll(!syncScroll)}
              title={syncScroll ? 'Synchronized Scrolling: ON' : 'Synchronized Scrolling: OFF'}
              className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] ${syncScroll
                  ? 'text-[var(--text-color)] bg-[var(--hover-bg)] font-semibold'
                  : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)]'
                }`}
            >
              {syncScroll ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
              <span>Sync Scroll</span>
            </button>

            {/* Close Split Mode button */}
            <button
              type="button"
              onClick={onCloseSplit}
              title="Return to Single View Mode"
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-[var(--muted-color)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Editor Canvas */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          <Editor
            ref={editorRefLive as any}
            initialContent={activeFile?.content || ''}
            fileId={activeFile?.id}
            settings={liveSettings}
            files={files}
            onChange={handleLiveChange}
            onCursorChange={onCursorChange}
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
          />
        </div>
      </div>
    </div>
  );
};
