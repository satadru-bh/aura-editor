import React, { useState } from 'react';
import {
  X,
  Palette,
  Layout,
  Sliders,
  History,
  Check,
  RotateCcw,
  Sparkles,
  Type,
  Maximize2,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  Code,
  Eye,
  Columns,
  RefreshCw,
  FileCode,
} from 'lucide-react';
import {
  EditorSettings,
  ThemeId,
  FontId,
  ContentWidth,
  FileItem,
  WordTrigger,
  EditorViewMode,
} from '../types';
import { autosaveService, RevisionSnapshot } from '../services/AutosaveService';
import { DEFAULT_WORD_TRIGGERS } from '../editor/WordTriggerPlugin';

interface SettingsModalProps {
  isOpen: boolean;
  settings: EditorSettings;
  activeFile: FileItem | null;
  appVersion?: string;
  onCheckForUpdates?: () => void;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  onRestoreSnapshot: (snapshot: RevisionSnapshot) => void;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'layout' | 'editor' | 'triggers' | 'revisions';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  activeFile,
  appVersion,
  onCheckForUpdates,
  onUpdateSettings,
  onRestoreSnapshot,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [newTriggerCode, setNewTriggerCode] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newDescription, setNewDescription] = useState('');

  if (!isOpen) return null;

  const currentTriggers: WordTrigger[] = settings.wordTriggers || DEFAULT_WORD_TRIGGERS;

  const handleToggleTrigger = (id: string) => {
    const updated = currentTriggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    onUpdateSettings({ wordTriggers: updated });
  };

  const handleDeleteTrigger = (id: string) => {
    const updated = currentTriggers.filter((t) => t.id !== id);
    onUpdateSettings({ wordTriggers: updated });
  };

  const handleAddTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTriggerCode.trim() || !newReplacement.trim()) return;

    const newTrigger: WordTrigger = {
      id: `wt-${Date.now()}`,
      trigger: newTriggerCode.trim(),
      replacement: newReplacement,
      enabled: true,
      description: newDescription.trim() || undefined,
    };

    const updated = [...currentTriggers, newTrigger];
    onUpdateSettings({ wordTriggers: updated });
    setNewTriggerCode('');
    setNewReplacement('');
    setNewDescription('');
    setIsAddingTrigger(false);
  };

  const handleResetTriggers = () => {
    onUpdateSettings({ wordTriggers: DEFAULT_WORD_TRIGGERS });
  };

  const themes: {
    id: ThemeId;
    name: string;
    desc: string;
    bg: string;
    surface: string;
    text: string;
    accent: string;
  }[] = [
    {
      id: 'paper',
      name: 'Paper Warm',
      desc: 'Warm ivory canvas for natural editorial comfort',
      bg: '#FAF8F5',
      surface: '#F3EFEA',
      text: '#22201E',
      accent: '#B45309',
    },
    {
      id: 'white',
      name: 'Pure White',
      desc: 'Clean, modern studio brightness',
      bg: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#111827',
      accent: '#3B82F6',
    },
    {
      id: 'dark',
      name: 'Obsidian Dark',
      desc: 'Deep warm charcoal for focused night writing',
      bg: '#141414',
      surface: '#1F1F1F',
      text: '#ECECEC',
      accent: '#38BDF8',
    },
    {
      id: 'oled',
      name: 'True OLED',
      desc: 'Pure pitch black for zero-bleed contrast',
      bg: '#000000',
      surface: '#111111',
      text: '#FAFAFA',
      accent: '#60A5FA',
    },
    {
      id: 'slate',
      name: 'Nordic Slate',
      desc: 'Subtle midnight blue tones',
      bg: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
      accent: '#38BDF8',
    },
    {
      id: 'sepia',
      name: 'Antique Sepia',
      desc: 'Vintage parchment and warm coffee tones',
      bg: '#FBF0D9',
      surface: '#F3E4C3',
      text: '#433422',
      accent: '#B45309',
    },
    {
      id: 'nord',
      name: 'Nord Frost',
      desc: 'Arctic blue and muted polar tones',
      bg: '#2E3440',
      surface: '#3B4252',
      text: '#ECEFF4',
      accent: '#88C0D0',
    },
    {
      id: 'dracula',
      name: 'Dracula Gothic',
      desc: 'Vibrant midnight purple & neon accents',
      bg: '#282A36',
      surface: '#343746',
      text: '#F8F8F2',
      accent: '#BD93F9',
    },
    {
      id: 'solarizedLight',
      name: 'Solarized Light',
      desc: 'Precision designer cream & cyan harmony',
      bg: '#FDF6E3',
      surface: '#EEE8D5',
      text: '#586E75',
      accent: '#268BD2',
    },
    {
      id: 'solarizedDark',
      name: 'Solarized Dark',
      desc: 'Deep oceanic abyss & amber highlights',
      bg: '#002B36',
      surface: '#073642',
      text: '#93A1A1',
      accent: '#2AA198',
    },
    {
      id: 'forest',
      name: 'Deep Forest',
      desc: 'Calming pine needle & evergreen moss',
      bg: '#15201B',
      surface: '#1E2D26',
      text: '#D8E2DC',
      accent: '#4ADE80',
    },
    {
      id: 'coffee',
      name: 'Espresso Mocha',
      desc: 'Rich roasted coffee & warm cream text',
      bg: '#1F1916',
      surface: '#2B231F',
      text: '#E6DFDA',
      accent: '#D97706',
    },
    {
      id: 'terracotta',
      name: 'Terracotta Dusk',
      desc: 'Warm desert sunset & clay accents',
      bg: '#2B1810',
      surface: '#3C2217',
      text: '#F5EBE6',
      accent: '#F97316',
    },
    {
      id: 'lavender',
      name: 'Twilight Lavender',
      desc: 'Soft dreamlike violet & wisteria',
      bg: '#1E1B2E',
      surface: '#28243D',
      text: '#E2DDF5',
      accent: '#A78BFA',
    },
    {
      id: 'matrix',
      name: 'Terminal Matrix',
      desc: 'Deep obsidian & phosphor cyber green',
      bg: '#08140B',
      surface: '#0E2012',
      text: '#4ADE80',
      accent: '#22C55E',
    },
    {
      id: 'rosePine',
      name: 'Rosé Pine',
      desc: 'Soothing Nordic pine & rose dusk',
      bg: '#191724',
      surface: '#211F30',
      text: '#E0DEF4',
      accent: '#EB6F92',
    },
    {
      id: 'hcLight',
      name: 'High Contrast Light',
      desc: 'Maximum contrast black text on white',
      bg: '#FFFFFF',
      surface: '#EEEEEE',
      text: '#000000',
      accent: '#000000',
    },
    {
      id: 'hcDark',
      name: 'High Contrast Dark',
      desc: 'Maximum contrast white text on black',
      bg: '#000000',
      surface: '#222222',
      text: '#FFFFFF',
      accent: '#FFFFFF',
    },
  ];

  const fonts: {
    id: FontId;
    name: string;
    family: string;
    sample: string;
    desc: string;
    css: string;
  }[] = [
    {
      id: 'serif',
      name: 'Editorial Serif',
      family: 'Newsreader / Charter',
      sample: 'The quick brown fox jumps over the lazy dog.',
      desc: 'Classical literary proportion with delicate serifs',
      css: 'font-serif',
    },
    {
      id: 'sans',
      name: 'Modern Sans',
      family: 'Inter / SF Pro',
      sample: 'The quick brown fox jumps over the lazy dog.',
      desc: 'Ultra-clean geometric precision for contemporary essays',
      css: 'font-sans',
    },
    {
      id: 'mono',
      name: 'Code Monospace',
      family: 'JetBrains Mono',
      sample: 'The quick brown fox jumps over the lazy dog.',
      desc: 'Fixed-width clarity designed for technical writers and coders',
      css: 'font-mono',
    },
    {
      id: 'quattro',
      name: 'Humanist Quattro',
      family: 'Literata / Quattro',
      sample: 'The quick brown fox jumps over the lazy dog.',
      desc: 'Balanced hybrid proportion optimized for long-form comfort',
      css: 'font-quattro',
    },
  ];

  const widthOptions: { value: ContentWidth; label: string; desc: string }[] = [
    { value: '800px', label: '800px', desc: 'Comfortable standard' },
    { value: '980px', label: '980px', desc: 'Optimal wide (Default)' },
    { value: '1160px', label: '1160px', desc: 'Spacious canvas' },
    { value: '1360px', label: '1360px', desc: 'Ultra-wide display' },
    { value: '100%', label: '100%', desc: 'Full screen edge-to-edge' },
  ];

  const snapshots: RevisionSnapshot[] = activeFile ? autosaveService.getSnapshots(activeFile.id) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all animate-fadeIn select-none p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[620px] max-h-[90vh] bg-[var(--surface-color)] text-[var(--text-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col sm:flex-row text-xs animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Sidebar */}
        <div className="w-full sm:w-52 flex-shrink-0 bg-[var(--bg-color)]/60 border-b sm:border-b-0 sm:border-r border-[var(--border-color)] p-3 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="px-2.5 py-2 mb-3 flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
              <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100">
                Preferences
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>Appearance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`w-full flex items-center px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'layout'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>Canvas & Layout</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`w-full flex items-center px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>Editor Behavior</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('triggers')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'triggers'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>Word Triggers</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">
                  {currentTriggers.filter((t) => t.enabled).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('revisions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'revisions'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>Revisions</span>
                {snapshots.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">
                    {snapshots.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Footer close button */}
          <div className="pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center py-1.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--border-color)] text-[var(--text-color)] font-medium transition-colors cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Color Themes */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider mb-3">
                  Color Themes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onUpdateSettings({ theme: t.id })}
                        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-24 cursor-pointer ${
                          isSelected
                            ? 'border-[var(--text-color)]/70 ring-2 ring-[var(--text-color)]/20 shadow-md'
                            : 'border-[var(--border-color)] hover:border-[var(--text-color)]/30'
                        }`}
                        style={{ backgroundColor: t.bg, color: t.text }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{t.name}</span>
                          {isSelected && (
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                              style={{ backgroundColor: t.accent }}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Miniature Document Preview */}
                        <div
                          className="p-1.5 rounded-md text-[10px] space-y-1 opacity-80"
                          style={{ backgroundColor: t.surface }}
                        >
                          <div
                            className="h-1.5 w-1/3 rounded-full"
                            style={{ backgroundColor: t.accent }}
                          />
                          <div className="h-1 w-full bg-current opacity-20 rounded-full" />
                          <div className="h-1 w-2/3 bg-current opacity-20 rounded-full" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography / Typeface */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider mb-3">
                  Typography Typeface
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {fonts.map((f) => {
                    const isSelected = settings.font === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => onUpdateSettings({ font: f.id })}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[var(--text-color)]/50 bg-[var(--hover-bg)] ring-1 ring-[var(--text-color)]/20 shadow-2xs'
                            : 'border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[var(--text-color)]">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted-color)] font-mono">
                              ({f.family})
                            </span>
                          </div>
                          <p className={`text-sm opacity-90 ${f.css}`}>{f.sample}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--text-color)] text-[var(--bg-color)] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANVAS & LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Content Width */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider mb-1">
                  Canvas Writing Width
                </div>
                <p className="text-[11px] text-[var(--muted-color)] mb-3">
                  Controls the maximum horizontal column width of the editorial writing area.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {widthOptions.map((w) => {
                    const isSelected = settings.contentWidth === w.value;
                    return (
                      <button
                        key={w.value}
                        onClick={() => onUpdateSettings({ contentWidth: w.value })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--text-color)]/50 bg-[var(--hover-bg)] ring-1 ring-[var(--text-color)]/20 shadow-2xs'
                            : 'border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        <div className="font-semibold text-xs text-[var(--text-color)]">
                          {w.label}
                        </div>
                        <div className="text-[10px] text-[var(--muted-color)] mt-0.5">{w.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Line Height Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Font Size */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--text-color)]">
                      Font Size
                    </span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-color)]">
                      {settings.fontSize} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="28"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-[var(--text-color)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--muted-color)]">
                    <span>14px</span>
                    <span>18px (Default)</span>
                    <span>28px</span>
                  </div>
                </div>

                {/* Line Height */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--text-color)]">
                      Line Spacing
                    </span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-color)]">
                      {settings.lineHeight}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.4"
                    max="2.2"
                    step="0.05"
                    value={settings.lineHeight}
                    onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full accent-[var(--text-color)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>1.4 (Compact)</span>
                    <span>1.75 (Default)</span>
                    <span>2.2 (Loose)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDITOR BEHAVIOR */}
          {activeTab === 'editor' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-2">
                Writing Behavior & Features
              </div>

              {/* Primary Editor Mode 3-Way Selector */}
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-[var(--text-color)] uppercase tracking-wider mb-1.5">
                  Editor View Mode
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'live' as EditorViewMode,
                      name: 'Live Mode',
                      desc: 'In-place rich Markdown rendering',
                      icon: <Eye className="w-4 h-4 text-emerald-500" />,
                    },
                    {
                      id: 'source' as EditorViewMode,
                      name: 'Source Mode',
                      desc: 'Raw Markdown code editing',
                      icon: <FileCode className="w-4 h-4 text-amber-500" />,
                    },
                    {
                      id: 'split' as EditorViewMode,
                      name: 'Split Mode',
                      desc: 'Source on left, Live on right',
                      icon: <Columns className="w-4 h-4 text-sky-500" />,
                    },
                  ].map((mode) => {
                    const currentMode = settings.editorMode || (settings.liveMarkdown ? 'live' : 'source');
                    const isSelected = currentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            editorMode: mode.id,
                            liveMarkdown: mode.id !== 'source',
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[var(--text-color)]/50 bg-[var(--hover-bg)] ring-1 ring-[var(--text-color)]/20 shadow-2xs'
                            : 'border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            {mode.icon}
                            <span className="font-semibold text-xs text-[var(--text-color)]">
                              {mode.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[var(--text-color)] text-[var(--bg-color)] flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--muted-color)]">{mode.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              {[
                {
                  key: 'focusMode',
                  label: 'Focus Mode (Paragraph Dimming)',
                  desc: 'Keep active paragraph at 100% opacity while softly dimming inactive paragraphs (Ctrl+Shift+F)',
                  val: settings.focusMode,
                },
                {
                  key: 'liveMarkdown',
                  label: 'Live Markdown Rendering',
                  desc: 'Render headings, tasks, formatting and math in-place as you write',
                  val: settings.liveMarkdown,
                },
                {
                  key: 'typewriterMode',
                  label: 'Typewriter Scrolling Mode',
                  desc: 'Automatically maintain active typing line centered vertically in the viewport',
                  val: settings.typewriterMode,
                },
                {
                  key: 'spellcheck',
                  label: 'Spellcheck & Autocorrect',
                  desc: 'Check spelling on prose text while automatically suppressing inside code blocks',
                  val: settings.spellcheck,
                },
                {
                  key: 'minimalMode',
                  label: 'Minimal Writing Mode (Zen Mode)',
                  desc: 'Hide all toolbars, bars, and clutter for pure, distraction-free writing',
                  val: settings.minimalMode,
                },
                {
                  key: 'showTitleBar',
                  label: 'Show Top Title Bar',
                  desc: 'Display document name, stats, and top action toolbar',
                  val: settings.showTitleBar,
                },
                {
                  key: 'showTabBar',
                  label: 'Show Document Tab Bar',
                  desc: 'Display open document tabs strip above the editor area (hidden by default)',
                  val: settings.showTabBar,
                },
                {
                  key: 'showStatusBar',
                  label: 'Show Bottom Status Bar',
                  desc: 'Display word counter, character stats, reading time, and cursor coordinates',
                  val: settings.showStatusBar,
                },
                {
                  key: 'showLineNumbers',
                  label: 'Show Line Numbers Gutter',
                  desc: 'Display subtle minimalist line numbers in the left margin',
                  val: settings.showLineNumbers,
                },
                {
                  key: 'vimMode',
                  label: 'Vim Modal Keybindings',
                  desc: 'Enable full Vim normal, visual, and insert mode modal navigation',
                  val: settings.vimMode,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => onUpdateSettings({ [item.key]: !item.val })}
                  className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 pr-4">
                    <div className="font-semibold text-xs text-[var(--text-color)]">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[var(--muted-color)]">{item.desc}</div>
                  </div>

                  {/* Switch Pill */}
                  <div
                    className={`w-10 h-5 rounded-full transition-colors p-0.5 flex-shrink-0 flex items-center ${
                      item.val ? 'bg-[var(--text-color)]' : 'bg-[var(--border-color)]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[var(--bg-color)] shadow-md transform transition-transform ${
                        item.val ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: WORD TRIGGERS & TEXT EXPANSIONS */}
          {activeTab === 'triggers' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider">
                    Word Triggers & Snippets
                  </div>
                  <p className="text-[11px] text-[var(--muted-color)]">
                    Type a trigger code anywhere in the editor to instantly expand it into custom text or dynamic macros.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTrigger(!isAddingTrigger)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  {isAddingTrigger ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAddingTrigger ? 'Cancel' : 'Add'}</span>
                </button>
              </div>

              {/* Add Trigger Inline Form */}
              {isAddingTrigger && (
                <form
                  onSubmit={handleAddTrigger}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 space-y-3 animate-slideDown"
                >
                  <div className="font-semibold text-xs text-[var(--text-color)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create New Word Trigger</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-color)] mb-1">
                        Trigger Code <span className="text-[var(--muted-color)] font-normal">(e.g. <code>:date</code> or <code>;sig</code>)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder=":mycode or ;shortcut"
                        value={newTriggerCode}
                        onChange={(e) => setNewTriggerCode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--hover-bg)]/30 border border-[var(--border-color)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--text-color)]/50 focus:ring-1 focus:ring-[var(--text-color)]/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-color)] mb-1">
                        Description <span className="text-[var(--muted-color)] font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. My email sign-off"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--hover-bg)]/30 border border-[var(--border-color)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--text-color)]/50 focus:ring-1 focus:ring-[var(--text-color)]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-color)] mb-1">
                      Replacement Content
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter the expanded text. Supports {{date}}, {{time}}, {{datetime}}, {{cursor}}"
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--hover-bg)]/30 border border-[var(--border-color)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--text-color)]/50 focus:ring-1 focus:ring-[var(--text-color)]/20 font-mono"
                    />
                  </div>

                  {/* Dynamic Macros Guide */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--muted-color)]">
                    <span className="font-semibold text-[var(--text-color)]">Supported Macros:</span>
                    {['{{date}}', '{{time}}', '{{datetime}}', '{{cursor}}', '{{weekday}}', '{{month}}', '{{year}}'].map(
                      (macro) => (
                        <button
                          key={macro}
                          type="button"
                          onClick={() => setNewReplacement((prev: string) => prev + macro)}
                          className="px-1.5 py-0.5 rounded bg-[var(--hover-bg)] hover:bg-[var(--border-color)] text-[var(--text-color)] font-mono text-[9px] transition-colors cursor-pointer border border-[var(--border-color)]"
                        >
                          +{macro}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTrigger(false)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--border-color)] text-[var(--muted-color)] hover:text-[var(--text-color)] text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Save Trigger
                    </button>
                  </div>
                </form>
              )}

              {/* Triggers List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {currentTriggers.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      item.enabled
                        ? 'border-[var(--border-color)] bg-[var(--hover-bg)]/20'
                        : 'border-[var(--border-color)] opacity-50 bg-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleTrigger(item.id)}
                        title={item.enabled ? 'Disable Trigger' : 'Enable Trigger'}
                        className={`w-8 h-4 rounded-full transition-colors p-0.5 mt-0.5 flex-shrink-0 flex items-center cursor-pointer ${
                          item.enabled ? 'bg-[var(--text-color)]' : 'bg-[var(--border-color)]'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-[var(--bg-color)] shadow-sm transform transition-transform ${
                            item.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Trigger Details */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--text-color)] border border-[var(--border-color)]">
                            {item.trigger}
                          </span>
                          {item.description && (
                            <span className="text-[11px] text-[var(--muted-color)] truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-color)] bg-[var(--hover-bg)]/40 p-1.5 rounded-md break-all whitespace-pre-wrap max-h-16 overflow-y-auto border border-[var(--border-color)]">
                          {item.replacement}
                        </div>
                      </div>
                    </div>

                    {/* Delete Trigger Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTrigger(item.id)}
                      title="Delete Trigger"
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-[var(--muted-color)] hover:text-red-500 transition-colors flex-shrink-0 mt-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Reset to Defaults button */}
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--muted-color)]">
                <span>{currentTriggers.length} triggers configured</span>
                <button
                  type="button"
                  onClick={handleResetTriggers}
                  className="hover:text-[var(--text-color)] underline transition-colors cursor-pointer"
                >
                  Reset to default triggers
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: REVISIONS & SAFETY */}
          {activeTab === 'revisions' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider">
                    Revision Snapshots
                  </div>
                  <p className="text-[11px] text-[var(--muted-color)]">
                    Automatic rolling snapshots stored locally for instant accident recovery.
                  </p>
                </div>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl text-[var(--muted-color)] space-y-2">
                  <ShieldCheck className="w-6 h-6 mx-auto opacity-40" />
                  <p>No previous snapshots yet for this document.</p>
                  <p className="text-[10px]">
                    Snapshots are generated automatically as you type.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {snapshots.map((snap: RevisionSnapshot) => {
                    const dateStr = new Date(snap.timestamp).toLocaleString();
                    const words = snap.content.trim().split(/\s+/).filter(Boolean).length;
                    return (
                      <div
                        key={snap.id}
                        className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-[var(--text-color)] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-color)]" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="text-[10px] text-[var(--muted-color)] font-mono">
                            {words} words • {snap.content.length} characters
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onRestoreSnapshot(snap);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors font-medium text-xs cursor-pointer text-[var(--text-color)] border border-[var(--border-color)]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Desktop Packaging & Durability Status */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider">
                  Desktop Durability & Auto-Updates
                </div>
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-color)]">
                        Aura Desktop Edition
                      </div>
                      <div className="text-[11px] text-[var(--muted-color)]">
                        Version {appVersion || '1.0.0'} • Window state & multi-display geometry preserved
                      </div>
                    </div>
                    {onCheckForUpdates && (
                      <button
                        type="button"
                        onClick={onCheckForUpdates}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 font-medium text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Check for Updates</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--muted-color)] pt-1 border-t border-[var(--border-color)]/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>External file watcher active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Auto-recovery snapshots active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
