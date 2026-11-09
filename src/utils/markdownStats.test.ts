import { describe, it, expect } from 'vitest';
import { calculateDocumentStats, extractDocumentOutline } from './markdownStats';

describe('calculateDocumentStats', () => {
  it('calculates stats for empty text', () => {
    const stats = calculateDocumentStats('');
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.lines).toBe(1);
    expect(stats.paragraphs).toBe(0);
  });

  it('calculates correct word and character counts', () => {
    const text = 'Hello world! This is Aura, an ultra-minimal text editor.';
    const stats = calculateDocumentStats(text);
    expect(stats.words).toBe(9);
    expect(stats.characters).toBe(text.length);
    expect(stats.charactersNoSpaces).toBe(text.replace(/\s+/g, '').length);
    expect(stats.readingTimeMinutes).toBe(1);
  });

  it('calculates paragraphs accurately', () => {
    const text = `First paragraph here.

Second paragraph here.

Third paragraph here.`;
    const stats = calculateDocumentStats(text);
    expect(stats.paragraphs).toBe(3);
    expect(stats.lines).toBe(5);
  });
});

describe('extractDocumentOutline', () => {
  it('extracts Markdown headings accurately', () => {
    const markdown = `# Title
Some content
## Chapter 1
Content here
### Section 1.1
More content
## Chapter 2`;

    const outline = extractDocumentOutline(markdown);
    expect(outline.length).toBe(4);
    expect(outline[0]).toMatchObject({ level: 1, text: 'Title' });
    expect(outline[1]).toMatchObject({ level: 2, text: 'Chapter 1' });
    expect(outline[2]).toMatchObject({ level: 3, text: 'Section 1.1' });
    expect(outline[3]).toMatchObject({ level: 2, text: 'Chapter 2' });
  });

  it('returns empty array when no headings exist', () => {
    const text = 'Just normal text without any headings.';
    const outline = extractDocumentOutline(text);
    expect(outline).toEqual([]);
  });
});
