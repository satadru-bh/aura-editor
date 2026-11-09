import { EditorView, KeyBinding } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { undo, redo } from '@codemirror/commands';

// Helper function to wrap or unwrap selection with markdown markers
export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state, dispatch } = view;
  const changes = state.changeByRange((range) => {
    const from = range.from;
    const to = range.to;
    const text = state.sliceDoc(from, to);
    const markerLen = marker.length;

    // Check if current selection is already wrapped by marker
    const before = state.sliceDoc(Math.max(0, from - markerLen), from);
    const after = state.sliceDoc(to, Math.min(state.doc.length, to + markerLen));

    if (before === marker && after === marker) {
      // Unwrap outer markers
      return {
        changes: [
          { from: from - markerLen, to: from, insert: '' },
          { from: to, to: to + markerLen, insert: '' },
        ],
        range: EditorSelection.range(from - markerLen, to - markerLen),
      };
    } else if (text.startsWith(marker) && text.endsWith(marker) && text.length >= markerLen * 2) {
      // Unwrap inner markers
      const innerText = text.slice(markerLen, text.length - markerLen);
      return {
        changes: { from, to, insert: innerText },
        range: EditorSelection.range(from, from + innerText.length),
      };
    } else {
      // Wrap with marker
      const wrappedText = `${marker}${text}${marker}`;
      return {
        changes: { from, to, insert: wrappedText },
        range: EditorSelection.range(
          from + markerLen,
          from + markerLen + text.length
        ),
      };
    }
  });

  dispatch(changes);
  return true;
}

// Toggle line prefix like `> ` or `- [ ] ` or `# `
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state, dispatch } = view;
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    if (line.text.startsWith(prefix)) {
      return {
        changes: { from: line.from, to: line.from + prefix.length, insert: '' },
        range: EditorSelection.range(
          Math.max(line.from, range.from - prefix.length),
          Math.max(line.from, range.to - prefix.length)
        ),
      };
    } else {
      return {
        changes: { from: line.from, to: line.from, insert: prefix },
        range: EditorSelection.range(
          range.from + prefix.length,
          range.to + prefix.length
        ),
      };
    }
  });

  dispatch(changes);
  return true;
}

export function createEditorKeybindings(): KeyBinding[] {
  return [
    {
      key: 'Mod-b',
      run: (view) => toggleWrap(view, '**'),
    },
    {
      key: 'Mod-i',
      run: (view) => toggleWrap(view, '*'),
    },
    {
      key: 'Mod-e',
      run: (view) => toggleWrap(view, '`'),
    },
    {
      key: 'Mod-Shift-x',
      run: (view) => toggleWrap(view, '~~'),
    },
    {
      key: 'Mod-Shift-c',
      run: (view) => toggleLinePrefix(view, '- [ ] '),
    },
    {
      key: 'Mod-z',
      run: undo,
    },
    {
      key: 'Mod-y',
      run: redo,
    },
    {
      key: 'Mod-Shift-z',
      run: redo,
    },
  ];
}
