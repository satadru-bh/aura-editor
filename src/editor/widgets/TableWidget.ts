import { WidgetType, EditorView } from '@codemirror/view';

export class TableWidget extends WidgetType {
  constructor(readonly markdown: string) {
    super();
  }

  eq(other: TableWidget) {
    return other.markdown === this.markdown;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-table-widget-container my-3 overflow-x-auto select-none rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/50 shadow-2xs';

    const table = document.createElement('table');
    table.className = 'w-full text-left text-xs border-collapse';

    const rawLines = this.markdown
      .trim()
      .split('\n')
      .map((l) => l.replace(/^(\s*>\s*)+/, '').trim())
      .filter((l) => l.includes('|'));
    if (rawLines.length === 0) return wrap;

    const parseRow = (line: string) => {
      let trimmed = line;
      if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
      if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
      return trimmed.split('|').map((c) => c.trim());
    };

    // Header line
    const headerCols = parseRow(rawLines[0]);
    let alignments: ('left' | 'center' | 'right')[] = [];

    // Delimiter line (index 1 if exists)
    let dataStartIdx = 1;
    if (rawLines.length > 1 && (rawLines[1].includes('---') || rawLines[1].includes('-:-') || rawLines[1].includes(':--'))) {
      const delimCols = parseRow(rawLines[1]);
      alignments = delimCols.map((col) => {
        const c = col.trim();
        if (c.startsWith(':') && c.endsWith(':')) return 'center';
        if (c.endsWith(':')) return 'right';
        return 'left';
      });
      dataStartIdx = 2;
    }

    // THEAD
    const thead = document.createElement('thead');
    thead.className = 'bg-[var(--hover-bg)] border-b border-[var(--border-color)]';
    const trHead = document.createElement('tr');

    headerCols.forEach((colText, idx) => {
      const th = document.createElement('th');
      const align = alignments[idx] || 'left';
      th.style.textAlign = align;
      th.className = 'py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider text-[var(--muted-color)] border-r border-[var(--border-color)] last:border-r-0';
      th.innerHTML = this.renderCellContent(colText);
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    // TBODY
    const tbody = document.createElement('tbody');
    for (let i = dataStartIdx; i < rawLines.length; i++) {
      const rowCols = parseRow(rawLines[i]);
      const tr = document.createElement('tr');
      const isLast = i === rawLines.length - 1;
      const isZebra = (i - dataStartIdx) % 2 === 1;
      tr.className = `${isZebra ? 'bg-[var(--hover-bg)]/30 ' : ''}hover:bg-[var(--hover-bg)]/70 transition-colors ${!isLast ? 'border-b border-[var(--border-color)]' : ''}`;

      rowCols.forEach((colText, idx) => {
        const td = document.createElement('td');
        const align = alignments[idx] || 'left';
        td.style.textAlign = align;
        td.className = 'py-2.5 px-4 text-[var(--text-color)] leading-normal border-r border-[var(--border-color)] last:border-r-0';
        td.innerHTML = this.renderCellContent(colText);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    wrap.appendChild(table);
    return wrap;
  }

  private renderCellContent(text: string): string {
    let out = text;

    // Subscript & Superscript
    out = out.replace(/<sub>(.*?)<\/sub>/gi, '<sub class="text-[0.75em] align-sub font-mono">$1</sub>');
    out = out.replace(/<sup>(.*?)<\/sup>/gi, '<sup class="text-[0.75em] align-super font-mono">$1</sup>');

    // Keyboard caps: <kbd>...</kbd>
    out = out.replace(
      /<kbd>(.*?)<\/kbd>/gi,
      '<kbd class="font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-color)] shadow-xs font-semibold">$1</kbd>'
    );

    // Underline & Ins & Del
    out = out.replace(/<u>(.*?)<\/u>/gi, '<u class="underline underline-offset-2">$1</u>');
    out = out.replace(/<ins>(.*?)<\/ins>/gi, '<ins class="underline decoration-[var(--border-accent)] text-[var(--border-accent)]">$1</ins>');
    out = out.replace(/<del>(.*?)<\/del>/gi, '<del class="line-through opacity-60">$1</del>');
    out = out.replace(/~~([^~]+)~~/g, '<del class="line-through opacity-60">$1</del>');
    out = out.replace(/<small>(.*?)<\/small>/gi, '<small class="text-[0.82em] opacity-80">$1</small>');

    // Custom spans & pills: <span style="...">...</span>
    out = out.replace(/<span\s+style="([^"]*)">([\s\S]*?)<\/span>/gi, (_match, style, inner) => {
      return `<span style="${style}" class="px-1.5 py-0.5 rounded text-[11px] inline-block">${inner}</span>`;
    });

    // Bold: **...** and __...__
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text-color)]">$1</strong>');
    out = out.replace(/__([^_]+)__/g, '<strong class="font-bold text-[var(--text-color)]">$1</strong>');

    // Italic: *...* and _..._
    out = out.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    out = out.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

    // Inline code: `...`
    out = out.replace(
      /`([^`]+)`/g,
      '<code class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--code-inline-bg)] text-[var(--border-accent)] font-semibold">$1</code>'
    );

    // Highlight: ==...== and <mark>...</mark>
    out = out.replace(
      /==([^=]+)==/g,
      '<mark class="bg-[var(--selection-bg)] text-[var(--text-color)] px-1 py-0.5 rounded">$1</mark>'
    );
    out = out.replace(
      /<mark(?:\s+[^>]*)?>([\s\S]*?)<\/mark>/gi,
      '<mark class="bg-[var(--selection-bg)] text-[var(--text-color)] px-1 py-0.5 rounded">$1</mark>'
    );

    // Links: [Label](URL)
    out = out.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--border-accent)] hover:underline font-medium">$1</a>'
    );

    return out;
  }

  ignoreEvent() {
    return false;
  }
}
