import { WidgetType, EditorView } from '@codemirror/view';

export class HorizontalRuleWidget extends WidgetType {
  eq(_other: HorizontalRuleWidget) {
    return true;
  }

  toDOM(_view: EditorView): HTMLElement {
    const hr = document.createElement('div');
    hr.className = 'cm-hr-rendered border-0 border-t border-[var(--border-color)] select-none opacity-60';
    return hr;
  }

  ignoreEvent() {
    return false;
  }
}
