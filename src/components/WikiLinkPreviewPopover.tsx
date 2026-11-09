import React from 'react';
import { FileText, ArrowUpRight } from 'lucide-react';

export interface WikiLinkPreviewData {
  target: string;
  label: string;
  x: number;
  y: number;
  previewContent?: string;
  filePath?: string;
  exists: boolean;
}

interface WikiLinkPreviewPopoverProps {
  data: WikiLinkPreviewData | null;
}

export const WikiLinkPreviewPopover: React.FC<WikiLinkPreviewPopoverProps> = ({ data }) => {
  if (!data) return null;

  // Calculate clamp coordinates within viewport
  const left = Math.min(Math.max(16, data.x), window.innerWidth - 340);
  const top = Math.min(Math.max(16, data.y + 24), window.innerHeight - 200);

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 w-80 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/90 backdrop-blur-md shadow-2xl p-3.5 text-xs text-[var(--text-color)] pointer-events-none animate-in fade-in zoom-in-95 duration-150 transition-all select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]/60">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <FileText className="w-3.5 h-3.5 text-[var(--muted-color)] shrink-0" />
          <span className="truncate">{data.target}</span>
        </div>
        <span className="text-[10px] text-[var(--muted-color)] flex items-center gap-0.5 shrink-0">
          Click <ArrowUpRight className="w-3 h-3 inline" />
        </span>
      </div>

      {data.filePath && (
        <div className="text-[10px] text-[var(--muted-color)] font-mono truncate mb-2">
          {data.filePath}
        </div>
      )}

      <div className="text-[11px] leading-relaxed text-[var(--text-color)] opacity-85 max-h-32 overflow-hidden font-serif line-clamp-5 whitespace-pre-wrap">
        {data.previewContent ? data.previewContent : (
          <span className="italic text-[var(--muted-color)]">
            {data.exists ? 'Empty document' : 'Note does not exist yet. Click to create.'}
          </span>
        )}
      </div>
    </div>
  );
};
