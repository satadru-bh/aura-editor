import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpellingSuggestions,
  addUserWord,
  getUserDictionary,
  isSpellingError,
  ignoreWord,
  isWordIgnored,
  clearIgnoredWords,
} from './spellcheck';

class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

globalThis.localStorage = new LocalStorageMock() as any;

describe('spellcheck', () => {
  beforeEach(() => {
    localStorage.clear();
    clearIgnoredWords();
  });

  it('provides suggestions for known common typos', () => {
    const suggestions = getSpellingSuggestions('teh');
    expect(suggestions).toContain('the');

    const capSuggestions = getSpellingSuggestions('Teh');
    expect(capSuggestions).toContain('The');

    const sepSuggestions = getSpellingSuggestions('seperate');
    expect(sepSuggestions).toContain('separate');
  });

  it('provides Levenshtein distance matches for close misspellings', () => {
    const suggestions = getSpellingSuggestions('documnt');
    expect(suggestions).toContain('document');
  });

  it('returns empty array for valid common words', () => {
    expect(getSpellingSuggestions('document')).toEqual([]);
    expect(getSpellingSuggestions('markdown')).toEqual([]);
    expect(getSpellingSuggestions('important')).toEqual([]);
  });

  it('allows adding custom words to user dictionary', () => {
    addUserWord('auraverse');
    const dict = getUserDictionary();
    expect(dict.has('auraverse')).toBe(true);

    // Now auraverse is recognized and yields no spelling error
    expect(getSpellingSuggestions('auraverse')).toEqual([]);
    expect(isSpellingError('auraverse')).toBe(false);
  });

  it('identifies spelling errors correctly', () => {
    expect(isSpellingError('teh')).toBe(true);
    expect(isSpellingError('seperate')).toBe(true);
    expect(isSpellingError('documnt')).toBe(true);
    expect(isSpellingError('the')).toBe(false);
    expect(isSpellingError('document')).toBe(false);
    expect(isSpellingError('markdown')).toBe(false);
    // Disregard non-words
    expect(isSpellingError('12345')).toBe(false);
    expect(isSpellingError('http://localhost')).toBe(false);
  });

  it('recognizes inflected words like elements as valid', () => {
    expect(isSpellingError('elements')).toBe(false);
    expect(isSpellingError('working')).toBe(false);
    expect(isSpellingError('created')).toBe(false);
    expect(isSpellingError('Elements')).toBe(false);
  });

  it('supports session ignored words', () => {
    expect(isSpellingError('elemsents')).toBe(true);
    ignoreWord('elemsents');
    expect(isWordIgnored('elemsents')).toBe(true);
    expect(isSpellingError('elemsents')).toBe(false);
    expect(getSpellingSuggestions('elemsents')).toEqual([]);
  });
});
