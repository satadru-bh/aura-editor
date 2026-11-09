import { WidgetType, EditorView } from '@codemirror/view';

export type CalloutType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

export class CalloutWidget extends WidgetType {
  constructor(readonly type: CalloutType) {
    super();
  }

  eq(other: CalloutWidget) {
    return other.type === this.type;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-callout-badge inline-flex items-center gap-1.5 font-sans font-semibold text-xs py-0.5 px-2 rounded mb-1 select-none';

    let iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    let label = 'Note';
    let colorClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-300';

    if (this.type === 'TIP') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
      label = 'Tip';
      colorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    } else if (this.type === 'IMPORTANT') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'Important';
      colorClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
    } else if (this.type === 'WARNING') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      label = 'Warning';
      colorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    } else if (this.type === 'CAUTION') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'Caution';
      colorClass = 'bg-red-500/10 text-red-700 dark:text-red-300';
    }

    wrap.className += ` ${colorClass}`;
    wrap.innerHTML = `<span class="inline-flex items-center">${iconSvg}</span> <span>${label}</span>`;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
