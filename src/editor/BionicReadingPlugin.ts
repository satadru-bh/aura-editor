import { Extension, Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

export function calculateFixationLength(wordLength: number): number {
  if (wordLength <= 1) return 1;
  if (wordLength <= 3) return 1;
  if (wordLength <= 5) return 2;
  return Math.ceil(wordLength * 0.45);
}

const bionicMark = Decoration.mark({ class: 'cm-bionic-fixation' });

export function buildBionicDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  const ranges: Range<Decoration>[] = [];

  // Iterate visible ranges for 60/120fps performance
  for (const { from, to } of view.visibleRanges) {
    const startLine = doc.lineAt(from).number;
    const endLine = doc.lineAt(to).number;

    let inCodeFence = false;

    for (let l = 1; l <= endLine; l++) {
      const line = doc.line(l);
      const text = line.text;
      const trimmed = text.trim();

      if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
        inCodeFence = !inCodeFence;
        continue;
      }

      if (l < startLine || inCodeFence) continue;
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) continue; // Skip tables

      // Match words while skipping markdown syntax markers and urls
      const wordRegex = /\b[A-Za-z\u00C0-\u024F]{2,}\b/g;
      let match: RegExpExecArray | null;

      while ((match = wordRegex.exec(text)) !== null) {
        const word = match[0];
        const wordStart = line.from + match.index;
        const fixationLen = calculateFixationLength(word.length);
        const fixationEnd = wordStart + fixationLen;

        // Skip if inside a url
        const prevText = text.slice(Math.max(0, match.index - 8), match.index);
        if (prevText.includes('http://') || prevText.includes('https://') || prevText.includes('file:///')) {
          continue;
        }

        ranges.push(bionicMark.range(wordStart, fixationEnd));
      }
    }
  }

  return Decoration.set(ranges, true);
}

export function createBionicReadingPlugin(enabled: boolean): Extension {
  if (!enabled) return [];

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildBionicDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildBionicDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

