import { WidgetType, EditorView } from '@codemirror/view';

export class ProgressBarWidget extends WidgetType {
  constructor(
    readonly value: number,
    readonly max: number
  ) {
    super();
  }

  eq(other: ProgressBarWidget) {
    return other.value === this.value && other.max === this.max;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-progress-widget inline-flex items-center gap-2.5 align-middle my-1 select-none px-2.5 py-1 rounded-md bg-[var(--surface-color)]/70 border border-[var(--border-color)] text-[var(--text-color)]';

    const prog = document.createElement('progress');
    prog.value = this.value;
    prog.max = this.max;
    prog.className = 'w-36 h-2 rounded-full overflow-hidden accent-[var(--border-accent)] bg-black/10 dark:bg-white/10';

    const pct = Math.round((this.value / this.max) * 100);
    const label = document.createElement('span');
    label.className = 'text-xs font-mono text-[var(--text-color)] font-medium';
    label.textContent = `${pct}%`;

    wrap.appendChild(prog);
    wrap.appendChild(label);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class MeterWidget extends WidgetType {
  constructor(
    readonly value: number,
    readonly min: number = 0,
    readonly max: number = 100,
    readonly low?: number,
    readonly high?: number,
    readonly optimum?: number
  ) {
    super();
  }

  eq(other: MeterWidget) {
    return (
      other.value === this.value &&
      other.min === this.min &&
      other.max === this.max
    );
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-meter-widget inline-flex items-center gap-2.5 align-middle my-1 select-none px-2.5 py-1 rounded-md bg-[var(--surface-color)]/70 border border-[var(--border-color)] text-[var(--text-color)]';

    const meter = document.createElement('meter');
    meter.value = this.value;
    meter.min = this.min;
    meter.max = this.max;
    if (this.low !== undefined) meter.low = this.low;
    if (this.high !== undefined) meter.high = this.high;
    if (this.optimum !== undefined) meter.optimum = this.optimum;
    meter.className = 'w-32 h-2.5 rounded overflow-hidden accent-emerald-500';

    const label = document.createElement('span');
    label.className = 'text-xs font-mono text-[var(--text-color)] font-medium';
    label.textContent = `${this.value}/${this.max}`;

    wrap.appendChild(meter);
    wrap.appendChild(label);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class DefinitionListWidget extends WidgetType {
  constructor(readonly rawHtml: string) {
    super();
  }

  eq(other: DefinitionListWidget) {
    return other.rawHtml === this.rawHtml;
  }

  toDOM(_view: EditorView): HTMLElement {
    const dl = document.createElement('dl');
    dl.className = 'cm-dl-widget my-4 py-1 space-y-3.5 select-text';
    dl.innerHTML = this.rawHtml
      .replace(/<dl[^>]*>/gi, '')
      .replace(/<\/dl>/gi, '')
      .replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, (_m, content) => {
        return `<dt class="font-semibold text-[var(--text-color)] text-[14.5px] sm:text-[15.5px] tracking-tight flex items-center gap-2 mt-4 first:mt-0">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--border-accent)] opacity-85 inline-block flex-shrink-0"></span>
          <span>${content}</span>
        </dt>`;
      })
      .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (_m, content) => {
        return `<dd class="pl-3.5 ml-1 border-l-2 border-[var(--border-accent)] text-[var(--text-color)] opacity-90 text-[13.5px] sm:text-[14px] leading-relaxed my-1">
          ${content}
        </dd>`;
      });
    return dl;
  }

  ignoreEvent() {
    return false;
  }
}
