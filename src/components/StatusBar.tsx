import React from 'react';
import { Check, Code2, Eye, Columns2, Sparkles } from 'lucide-react';
import { DocumentStats, EditorViewMode } from '../types';

interface StatusBarProps {
  stats: DocumentStats;
  cursorPos: { line: number; col: number; offset: number };
  isDirty: boolean;
  isVisible: boolean;
  editorMode?: EditorViewMode;
  liveMarkdown: boolean;
  focusMode?: boolean;
  bionicReading?: boolean;
  hemingwayMode?: boolean;
  onOpenStats: () => void;
  onToggleLiveMarkdown: () => void;
  onToggleFocusMode?: () => void;
  onToggleBionicReading?: () => void;
  onToggleHemingwayMode?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorPos,
  isDirty,
  isVisible,
  editorMode,
  liveMarkdown,
  focusMode = false,
  bionicReading = false,
  hemingwayMode = false,
  onOpenStats,
  onToggleLiveMarkdown,
  onToggleFocusMode,
  onToggleBionicReading,
  onToggleHemingwayMode,
}) => {
  if (!isVisible) return null;

  const currentMode: EditorViewMode = editorMode || (liveMarkdown ? 'live' : 'source');

  return (
    <footer className="h-7 flex-shrink-0 flex items-center justify-between px-4 border-t border-[var(--border-color)] text-[11px] font-mono text-[var(--muted-color)] select-none transition-colors">
      {/* Left: Writing Metrics */}
      <button
        onClick={onOpenStats}
        title="View detailed document insights"
        className="flex items-center gap-2 hover:text-[var(--text-color)] transition-colors cursor-pointer"
      >
        <span>{stats.words.toLocaleString()} words</span>
        <span>·</span>
        <span>{stats.characters.toLocaleString()} characters</span>
        <span>·</span>
        <span>{stats.readingTimeMinutes} min read</span>
      </button>

      {/* Right: Mode Toggle, Position & Status */}
      <div className="flex items-center gap-2.5">
        {/* Focus Mode Toggle */}
        {onToggleFocusMode && (
          <>
            <button
              onClick={onToggleFocusMode}
              title={focusMode ? 'Focus Mode ON (Paragraph Dimming Active) - Click or Ctrl+Shift+F to Disable' : 'Focus Mode OFF - Click or Ctrl+Shift+F to Dim Unfocused Paragraphs'}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                focusMode
                  ? 'text-[var(--text-color)] bg-[var(--hover-bg)] font-semibold'
                  : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Focus</span>
            </button>
            <span>·</span>
          </>
        )}

        {/* Bionic Reading Toggle */}
        {onToggleBionicReading && (
          <>
            <button
              onClick={onToggleBionicReading}
              title={bionicReading ? 'Bionic Reading ON - Click to Disable' : 'Bionic Reading OFF - Click to Enable Live Typographic Fixation Bolding'}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                bionicReading
                  ? 'text-[var(--text-color)] bg-[var(--hover-bg)] font-bold'
                  : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <span>Bio</span>
            </button>
            <span>·</span>
          </>
        )}

        {/* Hemingway Mode Toggle */}
        {onToggleHemingwayMode && (
          <>
            <button
              onClick={onToggleHemingwayMode}
              title={hemingwayMode ? 'Hemingway Mode ON (No Backspace/Delete) - Pure Forward Drafting Momentum' : 'Hemingway Mode OFF - Click to Lock Forward Drafting'}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                hemingwayMode
                  ? 'text-[var(--text-color)] bg-[var(--hover-bg)] font-semibold'
                  : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <span>Flow</span>
            </button>
            <span>·</span>
          </>
        )}

        {/* 3-Way Mode Switch: Live -> Source -> Split */}
        <button
          onClick={onToggleLiveMarkdown}
          title={
            currentMode === 'live'
              ? 'Current: Live Mode. Click to switch to Source Mode.'
              : currentMode === 'source'
              ? 'Current: Source Mode. Click to switch to Split Mode (Source Left, Live Right).'
              : 'Current: Split Mode. Click to switch to Live Mode.'
          }
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
        >
          {currentMode === 'live' && (
            <>
              <Eye className="w-3 h-3 text-[var(--text-color)]" />
              <span>Live Mode</span>
            </>
          )}
          {currentMode === 'source' && (
            <>
              <Code2 className="w-3 h-3 text-[var(--text-color)]" />
              <span className="font-medium text-[var(--text-color)]">Source Mode</span>
            </>
          )}
          {currentMode === 'split' && (
            <>
              <Columns2 className="w-3 h-3 text-[var(--text-color)]" />
              <span className="font-medium text-[var(--text-color)]">Split Mode</span>
            </>
          )}
        </button>

        <span>·</span>

        <span>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <span>·</span>
        <div className="flex items-center gap-1">
          {isDirty ? (
            <span className="flex items-center gap-1 text-[var(--text-color)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-color)] animate-pulse" />
              <span>Unsaved</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};

