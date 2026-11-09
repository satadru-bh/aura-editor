import { Extension } from '@codemirror/state';
import { EditorView, KeyBinding, keymap } from '@codemirror/view';
import { WordTrigger } from '../types';

export const DEFAULT_WORD_TRIGGERS: WordTrigger[] = [
  { id: 'wt-1', trigger: ':date', replacement: '{{date}}', enabled: true, description: 'Current date (YYYY-MM-DD)' },
  { id: 'wt-2', trigger: ':time', replacement: '{{time}}', enabled: true, description: 'Current time (HH:MM)' },
  { id: 'wt-3', trigger: ':datetime', replacement: '{{datetime}}', enabled: true, description: 'Current date and time' },
  { id: 'wt-4', trigger: ';sig', replacement: 'Best regards,\n', enabled: true, description: 'Standard sign-off signature' },
  { id: 'wt-5', trigger: '!todo', replacement: '- [ ] ', enabled: true, description: 'Interactive checklist task' },
  { id: 'wt-6', trigger: ';shrug', replacement: '¯\\_(ツ)_/¯', enabled: true, description: 'Shrug emoji ASCII' },
  { id: 'wt-7', trigger: ';arrow', replacement: '→', enabled: true, description: 'Right directional arrow' },
  { id: 'wt-8', trigger: '!tip', replacement: '> [!TIP]\n> {{cursor}}', enabled: true, description: 'GFM Tip Callout Box' },
  { id: 'wt-9', trigger: '!note', replacement: '> [!NOTE]\n> {{cursor}}', enabled: true, description: 'GFM Note Callout Box' },
  { id: 'wt-10', trigger: '!warn', replacement: '> [!WARNING]\n> {{cursor}}', enabled: true, description: 'GFM Warning Callout Box' },
  { id: 'wt-11', trigger: '!code', replacement: '```typescript\n{{cursor}}\n```', enabled: true, description: 'Fenced code block' },
  { id: 'wt-12', trigger: ';lorem', replacement: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', enabled: true, description: 'Sample placeholder paragraph' },
];

export function evaluateReplacement(template: string): { text: string; cursorOffset: number | null } {
  const now = new Date();
  
  // Format Date & Time strings
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthName = now.toLocaleString('default', { month: 'long' });
  const day = String(now.getDate()).padStart(2, '0');
  const weekday = now.toLocaleString('default', { weekday: 'long' });
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}`;
  const dateTimeStr = `${dateStr} ${timeStr}`;

  let result = template
    .replace(/\{\{date\}\}/gi, dateStr)
    .replace(/\{\{time\}\}/gi, timeStr)
    .replace(/\{\{datetime\}\}/gi, dateTimeStr)
    .replace(/\{\{year\}\}/gi, String(year))
    .replace(/\{\{month\}\}/gi, monthName)
    .replace(/\{\{day\}\}/gi, day)
    .replace(/\{\{weekday\}\}/gi, weekday);

  let cursorOffset: number | null = null;
  const cursorIndex = result.indexOf('{{cursor}}');
  if (cursorIndex !== -1) {
    cursorOffset = cursorIndex;
    result = result.replace('{{cursor}}', '');
  }

  return { text: result, cursorOffset };
}

export function createWordTriggerPlugin(getTriggers: () => WordTrigger[]): Extension {
  // Helper to test if a trigger can be expanded at cursor
  const tryExpand = (view: EditorView, extraChar?: string): boolean => {
    const triggers = (getTriggers() || []).filter((t) => t.enabled && t.trigger.trim().length > 0);
    if (triggers.length === 0) return false;

    const { state } = view;
    const { head } = state.selection.main;
    
    // Scan up to 60 characters back from cursor
    const startScan = Math.max(0, head - 60);
    const textBefore = state.sliceDoc(startScan, head) + (extraChar || '');

    for (const item of triggers) {
      const trig = item.trigger;
      if (textBefore.endsWith(trig)) {
        const from = head - trig.length + (extraChar ? extraChar.length : 0);
        const to = head;

        const { text, cursorOffset } = evaluateReplacement(item.replacement);
        const newCursorPos = cursorOffset !== null ? from + cursorOffset : from + text.length;

        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: newCursorPos, head: newCursorPos },
          scrollIntoView: true,
        });

        return true;
      }
    }

    return false;
  };

  const keybindings: KeyBinding[] = [
    {
      key: 'Space',
      run: (view) => {
        const expanded = tryExpand(view);
        if (expanded) return true;
        return false; // let normal space proceed
      },
    },
    {
      key: 'Enter',
      run: (view) => {
        const expanded = tryExpand(view);
        if (expanded) return true;
        return false; // let normal enter proceed
      },
    },
    {
      key: 'Tab',
      run: (view) => {
        const expanded = tryExpand(view);
        if (expanded) return true;
        return false; // let normal tab proceed
      },
    },
  ];

  return [
    EditorView.inputHandler.of((view, from, to, text) => {
      // Check if typing this text completes a trigger immediately
      const triggers = (getTriggers() || []).filter((t) => t.enabled && t.trigger.trim().length > 0);
      if (triggers.length === 0) return false;

      const { state } = view;
      const head = from;
      const startScan = Math.max(0, head - 60);
      const textBefore = state.sliceDoc(startScan, head) + text;

      for (const item of triggers) {
        if (textBefore.endsWith(item.trigger)) {
          const matchFrom = head - (item.trigger.length - text.length);
          const { text: replacementText, cursorOffset } = evaluateReplacement(item.replacement);
          const newCursorPos = cursorOffset !== null ? matchFrom + cursorOffset : matchFrom + replacementText.length;

          view.dispatch({
            changes: { from: matchFrom, to, insert: replacementText },
            selection: { anchor: newCursorPos, head: newCursorPos },
            scrollIntoView: true,
          });

          return true;
        }
      }

      return false;
    }),
    keymap.of(keybindings),
  ];
}
