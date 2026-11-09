import { WidgetType, EditorView } from '@codemirror/view';
import { toggleCodeCollapseEffect } from '../CodeCollapseEffect';

const LANG_MAP: Record<string, { label: string }> = {
  c: { label: 'C' },
  cpp: { label: 'C++' },
  'c++': { label: 'C++' },
  cs: { label: 'C#' },
  csharp: { label: 'C#' },
  js: { label: 'JavaScript' },
  javascript: { label: 'JavaScript' },
  ts: { label: 'TypeScript' },
  typescript: { label: 'TypeScript' },
  jsx: { label: 'JSX' },
  tsx: { label: 'TSX' },
  py: { label: 'Python' },
  python: { label: 'Python' },
  rs: { label: 'Rust' },
  rust: { label: 'Rust' },
  go: { label: 'Go' },
  golang: { label: 'Go' },
  java: { label: 'Java' },
  kt: { label: 'Kotlin' },
  kotlin: { label: 'Kotlin' },
  rb: { label: 'Ruby' },
  ruby: { label: 'Ruby' },
  php: { label: 'PHP' },
  html: { label: 'HTML' },
  css: { label: 'CSS' },
  scss: { label: 'SCSS' },
  json: { label: 'JSON' },
  yaml: { label: 'YAML' },
  yml: { label: 'YAML' },
  md: { label: 'Markdown' },
  markdown: { label: 'Markdown' },
  sql: { label: 'SQL' },
  sh: { label: 'Bash' },
  bash: { label: 'Bash' },
  shell: { label: 'Shell' },
  zsh: { label: 'Zsh' },
  powershell: { label: 'PowerShell' },
  ps1: { label: 'PowerShell' },
  swift: { label: 'Swift' },
  lua: { label: 'Lua' },
  r: { label: 'R' },
  dart: { label: 'Dart' },
  docker: { label: 'Dockerfile' },
  dockerfile: { label: 'Dockerfile' },
  xml: { label: 'XML' },
  toml: { label: 'TOML' },
  graphql: { label: 'GraphQL' },
};

export class CodeBlockHeaderWidget extends WidgetType {
  constructor(
    readonly language: string,
    readonly codeContent: string,
    readonly quoteDepth: number = 0,
    readonly isCollapsed: boolean = false,
    readonly lineCount: number = 0,
    readonly startLine?: number,
    readonly onToggleCollapse?: () => void
  ) {
    super();
  }

  eq(other: CodeBlockHeaderWidget) {
    return (
      other.language === this.language &&
      other.codeContent === this.codeContent &&
      other.quoteDepth === this.quoteDepth &&
      other.isCollapsed === this.isCollapsed &&
      other.lineCount === this.lineCount &&
      other.startLine === this.startLine
    );
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = `cm-code-block-header flex items-center justify-between px-3 py-1.5 bg-[var(--hover-bg)]/40 border-b border-[var(--border-color)] select-none text-[11px] rounded-t-[7px] transition-colors ${
      this.isCollapsed ? 'rounded-b-[7px] border-b-transparent hover:bg-[var(--hover-bg)] cursor-pointer' : ''
    }`;

    if (this.quoteDepth === 1) {
      wrap.style.marginLeft = '15px';
    } else if (this.quoteDepth === 2) {
      wrap.style.marginLeft = '25px';
    } else if (this.quoteDepth >= 3) {
      wrap.style.marginLeft = `${15 + this.quoteDepth * 10}px`;
    }

    const rawLang = (this.language || '').trim().toLowerCase();
    const langInfo = LANG_MAP[rawLang];
    const displayLabel = langInfo?.label || (rawLang ? rawLang.toUpperCase() : 'CODE');

    // Left side: collapse button + code icon + language name + optional line count
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center gap-1.5';

    // Collapse / Expand toggle button
    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.title = this.isCollapsed ? 'Expand code block' : 'Collapse code block';
    collapseBtn.className =
      'p-0.5 rounded hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] active:scale-90 transition-all duration-150 cursor-pointer flex items-center justify-center';
    collapseBtn.innerHTML = `<svg class="w-3.5 h-3.5 transition-transform duration-200 ease-out ${
      this.isCollapsed ? '-rotate-90' : 'rotate-0'
    }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const handleToggle = () => {
      if (this.onToggleCollapse) {
        this.onToggleCollapse();
      } else if (_view && this.startLine !== undefined) {
        _view.dispatch({
          effects: toggleCodeCollapseEffect.of(this.startLine),
        });
      }
    };

    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleToggle();
    });
    leftSide.appendChild(collapseBtn);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'flex items-center justify-center text-[var(--muted-color)] opacity-80';
    iconSpan.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    leftSide.appendChild(iconSpan);

    const langSpan = document.createElement('span');
    langSpan.className =
      'font-mono font-semibold tracking-wider text-[10.5px] uppercase text-[var(--text-color)]';
    langSpan.textContent = displayLabel;
    leftSide.appendChild(langSpan);

    if (this.isCollapsed && this.lineCount > 0) {
      const linesSpan = document.createElement('span');
      linesSpan.className =
        'font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--muted-color)] font-normal border border-[var(--border-color)]';
      linesSpan.textContent = `${this.lineCount} lines`;
      leftSide.appendChild(linesSpan);
    }

    // Right side: copy button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className =
      'flex items-center gap-1.5 text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] active:scale-95 transition-all text-[11px] px-2 py-0.5 rounded-md font-sans font-medium cursor-pointer';

    const copyIconSvg = `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIconSvg = `<svg class="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    copyBtn.innerHTML = `${copyIconSvg}<span>Copy</span>`;

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      navigator.clipboard.writeText(this.codeContent.trim());
      copyBtn.innerHTML = `${checkIconSvg}<span class="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>`;
      copyBtn.classList.add('bg-emerald-500/10');
      setTimeout(() => {
        copyBtn.innerHTML = `${copyIconSvg}<span>Copy</span>`;
        copyBtn.classList.remove('bg-emerald-500/10');
      }, 2000);
    });

    if (this.isCollapsed) {
      wrap.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        handleToggle();
      });
    }

    wrap.appendChild(leftSide);
    wrap.appendChild(copyBtn);
    return wrap;
  }

  ignoreEvent() {
    return true;
  }
}
