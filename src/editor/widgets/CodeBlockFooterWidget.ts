import { WidgetType, EditorView } from '@codemirror/view';

export class CodeBlockFooterWidget extends WidgetType {
  eq(_other: CodeBlockFooterWidget) {
    return true;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-code-block-footer h-2.5 bg-[var(--hover-bg)]/30 border-b border-x border-[var(--border-color)] rounded-b-lg mb-4 select-none';
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
