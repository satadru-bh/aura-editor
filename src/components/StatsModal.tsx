import React from 'react';
import { X, BookOpen, Clock, FileText, AlignLeft, Hash } from 'lucide-react';
import { DocumentStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  stats: DocumentStats;
  fileName: string;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  fileName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface-color)] text-[var(--text-color)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col text-xs animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
            <span className="font-semibold text-sm text-[var(--text-color)]">Document Statistics</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center pb-3 border-b border-[var(--border-color)]">
            <div className="text-[var(--muted-color)] text-[11px] uppercase tracking-wider font-mono">
              {fileName}
            </div>
            <div className="text-3xl font-bold font-serif mt-1 text-[var(--text-color)]">
              {stats.words.toLocaleString()}
            </div>
            <div className="text-[var(--muted-color)] text-xs">Total Words</div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[var(--hover-bg)]/20 border border-[var(--border-color)] flex flex-col gap-1">
              <span className="text-[var(--muted-color)] text-[11px]">Reading Time</span>
              <span className="text-base font-semibold font-mono text-[var(--text-color)]">
                ~{stats.readingTimeMinutes} min
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--hover-bg)]/20 border border-[var(--border-color)] flex flex-col gap-1">
              <span className="text-[var(--muted-color)] text-[11px]">Speaking Time</span>
              <span className="text-base font-semibold font-mono text-[var(--text-color)]">
                ~{stats.speakingTimeMinutes} min
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--hover-bg)]/20 border border-[var(--border-color)] flex flex-col gap-1">
              <span className="text-[var(--muted-color)] text-[11px]">Characters</span>
              <span className="text-base font-semibold font-mono text-[var(--text-color)]">
                {stats.characters.toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--muted-color)]">
                ({stats.charactersNoSpaces.toLocaleString()} no spaces)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--hover-bg)]/20 border border-[var(--border-color)] flex flex-col gap-1">
              <span className="text-[var(--muted-color)] text-[11px]">Paragraphs</span>
              <span className="text-base font-semibold font-mono text-[var(--text-color)]">
                {stats.paragraphs.toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--muted-color)]">
                ({stats.lines.toLocaleString()} lines)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
