import React, { useEffect } from 'react';
import { AlertTriangle, X, Save, Trash2, ArrowLeft } from 'lucide-react';

interface ConfirmCloseModalProps {
  isOpen: boolean;
  fileName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const ConfirmCloseModal: React.FC<ConfirmCloseModalProps> = ({
  isOpen,
  fileName,
  onSave,
  onDiscard,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSave();
      } else if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        e.stopPropagation();
        onDiscard();
      } else if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onSave, onDiscard, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-[var(--surface-color)] text-[var(--text-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col text-xs animate-slideDown select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-sm text-[var(--text-color)]">Save changes before closing?</span>
              <span className="text-[11px] text-[var(--muted-color)] block font-normal truncate max-w-[280px]">
                {fileName || 'Untitled.md'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            title="Cancel (Esc)"
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-2">
          <p className="text-xs text-[var(--text-color)] leading-relaxed">
            Do you want to save the changes you made to{' '}
            <strong className="font-semibold text-[var(--text-color)]">
              &ldquo;{fileName || 'Untitled.md'}&rdquo;
            </strong>
            ?
          </p>
          <p className="text-[11px] text-[var(--muted-color)]">
            If you close without saving, your recent edits will be discarded.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--hover-bg)]/20 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onDiscard}
            title="Don't Save (Ctrl+D)"
            className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium transition-colors cursor-pointer"
          >
            Don&apos;t Save
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              title="Cancel (Esc)"
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-color)] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              title="Save & Close (Enter)"
              className="px-4 py-1.5 rounded-lg bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 font-medium shadow-xs transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
