import { WidgetType, EditorView } from '@codemirror/view';

export class CalloutHeaderWidget extends WidgetType {
  constructor(readonly type: string) {
    super();
  }

  eq(other: CalloutHeaderWidget) {
    return other.type === this.type;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    const t = this.type.toUpperCase();

    let iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    let label = 'NOTE';
    let badgeCls = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';

    if (t === 'TIP') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
      label = 'TIP';
      badgeCls = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    } else if (t === 'IMPORTANT') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'IMPORTANT';
      badgeCls = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
    } else if (t === 'WARNING') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      label = 'WARNING';
      badgeCls = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    } else if (t === 'CAUTION') {
      iconSvg = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'CAUTION';
      badgeCls = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    }

    wrap.className = 'cm-callout-header inline-flex items-center gap-1.5 font-sans font-semibold text-xs my-0.5 select-none';
    wrap.innerHTML = `
      <span class="px-2 py-0.5 rounded-md border text-[10px] tracking-wider font-bold uppercase inline-flex items-center gap-1.5 ${badgeCls}">${iconSvg} ${label}</span>
    `;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
