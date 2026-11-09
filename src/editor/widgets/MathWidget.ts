import { WidgetType, EditorView } from '@codemirror/view';
import katex from 'katex';

export class MathWidget extends WidgetType {
  constructor(
    readonly latex: string,
    readonly isBlock: boolean
  ) {
    super();
  }

  eq(other: MathWidget) {
    return other.latex === this.latex && other.isBlock === this.isBlock;
  }

  toDOM(_view: EditorView): HTMLElement {
    const span = document.createElement(this.isBlock ? 'div' : 'span');
    span.className = `cm-math-rendered ${
      this.isBlock
        ? 'block text-center my-4 py-2 px-3 overflow-x-auto select-none bg-black/[0.02] dark:bg-white/[0.02] rounded'
        : 'inline-block px-1 align-baseline select-none'
    }`;

    try {
      katex.render(this.latex.trim(), span, {
        displayMode: this.isBlock,
        throwOnError: false,
      });
    } catch (e) {
      span.textContent = this.latex;
      span.className += ' text-red-500 font-mono text-xs';
    }

    return span;
  }

  ignoreEvent() {
    return false;
  }
}
