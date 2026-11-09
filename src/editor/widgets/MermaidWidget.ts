import { WidgetType, EditorView } from '@codemirror/view';
import mermaid from 'mermaid';

let mermaidInitialized = false;

function ensureMermaidInit() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, -apple-system, sans-serif',
    });
    mermaidInitialized = true;
  }
}

export class MermaidWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }

  eq(other: MermaidWidget) {
    return other.code === this.code;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-mermaid-container my-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 flex flex-col items-center justify-center overflow-x-auto select-none';

    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    const renderTarget = document.createElement('div');
    renderTarget.id = id;
    renderTarget.className = 'w-full flex justify-center';
    wrap.appendChild(renderTarget);

    try {
      ensureMermaidInit();
      const cleanCode = this.code.trim();
      mermaid.render(id + '-svg', cleanCode).then((res) => {
        renderTarget.innerHTML = res.svg;
      }).catch((err) => {
        console.warn('Mermaid render error:', err);
        renderTarget.innerHTML = `<div class="text-xs text-[var(--border-accent)] font-mono p-2">Diagram preview error. Click to edit syntax.</div>`;
      });
    } catch (e) {
      renderTarget.innerHTML = `<div class="text-xs text-[var(--muted-color)] font-mono p-2">Rendering diagram...</div>`;
    }

    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
