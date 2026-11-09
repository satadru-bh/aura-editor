import { describe, it, expect } from 'vitest';
import { calculateFixationLength } from './BionicReadingPlugin';
import { createHemingwayPlugin } from './HemingwayPlugin';

describe('Flow State Writing Plugins', () => {
  describe('BionicReadingPlugin: calculateFixationLength', () => {
    it('calculates optimal visual fixation length for different word sizes', () => {
      // 1 char
      expect(calculateFixationLength(1)).toBe(1);
      // 2 chars -> 1 (e.g. "it" -> "i")
      expect(calculateFixationLength(2)).toBe(1);
      // 3 chars -> 1 (e.g. "the" -> "t")
      expect(calculateFixationLength(3)).toBe(1);
      // 4 chars -> 2 (e.g. "read" -> "re")
      expect(calculateFixationLength(4)).toBe(2);
      // 5 chars -> 2 (e.g. "focus" -> "fo")
      expect(calculateFixationLength(5)).toBe(2);
      // 7 chars -> ceil(7 * 0.45) = 4 (e.g. "writing" -> "writ")
      expect(calculateFixationLength(7)).toBe(4);
      // 10 chars -> ceil(10 * 0.45) = 5 (e.g. "distract" -> "distr")
      expect(calculateFixationLength(10)).toBe(5);
    });
  });

  describe('HemingwayPlugin', () => {
    it('returns empty extension array when disabled', () => {
      const ext = createHemingwayPlugin(false);
      expect(Array.isArray(ext) && ext.length === 0).toBe(true);
    });

    it('returns a configured keymap extension when enabled', () => {
      const ext = createHemingwayPlugin(true);
      expect(ext).toBeDefined();
    });
  });
});
