import React, { useEffect, useState, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import {
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Table,
  Sigma,
  GitBranch,
  Info,
  Search,
  CheckSquare,
  Minus,
  CaseUpper,
  CaseLower,
  Check,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import {
  getSpellingSuggestions,
  addUserWord,
  isSpellingError,
  ignoreWord,
} from '../utils/spellcheck';

interface ContextMenuProps {
  view: EditorView | null;
  onOpenCommandPalette: () => void;
  onOpenFindReplace: () => void;
  onOpenTableModal?: () => void;
}

interface MenuPosition {
  x: number;
  y: number;
  visible: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  view,
  onOpenCommandPalette,
  onOpenFindReplace,
  onOpenTableModal,
}) => {
  const [pos, setPos] = useState<MenuPosition>({ x: 0, y: 0, visible: false });
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [targetWord, setTargetWord] = useState('');
  const [targetWordRange, setTargetWordRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });
  const [hasSpellingError, setHasSpellingError] = useState(false);
  const [spellingSuggestions, setSpellingSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!view) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Find word at right-clicked cursor position
      const clickPos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      let clickedWord = '';
      let range = { from: 0, to: 0 };

      if (clickPos !== null) {
        const line = view.state.doc.lineAt(clickPos);
        const lineText = line.text;
        const offsetInLine = clickPos - line.from;

        const before = lineText.slice(0, offsetInLine).match(/[\w'-]+$/);
        const after = lineText.slice(offsetInLine).match(/^[\w'-]+/);
        clickedWord = (before ? before[0] : '') + (after ? after[0] : '');
        const wordFrom = clickPos - (before ? before[0].length : 0);
        const wordTo = clickPos + (after ? after[0].length : 0);
        range = { from: wordFrom, to: wordTo };
      }

      // Check selection fallback
      const hasSel = !view.state.selection.main.empty;
      const currentSelection = hasSel
        ? view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to).trim()
        : '';

      // Determine word to check for spelling
      // Only single words qualify for spellchecking
      let wordToCheck = '';
      if (hasSel && !/\s/.test(currentSelection) && currentSelection.length >= 2) {
        wordToCheck = currentSelection;
      } else if (!hasSel && clickedWord) {
        wordToCheck = clickedWord;
      }

      const isError = wordToCheck ? isSpellingError(wordToCheck) : false;
      const suggestions = isError ? getSpellingSuggestions(wordToCheck) : [];
      // Only show spellcheck when the word actually has an error with valid suggestions
      const showSpellcheck = isError && suggestions.length > 0;

      setTargetWord(wordToCheck);
      setTargetWordRange(range);
      setHasSpellingError(showSpellcheck);
      setSpellingSuggestions(suggestions);
      // When a spelling error is detected, primarily show the spellcheck card collapsed
      // When regular text is clicked, show regular menu expanded directly
      setIsExpanded(!showSpellcheck);

      // Keep menu comfortably inside window viewport
      const menuWidth = 240;
      const estimatedHeight = showSpellcheck ? 180 : 420;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16);
      const y = Math.min(e.clientY, window.innerHeight - estimatedHeight - 16);

      setPos({
        x: Math.max(10, x),
        y: Math.max(10, y),
        visible: true,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const dom = view.dom;
    dom.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      dom.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [view]);

  if (!pos.visible || !view) return null;

  const close = () => setPos((prev) => ({ ...prev, visible: false }));

  const hasSelection = !view.state.selection.main.empty;
  const selectedText = hasSelection
    ? view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)
    : '';

  // Spellcheck apply handler
  const handleApplySpelling = (replacement: string) => {
    if (hasSelection && selectedText === targetWord) {
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: replacement },
        selection: { anchor: sel.from + replacement.length },
      });
    } else if (targetWordRange.to > targetWordRange.from) {
      view.dispatch({
        changes: { from: targetWordRange.from, to: targetWordRange.to, insert: replacement },
        selection: { anchor: targetWordRange.from + replacement.length },
      });
    }
    view.focus();
    close();
  };

  const handleAddToDict = () => {
    if (targetWord) {
      addUserWord(targetWord);
    }
    close();
  };

  const handleIgnore = () => {
    if (targetWord) {
      ignoreWord(targetWord);
    }
    close();
  };

  // Actions
  const handleCut = async () => {
    if (hasSelection) {
      await navigator.clipboard.writeText(selectedText);
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: '' },
        selection: { anchor: sel.from },
      });
      view.focus();
    }
    close();
  };

  const handleCopy = async () => {
    if (hasSelection) {
      await navigator.clipboard.writeText(selectedText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 1500);
    }
    close();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: { anchor: sel.from + text.length },
      });
      view.focus();
    } catch {
      // Fallback
    }
    close();
  };

  const wrapSelection = (before: string, after: string = before) => {
    const sel = view.state.selection.main;
    const text = view.state.sliceDoc(sel.from, sel.to);
    const wrapped = `${before}${text}${after}`;
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: wrapped },
      selection: { anchor: sel.from + before.length, head: sel.from + before.length + text.length },
    });
    view.focus();
    close();
  };

  const insertTemplate = (template: string) => {
    const sel = view.state.selection.main;
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: template },
      selection: { anchor: sel.from + template.length },
    });
    view.focus();
    close();
  };

  const transformCase = (type: 'upper' | 'lower' | 'title') => {
    if (!hasSelection) return;
    const sel = view.state.selection.main;
    let transformed = selectedText;
    if (type === 'upper') transformed = selectedText.toUpperCase();
    else if (type === 'lower') transformed = selectedText.toLowerCase();
    else if (type === 'title') {
      transformed = selectedText.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: transformed },
      selection: { anchor: sel.from, head: sel.from + transformed.length },
    });
    view.focus();
    close();
  };

  // Render the standard context menu actions (Clipboard, Formatting/Insert, Utilities)
  const renderRegularItems = () => (
    <div className="space-y-1">
      {/* 1. Clipboard Group */}
      <div className="space-y-0.5">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={handleCut}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Cut</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">Ctrl+X</span>
        </button>

        <button
          type="button"
          disabled={!hasSelection}
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {copiedNotification ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            )}
            <span>{copiedNotification ? 'Copied!' : 'Copy'}</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">Ctrl+C</span>
        </button>

        <button
          type="button"
          onClick={handlePaste}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Clipboard className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Paste</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">Ctrl+V</span>
        </button>
      </div>

      <div className="h-px bg-[var(--border-color)] my-1" />

      {/* 2. Formatting / Insert Group */}
      {hasSelection ? (
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--muted-color)] px-2.5 py-0.5 tracking-wider">
            Format Selection
          </div>
          <div className="grid grid-cols-4 gap-1 px-1 py-0.5">
            <button
              type="button"
              title="Bold"
              onClick={() => wrapSelection('**')}
              className="p-1.5 flex items-center justify-center rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic"
              onClick={() => wrapSelection('*')}
              className="p-1.5 flex items-center justify-center rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Strikethrough"
              onClick={() => wrapSelection('~~')}
              className="p-1.5 flex items-center justify-center rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Code"
              onClick={() => wrapSelection('`')}
              className="p-1.5 flex items-center justify-center rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => transformCase('upper')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <CaseUpper className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>UPPERCASE</span>
          </button>
          <button
            type="button"
            onClick={() => transformCase('lower')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <CaseLower className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>lowercase</span>
          </button>
        </div>
      ) : (
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--muted-color)] px-2.5 py-0.5 tracking-wider">
            Insert
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              if (onOpenTableModal) {
                onOpenTableModal();
              } else {
                insertTemplate(
                  '\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Item 1 | Item 2 | Item 3 |\n| Item 4 | Item 5 | Item 6 |\n'
                );
              }
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-[var(--muted-color)]" />
              <span>Table</span>
            </span>
            <span className="text-[10px] font-mono opacity-50">Ctrl+Shift+T</span>
          </button>
          <button
            type="button"
            onClick={() =>
              insertTemplate('\n```typescript\nconst greeting = "Hello, Aura!";\nconsole.log(greeting);\n```\n')
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Code Block</span>
          </button>
          <button
            type="button"
            onClick={() =>
              insertTemplate('\n```mermaid\nflowchart TD\n  Start([Start]) --> Process[Execute Plan]\n  Process --> Done([Done])\n```\n')
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Mermaid Diagram</span>
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('\n$$\nE = mc^2\n$$\n')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <Sigma className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Math Equation</span>
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('\n> [!NOTE]\n> Useful information that users should notice.\n')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Callout Note</span>
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('\n- [ ] Task item\n')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Task Item</span>
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('\n---\n')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Thematic Break</span>
          </button>
        </div>
      )}

      <div className="h-px bg-[var(--border-color)] my-1" />

      {/* 3. Utilities */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onOpenFindReplace();
            close();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Find & Replace</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">Ctrl+F</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenCommandPalette();
            close();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[var(--muted-color)]" />
            <span>Command Palette</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">Ctrl+K</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 w-60 max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-[var(--surface-color)]/95 backdrop-blur-xl border border-[var(--border-color)] shadow-2xl p-1.5 text-xs text-[var(--text-color)] animate-in fade-in zoom-in-95 duration-120 select-none scrollbar-none"
    >
      {/* CASE 1: Right clicked on spelling error */}
      {hasSpellingError ? (
        <div className="space-y-1.5">
          {/* Spellcheck Card Header (No pill, no little icon) */}
          <div className="px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-color)] tracking-wide">
            Spelling
          </div>

          {/* Suggestions List (No little icon) */}
          {spellingSuggestions.length > 0 && (
            <div className="space-y-1">
              {spellingSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySpelling(suggestion)}
                  className="w-full flex items-center px-3 py-2 rounded-xl bg-[var(--hover-bg)]/80 hover:bg-[var(--hover-bg)] border border-transparent hover:border-[var(--border-color)] text-[var(--text-color)] font-semibold text-xs transition-all duration-150 cursor-pointer text-left"
                >
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Spellcheck Actions (No little icons) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleAddToDict}
              className="flex items-center justify-center px-2 py-1.5 rounded-xl bg-[var(--hover-bg)]/60 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] text-[11px] font-medium transition-colors cursor-pointer border border-[var(--border-color)]/50 hover:border-[var(--border-color)]"
              title={`Add "${targetWord}" to custom dictionary`}
            >
              <span className="truncate">Add to Dict</span>
            </button>
            <button
              type="button"
              onClick={handleIgnore}
              className="flex items-center justify-center px-2 py-1.5 rounded-xl bg-[var(--hover-bg)]/60 hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] text-[11px] font-medium transition-colors cursor-pointer border border-[var(--border-color)]/50 hover:border-[var(--border-color)]"
              title={`Ignore "${targetWord}" for this session`}
            >
              <span>Ignore</span>
            </button>
          </div>

          <div className="h-px bg-[var(--border-color)]/70 my-1" />

          {/* Expandable "More options" Dropdown Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] text-[11px] font-medium transition-all duration-150 cursor-pointer border border-dashed border-[var(--border-color)]/70 hover:border-[var(--border-color)]"
              aria-expanded={isExpanded}
            >
              <span className="flex items-center gap-2">
                <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-color)]" />
                <span>{isExpanded ? 'Fewer options' : 'More options...'}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-[var(--text-color)]' : 'opacity-60'
                }`}
              />
            </button>
          </div>

          {/* Collapsible Regular Menu Body */}
          <div
            className={`transition-all duration-200 ease-in-out overflow-hidden ${
              isExpanded
                ? 'max-h-[600px] opacity-100 pt-1 border-t border-[var(--border-color)]/70'
                : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            {renderRegularItems()}
          </div>
        </div>
      ) : (
        /* CASE 2: Right clicked on regular text (no spelling error) */
        renderRegularItems()
      )}
    </div>
  );
};
