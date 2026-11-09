import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minus,
  ArrowDownToLine,
  FileText,
  Lock,
  CornerDownRight,
} from 'lucide-react';
import { Editor, EditorHandle } from './Editor';
import { FileItem, EditorSettings, FloatingWindow } from '../types';
import { calculateDocumentStats } from '../utils/markdownStats';

interface FloatingEditorWindowProps {
  windowState: FloatingWindow;
  file: FileItem;
  settings: EditorSettings;
  files: FileItem[];
  tabBarBounds?: DOMRect | null;
  onUpdateWindow: (fileId: string, updates: Partial<FloatingWindow>) => void;
  onCloseWindow: (fileId: string) => void;
  onRemergeWindow: (fileId: string) => void;
  onContentChange: (fileId: string, newContent: string) => void;
  onBringToFront: (fileId: string) => void;
}

const FloatingEditorWindowComponent: React.FC<FloatingEditorWindowProps> = ({
  windowState,
  file,
  settings,
  files,
  tabBarBounds,
  onUpdateWindow,
  onCloseWindow,
  onRemergeWindow,
  onContentChange,
  onBringToFront,
}) => {
  const { fileId, x, y, width, height, zIndex, isMinimized } = windowState;
  const editorRef = useRef<EditorHandle | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringTabBar, setIsHoveringTabBar] = useState(false);

  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const currentPosRef = useRef({ x, y });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });
  const currentSizeRef = useRef({ width, height });
  const rafMoveRef = useRef<number | null>(null);
  const rafResizeRef = useRef<number | null>(null);

  // Keep refs in sync when props change externally
  useEffect(() => {
    currentPosRef.current = { x, y };
  }, [x, y]);

  useEffect(() => {
    currentSizeRef.current = { width, height };
  }, [width, height]);

  const stats = calculateDocumentStats(file.content);

  // Focus floating window
  const handleFocus = () => {
    onBringToFront(fileId);
  };

  // Header Drag Start
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    handleFocus();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentPosRef.current.x,
      startY: currentPosRef.current.y,
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Header Drag Move & End
  const handleHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.startX + dx;
    let newY = dragStartRef.current.startY + dy;

    // Clamp inside viewport
    newX = Math.max(10, Math.min(viewportW - currentSizeRef.current.width - 10, newX));
    newY = Math.max(10, Math.min(viewportH - 60, newY));

    currentPosRef.current = { x: newX, y: newY };

    // Update DOM directly for 120fps smooth drag without React rerenders
    if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
    rafMoveRef.current = requestAnimationFrame(() => {
      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }
    });

    // Check if dragging over TabBar area for drop-to-remerge
    if (tabBarBounds) {
      const isOverTabBar =
        e.clientX >= tabBarBounds.left &&
        e.clientX <= tabBarBounds.right &&
        e.clientY >= tabBarBounds.top - 15 &&
        e.clientY <= tabBarBounds.bottom + 25;
      setIsHoveringTabBar(isOverTabBar);
    } else {
      setIsHoveringTabBar(e.clientY < 70);
    }
  };

  const handleHeaderPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Sync final position to state once
    onUpdateWindow(fileId, { x: currentPosRef.current.x, y: currentPosRef.current.y });

    // If released over tab bar, remerge!
    if (isHoveringTabBar) {
      setIsHoveringTabBar(false);
      onRemergeWindow(fileId);
    }
  };

  // Resize Handlers
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFocus();

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: currentSizeRef.current.width,
      startH: currentSizeRef.current.height,
    };
    setIsResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.preventDefault();

    const deltaX = e.clientX - resizeStartRef.current.mouseX;
    const deltaY = e.clientY - resizeStartRef.current.mouseY;

    const newW = Math.max(360, Math.min(window.innerWidth - currentPosRef.current.x - 20, resizeStartRef.current.startW + deltaX));
    const newH = Math.max(260, Math.min(window.innerHeight - currentPosRef.current.y - 20, resizeStartRef.current.startH + deltaY));

    currentSizeRef.current = { width: newW, height: newH };

    if (rafResizeRef.current) cancelAnimationFrame(rafResizeRef.current);
    rafResizeRef.current = requestAnimationFrame(() => {
      if (windowRef.current) {
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
      }
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    if (rafResizeRef.current) cancelAnimationFrame(rafResizeRef.current);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Sync final size to state once
    onUpdateWindow(fileId, { width: currentSizeRef.current.width, height: currentSizeRef.current.height });
  };

  // Minimized state rendering
  if (isMinimized) {
    return (
      <div
        style={{ zIndex }}
        onClick={() => {
          onUpdateWindow(fileId, { isMinimized: false });
          onBringToFront(fileId);
        }}
        className="fixed bottom-10 right-6 flex items-center gap-2 px-3.5 py-2 bg-[var(--surface-color)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-xl shadow-xl cursor-pointer hover:scale-105 transition-all text-xs text-[var(--text-color)] select-none group"
      >
        <FileText className="w-3.5 h-3.5 text-[var(--text-color)]" />
        <span className="font-medium max-w-[140px] truncate">{file.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemergeWindow(fileId);
          }}
          title="Remerge into Tab Bar"
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-[var(--muted-color)] hover:text-[var(--text-color)]"
        >
          <ArrowDownToLine className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      onPointerDown={handleFocus}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      }}
      className={`fixed flex flex-col bg-[var(--bg-color)] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border transition-shadow duration-150 overflow-hidden select-none ${
        isHoveringTabBar
          ? 'border-[var(--text-color)]/60 ring-2 ring-[var(--text-color)]/20 shadow-2xl'
          : 'border-[var(--border-color)]'
      }`}
    >
      {/* Floating Window Header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
        className={`h-9 px-3 flex-shrink-0 flex items-center justify-between border-b cursor-grab active:cursor-grabbing transition-colors ${
          isHoveringTabBar
            ? 'bg-[var(--hover-bg)] border-[var(--border-color)]'
            : 'bg-[var(--surface-color)]/70 border-[var(--border-color)]'
        }`}
      >
        {/* Left: Document Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
          {file.isEncrypted ? (
            <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-[var(--muted-color)] flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-[var(--text-color)] truncate">
            {file.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--muted-color)] font-mono border border-[var(--border-color)] flex-shrink-0">
            Floating
          </span>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Remerge / Dock into Tab Bar button */}
          <button
            type="button"
            onClick={() => onRemergeWindow(fileId)}
            title="Dock / Remerge into Tab Bar"
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-color)] transition-colors flex items-center gap-1 text-[11px] px-1.5 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Dock</span>
          </button>

          {/* Minimize Window */}
          <button
            type="button"
            onClick={() => onUpdateWindow(fileId, { isMinimized: true })}
            title="Minimize to Floating Dock"
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close Window */}
          <button
            type="button"
            onClick={() => onCloseWindow(fileId)}
            title="Close Floating Window"
            className="p-1 rounded hover:bg-red-500/20 text-[var(--muted-color)] hover:text-red-500 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dock Hint Banner when hovering TabBar */}
      {isHoveringTabBar && (
        <div className="bg-[var(--text-color)] text-[var(--bg-color)] text-[11px] font-medium py-1 text-center animate-pulse flex items-center justify-center gap-1.5 shadow-inner">
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Release to Dock back into Window</span>
        </div>
      )}

      {/* Window Body: Live Editor */}
      <div className="flex-1 w-full h-full overflow-hidden relative select-text">
        <Editor
          ref={editorRef as any}
          initialContent={file.content}
          fileId={file.id}
          settings={settings}
          onChange={(newContent) => onContentChange(fileId, newContent)}
          onCursorChange={() => {}}
          onSave={() => {}}
          onOpen={() => {}}
          onNew={() => {}}
          onFind={() => {}}
          onReplace={() => {}}
          onCommandPalette={() => {}}
          onToggleOutline={() => {}}
          onToggleFocus={() => {}}
        />
      </div>

      {/* Window Footer with Stats & Resize Handle */}
      <div className="h-6 px-3 flex-shrink-0 flex items-center justify-between border-t border-[var(--border-color)] bg-[var(--hover-bg)]/20 text-[10px] text-[var(--muted-color)] select-none">
        <div className="flex items-center gap-2">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.characters} chars</span>
        </div>

        {/* Resize Handle Grip */}
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          title="Drag to resize window"
          className="cursor-nwse-resize p-1 -mr-2 text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors"
        >
          <CornerDownRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export const FloatingEditorWindow = React.memo(FloatingEditorWindowComponent);
