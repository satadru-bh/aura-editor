import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Replace, X } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

interface FindReplaceProps {
  isOpen: boolean;
  isReplaceMode: boolean;
  editorView: EditorView | null;
  onClose: () => void;
}

export const FindReplace: React.FC<FindReplaceProps> = ({
  isOpen,
  isReplaceMode: initialReplaceMode,
  editorView,
  onClose,
}) => {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(initialReplaceMode);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowReplace(initialReplaceMode);
  }, [initialReplaceMode]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Search logic whenever query or options change
  useEffect(() => {
    if (!isOpen || !editorView || !findQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const docText = editorView.state.doc.toString();
    const foundMatches: { from: number; to: number }[] = [];

    try {
      let pattern: RegExp;
      let flags = caseSensitive ? 'g' : 'gi';

      if (useRegex) {
        pattern = new RegExp(findQuery, flags);
      } else {
        const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const finalPattern = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(finalPattern, flags);
      }

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(docText)) !== null) {
        if (match[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }
        foundMatches.push({
          from: match.index,
          to: match.index + match[0].length,
        });
      }
    } catch (e) {
      // Regex compilation error
    }

    setMatches(foundMatches);

    // Find closest match to current cursor
    if (foundMatches.length > 0) {
      const cursor = editorView.state.selection.main.head;
      let closestIdx = foundMatches.findIndex((m) => m.from >= cursor);
      if (closestIdx === -1) closestIdx = 0;
      setCurrentMatchIndex(closestIdx);
      highlightMatch(foundMatches[closestIdx]);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [findQuery, caseSensitive, wholeWord, useRegex, isOpen, editorView]);

  const highlightMatch = (match: { from: number; to: number } | undefined) => {
    if (!match || !editorView) return;
    editorView.dispatch({
      selection: EditorSelection.range(match.from, match.to),
      scrollIntoView: true,
    });
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    highlightMatch(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    highlightMatch(matches[prevIdx]);
  };

  const handleReplace = () => {
    if (!editorView || matches.length === 0 || currentMatchIndex === -1) return;
    const current = matches[currentMatchIndex];
    editorView.dispatch({
      changes: { from: current.from, to: current.to, insert: replaceQuery },
      selection: EditorSelection.cursor(current.from + replaceQuery.length),
    });
    // Trigger next find
    setTimeout(handleNext, 10);
  };

  const handleReplaceAll = () => {
    if (!editorView || matches.length === 0) return;
    // Replace from end to start to avoid index drift
    const changes = matches.map((m) => ({
      from: m.from,
      to: m.to,
      insert: replaceQuery,
    }));
    editorView.dispatch({ changes });
    setMatches([]);
    setCurrentMatchIndex(-1);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-6 z-40 bg-[var(--surface-color)] text-[var(--text-color)] p-2.5 rounded-lg shadow-xl border border-[var(--border-color)] flex flex-col gap-2 text-xs animate-slideDown max-w-sm">
      {/* Row 1: Find */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-stone-500"
          title="Toggle Replace"
        >
          {showReplace ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 relative flex items-center bg-[var(--hover-bg)] rounded px-2 py-1 border border-[var(--border-color)]">
          <input
            ref={findInputRef}
            type="text"
            placeholder="Find..."
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            className="w-full bg-transparent outline-none pr-14 text-[var(--text-color)] placeholder:text-[var(--muted-color)]"
          />
          <span className="absolute right-2 text-[10px] text-[var(--muted-color)] select-none">
            {matches.length > 0
              ? `${currentMatchIndex + 1}/${matches.length}`
              : findQuery
              ? '0/0'
              : ''}
          </span>
        </div>

        {/* Next / Prev */}
        <button
          onClick={handlePrev}
          disabled={matches.length === 0}
          className="p-1 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded disabled:opacity-30 cursor-pointer"
          title="Previous Match (Shift+Enter)"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNext}
          disabled={matches.length === 0}
          className="p-1 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded disabled:opacity-30 cursor-pointer"
          title="Next Match (Enter)"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 2: Replace */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pl-6">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReplace();
              else if (e.key === 'Escape') onClose();
            }}
            className="flex-1 bg-[var(--hover-bg)] rounded px-2 py-1 outline-none border border-[var(--border-color)] text-[var(--text-color)] placeholder:text-[var(--muted-color)]"
          />
          <button
            onClick={handleReplace}
            disabled={matches.length === 0}
            className="px-2 py-1 rounded bg-[var(--hover-bg)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-color)] disabled:opacity-30 font-medium text-[11px] cursor-pointer"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2 py-1 rounded bg-[var(--hover-bg)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-color)] disabled:opacity-30 font-medium text-[11px] cursor-pointer"
          >
            All
          </button>
        </div>
      )}

      {/* Options Row */}
      <div className="flex items-center justify-between pl-6 text-[10px] text-[var(--muted-color)] pt-0.5 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
              caseSensitive
                ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)]'
            }`}
            title="Match Case"
          >
            Aa
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
              wholeWord
                ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)]'
            }`}
            title="Match Whole Word"
          >
            \b
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
              useRegex
                ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                : 'hover:bg-[var(--hover-bg)] text-[var(--muted-color)]'
            }`}
            title="Use Regular Expression"
          >
            .*
          </button>
        </div>
      </div>
    </div>
  );
};
