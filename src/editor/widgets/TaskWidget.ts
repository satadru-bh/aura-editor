import { WidgetType, EditorView } from '@codemirror/view';

export class TaskWidget extends WidgetType {
  constructor(
    readonly isChecked: boolean,
    readonly pos: number
  ) {
    super();
  }

  eq(other: TaskWidget) {
    return other.isChecked === this.isChecked && other.pos === this.pos;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-task-checkbox-wrap inline-flex items-center justify-center align-middle mr-2 cursor-pointer select-none';

    const box = document.createElement('button');
    box.type = 'button';
    box.setAttribute('aria-label', this.isChecked ? 'Mark incomplete' : 'Mark complete');

    if (this.isChecked) {
      box.className =
        'w-4 h-4 rounded-[5px] bg-[var(--border-accent)] border border-[var(--border-accent)] text-white flex items-center justify-center shadow-xs hover:opacity-90 transition-all duration-150 transform active:scale-90';
      box.innerHTML = `
        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
    } else {
      box.className =
        'w-4 h-4 rounded-[5px] border border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--border-accent)] hover:bg-[var(--hover-bg)] flex items-center justify-center transition-all duration-150 transform active:scale-90';
    }

    box.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    box.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newText = this.isChecked ? '[ ]' : '[x]';
      view.dispatch({
        changes: {
          from: this.pos,
          to: this.pos + 3,
          insert: newText,
        },
      });
    });

    wrap.appendChild(box);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
