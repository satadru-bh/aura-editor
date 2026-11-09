import { WidgetType, EditorView } from '@codemirror/view';

export class DetailsWidget extends WidgetType {
  constructor(
    readonly summary: string,
    readonly content: string
  ) {
    super();
  }

  eq(other: DetailsWidget) {
    return other.summary === this.summary && other.content === this.content;
  }

  toDOM(_view: EditorView): HTMLElement {
    const details = document.createElement('details');
    details.className = 'cm-details-widget my-3.5 p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)]/50 text-[14px] leading-relaxed transition-colors select-text group';

    const summary = document.createElement('summary');
    summary.className = 'font-semibold text-[var(--text-color)] cursor-pointer select-none outline-none hover:text-[var(--border-accent)] transition-colors py-0.5 flex items-center gap-2';
    summary.innerHTML = this.summary || 'Details';

    const body = document.createElement('div');
    body.className = 'pt-2.5 mt-2 border-t border-[var(--border-color)] text-[var(--text-color)] opacity-90 leading-relaxed';
    body.innerHTML = this.content;

    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }

  ignoreEvent() {
    return false;
  }
}
