import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: 'General',
      shortcuts: [
        { key: 'Ctrl + K', desc: 'Open Command Palette' },
        { key: 'Ctrl + S', desc: 'Save Document' },
        { key: 'Ctrl + Shift + S', desc: 'Save Document As...' },
        { key: 'Ctrl + Shift + I', desc: 'Open Import & Export Hub' },
        { key: 'Ctrl + N', desc: 'Create New Document' },
        { key: 'Ctrl + W', desc: 'Close Active Tab' },
        { key: 'Ctrl + O', desc: 'Open Document from Disk' },
        { key: 'Ctrl + ,', desc: 'Open Preferences' },
        { key: 'Ctrl + /', desc: 'Shortcuts Cheat Sheet' },
        { key: 'Ctrl + = / +', desc: 'Zoom In (Increase Scale)' },
        { key: 'Ctrl + -', desc: 'Zoom Out (Decrease Scale)' },
        { key: 'Ctrl + 0', desc: 'Reset Zoom (100%)' },
      ],
    },
    {
      group: 'View, Minimal Mode & Security',
      shortcuts: [
        { key: 'F11', desc: 'Toggle True Fullscreen (OS Window Fullscreen)' },
        { key: 'Alt + Z / Ctrl+Shift+M', desc: 'Toggle Minimal Writing Mode (Zen Mode)' },
        { key: 'Esc', desc: 'Exit Minimal Writing Mode' },
        { key: 'Ctrl + Alt + T', desc: 'Toggle Top Title Bar' },
        { key: 'Drag Tab Out', desc: 'Detach Tab as Floating Window' },
        { key: 'Drag Floating to Bar', desc: 'Dock / Remerge Floating Window into Tab Bar' },
        { key: 'Ctrl + L', desc: 'Encrypt & Lock Document (AES-256)' },
        { key: 'Ctrl + Shift + F / F10', desc: 'Toggle Focus Mode (Paragraph Dimming)' },
        { key: 'Ctrl + Shift + U', desc: 'Cycle Editor Modes (Live ↔ Source ↔ Split)' },
        { key: 'Ctrl + Shift + E', desc: 'Toggle Sidebar (Documents Tab)' },
        { key: 'Ctrl + Shift + O', desc: 'Toggle Sidebar (File Structure Outline Tab)' },
        { key: 'Ctrl + F', desc: 'Find in Document' },
        { key: 'Ctrl + H', desc: 'Find & Replace in Document' },
      ],
    },
    {
      group: 'Word Triggers & Snippets (Type anywhere in editor)',
      shortcuts: [
        { key: ':date', desc: 'Inserts current date (YYYY-MM-DD)' },
        { key: ':time', desc: 'Inserts current time (HH:MM)' },
        { key: ';sig', desc: 'Inserts sign-off signature' },
        { key: '!todo', desc: 'Inserts checklist task item (- [ ])' },
        { key: '!tip / !note / !warn', desc: 'Inserts formatted GFM callout block' },
        { key: '!code', desc: 'Inserts fenced code block template' },
        { key: ';shrug / ;arrow', desc: 'Inserts Unicode glyphs / symbols' },
      ],
    },
    {
      group: 'Live Formatting',
      shortcuts: [
        { key: 'Ctrl + B', desc: 'Toggle Bold (**text**)' },
        { key: 'Ctrl + I', desc: 'Toggle Italic (*text*)' },
        { key: 'Ctrl + E', desc: 'Toggle Inline Code (`code`)' },
        { key: 'Ctrl + Shift + X', desc: 'Toggle Strikethrough (~~text~~)' },
        { key: 'Ctrl + Shift + Q', desc: 'Toggle Blockquote (> quote)' },
        { key: 'Ctrl + Shift + C', desc: 'Toggle Checklist (- [ ])' },
        { key: 'Ctrl + Shift + T', desc: 'Custom Table Generator (Grid & Presets)' },
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: 'Redo' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface-color)] text-[var(--text-color)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[80vh] text-xs animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
            <span className="font-semibold text-sm text-[var(--text-color)]">Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-4">
          {shortcutGroups.map((g) => (
            <div key={g.group}>
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                {g.group}
              </div>
              <div className="space-y-1.5">
                {g.shortcuts.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    <span className="text-stone-700 dark:text-stone-300">{s.desc}</span>
                    <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
