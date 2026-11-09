import { WidgetType, EditorView } from '@codemirror/view';

export class CalloutHeaderWidget extends WidgetType {
  constructor(
    readonly type: string,
    readonly customTitle?: string
  ) {
    super();
  }

  eq(other: CalloutHeaderWidget) {
    return other.type === this.type && other.customTitle === this.customTitle;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    const t = this.type.toUpperCase();

    // Elegant minimal icons (Feather/Lucide style, 12x12)
    let iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    let label = t;

    if (t === 'TIP' || t === 'HINT') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
      label = 'TIP';
    } else if (t === 'IMPORTANT') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'IMPORTANT';
    } else if (t === 'WARNING') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      label = 'WARNING';
    } else if (t === 'CAUTION' || t === 'DANGER' || t === 'CRITICAL') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      label = 'CAUTION';
    } else if (t === 'QUOTE' || t === 'CITE') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>';
      label = 'QUOTE';
    } else if (t === 'ABSTRACT' || t === 'SUMMARY' || t === 'TLDR') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>';
      label = 'SUMMARY';
    } else if (t === 'SUCCESS' || t === 'DONE' || t === 'CHECK') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      label = 'SUCCESS';
    } else if (t === 'QUESTION' || t === 'FAQ' || t === 'HELP') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      label = 'QUESTION';
    } else if (t === 'BUG') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>';
      label = 'BUG';
    } else if (t === 'EXAMPLE') {
      iconSvg = '<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
      label = 'EXAMPLE';
    }

    wrap.className = 'cm-callout-header inline-flex items-center gap-2 font-sans text-xs my-0.5 select-none align-middle';

    const titleHtml = this.customTitle
      ? `<span class="font-medium text-[var(--editor-fg)] opacity-90 text-[11px] tracking-normal">${this.customTitle}</span>`
      : '';

    wrap.innerHTML = `
      <span class="px-2 py-0.5 rounded border border-[var(--border-color)] bg-[var(--hover-bg)]/50 text-[var(--editor-fg)] opacity-85 text-[10px] tracking-widest font-mono font-medium uppercase inline-flex items-center gap-1.5 shadow-2xs">${iconSvg} ${label}</span>${titleHtml}
    `;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
