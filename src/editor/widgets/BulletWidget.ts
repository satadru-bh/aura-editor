import { WidgetType, EditorView } from '@codemirror/view';

export class BulletWidget extends WidgetType {
  constructor(readonly level: number = 0) {
    super();
  }

  eq(other: BulletWidget) {
    return other.level === this.level;
  }

  toDOM(_view: EditorView): HTMLElement {
    const span = document.createElement('span');
    const symbols = ['•', '◦', '▪', '▫', '–'];
    const symbol = symbols[Math.min(this.level, symbols.length - 1)];
    span.className = 'cm-bullet text-amber-700/90 dark:text-amber-400/90 font-bold select-none mr-2 inline-block';
    span.textContent = symbol;
    return span;
  }

  ignoreEvent() {
    return false;
  }
}
