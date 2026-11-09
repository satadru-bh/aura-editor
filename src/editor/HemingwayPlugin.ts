import { Extension, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

export function createHemingwayPlugin(enabled: boolean): Extension {
  if (!enabled) return [];

  return Prec.highest(
    keymap.of([
      {
        key: 'Backspace',
        run: () => {
          // Suppress Backspace to enforce forward-only momentum
          return true;
        },
      },
      {
        key: 'Delete',
        run: () => {
          // Suppress Delete
          return true;
        },
      },
    ])
  );
}
