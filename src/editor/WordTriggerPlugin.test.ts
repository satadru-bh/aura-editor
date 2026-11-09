import { describe, it, expect } from 'vitest';
import { evaluateReplacement, DEFAULT_WORD_TRIGGERS } from './WordTriggerPlugin';

describe('WordTriggerPlugin', () => {
  it('should evaluate date and time macros in templates', () => {
    const template = 'Date: {{date}}, Time: {{time}}';
    const { text, cursorOffset } = evaluateReplacement(template);

    expect(text).toMatch(/^Date: \d{4}-\d{2}-\d{2}, Time: \d{2}:\d{2}$/);
    expect(cursorOffset).toBeNull();
  });

  it('should evaluate cursor positioning marker', () => {
    const template = '> [!NOTE]\n> {{cursor}}\n';
    const { text, cursorOffset } = evaluateReplacement(template);

    expect(text).toBe('> [!NOTE]\n> \n');
    expect(cursorOffset).toBe(12); // Position right after '> '
  });

  it('should preserve static text without macros', () => {
    const template = '¯\\_(ツ)_/¯';
    const { text, cursorOffset } = evaluateReplacement(template);

    expect(text).toBe('¯\\_(ツ)_/¯');
    expect(cursorOffset).toBeNull();
  });

  it('should contain default starter triggers', () => {
    expect(DEFAULT_WORD_TRIGGERS.length).toBeGreaterThanOrEqual(10);
    const dateTrigger = DEFAULT_WORD_TRIGGERS.find((t) => t.trigger === ':date');
    expect(dateTrigger).toBeDefined();
    expect(dateTrigger?.enabled).toBe(true);
  });
});
