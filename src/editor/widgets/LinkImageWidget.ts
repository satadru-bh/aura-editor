import { WidgetType, EditorView } from '@codemirror/view';
import { assetManager } from '../../services/AssetManagerService';

export class LinkImageWidget extends WidgetType {
  constructor(
    readonly alt: string,
    readonly src: string,
    readonly href: string
  ) {
    super();
  }

  eq(other: LinkImageWidget) {
    return other.alt === this.alt && other.src === this.src && other.href === this.href;
  }

  toDOM(_view: EditorView): HTMLElement {
    const a = document.createElement('a');
    a.href = this.href || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'cm-badge-link inline-block align-middle mr-1.5 my-1 transition-transform hover:scale-105 select-none';

    const img = document.createElement('img');
    img.alt = this.alt || 'Badge';
    img.src = this.src;
    img.className = 'inline-block max-h-6 rounded object-contain shadow-xs';
    img.loading = 'lazy';

    if (!this.src.startsWith('http://') && !this.src.startsWith('https://') && !this.src.startsWith('data:') && !this.src.startsWith('blob:') && !this.src.startsWith('file:///')) {
      assetManager.resolveImageSrc(this.src).then((resolved) => {
        if (resolved && resolved !== this.src) {
          img.src = resolved;
        }
      });
    }

    img.onerror = () => {
      a.textContent = `[${this.alt || 'Badge'}]`;
      a.className = 'text-xs text-blue-500 underline inline-block';
    };

    a.appendChild(img);
    return a;
  }

  ignoreEvent() {
    return false;
  }
}
