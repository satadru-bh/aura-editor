import { marked, MarkedExtension } from 'marked';
import katex from 'katex';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { FileItem, EditorSettings } from '../types';
import { calculateDocumentStats, extractDocumentOutline } from '../utils/markdownStats';

export class ImportExportService {
  private static markedConfigured = false;
  private static mermaidConfigured = false;

  private static setupMarked(): void {
    if (this.markedConfigured) return;

    // 1. Math Extension (Block $$...$$ and Inline $...$)
    const mathExtension: MarkedExtension = {
      extensions: [
        {
          name: 'blockMath',
          level: 'block',
          start(src: string) {
            return src.indexOf('$$');
          },
          tokenizer(src: string) {
            const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
            if (match) {
              return {
                type: 'blockMath',
                raw: match[0],
                text: match[1].trim(),
              };
            }
            return undefined;
          },
          renderer(token: any) {
            try {
              const rendered = katex.renderToString(token.text, {
                displayMode: true,
                throwOnError: false,
              });
              return `<div class="math-block">${rendered}</div>\n`;
            } catch {
              return `<div class="math-block"><code>${token.text}</code></div>\n`;
            }
          },
        },
        {
          name: 'inlineMath',
          level: 'inline',
          start(src: string) {
            return src.indexOf('$');
          },
          tokenizer(src: string) {
            const match = /^\$([^\$\n]+?)\$/.exec(src);
            if (match) {
              return {
                type: 'inlineMath',
                raw: match[0],
                text: match[1].trim(),
              };
            }
            return undefined;
          },
          renderer(token: any) {
            try {
              const rendered = katex.renderToString(token.text, {
                displayMode: false,
                throwOnError: false,
              });
              return `<span class="math-inline">${rendered}</span>`;
            } catch {
              return `<code class="math-inline">${token.text}</code>`;
            }
          },
        },
      ],
    };

    // 2. Callout Alert Boxes Extension (> [!NOTE], > [!TIP], etc.)
    const calloutExtension: MarkedExtension = {
      extensions: [
        {
          name: 'callout',
          level: 'block',
          start(src: string) {
            const match = src.match(/(?:^|\n)>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
            return match ? match.index! + (match[0].startsWith('\n') ? 1 : 0) : undefined;
          },
          tokenizer(src: string) {
            const match = /^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*([^\n]*)(?:\n|$)(?:>[ \t]*[^\n]*(?:\n|$))*/i.exec(src);
            if (match && match.index === 0) {
              const type = match[1].toUpperCase();
              const customTitle = match[2]?.trim() || '';
              const raw = match[0];
              const lines = raw.split(/\r?\n/);
              const bodyLines = lines.slice(1).map((l) => l.replace(/^>[ \t]?/, '')).join('\n');
              return {
                type: 'callout',
                raw,
                calloutType: type,
                title: customTitle || type,
                text: bodyLines.trim(),
              };
            }
            return undefined;
          },
          renderer(token: any) {
            const type = token.calloutType.toUpperCase();
            const typeClass = type.toLowerCase();
            const innerHtml = token.text ? (marked.parse(token.text) as string) : '';

            let iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
            if (type === 'TIP') {
              iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
            } else if (type === 'IMPORTANT') {
              iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
            } else if (type === 'WARNING') {
              iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            } else if (type === 'CAUTION') {
              iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
            }

            const titleText = ImportExportService.escapeHtml(token.title);
            return `<div class="callout callout-${typeClass}"><div class="callout-header"><span class="callout-badge">${iconSvg} <span>${titleText}</span></span></div>${innerHtml ? `<div class="callout-body">${innerHtml}</div>` : ''}</div>\n`;
          },
        },
      ],
    };

    // 3. Highlight Mark Extension (==text==)
    const highlightExtension: MarkedExtension = {
      extensions: [
        {
          name: 'highlightMark',
          level: 'inline',
          start(src: string) {
            return src.indexOf('==');
          },
          tokenizer(src: string) {
            const match = /^==([^=\n]+?)==/.exec(src);
            if (match) {
              return {
                type: 'highlightMark',
                raw: match[0],
                text: match[1],
              };
            }
            return undefined;
          },
          renderer(token: any) {
            return `<mark>${token.text}</mark>`;
          },
        },
      ],
    };

    // 4. Subscript Extension (~text~) - safely ignores ~~strikethrough~~
    const subscriptExtension: MarkedExtension = {
      extensions: [
        {
          name: 'subscript',
          level: 'inline',
          start(src: string) {
            return src.indexOf('~');
          },
          tokenizer(src: string) {
            if (src.startsWith('~~')) return undefined;
            const match = /^~([^~\r\n\s]+?)~/.exec(src);
            if (match) {
              return {
                type: 'subscript',
                raw: match[0],
                text: match[1],
              };
            }
            return undefined;
          },
          renderer(token: any) {
            return `<sub>${token.text}</sub>`;
          },
        },
      ],
    };

    // 5. Superscript Extension (^text^)
    const superscriptExtension: MarkedExtension = {
      extensions: [
        {
          name: 'superscript',
          level: 'inline',
          start(src: string) {
            return src.indexOf('^');
          },
          tokenizer(src: string) {
            const match = /^\^([^\^\r\n\s]+?)\^/.exec(src);
            if (match) {
              return {
                type: 'superscript',
                raw: match[0],
                text: match[1],
              };
            }
            return undefined;
          },
          renderer(token: any) {
            return `<sup>${token.text}</sup>`;
          },
        },
      ],
    };

    // Configure marked with extensions and code syntax highlighting
    marked.use(mathExtension, calloutExtension, highlightExtension, subscriptExtension, superscriptExtension, {
      gfm: true,
      breaks: true,
      renderer: {
        code({ text, lang }: { text: string; lang?: string }) {
          const cleanLang = (lang || '').trim().toLowerCase();
          const validLang = cleanLang && hljs.getLanguage(cleanLang) ? cleanLang : null;
          let highlighted = '';
          try {
            highlighted = validLang
              ? hljs.highlight(text, { language: validLang }).value
              : hljs.highlightAuto(text).value;
          } catch {
            highlighted = ImportExportService.escapeHtml(text);
          }

          const linesCount = text.split('\n').length;
          const headerHtml = cleanLang
            ? `<div class="code-header">
            <span class="code-lang">${cleanLang.toUpperCase()}</span>
          </div>`
            : '';

          return `<div class="code-block-wrapper">${headerHtml}<pre><code class="hljs ${validLang ? `language-${validLang}` : ''}">${highlighted}</code></pre></div>\n`;
        },
        list(this: any, token: any) {
          const ordered = token.ordered;
          const start = token.start;
          const tag = ordered ? 'ol' : 'ul';
          const startAttr = ordered && start && start !== 1 ? ` start="${start}"` : '';
          let body = '';
          if (token.items) {
            for (const item of token.items) {
              body += this.listitem(item);
            }
          } else if (token.body) {
            body = token.body;
          }
          return `<${tag}${startAttr}>\n${body}</${tag}>\n`;
        },
        listitem(this: any, token: any) {
          let content = this.parser ? this.parser.parse(token.tokens) : (token.text || '');
          if (token.task) {
            const checked = token.checked;
            content = content.replace(/^<input\s+[^>]*type="checkbox"[^>]*>\s*/i, '');
            content = content.replace(/^<p>(.*?)<\/p>$/s, '$1');
            const checkIcon = checked
              ? `<span class="task-checkbox checked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></span>`
              : `<span class="task-checkbox"></span>`;
            return `<li class="task-list-item">${checkIcon} <span>${content}</span></li>\n`;
          }
          return `<li>${content}</li>\n`;
        },
        image(token: any) {
          const href = token.href || '';
          const text = token.text || '';
          const isBadge = href.includes('shields.io') || href.includes('badge') || href.endsWith('.svg');
          if (isBadge) {
            return `<img src="${href}" alt="${text || 'Badge'}" class="inline-badge" />`;
          }
          const captionHtml = text && text.trim().length > 0
            ? `<figcaption class="image-caption">${ImportExportService.escapeHtml(text)}</figcaption>`
            : '';
          return `<figure class="doc-image-figure"><img src="${href}" alt="${ImportExportService.escapeHtml(text || 'Image')}" />${captionHtml}</figure>`;
        },
        table(token: any) {
          let header = '';
          let body = '';
          let headRow = '';
          for (const cell of token.header) {
            const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
            headRow += `<th${align}>${marked.parseInline(cell.text)}</th>`;
          }
          header = `<thead><tr>${headRow}</tr></thead>`;
          for (const row of token.rows) {
            let bodyRow = '';
            for (let j = 0; j < row.length; j++) {
              const cell = row[j];
              const align = token.header[j]?.align ? ` style="text-align: ${token.header[j].align}"` : '';
              bodyRow += `<td${align}>${marked.parseInline(cell.text)}</td>`;
            }
            body += `<tr>${bodyRow}</tr>`;
          }
          return `<div class="cm-table-widget-container"><table class="doc-table">${header}<tbody>${body}</tbody></table></div>\n`;
        },
      },
    });

    this.markedConfigured = true;
  }

  public static async markdownToFullHtml(md: string): Promise<string> {
    this.setupMarked();

    let processed = md;

    // 0. Extract YAML Frontmatter if present at the start
    let frontmatterHtml = '';
    const fmMatch = processed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (fmMatch) {
      const fmContent = fmMatch[1].trim();
      frontmatterHtml = `<div class="frontmatter-card"><div class="frontmatter-badge">YAML Metadata</div><pre><code>${this.escapeHtml(fmContent)}</code></pre></div>\n`;
      processed = processed.slice(fmMatch[0].length);
    }

    // 1. Render all ```mermaid diagrams into SVG
    const mermaidMatches = Array.from(processed.matchAll(/```mermaid\n([\s\S]*?)```/gi));
    if (mermaidMatches.length > 0) {
      if (!this.mermaidConfigured) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, -apple-system, sans-serif',
        });
        this.mermaidConfigured = true;
      }

