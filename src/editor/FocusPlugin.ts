import { Range, Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

const activeParagraphDeco = Decoration.line({
  class: 'cm-line-focused-active',
});

function getActiveParagraphLines(view: EditorView): Set<number> {
  const doc = view.state.doc;
  const selection = view.state.selection;
  const activeLineNumbers = new Set<number>();
  const totalLines = doc.lines;

  for (const range of selection.ranges) {
    const mainLine = doc.lineAt(range.head);
    activeLineNumbers.add(mainLine.number);

    // Case 1: Cursor is on a non-empty line
    if (mainLine.text.trim().length > 0) {
      // Check if cursor is inside a fenced code block
      let fenceStart = -1;
      for (let l = mainLine.number; l >= 1; l--) {
        const text = doc.line(l).text.trim();
        if (text.startsWith('```') || text.startsWith('~~~')) {
          fenceStart = l;
          break;
        }
      }

      let isInsideFence = false;
      if (fenceStart !== -1) {
        let fenceEnd = -1;
        for (let l = mainLine.number; l <= totalLines; l++) {
          if (l === fenceStart) continue;
          const text = doc.line(l).text.trim();
          if (text.startsWith('```') || text.startsWith('~~~')) {
            fenceEnd = l;
            break;
          }
        }
        if (fenceEnd !== -1 && fenceStart <= mainLine.number && mainLine.number <= fenceEnd) {
          isInsideFence = true;
          for (let l = fenceStart; l <= fenceEnd; l++) {
            activeLineNumbers.add(l);
          }
        }
      }

      if (!isInsideFence) {
        // Scan upwards for contiguous non-empty lines
        for (let l = mainLine.number - 1; l >= 1; l--) {
          if (doc.line(l).text.trim().length === 0) break;
          activeLineNumbers.add(l);
        }
        // Scan downwards for contiguous non-empty lines
        for (let l = mainLine.number + 1; l <= totalLines; l++) {
          if (doc.line(l).text.trim().length === 0) break;
          activeLineNumbers.add(l);
        }
      }
    } else {
      // Case 2: Cursor is on an EMPTY line.
      // Keep the nearest adjacent paragraph illuminated so the screen never plunges into darkness.
      let prevNonEmpty = -1;
      for (let l = mainLine.number - 1; l >= 1; l--) {
        if (doc.line(l).text.trim().length > 0) {
          prevNonEmpty = l;
          break;
        }
      }

      if (prevNonEmpty !== -1) {
        activeLineNumbers.add(prevNonEmpty);
        for (let l = prevNonEmpty - 1; l >= 1; l--) {
          if (doc.line(l).text.trim().length === 0) break;
          activeLineNumbers.add(l);
        }
      } else {
        // If at top of document, illuminate following paragraph
        let nextNonEmpty = -1;
        for (let l = mainLine.number + 1; l <= totalLines; l++) {
          if (doc.line(l).text.trim().length > 0) {
            nextNonEmpty = l;
            break;
          }
        }
        if (nextNonEmpty !== -1) {
          activeLineNumbers.add(nextNonEmpty);
          for (let l = nextNonEmpty + 1; l <= totalLines; l++) {
            if (doc.line(l).text.trim().length === 0) break;
            activeLineNumbers.add(l);
          }
        }
      }
    }
  }

  return activeLineNumbers;
}

function buildFocusDecorations(view: EditorView, activeLines: Set<number>): DecorationSet {
  const doc = view.state.doc;
  const sortedLines = Array.from(activeLines).sort((a, b) => a - b);
  const ranges: Range<Decoration>[] = [];

  for (const lineNum of sortedLines) {
    if (lineNum >= 1 && lineNum <= doc.lines) {
      const line = doc.line(lineNum);
      ranges.push(activeParagraphDeco.range(line.from));
    }
  }

  return Decoration.set(ranges, true);
}

export function createFocusModePlugin(enabled: boolean): Extension {
  if (!enabled) return [];

  const focusPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      view: EditorView;
      activeLineKey: string;

      constructor(view: EditorView) {
        this.view = view;
        view.dom.classList.add('cm-focus-mode');
        const activeLines = getActiveParagraphLines(view);
        this.activeLineKey = Array.from(activeLines).sort((a, b) => a - b).join(',');
        this.decorations = buildFocusDecorations(view, activeLines);
      }

      update(update: ViewUpdate) {
        // Only re-evaluate when selection or document changes
        // Omit viewportChanged to ensure 60/120fps scrolling without decoration churn
        if (update.selectionSet || update.docChanged) {
          const activeLines = getActiveParagraphLines(update.view);
          const sorted = Array.from(activeLines).sort((a, b) => a - b);
          const newKey = sorted.join(',');

          // Skip rebuilding if active line set is identical and doc wasn't modified
          if (!update.docChanged && newKey === this.activeLineKey) {
            return;
          }

          this.activeLineKey = newKey;
          this.decorations = buildFocusDecorations(update.view, activeLines);
        }
      }

      destroy() {
        this.view.dom.classList.remove('cm-focus-mode');
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

  return [focusPlugin];
}
