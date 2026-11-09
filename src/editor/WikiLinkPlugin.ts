import { Extension, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export interface WikiLinkMatch {
  from: number;
  to: number;
  target: string;
  label: string;
}

export const WIKILINK_REGEX = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;

export function findWikiLinks(text: string, baseOffset: number = 0): WikiLinkMatch[] {
  const matches: WikiLinkMatch[] = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');

  while ((m = regex.exec(text)) !== null) {
    const rawTarget = m[1].trim();
    const rawLabel = m[2] ? m[2].trim() : rawTarget;
    matches.push({
      from: baseOffset + m.index,
      to: baseOffset + m.index + m[0].length,
      target: rawTarget,
      label: rawLabel,
    });
  }

  return matches;
}

export function buildWikiLinkDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  const ranges: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const text = doc.sliceString(from, to);
    const links = findWikiLinks(text, from);

    for (const link of links) {
      ranges.push(
        Decoration.mark({
          class: 'cm-wikilink group cursor-pointer inline-flex items-center text-[var(--accent-color,rgb(160,160,160))] hover:underline underline-offset-4 decoration-dotted font-medium',
          attributes: {
            'data-wikilink-target': link.target,
            'data-wikilink-label': link.label,
          },
        }).range(link.from, link.to)
      );
    }
  }

  return Decoration.set(ranges, true);
}

export function createWikiLinkPlugin(onOpenTarget?: (target: string) => void): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildWikiLinkDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildWikiLinkDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        click: (e, view) => {
          const target = (e.target as HTMLElement).closest('[data-wikilink-target]');
          if (target) {
            const noteTarget = target.getAttribute('data-wikilink-target');
            if (noteTarget && onOpenTarget) {
              e.preventDefault();
              e.stopPropagation();
              onOpenTarget(noteTarget);
              return true;
            }
          }
          return false;
        },
      },
    }
  );
}

export function createWikiLinkAutocompletion(getAvailableNotes: () => { name: string; path?: string }[]): Extension {
  const completionSource = (context: CompletionContext): CompletionResult | null => {
    // Check if cursor is directly following `[[`
    const match = context.matchBefore(/\[\[([^\]\n]*)$/);
    if (!match) return null;

    const query = match.text.slice(2).toLowerCase();
    const notes = getAvailableNotes();

    return {
      from: match.from + 2,
      options: notes
        .filter((n) => {
          const cleanName = n.name.replace(/\.(md|txt)$/i, '');
          return cleanName.toLowerCase().includes(query);
        })
        .map((n) => {
          const cleanName = n.name.replace(/\.(md|txt)$/i, '');
          return {
            label: cleanName,
            type: 'text',
            detail: n.path ? n.path.replace(/\\/g, '/') : 'Note',
            apply: `${cleanName}]]`,
          };
        }),
    };
  };

  return autocompletion({
    override: [completionSource],
    defaultKeymap: true,
  });
}
