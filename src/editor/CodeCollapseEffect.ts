import { StateEffect, StateField } from '@codemirror/state';

export const toggleCodeCollapseEffect = StateEffect.define<number>();

export const collapsedCodeBlocksField = StateField.define<Set<number>>({
  create() {
    return new Set<number>();
  },
  update(collapsedSet, tr) {
    let set = new Set(collapsedSet);
    for (const effect of tr.effects) {
      if (effect.is(toggleCodeCollapseEffect)) {
        const lineNum = effect.value;
        if (set.has(lineNum)) {
          set.delete(lineNum);
        } else {
          set.add(lineNum);
        }
      }
    }
    if (tr.docChanged) {
      const newSet = new Set<number>();
      for (const lineNum of set) {
        if (lineNum <= tr.startState.doc.lines) {
          const oldPos = tr.startState.doc.line(lineNum).from;
          const newPos = tr.changes.mapPos(oldPos);
          if (newPos <= tr.state.doc.length) {
            newSet.add(tr.state.doc.lineAt(newPos).number);
          }
        }
      }
      return newSet;
    }
    return set;
  },
});
