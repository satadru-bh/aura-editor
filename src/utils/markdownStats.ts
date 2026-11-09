import { DocumentStats, OutlineItem } from '../types';

export function calculateDocumentStats(text: string): DocumentStats {
  if (!text || text.trim().length === 0) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 1,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  // Count characters
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;

  // Count words: match non-whitespace segments
  const wordsMatch = text.trim().match(/[\p{L}\p{N}_\-]+/gu);
  const words = wordsMatch ? wordsMatch.length : 0;

  // Count lines
  const lines = text.split('\n').length;

  // Count paragraphs (blocks separated by blank lines)
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0).length;

  // Average reading speed: 200-220 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Average speaking speed: 130 words per minute
  const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    readingTimeMinutes,
    speakingTimeMinutes,
  };
}

export function extractDocumentOutline(text: string): OutlineItem[] {
  const outline: OutlineItem[] = [];
  const lines = text.split('\n');
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      // Strip any trailing Markdown or hashes
      const textClean = headingMatch[2].replace(/\s+#+$/, '').trim();
      const from = currentOffset;
      const to = currentOffset + line.length;

      outline.push({
        id: `heading-${i}-${from}`,
        level,
        text: textClean,
        from,
        to,
        line: i + 1,
      });
    }

    currentOffset += line.length + 1; // +1 for the newline
  }

  return outline;
}
