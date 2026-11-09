import React, { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Search,
  FileText,
  Save,
  Plus,
  FolderOpen,
  Eye,
  Maximize2,
  List,
  Type,
  Moon,
  Sun,
  Download,
  Copy,
  Printer,
  Settings,
  HelpCircle,
  Hash,
  Bold,
  Italic,
  Code,
  CheckSquare,
  BarChart2,
  Sigma,
  Info,
  AlertCircle,
  Highlighter,
  FileCode,
  BookOpen,
  Columns,
  Keyboard,
  Lock,
  Unlock,
  Share2,
  ExternalLink,
  ArrowDownToLine,
  Table,
  Zap,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { ThemeId, FontId, EditorViewMode } from '../types';

export interface CommandItem {
  id: string;
  title: string;
  category: 'File' | 'Format' | 'View' | 'Typography' | 'Theme' | 'Export' | 'Security' | 'General';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenWorkspace?: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  onToggleFocusMode: () => void;
  onToggleMinimalMode?: () => void;
  onToggleTitleBar?: () => void;
  onToggleTabBar?: () => void;
  onToggleTrueFullscreen?: () => void;
  onDetachActiveTab?: () => void;
  onRemergeAllFloating?: () => void;
  onToggleOutline: () => void;
  onToggleTypewriter: () => void;
  onToggleStatusBar: () => void;
  onToggleLineNumbers: () => void;
  onToggleBionicReading?: () => void;
  onToggleHemingwayMode?: () => void;
  onToggleLiveMarkdown?: () => void;
  editorMode?: EditorViewMode;
  onSetEditorMode?: (mode: EditorViewMode) => void;
  onCheckForUpdates?: () => void;
  appVersion?: string;
  onOpenImportExport: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenShortcuts: () => void;
  onOpenAudio?: () => void;
  onOpenLockModal?: () => void;
  onToggleSplit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onLoadShowcase: () => void;
  onChangeTheme: (theme: ThemeId) => void;
  onChangeFont: (font: FontId) => void;
  onFormatBold: () => void;
  onFormatItalic: () => void;
  onFormatCode: () => void;
  onFormatQuote: () => void;
  onFormatTask: () => void;
  onFormatHighlight: () => void;
  onInsertCallout: (type: string) => void;
  onInsertCodeBlock: (lang: string) => void;
  onInsertMath: () => void;
  onInsertTable: () => void;
  onExportMarkdown: () => void;
  onExportPlainText: () => void;
  onExportHTML: () => void;
  onExportPDF?: () => void;
  onCopyRichText: () => void;
  onPrint: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewFile,
  onOpenFile,
  onOpenWorkspace,
  onSaveFile,
  onSaveFileAs,
  onToggleFocusMode,
  onToggleMinimalMode,
  onToggleTitleBar,
  onToggleTabBar,
  onToggleTrueFullscreen,
  onDetachActiveTab,
  onRemergeAllFloating,
  onToggleOutline,
  onToggleTypewriter,
  onToggleStatusBar,
  onToggleLineNumbers,
  onToggleBionicReading,
  onToggleHemingwayMode,
  onToggleLiveMarkdown,
  editorMode,
  onSetEditorMode,
  onCheckForUpdates,
  appVersion,
  onOpenImportExport,
  onOpenSettings,
  onOpenStats,
  onOpenShortcuts,
  onOpenAudio,
  onOpenLockModal,
  onToggleSplit,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onLoadShowcase,
  onChangeTheme,
  onChangeFont,
  onFormatBold,
  onFormatItalic,
  onFormatCode,
  onFormatQuote,
  onFormatTask,
  onFormatHighlight,
  onInsertCallout,
  onInsertCodeBlock,
  onInsertMath,
  onInsertTable,
  onExportMarkdown,
  onExportPlainText,
  onExportHTML,
  onExportPDF,
  onCopyRichText,
  onPrint,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      // File
      {
        id: 'new-file',
        title: 'New Document',
        category: 'File',
        shortcut: 'Ctrl+N',
        icon: <Plus className="w-4 h-4" />,
        action: onNewFile,
        keywords: ['create', 'blank'],
      },
      {
        id: 'open-file',
        title: 'Open Document...',
        category: 'File',
        shortcut: 'Ctrl+O',
        icon: <FolderOpen className="w-4 h-4" />,
        action: onOpenFile,
        keywords: ['load', 'read', 'browse'],
      },
      {
        id: 'open-workspace-vault',
        title: 'Open Workspace Vault Folder...',
        category: 'File',
        shortcut: 'Ctrl+Shift+O',
        icon: <FolderOpen className="w-4 h-4" />,
        action: onOpenWorkspace || (() => {}),
        keywords: ['folder', 'vault', 'workspace', 'directory', 'project'],
      },
      {
        id: 'save-file',
        title: 'Save Document',
        category: 'File',
        shortcut: 'Ctrl+S',
        icon: <Save className="w-4 h-4" />,
        action: onSaveFile,
        keywords: ['write', 'disk'],
      },
      {
        id: 'save-file-as',
        title: 'Save Document As...',
        category: 'File',
        shortcut: 'Ctrl+Shift+S',
        icon: <Save className="w-4 h-4" />,
        action: onSaveFileAs,
        keywords: ['export', 'duplicate'],
      },
      {
        id: 'load-showcase',
        title: 'Open Welcome to Aura Guide / Feature Tour',
        category: 'File',
        icon: <BookOpen className="w-4 h-4" />,
        action: onLoadShowcase,
        keywords: ['welcome', 'sample', 'guide', 'features', 'tour', 'help', 'showcase'],
      },
      {
        id: 'doc-stats',
        title: 'Document Statistics & Reading Time',
        category: 'File',
        icon: <BarChart2 className="w-4 h-4" />,
        action: onOpenStats,
        keywords: ['words', 'characters', 'lines', 'count'],
      },
      // View
      {
        id: 'toggle-fullscreen',
        title: 'Toggle True Fullscreen (OS Window Fullscreen)',
        category: 'View',
        shortcut: 'F11',
        icon: <Maximize2 className="w-4 h-4" />,
        action: onToggleTrueFullscreen || onToggleFocusMode,
        keywords: ['fullscreen', 'window', 'screen', 'expand'],
      },
      {
        id: 'toggle-minimal',
        title: 'Toggle Minimal Writing Mode (Zen Mode)',
        category: 'View',
        shortcut: 'Alt+Z',
        icon: <Eye className="w-4 h-4" />,
        action: onToggleMinimalMode || onToggleFocusMode,
        keywords: ['zen', 'minimal', 'distraction free', 'focus', 'clean', 'pure'],
      },
      {
        id: 'toggle-titlebar',
        title: 'Toggle Top Title Bar',
        category: 'View',
        shortcut: 'Ctrl+Alt+T',
        icon: <Columns className="w-4 h-4" />,
        action: onToggleTitleBar || (() => {}),
        keywords: ['header', 'title', 'top bar', 'hide titlebar'],
      },
      {
        id: 'toggle-tabbar',
        title: 'Toggle Document Tab Bar',
        category: 'View',
        shortcut: 'Ctrl+Alt+B',
        icon: <Columns className="w-4 h-4" />,
        action: onToggleTabBar || (() => {}),
        keywords: ['tabs', 'tab strip', 'multi tab', 'hide tabs'],
      },
      {
        id: 'open-word-triggers',
        title: 'Manage Word Triggers (Snippets & Text Expansions)',
        category: 'General',
        icon: <Zap className="w-4 h-4" />,
        action: onOpenSettings,
        keywords: ['word triggers', 'snippets', 'expansions', 'macros', 'shortcuts', 'code replacement'],
      },
      {
        id: 'check-for-updates',
        title: `Check for Desktop Updates (v${appVersion || '1.0.0'})`,
        category: 'General',
        icon: <RefreshCw className="w-4 h-4 text-sky-500" />,
        action: onCheckForUpdates || (() => {}),
        keywords: ['update', 'version', 'upgrade', 'github', 'release', 'download', 'check updates'],
      },
      {
        id: 'detach-tab',
        title: 'Detach Active Document as Floating Window',
        category: 'View',
        icon: <ExternalLink className="w-4 h-4" />,
        action: onDetachActiveTab || (() => {}),
        keywords: ['float', 'detach', 'floating window', 'undock', 'separate window'],
      },
      {
        id: 'remerge-floating',
        title: 'Dock / Remerge All Floating Windows into Tab Bar',
        category: 'View',
        icon: <ArrowDownToLine className="w-4 h-4" />,
        action: onRemergeAllFloating || (() => {}),
        keywords: ['merge', 'dock', 'remerge', 'join', 'tabs'],
      },
      {
        id: 'toggle-outline',
        title: 'Toggle Document Outline (Table of Contents)',
        category: 'View',
        shortcut: 'Ctrl+Shift+O',
        icon: <List className="w-4 h-4" />,
        action: onToggleOutline,
        keywords: ['headings', 'toc', 'navigation'],
      },
      {
        id: 'toggle-typewriter',
        title: 'Toggle Typewriter Scrolling',
        category: 'View',
        icon: <Eye className="w-4 h-4" />,
        action: onToggleTypewriter,
        keywords: ['center', 'scroll', 'ia writer'],
      },
      {
        id: 'toggle-statusbar',
        title: 'Toggle Status Bar',
        category: 'View',
        icon: <BarChart2 className="w-4 h-4" />,
        action: onToggleStatusBar,
        keywords: ['footer', 'word count'],
      },
      {
        id: 'toggle-focus-mode',
        title: 'Toggle Focus Mode (Paragraph Dimming)',
        category: 'View',
        shortcut: 'Ctrl+Shift+F',
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        action: onToggleFocusMode,
        keywords: ['focus', 'dim', 'paragraph', 'distraction free', 'highlight active', 'dimming'],
      },
      {
        id: 'toggle-bionic-reading',
        title: 'Toggle Bionic Reading (Typographic Anchor Bolding)',
        category: 'View',
        shortcut: 'Ctrl+Shift+B',
        icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
        action: onToggleBionicReading || (() => {}),
        keywords: ['bionic', 'reading', 'speed', 'anchor', 'bold', 'typography', 'dyslexia'],
      },
      {
        id: 'toggle-hemingway-mode',
        title: 'Toggle Hemingway Mode (Forward-Only Drafting Lock)',
        category: 'View',
        shortcut: 'Ctrl+Shift+H',
        icon: <Sparkles className="w-4 h-4 text-rose-500" />,
        action: onToggleHemingwayMode || (() => {}),
        keywords: ['hemingway', 'drafting', 'forward', 'no backspace', 'momentum', 'lock'],
      },
      {
        id: 'toggle-source-mode',
        title: 'Cycle Editor Modes (Live ↔ Source ↔ Split)',
        category: 'View',
        shortcut: 'Ctrl+Shift+U',
        icon: <FileCode className="w-4 h-4" />,
        action: onToggleLiveMarkdown || (() => {}),
        keywords: ['source', 'raw', 'code', 'markdown', 'render', 'preview', 'wysiwyg', 'mode', 'split', 'cycle'],
      },
      {
        id: 'switch-split-mode',
        title: 'Switch to Split Mode (Source Left, Live Right)',
        category: 'View',
        icon: <Columns className="w-4 h-4 text-sky-500" />,
        action: () => (onSetEditorMode ? onSetEditorMode('split') : onToggleLiveMarkdown?.()),
        keywords: ['split mode', 'side by side', 'source and live', 'dual', 'sync', 'split view'],
      },
      {
        id: 'switch-live-mode',
        title: 'Switch to Live Rendering Mode',
        category: 'View',
        icon: <Eye className="w-4 h-4 text-emerald-500" />,
        action: () => (onSetEditorMode ? onSetEditorMode('live') : onToggleLiveMarkdown?.()),
        keywords: ['live mode', 'rendered', 'wysiwyg', 'preview', 'formatted'],
      },
      {
        id: 'switch-source-mode',
        title: 'Switch to Source Code Mode (Raw Markdown)',
        category: 'View',
        icon: <FileCode className="w-4 h-4 text-amber-500" />,
        action: () => (onSetEditorMode ? onSetEditorMode('source') : onToggleLiveMarkdown?.()),
        keywords: ['source mode', 'raw markdown', 'plain text', 'code view', 'unrendered'],
      },
      {
        id: 'toggle-linenumbers',
        title: 'Toggle Line Numbers',
        category: 'View',
        icon: <Hash className="w-4 h-4" />,
        action: onToggleLineNumbers,
        keywords: ['gutter', 'lines'],
      },
      {
        id: 'toggle-split',
        title: 'Toggle Split Editor Side-by-Side (Dual Pane)',
        category: 'View',
        shortcut: 'Ctrl+\\',
        icon: <Columns className="w-4 h-4" />,
        action: onToggleSplit || (() => {}),
        keywords: ['dual', 'pane', 'side by side', 'two', 'split'],
      },
      {
        id: 'zoom-in',
        title: 'Zoom In (Increase Scale)',
        category: 'View',
        shortcut: 'Ctrl+=',
        icon: <ZoomIn className="w-4 h-4 text-sky-500" />,
        action: onZoomIn || (() => {}),
        keywords: ['zoom in', 'magnify', 'bigger', 'larger', 'scale up'],
      },
      {
        id: 'zoom-out',
        title: 'Zoom Out (Decrease Scale)',
        category: 'View',
        shortcut: 'Ctrl+-',
        icon: <ZoomOut className="w-4 h-4 text-sky-500" />,
        action: onZoomOut || (() => {}),
        keywords: ['zoom out', 'shrink', 'smaller', 'scale down'],
      },
      {
        id: 'zoom-reset',
        title: 'Reset Zoom (100% Scale)',
        category: 'View',
        shortcut: 'Ctrl+0',
        icon: <RotateCcw className="w-4 h-4" />,
        action: onZoomReset || (() => {}),
        keywords: ['reset zoom', '100%', 'default scale', 'normal size'],
      },
      {
        id: 'open-lock',
        title: 'Encrypt & Lock Document (AES-256)',
        category: 'Security',
        shortcut: 'Ctrl+L',
        icon: <Lock className="w-4 h-4" />,
        action: onOpenLockModal || (() => {}),
        keywords: ['encrypt', 'lock', 'password', 'passphrase', 'secure', 'crypto', 'protect'],
      },
      {
        id: 'open-audio',
        title: 'Keyboard Typing Acoustics',
        category: 'View',
        icon: <Keyboard className="w-4 h-4" />,
        action: onOpenAudio || (() => {}),
        keywords: ['sound', 'keyboard', 'typewriter', 'clicky', 'thock', 'keystroke', 'typing'],
      },
      // Formatting
      {
        id: 'format-bold',
        title: 'Bold (**text**)',
        category: 'Format',
        shortcut: 'Ctrl+B',
        icon: <Bold className="w-4 h-4" />,
        action: onFormatBold,
      },
      {
        id: 'format-italic',
        title: 'Italic (*text*)',
        category: 'Format',
        shortcut: 'Ctrl+I',
        icon: <Italic className="w-4 h-4" />,
        action: onFormatItalic,
      },
      {
        id: 'format-code',
        title: 'Inline Code (`code`)',
        category: 'Format',
        shortcut: 'Ctrl+E',
        icon: <Code className="w-4 h-4" />,
        action: onFormatCode,
      },
      {
        id: 'format-highlight',
        title: 'Highlight (==text==)',
        category: 'Format',
        icon: <Highlighter className="w-4 h-4" />,
        action: onFormatHighlight,
        keywords: ['yellow', 'mark'],
      },
      {
        id: 'format-task',
        title: 'Insert Checklist Item (- [ ])',
        category: 'Format',
        shortcut: 'Ctrl+Shift+C',
        icon: <CheckSquare className="w-4 h-4" />,
        action: onFormatTask,
      },
      // Callouts
      {
        id: 'callout-note',
        title: 'Insert Callout: Note [!NOTE]',
        category: 'Format',
        icon: <AlertCircle className="w-4 h-4" />,
        action: () => onInsertCallout('NOTE'),
        keywords: ['alert', 'info', 'box'],
      },
      {
        id: 'callout-tip',
        title: 'Insert Callout: Tip [!TIP]',
        category: 'Format',
        icon: <Info className="w-4 h-4" />,
        action: () => onInsertCallout('TIP'),
        keywords: ['alert', 'hint', 'idea'],
      },
      {
        id: 'callout-important',
        title: 'Insert Callout: Important [!IMPORTANT]',
        category: 'Format',
        icon: <AlertCircle className="w-4 h-4" />,
        action: () => onInsertCallout('IMPORTANT'),
        keywords: ['alert', 'key', 'notice'],
      },
      {
        id: 'callout-warning',
        title: 'Insert Callout: Warning [!WARNING]',
        category: 'Format',
        icon: <AlertCircle className="w-4 h-4" />,
        action: () => onInsertCallout('WARNING'),
        keywords: ['alert', 'caution', 'warn'],
      },
      // Code Blocks
      {
        id: 'code-ts',
        title: 'Insert TypeScript Code Block',
        category: 'Format',
        icon: <FileCode className="w-4 h-4" />,
        action: () => onInsertCodeBlock('typescript'),
        keywords: ['ts', 'js', 'syntax'],
      },
      {
        id: 'code-python',
        title: 'Insert Python Code Block',
        category: 'Format',
        icon: <FileCode className="w-4 h-4" />,
        action: () => onInsertCodeBlock('python'),
        keywords: ['py', 'syntax'],
      },
      {
        id: 'code-rust',
        title: 'Insert Rust Code Block',
        category: 'Format',
        icon: <FileCode className="w-4 h-4" />,
        action: () => onInsertCodeBlock('rust'),
        keywords: ['rs', 'syntax'],
      },
      {
        id: 'code-sql',
        title: 'Insert SQL Code Block',
        category: 'Format',
        icon: <FileCode className="w-4 h-4" />,
        action: () => onInsertCodeBlock('sql'),
        keywords: ['database', 'query'],
      },
      {
        id: 'format-math',
        title: 'Insert LaTeX Math Formula ($$)',
        category: 'Format',
        icon: <Sigma className="w-4 h-4" />,
        action: onInsertMath,
        keywords: ['equation', 'katex'],
      },
      {
        id: 'format-table',
        title: 'Insert Markdown Table...',
        category: 'Format',
        shortcut: 'Ctrl+Shift+T',
        icon: <Table className="w-4 h-4" />,
        action: onInsertTable,
        keywords: ['grid', 'columns', 'rows', 'alignment', 'comparison', 'sprint', 'schedule'],
      },
      // Export
      {
        id: 'open-import-export',
        title: 'Open Import & Export Hub (ZIP, HTML, PDF, LaTeX, MD)...',
        category: 'Export',
        shortcut: 'Ctrl+Shift+I',
        icon: <Download className="w-4 h-4" />,
        action: onOpenImportExport,
        keywords: ['import', 'export', 'backup', 'zip', 'latex', 'pdf', 'html'],
      },
      {
        id: 'export-md',
        title: 'Export as Markdown (.md)',
        category: 'Export',
        icon: <Download className="w-4 h-4" />,
        action: onExportMarkdown,
      },
      {
        id: 'export-txt',
        title: 'Export as Plain Text (.txt)',
        category: 'Export',
        icon: <FileText className="w-4 h-4" />,
        action: onExportPlainText,
      },
      {
        id: 'export-html',
        title: 'Export as Styled HTML (.html)',
        category: 'Export',
        icon: <Download className="w-4 h-4" />,
        action: onExportHTML,
      },
      {
        id: 'copy-rich-text',
        title: 'Copy Formatted Rich Text to Clipboard',
        category: 'Export',
        icon: <Copy className="w-4 h-4" />,
        action: onCopyRichText,
        keywords: ['word', 'google docs', 'email'],
      },
      {
        id: 'export-pdf',
        title: 'Export as Direct PDF Document (.pdf)',
        category: 'Export',
        icon: <Printer className="w-4 h-4" />,
        action: onExportPDF || onPrint,
        keywords: ['pdf', 'vector', 'export', 'document', 'save'],
      },
      {
        id: 'print-pdf',
        title: 'Print Document (Native Print Dialog)',
        category: 'Export',
        shortcut: 'Ctrl+P',
        icon: <Printer className="w-4 h-4" />,
        action: onPrint,
      },
      // Typography
      {
        id: 'font-serif',
        title: 'Font: Editorial Serif (Newsreader / Charter)',
        category: 'Typography',
        icon: <Type className="w-4 h-4" />,
        action: () => onChangeFont('serif'),
      },
      {
        id: 'font-sans',
        title: 'Font: Modern Sans (Inter / SF Pro)',
        category: 'Typography',
        icon: <Type className="w-4 h-4" />,
        action: () => onChangeFont('sans'),
      },
      {
        id: 'font-mono',
        title: 'Font: Monospace (JetBrains Mono)',
        category: 'Typography',
        icon: <Type className="w-4 h-4" />,
        action: () => onChangeFont('mono'),
      },
      {
        id: 'font-quattro',
        title: 'Font: Editorial Quattro (Literata)',
        category: 'Typography',
        icon: <Type className="w-4 h-4" />,
        action: () => onChangeFont('quattro'),
      },
      // Themes
      {
        id: 'theme-paper',
        title: 'Theme: Warm Paper (Calm Editorial Ivory)',
        category: 'Theme',
        icon: <Sun className="w-4 h-4" />,
        action: () => onChangeTheme('paper'),
        keywords: ['light', 'warm', 'canvas', 'beige'],
      },
      {
        id: 'theme-white',
        title: 'Theme: Pure White (Crisp Minimal)',
        category: 'Theme',
        icon: <Sun className="w-4 h-4" />,
        action: () => onChangeTheme('white'),
        keywords: ['light', 'clean', 'bright'],
      },
      {
        id: 'theme-dark',
        title: 'Theme: Charcoal Dark (Comfortable Night)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('dark'),
        keywords: ['dark', 'black', 'night'],
      },
      {
        id: 'theme-oled',
        title: 'Theme: OLED Pure Black (Zero-Bleed)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('oled'),
        keywords: ['pitch black', 'oled', 'dark'],
      },
      {
        id: 'theme-slate',
        title: 'Theme: Nordic Slate Blue',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('slate'),
        keywords: ['blue', 'slate', 'dark'],
      },
      {
        id: 'theme-sepia',
        title: 'Theme: Antique Sepia (Vintage Novel)',
        category: 'Theme',
        icon: <Sun className="w-4 h-4" />,
        action: () => onChangeTheme('sepia'),
        keywords: ['sepia', 'parchment', 'book', 'warm'],
      },
      {
        id: 'theme-nord',
        title: 'Theme: Nord Frost (Arctic Polar)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('nord'),
        keywords: ['nord', 'frost', 'arctic', 'blue'],
      },
      {
        id: 'theme-dracula',
        title: 'Theme: Dracula Gothic (Midnight Violet)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('dracula'),
        keywords: ['purple', 'violet', 'neon', 'dark'],
      },
      {
        id: 'theme-solarizedLight',
        title: 'Theme: Solarized Light',
        category: 'Theme',
        icon: <Sun className="w-4 h-4" />,
        action: () => onChangeTheme('solarizedLight'),
        keywords: ['solarized', 'cream', 'teal'],
      },
      {
        id: 'theme-solarizedDark',
        title: 'Theme: Solarized Dark',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('solarizedDark'),
        keywords: ['solarized', 'ocean', 'abyss', 'teal'],
      },
      {
        id: 'theme-forest',
        title: 'Theme: Deep Forest (Evergreen Pine)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('forest'),
        keywords: ['green', 'pine', 'moss', 'nature'],
      },
      {
        id: 'theme-coffee',
        title: 'Theme: Espresso Mocha (Roasted Coffee)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('coffee'),
        keywords: ['brown', 'mocha', 'espresso', 'warm'],
      },
      {
        id: 'theme-terracotta',
        title: 'Theme: Terracotta Dusk (Desert Clay)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('terracotta'),
        keywords: ['orange', 'clay', 'sunset', 'rust'],
      },
      {
        id: 'theme-lavender',
        title: 'Theme: Twilight Lavender (Soft Violet)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('lavender'),
        keywords: ['purple', 'lilac', 'lavender', 'pastel'],
      },
      {
        id: 'theme-matrix',
        title: 'Theme: Terminal Matrix (Hacker Green)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('matrix'),
        keywords: ['matrix', 'green', 'terminal', 'cyber', 'hacker'],
      },
      {
        id: 'theme-rosePine',
        title: 'Theme: Rosé Pine (Nordic Dusk)',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('rosePine'),
        keywords: ['rose', 'pine', 'pink', 'nordic'],
      },
      {
        id: 'theme-hcLight',
        title: 'Theme: High Contrast Light',
        category: 'Theme',
        icon: <Sun className="w-4 h-4" />,
        action: () => onChangeTheme('hcLight'),
        keywords: ['high contrast', 'accessibility', 'monochrome'],
      },
      {
        id: 'theme-hcDark',
        title: 'Theme: High Contrast Dark',
        category: 'Theme',
        icon: <Moon className="w-4 h-4" />,
        action: () => onChangeTheme('hcDark'),
        keywords: ['high contrast', 'accessibility', 'black and white'],
      },
      // General
      {
        id: 'open-settings',
        title: 'Preferences & Settings...',
        category: 'General',
        shortcut: 'Ctrl+,',
        icon: <Settings className="w-4 h-4" />,
        action: onOpenSettings,
      },
      {
        id: 'open-shortcuts',
        title: 'Keyboard Shortcuts Help...',
        category: 'General',
        shortcut: 'Ctrl+/',
        icon: <HelpCircle className="w-4 h-4" />,
        action: onOpenShortcuts,
      },
    ],
    [
      onNewFile,
      onOpenFile,
      onSaveFile,
      onSaveFileAs,
      onLoadShowcase,
      onOpenStats,
      onToggleFocusMode,
      onToggleOutline,
      onToggleTypewriter,
      onToggleStatusBar,
      onToggleLineNumbers,
      onToggleLiveMarkdown,
      onFormatBold,
      onFormatItalic,
      onFormatCode,
      onFormatQuote,
      onFormatTask,
      onFormatHighlight,
      onInsertCallout,
      onInsertCodeBlock,
      onInsertMath,
      onInsertTable,
      onExportMarkdown,
      onExportPlainText,
      onExportHTML,
      onCopyRichText,
      onPrint,
      onChangeFont,
      onChangeTheme,
      onOpenSettings,
      onOpenShortcuts,
    ]
  );

  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: ['title', 'category', 'keywords'],
        threshold: 0.35,
      }),
    [commands]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }
    return fuse.search(query).map((res) => res.item);
  }, [query, fuse, commands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface-color)] text-[var(--text-color)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[65vh] animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-color)]">
          <Search className="w-5 h-5 text-stone-400 mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-base outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/5 dark:bg-white/10 text-stone-400 select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto p-1.5 flex-1 divide-y divide-transparent"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs select-none transition-colors ${
                    isSelected
                      ? 'bg-black/10 dark:bg-white/15 font-medium'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-stone-500 dark:text-stone-400 flex-shrink-0">
                      {cmd.icon}
                    </span>
                    <span className="truncate">{cmd.title}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-400 dark:text-stone-400 flex-shrink-0">
                      {cmd.category}
                    </span>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-500 dark:text-stone-400 flex-shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
