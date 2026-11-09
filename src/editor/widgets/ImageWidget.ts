import { WidgetType, EditorView } from '@codemirror/view';
import { assetManager } from '../../services/AssetManagerService';

export class ImageWidget extends WidgetType {
  constructor(
    readonly alt: string,
    readonly src: string
  ) {
    super();
  }

  eq(other: ImageWidget) {
    return other.alt === this.alt && other.src === this.src;
  }

  toDOM(_view: EditorView): HTMLElement {
    const isBadge = this.src.includes('shields.io') || this.src.includes('badge') || this.src.endsWith('.svg');

    if (isBadge) {
      const img = document.createElement('img');
      img.alt = this.alt || 'Badge';
      img.src = this.src;
      img.className = 'inline-block align-middle mr-1.5 my-1 max-h-6 rounded select-none';
      img.loading = 'lazy';

      if (!this.src.startsWith('http://') && !this.src.startsWith('https://') && !this.src.startsWith('data:') && !this.src.startsWith('blob:') && !this.src.startsWith('file:///')) {
        assetManager.resolveImageSrc(this.src).then((resolved) => {
          if (resolved && resolved !== this.src) {
            img.src = resolved;
          }
        });
      }

      return img;
    }

    const wrap = document.createElement('div');
    wrap.className = 'cm-image-widget my-3 select-none inline-block max-w-full';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'relative group rounded overflow-hidden border border-[var(--border-color)] bg-[var(--hover-bg)]/20 inline-block max-w-full';

    const img = document.createElement('img');
    img.alt = this.alt || 'Markdown Image';
    img.src = this.src;
    img.className = 'block max-h-96 max-w-full object-contain rounded transition-opacity duration-200';
    img.loading = 'lazy';

    if (!this.src.startsWith('http://') && !this.src.startsWith('https://') && !this.src.startsWith('data:') && !this.src.startsWith('blob:') && !this.src.startsWith('file:///')) {
      assetManager.resolveImageSrc(this.src).then((resolved) => {
        if (resolved && resolved !== this.src) {
          img.src = resolved;
        }
      });
    }

    imgContainer.appendChild(img);
    wrap.appendChild(imgContainer);

    if (this.alt && this.alt.trim().length > 0 && !isBadge) {
      const caption = document.createElement('div');
      caption.className = 'text-center text-xs text-[var(--muted-color)] mt-1 font-serif italic';
      caption.textContent = this.alt;
      wrap.appendChild(caption);
    }

    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
