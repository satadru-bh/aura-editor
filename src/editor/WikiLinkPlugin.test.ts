import { describe, it, expect } from 'vitest';
import { findWikiLinks } from './WikiLinkPlugin';

describe('WikiLinkPlugin', () => {
  describe('findWikiLinks', () => {
    it('finds simple [[Note]] links', () => {
      const text = 'Here is a reference to [[Project Architecture]] in the text.';
      const matches = findWikiLinks(text);

      expect(matches.length).toBe(1);
      expect(matches[0].target).toBe('Project Architecture');
      expect(matches[0].label).toBe('Project Architecture');
      expect(matches[0].from).toBe(text.indexOf('[['));
      expect(matches[0].to).toBe(text.indexOf(']]') + 2);
    });

    it('finds piped [[Target|Display]] links', () => {
      const text = 'Check out the [[Master Plan 2026|Roadmap]] for more details.';
      const matches = findWikiLinks(text);

      expect(matches.length).toBe(1);
      expect(matches[0].target).toBe('Master Plan 2026');
      expect(matches[0].label).toBe('Roadmap');
    });

    it('finds multiple links across lines', () => {
      const text = `Line 1 with [[Note Alpha]]
Line 2 with [[Note Beta|Custom Beta]] and another [[Note Gamma]].`;
      const matches = findWikiLinks(text);

      expect(matches.length).toBe(3);
      expect(matches[0].target).toBe('Note Alpha');
      expect(matches[1].target).toBe('Note Beta');
      expect(matches[1].label).toBe('Custom Beta');
      expect(matches[2].target).toBe('Note Gamma');
    });

    it('ignores broken brackets and normal text', () => {
      expect(findWikiLinks('Just [single brackets] here').length).toBe(0);
      expect(findWikiLinks('Unclosed [[note without closing').length).toBe(0);
    });
  });
});
