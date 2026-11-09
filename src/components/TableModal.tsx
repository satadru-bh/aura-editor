import React, { useState, useMemo } from 'react';
import {
  Table,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  X,
  LayoutGrid,
} from 'lucide-react';

export type ColumnAlignment = 'left' | 'center' | 'right';

export interface ColumnConfig {
  id: string;
  name: string;
  align: ColumnAlignment;
}

export interface TablePreset {
  id: string;
  name: string;
  desc: string;
  columns: { name: string; align: ColumnAlignment }[];
  rows: string[][];
}

const TABLE_PRESETS: TablePreset[] = [
  {
    id: 'comparison',
    name: 'Feature Comparison',
    desc: 'Compare plans, tiers, or features',
    columns: [
      { name: 'Feature', align: 'left' },
      { name: 'Free', align: 'center' },
      { name: 'Pro', align: 'center' },
      { name: 'Enterprise', align: 'center' },
    ],
    rows: [
      ['Offline Writing', 'Yes', 'Yes', 'Yes'],
      ['Custom Themes', 'Standard (5)', 'All 18 Themes', 'Custom CSS'],
      ['Zero-Knowledge AES-256', 'Yes', 'Yes', 'Yes'],
      ['Cloud Backup', 'No', 'Optional', 'Dedicated Vault'],
    ],
  },
  {
    id: 'sprint',
    name: 'Sprint / Task Tracker',
    desc: 'Track tasks, assignees, and progress',
    columns: [
      { name: 'Task', align: 'left' },
      { name: 'Assignee', align: 'left' },
      { name: 'Priority', align: 'center' },
      { name: 'Status', align: 'center' },
    ],
    rows: [
      ['Setup project scaffolding', '@satadru', 'High', 'Completed'],
      ['Design theme morphic UI', '@alex', 'High', 'In Progress'],
      ['Write automated unit tests', '@dev', 'Medium', 'Pending'],
    ],
  },
  {
    id: 'metrics',
    name: 'Quarterly Metrics',
    desc: 'Financial and performance data',
    columns: [
      { name: 'Metric', align: 'left' },
      { name: 'Q1 Target', align: 'right' },
      { name: 'Q1 Actual', align: 'right' },
      { name: 'Growth', align: 'center' },
    ],
    rows: [
      ['Active Writers', '10,000', '14,250', '+42.5%'],
      ['Words Authored', '1.2M', '2.4M', '+100%'],
      ['Avg. Focus Time', '45 min', '62 min', '+37.7%'],
    ],
  },
  {
    id: 'schedule',
    name: 'Weekly Schedule',
    desc: 'Timetable or daily agenda',
    columns: [
      { name: 'Time', align: 'left' },
      { name: 'Monday', align: 'left' },
      { name: 'Wednesday', align: 'left' },
      { name: 'Friday', align: 'left' },
    ],
    rows: [
      ['09:00 - 11:00', 'Deep Writing', 'Research & Draft', 'Editing & Polish'],
      ['14:00 - 16:00', 'Review Notes', 'Knowledge Graph', 'Weekly Export'],
    ],
  },
];

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (markdown: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
}) => {
  const [colsCount, setColsCount] = useState<number>(3);
  const [rowsCount, setRowsCount] = useState<number>(3);
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [fillPlaceholders, setFillPlaceholders] = useState<boolean>(true);
  const [hoverGrid, setHoverGrid] = useState<{ r: number; c: number } | null>(null);

  // Column definitions
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'col-1', name: 'Column 1', align: 'left' },
    { id: 'col-2', name: 'Column 2', align: 'center' },
    { id: 'col-3', name: 'Column 3', align: 'right' },
  ]);

  // Optional custom row data
  const [customRows, setCustomRows] = useState<string[][]>([]);

  // Synchronize column configs when count changes
  const handleUpdateColsCount = (newCount: number) => {
    const count = Math.max(1, Math.min(12, newCount));
    setColsCount(count);

    setColumns((prev) => {
      if (count > prev.length) {
        const added: ColumnConfig[] = [];
        for (let i = prev.length + 1; i <= count; i++) {
          added.push({
            id: `col-${i}-${Date.now()}`,
            name: `Column ${i}`,
            align: i % 3 === 1 ? 'left' : i % 3 === 2 ? 'center' : 'right',
          });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  const handleUpdateColumnName = (index: number, name: string) => {
    setColumns((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], name };
      }
      return copy;
    });
  };

  const handleUpdateColumnAlign = (index: number, align: ColumnAlignment) => {
    setColumns((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], align };
      }
      return copy;
    });
  };

  const handleApplyPreset = (preset: TablePreset) => {
    setColsCount(preset.columns.length);
    setRowsCount(preset.rows.length);
    setColumns(
      preset.columns.map((c, i) => ({
        id: `preset-col-${i}-${Date.now()}`,
        name: c.name,
        align: c.align,
      }))
    );
    setCustomRows(preset.rows);
    setHasHeader(true);
  };

  // Generate formatted Markdown
  const generatedMarkdown = useMemo(() => {
    const lines: string[] = [];

    // Header Row
    if (hasHeader) {
      const headerCells = columns.map((c) => c.name || `Column`);
      lines.push(`| ${headerCells.join(' | ')} |`);

      // Alignment Delimiter Row
      const delimCells = columns.map((c) => {
        if (c.align === 'center') return ':---:';
        if (c.align === 'right') return '---:';
        return ':---';
      });
      lines.push(`| ${delimCells.join(' | ')} |`);
    }

    // Data Rows
    for (let r = 0; r < rowsCount; r++) {
      const rowCells: string[] = [];
      for (let c = 0; c < columns.length; c++) {
        if (customRows[r] && customRows[r][c] !== undefined) {
          rowCells.push(customRows[r][c]);
        } else if (fillPlaceholders) {
          const colName = columns[c]?.name || `Col ${c + 1}`;
          rowCells.push(`${colName} ${r + 1}`);
        } else {
          rowCells.push('   ');
        }
      }
      lines.push(`| ${rowCells.join(' | ')} |`);
    }

    return `\n${lines.join('\n')}\n\n`;
  }, [columns, rowsCount, hasHeader, fillPlaceholders, customRows]);

  if (!isOpen) return null;

  const handleInsert = () => {
    onInsertTable(generatedMarkdown);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[var(--surface-color)] text-[var(--text-color)] border border-[var(--border-color)] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-color)]">
                Table Generator
              </h3>
              <p className="text-xs text-[var(--muted-color)]">
                Customize grid dimensions, column alignments, headers, and presets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Presets Bar */}
          <div>
            <div className="font-semibold text-[11px] uppercase tracking-wider text-[var(--muted-color)] mb-2">
              Layout Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TABLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/40 hover:bg-[var(--hover-bg)] text-left transition-all hover:border-[var(--text-color)]/30 cursor-pointer group"
                >
                  <div className="font-semibold text-[11px] text-[var(--text-color)] transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-[var(--muted-color)] mt-0.5 line-clamp-1">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Grid & Dimension Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-[var(--hover-bg)]/30 border border-[var(--border-color)]">
            {/* Visual Grid Picker */}
            <div className="flex flex-col items-center justify-center p-2">
              <div className="text-[11px] font-semibold text-[var(--text-color)] mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-[var(--text-color)]" />
                <span>
                  Grid Picker (
                  {hoverGrid ? `${hoverGrid.c} × ${hoverGrid.r}` : `${colsCount} × ${rowsCount}`})
                </span>
              </div>

              <div
                className="grid grid-cols-8 gap-1 p-2 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)]"
                onMouseLeave={() => setHoverGrid(null)}
              >
                {Array.from({ length: 6 }).map((_, rIdx) =>
                  Array.from({ length: 8 }).map((_, cIdx) => {
                    const r = rIdx + 1;
                    const c = cIdx + 1;
                    const isHighlighted = hoverGrid
                      ? r <= hoverGrid.r && c <= hoverGrid.c
                      : r <= rowsCount && c <= colsCount;

                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => setHoverGrid({ r, c })}
                        onClick={() => {
                          handleUpdateColsCount(c);
                          setRowsCount(r);
                          setCustomRows([]);
                        }}
                        className={`w-5 h-5 rounded transition-all cursor-pointer ${
                          isHighlighted
                            ? 'bg-[var(--text-color)] opacity-90 scale-95'
                            : 'bg-[var(--hover-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]/80'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Stepper Inputs */}
            <div className="space-y-4 flex flex-col justify-center">
              {/* Columns Stepper */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-color)]">
                  <Columns className="w-4 h-4 text-[var(--muted-color)]" />
                  <span className="font-semibold">Columns</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateColsCount(colsCount - 1)}
                    disabled={colsCount <= 1}
                    className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--hover-bg)] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm">
                    {colsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateColsCount(colsCount + 1)}
                    disabled={colsCount >= 12}
                    className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--hover-bg)] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rows Stepper */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-color)]">
                  <Rows className="w-4 h-4 text-[var(--muted-color)]" />
                  <span className="font-semibold">Data Rows</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRowsCount((r) => Math.max(1, r - 1))}
                    disabled={rowsCount <= 1}
                    className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--hover-bg)] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm">
                    {rowsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRowsCount((r) => Math.min(30, r + 1))}
                    disabled={rowsCount >= 30}
                    className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--hover-bg)] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Options Toggles */}
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="rounded accent-[var(--text-color)]"
                  />
                  <span className="text-[11px] font-medium">Header Row</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fillPlaceholders}
                    onChange={(e) => setFillPlaceholders(e.target.checked)}
                    className="rounded accent-[var(--text-color)]"
                  />
                  <span className="text-[11px] font-medium">Sample Data</span>
                </label>
              </div>
            </div>
          </div>

          {/* Per-Column Customizer */}
          <div className="space-y-2">
            <div className="font-semibold text-[11px] uppercase tracking-wider text-[var(--muted-color)]">
              Customize Columns & Alignments
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-[var(--hover-bg)]/40 border border-[var(--border-color)]"
                >
                  <span className="font-mono text-[10px] text-[var(--muted-color)] w-5 text-center">
                    #{idx + 1}
                  </span>

                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleUpdateColumnName(idx, e.target.value)}
                    placeholder={`Column ${idx + 1} Title`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] text-xs text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--text-color)]/30 focus:border-[var(--text-color)]/50 font-medium"
                  />

                  {/* Alignment Button Group */}
                  <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-0.5">
                    <button
                      type="button"
                      title="Align Left (:---)"
                      onClick={() => handleUpdateColumnAlign(idx, 'left')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        col.align === 'left'
                          ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                          : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Align Center (:---:)"
                      onClick={() => handleUpdateColumnAlign(idx, 'center')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        col.align === 'center'
                          ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                          : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Align Right (---:)"
                      onClick={() => handleUpdateColumnAlign(idx, 'right')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        col.align === 'right'
                          ? 'bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-2xs'
                          : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <div className="font-semibold text-[11px] uppercase tracking-wider text-[var(--muted-color)]">
              Markdown Output
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-color)]/70 border border-[var(--border-color)] font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed text-[var(--text-color)]">
              {generatedMarkdown.trim()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--hover-bg)]/20">
          <div className="text-[11px] text-[var(--muted-color)]">
            Inserts a clean GFM compliant Markdown table at cursor
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-5 py-2 rounded-xl bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