      for (let i = 0; i < mermaidMatches.length; i++) {
        const match = mermaidMatches[i];
        const rawBlock = match[0];
        const diagramCode = match[1].trim();
        const diagramId = `export-mermaid-${Date.now()}-${i}`;
        try {
          const { svg } = await mermaid.render(diagramId, diagramCode);
          processed = processed.replace(
            rawBlock,
            `\n<div class="mermaid-diagram-container">${svg}</div>\n`
          );
        } catch (err) {
          console.warn('Mermaid export render error:', err);
          processed = processed.replace(
            rawBlock,
            `\n<div class="mermaid-diagram-container"><pre><code>${this.escapeHtml(diagramCode)}</code></pre></div>\n`
          );
        }
      }
    }

    // 2. Footnote definitions & references
    const footnotes: { id: string; text: string }[] = [];
    processed = processed.replace(/^\[\^([a-zA-Z0-9_\-]+)\]:\s*([^\n]+(?:\n(?:\s{2,}|\t)[^\n]+)*)/gm, (_match, id, text) => {
      footnotes.push({ id, text: text.trim() });
      return '';
    });

    processed = processed.replace(/\[\^([a-zA-Z0-9_\-]+)\]/g, (_match, id) => {
      return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`;
    });

    try {
      let html = marked.parse(processed) as string;

      // Append rendered footnotes section if any
      if (footnotes.length > 0) {
        const fnHtml = footnotes
          .map(
            (fn) =>
              `<li id="fn-${fn.id}">${marked.parseInline(fn.text)} <a href="#fnref-${fn.id}" class="footnote-backref" title="Back to content">&#x21a9;</a></li>`
          )
          .join('\n');
        html += `\n<section class="footnotes"><hr /><ol>\n${fnHtml}\n</ol></section>\n`;
      }

      return frontmatterHtml + html;
    } catch (e) {
      console.error('Marked parse error:', e);
      return `<pre>${processed}</pre>`;
    }
  }

  // Safe trigger for file download in browser
  public static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  public static downloadText(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  // ==========================================
  // 1. Export as Standard Markdown (.md)
  // ==========================================
  public static exportMarkdown(title: string, markdown: string): void {
    const filename = title.endsWith('.md') ? title : `${title}.md`;
    this.downloadText(filename, markdown, 'text/markdown;charset=utf-8');
  }

  // ==========================================
  // 2. Export as Clean Plain Text (.txt)
  // ==========================================
  public static exportPlainText(title: string, markdown: string): void {
    const baseName = title.replace(/\.[^/.]+$/, '');
    let text = markdown;

    // Remove frontmatter
    text = text.replace(/^---\n[\s\S]*?\n---\n/, '');

    // Format tables into clean spaced columns
    text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter((r) => r.includes('|') && !r.includes('---'));
      const parsed = rows.map((r) => {
        let trimmed = r.trim();
        if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
        if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
        return trimmed.split('|').map((c) => c.trim());
      });
      return '\n' + parsed.map((row) => row.join('  |  ')).join('\n') + '\n';
    });

    // Remove markdown symbols
    text = text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^\s*>\s*/gm, '');

    this.downloadText(`${baseName}.txt`, text.trim(), 'text/plain;charset=utf-8');
  }

  // ==========================================
  // 3. Export as Standalone Styled HTML (.html)
  // ==========================================
  public static async exportHTML(title: string, markdown: string, _theme: string = 'canvas'): Promise<void> {
    const baseName = title.replace(/\.[^/.]+$/, '');
    const htmlDocument = await this.generateDocumentTemplate(baseName, markdown, { isPrint: false });
    this.downloadText(`${baseName}.html`, htmlDocument, 'text/html;charset=utf-8');
  }

  // ==========================================
  // 4. Export as Publication-Grade Vector PDF (.pdf)
  // ==========================================
  public static async exportPDF(title: string, markdown: string, settings?: EditorSettings): Promise<void> {
    const baseName = title.replace(/\.[^/.]+$/, '');
    const fullHtml = await this.generateDocumentTemplate(baseName, markdown, { isPrint: true, settings });

    // Primary: Use Electron's native printToPDF via IPC (no new windows, no print dialog)
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.exportPDF) {
      const result = await electronAPI.exportPDF(fullHtml);
      if (result?.success && result.data) {
        const pdfBytes = new Uint8Array(result.data);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        this.downloadBlob(blob, `${baseName}.pdf`);
        return;
      }
      // If Electron IPC failed, fall through to browser fallback
      console.warn('Electron PDF export failed:', result?.error);
    }

    // Fallback: Hidden iframe print for browser-only usage
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error, falling back to HTML download:', err);
          this.downloadText(`${baseName}.html`, fullHtml, 'text/html;charset=utf-8');
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 4000);
        }
      }, 600);
    }
  }

  // ==========================================
  // Publication Document Template Generator
  // ==========================================
  public static async generateDocumentTemplate(
    title: string,
    markdown: string,
    options: { isPrint?: boolean; settings?: EditorSettings } = {}
  ): Promise<string> {
    const renderedBody = await this.markdownToFullHtml(markdown);

    const font = options.settings?.font || 'serif';
    const fontFamilies: Record<string, string> = {
      serif: '"Newsreader", Charter, "Source Serif 4", Georgia, serif',
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      quattro: 'Literata, Georgia, "iA Writer Quattro", sans-serif',
    };
    const bodyFont = fontFamilies[font] || fontFamilies.serif;
    const headingFont =
      font === 'serif'
        ? '"Newsreader", Georgia, serif'
        : font === 'quattro'
        ? 'Literata, Georgia, sans-serif'
        : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const fontSize = options.settings?.fontSize ? `${options.settings.fontSize}px` : '16px';
    const lineHeight = options.settings?.lineHeight ? `${options.settings.lineHeight}` : '1.7';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.isPrint ? '' : this.escapeHtml(title)}</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,400&display=swap" rel="stylesheet">
  
  <!-- KaTeX Math CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  
  <style>
    /* =========================================================================
       Publication-Grade Typography & Document Stylesheet
       ========================================================================= */
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --text-muted: #5c5c5c;
      --border: #e5e7eb;
      --border-subtle: #f3f4f6;
      --accent: #b45309;
      --code-bg: #f8fafc;
      --code-border: #e2e8f0;
      --table-header-bg: #f9fafb;
      --table-zebra-bg: #fafafa;
      --body-font: ${bodyFont};
      --heading-font: ${headingFont};
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    @page {
      size: auto;
      margin: 12mm 14mm;
    }

    html, body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--body-font);
      font-size: ${fontSize};
      line-height: ${lineHeight};
      margin: 0;
      padding: 0;
      height: auto !important;
      min-height: 100% !important;
      overflow: visible !important;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Print Preview Toolbar (Only visible on web screen, auto-hidden on print) */
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e293b;
      color: #f8fafc;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
    }
    .print-toolbar-title {
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .print-toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .print-btn {
      background: #3b82f6;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 12.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .print-btn:hover {
      background: #2563eb;
    }
    .print-btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }
    .print-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Main Container */
    .doc-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 0;
      box-sizing: border-box;
      overflow: visible !important;
    }

    .doc-content > *:first-child,
    .doc-content > div[align="center"]:first-child > *:first-child {
      margin-top: 0 !important;
    }

    @media screen {
      body {
        background-color: #f1f5f9;
        padding-bottom: 40px;
      }
      .doc-container {
        max-width: 820px;
        background: #ffffff;
        margin: 24px auto;
        padding: 32px 40px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
    }

    /* Frontmatter Metadata Card */
    .frontmatter-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 1.5em;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
      color: #475569;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .frontmatter-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .frontmatter-card pre {
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
      font-size: 12px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font);
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      letter-spacing: -0.015em;
      page-break-before: auto !important;
      break-before: auto !important;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { font-size: 1.85em; margin-top: 1.1em; }
    h2 { font-size: 1.38em; margin-top: 1.1em; }
    h3 { font-size: 1.18em; margin-top: 0.95em; }
    h4 { font-size: 1.05em; margin-top: 0.85em; }
    h5 { font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    h6 { font-size: 0.88em; text-transform: uppercase; color: var(--text-muted); }

    p {
      margin: 0.75em 0;
      text-align: left;
      orphans: 3;
      widows: 3;
    }

    /* Blockquotes */
    blockquote {
      margin: 1em 0;
      padding: 0.4em 0 0.4em 14px;
      border-left: 3.5px solid var(--accent);
      color: #374151;
      font-style: normal;
      background: rgba(180, 83, 9, 0.03);
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }
    blockquote p {
      margin: 0.3em 0;
      text-align: left;
    }
    blockquote blockquote {
      margin: 0.6em 0;
      border-left-color: rgba(180, 83, 9, 0.6);
      background: rgba(180, 83, 9, 0.05);
    }

    /* Callouts */
    .callout {
      margin: 1em 0;
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 4px solid;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .callout-header {
      margin-bottom: 4px;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .callout-badge {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .callout-body {
      font-size: 14px;
      line-height: 1.6;
    }
    .callout-body p:first-child { margin-top: 0; }
    .callout-body p:last-child { margin-bottom: 0; }

    .callout-note { border-left-color: #3b82f6; background: rgba(59, 130, 246, 0.08) !important; }
    .callout-note .callout-badge { color: #1d4ed8; }

    .callout-tip { border-left-color: #10b981; background: rgba(16, 185, 129, 0.08) !important; }
    .callout-tip .callout-badge { color: #047857; }

    .callout-important { border-left-color: #8b5cf6; background: rgba(139, 92, 246, 0.08) !important; }
    .callout-important .callout-badge { color: #6d28d9; }

    .callout-warning { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.08) !important; }
    .callout-warning .callout-badge { color: #b45309; }

    .callout-caution { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.08) !important; }
    .callout-caution .callout-badge { color: #b91c1c; }

    /* Tables */
    .cm-table-widget-container {
      margin: 1.1em 0;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }
    table.doc-table th, table.doc-table td {
      padding: 7px 12px;
      border-bottom: 1px solid var(--border);
    }
    table.doc-table th {
      background-color: var(--table-header-bg, #f1f5f9);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.05em;
      color: var(--text-muted, #334155);
      text-align: left;
      border-bottom: 1.5px solid var(--border, #cbd5e1);
    }
    table.doc-table tr:nth-child(even) td {
      background-color: var(--table-zebra-bg, #f8fafc);
    }
    table.doc-table tr:last-child td {
      border-bottom: none;
    }
    table.doc-table tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    table.doc-table thead {
      display: table-header-group !important;
    }

    /* Mermaid Diagrams */
    .mermaid-diagram-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 1.4em 0;
      padding: 14px;
      background: #fafafa;
      border: 1px solid var(--border);
      border-radius: 8px;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      text-align: center;
    }
    .mermaid-diagram-container svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Code Blocks & Highlight.js */
    .code-block-wrapper {
      margin: 1.1em 0;
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      transition: all 0.2s ease;
    }
    .code-block-wrapper.collapsed pre {
      display: none !important;
    }
    .code-block-wrapper.collapsed {
      border-bottom: 1px solid var(--code-border);
    }
    .code-header {
      background: #f1f5f9;
      border-bottom: 1px solid var(--code-border);
      padding: 5px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    .code-header-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .code-collapse-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
    .code-collapse-btn:hover {
      color: #0f172a;
      background: rgba(0, 0, 0, 0.05);
    }

    .code-lang {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .code-lines-count {
      font-size: 10.5px;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      margin-left: 2px;
    }
    .code-copy-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .code-copy-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }
    pre {
      margin: 0;
      padding: 12px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      line-height: 1.55;
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      overflow: hidden;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88em;
    }
    :not(pre) > code {
      background: #f3f4f6;
      color: #1f2937;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    /* Highlight.js Tokens */
    .hljs { color: #24292e; background: transparent; }
    .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #d73a49; font-weight: 600; }
    .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition { color: #032f62; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #6a737d; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-link { color: #005cc5; }
    .hljs-variable, .hljs-symbol, .hljs-bullet { color: #e36209; }
    .hljs-title.function_, .hljs-function { color: #6f42c1; }
    .hljs-params { color: #24292e; }

    /* KaTeX Math */
    .math-block {
      margin: 1.4em 0;
      text-align: center;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .math-inline {
      padding: 0 2px;
    }

    /* Lists & Checklists */
    ul, ol {
      margin: 0.65em 0;
      padding-left: 28px;
    }
    ul {
      list-style-type: disc;
    }
    ol {
      list-style-type: decimal;
    }
    ul ul, ol ul {
      list-style-type: circle;
      margin: 0.2em 0;
      padding-left: 22px;
    }
    ul ul ul, ol ul ul {
      list-style-type: square;
      margin: 0.2em 0;
      padding-left: 22px;
    }
    ol ol, ul ol {
      list-style-type: lower-alpha;
      margin: 0.2em 0;
      padding-left: 22px;
    }
    ol ol ol, ul ol ol {
      list-style-type: lower-roman;
      margin: 0.2em 0;
      padding-left: 22px;
    }
    li {
      margin: 0.28em 0;
      line-height: inherit;
      orphans: 3;
      widows: 3;
    }
    li > p {
      margin: 0.15em 0 !important;
      display: inline;
    }
    li > p:first-child {
      margin-top: 0 !important;
    }
    li > p:last-child {
      margin-bottom: 0 !important;
    }
    .task-list-item {
      list-style-type: none !important;
      margin-left: -22px;
      display: flex;
      align-items: baseline;
      gap: 8px;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .task-checkbox {
      width: 15px;
      height: 15px;
      min-width: 15px;
      border-radius: 4px;
      border: 1.5px solid #a8a29e;
      background: #f5f5f4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transform: translateY(2px);
      flex-shrink: 0;
    }
    .task-checkbox.checked {
      background: #d97706;
      border-color: #d97706;
      color: #ffffff;
    }
    .task-checkbox.checked svg {
      width: 11px;
      height: 11px;
      stroke: #ffffff;
    }

    /* Micro-typography & Inline Elements */
    mark {
      background: rgba(245, 158, 11, 0.22);
      color: inherit;
      padding: 1px 4px;
      border-radius: 3px;
    }
    del, s, strike {
      text-decoration: line-through;
      color: var(--text-muted);
      opacity: 0.75;
    }
    u {
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-thickness: 1.5px;
    }
    ins {
      text-decoration: underline;
      text-decoration-color: #10b981;
      text-underline-offset: 3px;
      background: rgba(16, 185, 129, 0.08);
      padding: 0 2px;
    }
    kbd {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 0.8em;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      background: #f8fafc;
      color: #1f2937;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
      font-weight: 600;
      white-space: nowrap;
    }
    sub {
      font-size: 0.75em;
      vertical-align: sub;
      line-height: 0;
    }
    sup {
      font-size: 0.75em;
      vertical-align: super;
      line-height: 0;
    }
    small {
      font-size: 0.85em;
      color: var(--text-muted);
    }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.2em 0;
      page-break-after: auto;
      break-after: auto;
    }
    a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .doc-image-figure {
      margin: 1.6em 0;
      text-align: center;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }
    .doc-image-figure img {
      max-width: 100%;
      max-height: 480px;
      height: auto;
      border-radius: 8px;
      border: 1px solid var(--border);
      display: inline-block;
    }
    .image-caption {
      font-family: 'Newsreader', Georgia, serif;
      font-style: italic;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 6px;
      text-align: center;
      page-break-before: avoid !important;
      break-before: avoid-page !important;
    }
    .inline-badge {
      display: inline-block;
      vertical-align: middle;
      margin: 2px 4px;
      max-height: 24px;
    }

    /* HTML UI Widgets & Components */
    progress {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      max-width: 320px;
      height: 10px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
      background-color: var(--code-bg);
      display: inline-block;
      vertical-align: middle;
      margin: 0.4em 0;
      page-break-inside: avoid !important;
    }
    progress::-webkit-progress-bar {
      background-color: var(--code-bg);
    }
    progress::-webkit-progress-value {
      background-color: var(--accent);
      border-radius: 5px;
    }
    meter {
      width: 100%;
      max-width: 280px;
      height: 12px;
      border-radius: 6px;
      vertical-align: middle;
      margin: 0.4em 0;
      page-break-inside: avoid !important;
    }
    details {
      margin: 1.2em 0;
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }
    summary {
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      color: #111827;
      outline: none;
      user-select: none;
      page-break-after: avoid !important;
      break-after: avoid-page !important;
    }
    details[open] summary {
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }
    dl {
      margin: 1.2em 0;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }
    dt {
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      color: #111827;
      margin-top: 0.8em;
      page-break-after: avoid !important;
      break-after: avoid-page !important;
    }
    dd {
      margin-left: 20px;
      color: var(--text);
      orphans: 3;
      widows: 3;
    }
    [align="center"], center {
      text-align: center;
    }

    /* Footnotes */
    .footnote-ref {
      font-size: 0.75em;
      font-weight: 600;
      vertical-align: super;
      line-height: 0;
      margin-left: 2px;
    }
    .footnote-ref a {
      color: var(--accent);
      text-decoration: none;
    }
    .footnotes {
      margin-top: 3em;
      padding-top: 1.2em;
      border-top: 1px solid var(--border);
      font-size: 0.88em;
      color: var(--text-muted);
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .footnotes ol {
      padding-left: 20px;
      margin: 0.5em 0;
    }
    .footnotes li {
      margin: 0.4em 0;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .footnote-backref {
      color: var(--accent);
      text-decoration: none;
      margin-left: 4px;
    }

    /* Print Overrides */
    @media print {
      .no-print, .print-toolbar, .code-copy-btn, .code-collapse-btn {
        display: none !important;
      }
      .code-lines-count {
        display: none !important;
      }
      .code-block-wrapper.collapsed pre {
        display: block !important;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .doc-container {
        max-width: 100% !important;
        width: 100% !important;
        padding: 16mm 18mm !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }
      h1, h2, h3, h4, h5, h6 {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto !important;
        break-before: auto !important;
        page-break-after: avoid;
        break-after: avoid;
      }
      blockquote, .callout, .mermaid-diagram-container, .math-block, .doc-image-figure, figure, img, details, dl, .frontmatter-card, .footnotes li, .task-list-item, .code-block-wrapper {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table.doc-table tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table.doc-table thead {
        display: table-header-group !important;
      }
      p, li, dd {
        orphans: 3 !important;
        widows: 3 !important;
      }
    }
  </style>
</head>
<body>
  ${
    !options.isPrint
      ? `<div class="print-toolbar no-print">
    <div class="print-toolbar-title">Aura Document Preview • ${this.escapeHtml(title)}</div>
    <div class="print-toolbar-actions">
      <button class="print-btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save PDF
      </button>
      <button class="print-btn print-btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>`
      : ''
  }

  <div class="doc-container">
    <article class="doc-content">
      ${renderedBody}
    </article>
  </div>
</body>
</html>`;
  }

  // ==========================================
  // 5. Export as Academic LaTeX Document (.tex)
  // ==========================================
  public static exportLaTeX(title: string, markdown: string): void {
    const baseName = title.replace(/\.[^/.]+$/, '');
    let tex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{xcolor}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{${this.escapeLatex(baseName)}}
\\author{Aura Document Editor}
\\date{\\today}

\\begin{document}
\\maketitle

`;

    let body = markdown;

    // Headings
    body = body.replace(/^# (.*$)/gm, '\\section{$1}');
    body = body.replace(/^## (.*$)/gm, '\\subsection{$1}');
    body = body.replace(/^### (.*$)/gm, '\\subsubsection{$1}');

    // Bold, Italic, Inline Code
    body = body.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
    body = body.replace(/\*(.*?)\*/g, '\\textit{$1}');
    body = body.replace(/`([^`]+)`/g, '\\texttt{$1}');

    tex += body + `\n\n\\end{document}`;
    this.downloadText(`${baseName}.tex`, tex, 'text/x-tex;charset=utf-8');
  }

  // ==========================================
  // 6. Export as Structured JSON Document (.json)
  // ==========================================
  public static exportJSON(file: FileItem): void {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const stats = calculateDocumentStats(file.content);
    const outline = extractDocumentOutline(file.content);

    const payload = {
      $schema: 'https://aura.editor/schemas/document-v1.json',
      title: baseName,
      filename: file.name,
      content: file.content,
      metadata: {
        createdAt: new Date(file.createdAt).toISOString(),
        lastModified: new Date(file.lastModified).toISOString(),
        isFavorite: !!file.isFavorite,
        generator: 'Aura Minimalist Live Editor',
        version: '1.0.0',
      },
      stats,
      outline,
    };

    this.downloadText(`${baseName}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  }

  // ==========================================
  // 7. Export Workspace as Native ZIP Backup (.zip)
  // ==========================================
  public static exportWorkspaceZip(files: FileItem[]): void {
    const zipBlob = this.createZipFromFiles(files);
    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadBlob(zipBlob, `Aura-Workspace-Backup-${dateStr}.zip`);
  }

  // ==========================================
  // 8. Copy Rich Text / HTML to Clipboard
  // ==========================================
  public static async copyRichText(markdown: string): Promise<boolean> {
    try {
      const html = await this.markdownToFullHtml(markdown);
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([markdown], { type: 'text/plain' });

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
        return true;
      } else {
        await navigator.clipboard.writeText(markdown);
        return true;
      }
    } catch (e) {
      console.error('Failed to copy rich text:', e);
      return false;
    }
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static escapeLatex(str: string): string {
    return str
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%$#_{}])/g, '\\$1')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  // Native PKZIP builder
  private static createZipFromFiles(files: FileItem[]): Blob {
    const encoder = new TextEncoder();
    const zipParts: Uint8Array[] = [];
    const cdEntries: Uint8Array[] = [];
    let offset = 0;

    for (const f of files) {
      const filename = f.name.endsWith('.md') ? f.name : `${f.name}.md`;
      const nameBytes = encoder.encode(filename);
      const dataBytes = encoder.encode(f.content);
      const crc = this.crc32(dataBytes);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, dataBytes.length, true);
      lv.setUint32(22, dataBytes.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      zipParts.push(localHeader);
      zipParts.push(dataBytes);

      const cdHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cdHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, dataBytes.length, true);
      cv.setUint32(24, dataBytes.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cdHeader.set(nameBytes, 46);

      cdEntries.push(cdHeader);
      offset += localHeader.length + dataBytes.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of cdEntries) {
      zipParts.push(cd);
      cdSize += cd.length;
    }

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, cdOffset, true);
    ev.setUint16(20, 0, true);
    zipParts.push(eocd);

    return new Blob(zipParts as any, { type: 'application/zip' });
  }

  // ==========================================
  // 8. Import Parsers & Converters
  // ==========================================
  public static async parseImportedFile(file: File): Promise<{ name: string; content: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const text = await file.text();

    if (ext === 'html' || ext === 'htm') {
      return {
        name: file.name.replace(/\.html?$/i, '.md'),
        content: this.htmlToMarkdown(text),
      };
    }

    if (ext === 'json') {
      try {
        const json = JSON.parse(text);
        if (json.content && typeof json.content === 'string') {
          return { name: json.title ? `${json.title}.md` : file.name.replace(/\.json$/i, '.md'), content: json.content };
        }
      } catch {}
    }

    return {
      name: file.name.endsWith('.md') || file.name.endsWith('.txt') ? file.name : `${file.name}.md`,
      content: text,
    };
  }

  public static htmlToMarkdown(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const inner = Array.from(el.childNodes).map(walk).join('');

      switch (tag) {
        case 'h1': return `\n# ${inner}\n\n`;
        case 'h2': return `\n## ${inner}\n\n`;
        case 'h3': return `\n### ${inner}\n\n`;
        case 'h4': return `\n#### ${inner}\n\n`;
        case 'h5': return `\n##### ${inner}\n\n`;
        case 'h6': return `\n###### ${inner}\n\n`;
        case 'p': return `\n${inner}\n\n`;
        case 'strong':
        case 'b': return `**${inner}**`;
        case 'em':
        case 'i': return `*${inner}*`;
        case 'del':
        case 's': return `~~${inner}~~`;
        case 'code':
          return el.parentElement?.tagName.toLowerCase() === 'pre' ? inner : `\`${inner}\``;
        case 'pre': return `\n\`\`\`\n${inner}\n\`\`\`\n\n`;
        case 'blockquote': return `\n> ${inner.trim()}\n\n`;
        case 'li': return `* ${inner}\n`;
        case 'ul':
        case 'ol': return `\n${inner}\n`;
        case 'hr': return `\n---\n\n`;
        case 'a': return `[${inner}](${el.getAttribute('href') || ''})`;
        case 'img': return `![${el.getAttribute('alt') || 'Image'}](${el.getAttribute('src') || ''})`;
        case 'br': return `\n`;
        default: return inner;
      }
    };

    return walk(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  }

  private static crc32(buf: Uint8Array): number {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ ~0) >>> 0;
  }
}

export const exportService = ImportExportService;


