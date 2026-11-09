import { describe, it, expect } from 'vitest';
import { ImportExportService } from './ImportExportService';

describe('ImportExportService.markdownToFullHtml', () => {
  it('correctly parses inline formatting inside lists without leaving raw syntax', async () => {
    const md = `* This is standard text containing **bold emphasis** via \`**bold**\` or \`__bold__\`.
* Text can also use *italic styling* via \`*italic*\` or \`_italic_\`.
* Combine them seamlessly for ***bold, italicized emphasis***.
* Mark deprecated concepts with ~~strikethrough styling~~ (\`~~strikethrough~~\`).
* Reference code variables inline with \`monospace literals\` like \`const buffer = new ArrayBuffer(1024);\`.
`;
    const html = await ImportExportService.markdownToFullHtml(md);

    expect(html).toContain('<strong>bold emphasis</strong>');
    expect(html).toContain('<em>italic styling</em>');
    expect(html).toContain('<em><strong>bold, italicized emphasis</strong></em>');
    expect(html).toContain('<del>strikethrough styling</del>');
    expect(html).toContain('<code>monospace literals</code>');

    // Ensure raw unparsed markdown symbols do not appear outside code tags
    expect(html).not.toContain('<li>This is standard text containing **bold emphasis**');
  });

  it('correctly parses table of contents links and nested sub-lists', async () => {
    const md = `- [📑 Table of Contents](#-table-of-contents)
- [1. Typography \\& Inline Elements](#1-typography--inline-elements)
  - [1.1 Standard Inline Formatting](#11-standard-inline-formatting)
  - [1.2 Micro-Typography \\& Semantic Tags](#12-micro-typography--semantic-tags)
`;
    const html = await ImportExportService.markdownToFullHtml(md);

    expect(html).toContain('<a href="#-table-of-contents">');
    expect(html).toContain('<a href="#1-typography--inline-elements">');
    expect(html).toContain('<a href="#11-standard-inline-formatting">');
    expect(html).toContain('<a href="#12-micro-typography--semantic-tags">');
  });

  it('correctly parses tasklists with custom checkbox SVGs', async () => {
    const md = `- [x] Complete System Architecture Review
- [ ] Implement Distributed Tracing
  - [x] Inject trace contexts into HTTP payloads
`;
    const html = await ImportExportService.markdownToFullHtml(md);

    expect(html).toContain('task-checkbox checked');
    expect(html).toContain('task-checkbox');
    expect(html).toContain('Complete System Architecture Review');
    expect(html).toContain('Inject trace contexts into HTTP payloads');
  });

  it('correctly parses ordered lists and unordered lists', async () => {
    const md = `
1. First numbered item
2. Second numbered item
3. Third numbered item

- First bullet item
- Second bullet item
`;
    const html = await ImportExportService.markdownToFullHtml(md);
    console.log('HTML FOR ORDERED & UNORDERED LISTS:\n', html);
    expect(html).toContain('<ol>');
    expect(html).toContain('</ol>');
    expect(html).toContain('<ul>');
    expect(html).toContain('</ul>');
    expect(html).toContain('<li>First numbered item</li>');
  });
});
