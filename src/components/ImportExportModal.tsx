import React, { useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileText,
  Code,
  Printer,
  Copy,
  Archive,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FileItem, EditorSettings } from '../types';
import { ImportExportService } from '../services/ImportExportService';

interface ImportExportModalProps {
  isOpen: boolean;
  activeFile: FileItem | null;
  files: FileItem[];
  theme: string;
  settings?: EditorSettings;
  onImportFiles: (fileList: FileList) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  activeFile,
  files,
  theme,
  settings,
  onImportFiles,
  onShowToast,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentContent = activeFile?.content || '';
  const currentTitle = activeFile?.name || 'Untitled.md';

  const exportOptions = [
    {
      id: 'md',
      title: 'Markdown Document (.md)',
      desc: 'Standard portable Markdown with full formatting',
      icon: <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      action: () => {
        ImportExportService.exportMarkdown(currentTitle, currentContent);
        onShowToast('Exported Markdown file', 'success');
      },
    },
    {
      id: 'txt',
      title: 'Plain Text (.txt)',
      desc: 'Clean text stripped of markdown delimiters',
      icon: <FileText className="w-4 h-4 text-stone-500" />,
      action: () => {
        ImportExportService.exportPlainText(currentTitle, currentContent);
        onShowToast('Exported Plain Text file', 'success');
      },
    },
    {
      id: 'html',
      title: 'Styled Standalone HTML (.html)',
      desc: 'Self-contained webpage with embedded editorial typography & dark/light styles',
      icon: <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      action: async () => {
        await ImportExportService.exportHTML(currentTitle, currentContent, theme);
        onShowToast('Exported Standalone HTML', 'success');
      },
    },
    {
      id: 'rich-text',
      title: 'Copy Rich Text to Clipboard',
      desc: 'Paste directly into Microsoft Word, Google Docs, Apple Pages, or Email',
      icon: <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      action: async () => {
        const ok = await ImportExportService.copyRichText(currentContent);
        if (ok) onShowToast('Rich Text copied to clipboard', 'success');
      },
    },
    {
      id: 'pdf',
      title: 'PDF Document (.pdf)',
      desc: 'Publication-quality PDF with styled typography — downloads directly',
      icon: <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      action: async () => {
        try {
          await ImportExportService.exportPDF(currentTitle, currentContent, settings);
          onShowToast('Exported PDF document', 'success');
        } catch (e) {
          console.error(e);
          onShowToast('Failed to export PDF', 'error');
        }
      },
    },
    {
      id: 'latex',
      title: 'LaTeX Document (.tex)',
      desc: 'Academic manuscript format for TeX engines',
      icon: <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      action: () => {
        ImportExportService.exportLaTeX(currentTitle, currentContent);
        onShowToast('Exported LaTeX document', 'success');
      },
    },
    {
      id: 'json',
      title: 'JSON Metadata (.json)',
      desc: 'Structured document payload with metrics and timestamps',
      icon: <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      action: () => {
        if (activeFile) ImportExportService.exportJSON(activeFile);
        onShowToast('Exported JSON document', 'success');
      },
    },
    {
      id: 'zip',
      title: `Workspace Backup ZIP (${files.length} documents)`,
      desc: 'Archive of all documents currently in the local workspace',
      icon: <Archive className="w-4 h-4 text-amber-700 dark:text-amber-500" />,
      action: () => {
        ImportExportService.exportWorkspaceZip(files);
        onShowToast(`Exported ${files.length} documents as ZIP backup`, 'success');
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--surface-color)] text-[var(--text-color)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[85vh] text-xs animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--text-color)]" />
            <span className="font-semibold text-sm text-[var(--text-color)]">Import & Export</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Import Section */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-2.5">
              Import Documents
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  onImportFiles(e.dataTransfer.files);
                  onClose();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--text-color)]/40 bg-[var(--hover-bg)]/20 text-center cursor-pointer transition-colors flex flex-col items-center gap-1.5"
            >
              <div className="font-medium text-xs text-[var(--text-color)]">
                Click to browse or drop files here
              </div>
              <div className="text-[11px] text-[var(--muted-color)]">
                Supports <code className="font-mono">.md</code>, <code className="font-mono">.txt</code>, <code className="font-mono">.html</code> (auto-converted to Markdown), and <code className="font-mono">.json</code>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.markdown,.txt,.text,.html,.htm,.json"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onImportFiles(e.target.files);
                    onClose();
                  }
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Export Section */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-2.5">
              Export Options
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {exportOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    opt.action();
                    onClose();
                  }}
                  className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)] hover:border-[var(--text-color)]/40 text-left transition-all flex flex-col justify-center cursor-pointer"
                >
                  <div className="font-medium text-xs text-[var(--text-color)] truncate">
                    {opt.title}
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-color)] mt-0.5 line-clamp-2">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
