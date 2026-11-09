import React, { useEffect, useState, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Heading1,
  Heading2,
  Quote,
  List,
  CheckSquare,
} from 'lucide-react';

interface FloatingToolbarProps {
  view: EditorView | null;
}

interface ToolbarPosition {
  x: number;
  y: number;
  visible: boolean;
  selectedText: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ view }) => {
  const [pos, setPos] = useState<ToolbarPosition>({
    x: 0,
    y: 0,
    visible: false,
    selectedText: '',
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!view) return;

    const handleSelection = () => {
      const selection = view.state.selection.main;
      if (selection.empty) {
        setPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const text = view.state.sliceDoc(selection.from, selection.to);
      if (!text.trim()) {
        setPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Measure coords
      const startCoords = view.coordsAtPos(selection.from);
      const endCoords = view.coordsAtPos(selection.to);

      if (!startCoords || !endCoords) {
        setPos((prev) => ({ ...prev, visible: false }));
        return;
      }

      const left = Math.min(startCoords.left, endCoords.left) + Math.abs(endCoords.right - startCoords.left) / 2;
      const top = Math.min(startCoords.top, endCoords.top) - 46;

      setPos({
        x: Math.max(16, left),
        y: Math.max(16, top),
        visible: true,
        selectedText: text,
      });
    };

    const dom = view.dom;
    dom.addEventListener('mouseup', handleSelection);
    dom.addEventListener('keyup', handleSelection);
    window.addEventListener('scroll', handleSelection, true);

    return () => {
      dom.removeEventListener('mouseup', handleSelection);
      dom.removeEventListener('keyup', handleSelection);
      window.removeEventListener('scroll', handleSelection, true);
    };
  }, [view]);

  if (!pos.visible || !view) return null;

  const wrapSelection = (before: string, after: string = before) => {
    const selection = view.state.selection.main;
    const text = view.state.sliceDoc(selection.from, selection.to);

    // If already wrapped, unwrap
    if (text.startsWith(before) && text.endsWith(after)) {
      const unwrapped = text.slice(before.length, text.length - after.length);
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: unwrapped },
        selection: { anchor: selection.from, head: selection.from + unwrapped.length },
      });
    } else {
      const wrapped = `${before}${text}${after}`;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: wrapped },
        selection: { anchor: selection.from + before.length, head: selection.from + before.length + text.length },
      });
    }
    view.focus();
  };

  const toggleLinePrefix = (prefix: string) => {
    const selection = view.state.selection.main;
    const fromLine = view.state.doc.lineAt(selection.from);
    const toLine = view.state.doc.lineAt(selection.to);

    const changes = [];
    for (let l = fromLine.number; l <= toLine.number; l++) {
      const line = view.state.doc.line(l);
      if (line.text.startsWith(prefix)) {
        changes.push({ from: line.from, to: line.from + prefix.length, insert: '' });
      } else {
        changes.push({ from: line.from, to: line.from, insert: prefix });
      }
    }

    view.dispatch({ changes });
    view.focus();
  };

  const insertLink = () => {
    const selection = view.state.selection.main;
    const text = view.state.sliceDoc(selection.from, selection.to);
    const url = prompt('Enter link URL:', 'https://');
    if (!url) return;

    const linkMarkdown = `[${text || 'Link'}](${url})`;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: linkMarkdown },
      selection: { anchor: selection.from, head: selection.from + linkMarkdown.length },
    });
    view.focus();
  };

  const wordCount = pos.selectedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = pos.selectedText.length;

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translateX(-50%)',
      }}
      className="fixed z-50 flex items-center gap-0.5 p-1 rounded-xl bg-[var(--surface-color)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-2xl text-[var(--text-color)] animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => wrapSelection('**')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I)"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => wrapSelection('*')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Strikethrough"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => wrapSelection('~~')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Inline Code"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => wrapSelection('`')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Highlight"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => wrapSelection('==')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Hyperlink"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={insertLink}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Link className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3.5 bg-[var(--border-color)] mx-1" />

      <button
        type="button"
        title="Heading 1"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => toggleLinePrefix('# ')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Heading 2"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => toggleLinePrefix('## ')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Quote"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => toggleLinePrefix('> ')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Bullet List"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => toggleLinePrefix('- ')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Task Item"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => toggleLinePrefix('- [ ] ')}
        className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3.5 bg-[var(--border-color)] mx-1" />

      <span className="text-[10px] font-mono text-[var(--muted-color)] px-1.5 py-0.5 select-none font-medium">
        {wordCount}w • {charCount}c
      </span>
    </div>
  );
};
