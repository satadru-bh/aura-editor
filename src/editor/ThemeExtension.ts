import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { EditorSettings } from '../types';

export function createEditorTheme(settings: EditorSettings): Extension {
  const fontFamilies = {
    serif: 'Newsreader, Charter, "Source Serif 4", Georgia, serif',
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    quattro: 'Literata, Georgia, "iA Writer Quattro", sans-serif',
  };

  const currentFontFamily = fontFamilies[settings.font] || fontFamilies.serif;
  const maxWidthVal = settings.contentWidth === '100%' ? '100%' : settings.contentWidth;

  return [
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: `${settings.fontSize}px`,
        lineHeight: `${settings.lineHeight}`,
        fontFamily: currentFontFamily,
        height: '100%',
        width: '100%',
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
        backgroundColor: 'transparent',
        color: 'var(--text-color) !important',
      },
      '&:focus, &:focus-visible': {
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-scroller': {
        fontFamily: currentFontFamily,
        overflowY: 'auto',
        overflowX: 'hidden',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        paddingBottom: '40vh',
        lineHeight: `${settings.lineHeight}`,
        color: 'var(--text-color)',
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-scroller:focus, .cm-scroller:focus-visible': {
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-content': {
        padding: '32px clamp(16px, 4vw, 36px)',
        boxSizing: 'border-box',
        caretColor: 'transparent !important',
        fontFamily: currentFontFamily,
        lineHeight: `${settings.lineHeight}`,
        color: 'var(--text-color) !important',
        maxWidth: maxWidthVal,
        width: '100%',
        margin: '0 auto !important',
        minHeight: '100%',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-line': {
        padding: '1px 0 !important',
        color: 'var(--text-color) !important',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftWidth: '2px !important',
        borderLeftStyle: 'solid !important',
        borderLeftColor: 'var(--text-color, currentColor) !important',
        marginLeft: '0 !important',
        transition: 'none !important',
        borderRadius: '1px',
        zIndex: '100 !important',
        opacity: '1 !important',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--selection-bg, rgba(217, 119, 6, 0.2)) !important',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'rgba(234, 179, 8, 0.3)',
        borderRadius: '2px',
      },

      // Headings (Clean typography with matching line geometry)
      '.cm-line-h1, .cm-line-h2, .cm-line-h3, .cm-line-h4, .cm-line-h5, .cm-line-h6': {
        paddingTop: '2px',
        paddingBottom: '2px',
      },
      '.cm-line-h1, .cm-line-h1 .cm-h1': {
        fontSize: '1.85em',
        fontWeight: '750',
        lineHeight: '1.3',
      },
      '.cm-line-h2, .cm-line-h2 .cm-h2': {
        fontSize: '1.45em',
        fontWeight: '700',
        lineHeight: '1.3',
      },
      '.cm-line-h3, .cm-line-h3 .cm-h3': {
        fontSize: '1.22em',
        fontWeight: '650',
        lineHeight: '1.35',
      },
      '.cm-line-h4, .cm-line-h4 .cm-h4': {
        fontSize: '1.12em',
        fontWeight: '650',
        lineHeight: '1.4',
      },
      '.cm-line-h5, .cm-line-h5 .cm-h5, .cm-line-h6, .cm-line-h6 .cm-h6': {
        fontSize: '1.0em',
        fontWeight: '600',
        lineHeight: '1.4',
        opacity: '0.85',
      },

      // Formatting marks
      '.cm-bold': {
        fontWeight: '700',
      },
      '.cm-italic': {
        fontStyle: 'italic',
      },
      '.cm-strikethrough': {
        textDecoration: 'line-through',
        opacity: '0.65',
      },
      '.cm-inline-code': {
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: '0.88em',
        padding: '2px 5px',
        borderRadius: '4px',
        backgroundColor: 'var(--code-inline-bg, rgba(125, 125, 125, 0.1))',
        color: 'var(--text-color)',
      },
      '.cm-highlight': {
        backgroundColor: 'rgba(234, 179, 8, 0.28)',
        borderRadius: '2px',
        padding: '1px 3px',
      },
      '.cm-footnote-ref': {
        fontSize: '0.75em',
        verticalAlign: 'super',
        color: 'var(--border-accent, #B45309)',
        fontWeight: '600',
      },
      '.cm-link-text': {
        color: 'var(--border-accent, #B45309)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        cursor: 'pointer',
      },

      // Micro-typography
      '.cm-sub': {
        fontSize: '0.75em',
        verticalAlign: 'sub',
      },
      '.cm-sup': {
        fontSize: '0.75em',
        verticalAlign: 'super',
      },
      '.cm-kbd': {
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: '0.78em',
        padding: '2px 5px',
        borderRadius: '4px',
        border: '1px solid var(--border-color, rgba(125, 125, 125, 0.3))',
        backgroundColor: 'var(--code-inline-bg, rgba(125, 125, 125, 0.08))',
        boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
        fontWeight: '600',
      },
      '.cm-underline': {
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      },
      '.cm-ins': {
        textDecoration: 'underline',
        textDecorationColor: '#10B981',
      },
      '.cm-small': {
        fontSize: '0.82em',
        opacity: '0.8',
      },

      // List matrix obvious indentations (Base lists not in quotes)
      '.cm-list-depth-0': {
        paddingLeft: '4px !important',
      },
      '.cm-list-depth-1': {
        paddingLeft: '24px !important',
      },
      '.cm-list-depth-2': {
        paddingLeft: '48px !important',
      },
      '.cm-list-depth-3': {
        paddingLeft: '72px !important',
      },
      '.cm-list-depth-4': {
        paddingLeft: '96px !important',
      },

      // Lists inside Quote depth 1
      '.cm-list-q1-d0': { paddingLeft: '18px !important' },
      '.cm-list-q1-d1': { paddingLeft: '36px !important' },
      '.cm-list-q1-d2': { paddingLeft: '54px !important' },
      '.cm-list-q1-d3': { paddingLeft: '72px !important' },
      '.cm-list-q1-d4': { paddingLeft: '90px !important' },

      // Lists inside Quote depth 2
      '.cm-list-q2-d0': { paddingLeft: '28px !important' },
      '.cm-list-q2-d1': { paddingLeft: '46px !important' },
      '.cm-list-q2-d2': { paddingLeft: '64px !important' },
      '.cm-list-q2-d3': { paddingLeft: '82px !important' },
      '.cm-list-q2-d4': { paddingLeft: '100px !important' },

      // Lists inside Quote depth 3
      '.cm-list-q3-d0': { paddingLeft: '38px !important' },
      '.cm-list-q3-d1': { paddingLeft: '56px !important' },
      '.cm-list-q3-d2': { paddingLeft: '74px !important' },
      '.cm-list-q3-d3': { paddingLeft: '92px !important' },
      '.cm-list-q3-d4': { paddingLeft: '110px !important' },

      // Lists inside Quote depth 4+
      '.cm-list-q4-d0': { paddingLeft: '48px !important' },
      '.cm-list-q4-d1': { paddingLeft: '66px !important' },
      '.cm-list-q4-d2': { paddingLeft: '84px !important' },
      '.cm-list-q4-d3': { paddingLeft: '102px !important' },
      '.cm-list-q4-d4': { paddingLeft: '120px !important' },

      // Blockquotes with multi-level nesting using crisp linear-gradient border separation
      '.cm-blockquote-line': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7))',
        backgroundColor: 'rgba(180, 83, 9, 0.03)',
        paddingLeft: '18px',
        paddingTop: '2px',
        paddingBottom: '2px',
        minHeight: '1.5em',
        opacity: '0.96',
      },
      '.cm-blockquote-depth-1': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundColor: 'rgba(180, 83, 9, 0.03) !important',
        paddingLeft: '18px !important',
      },
      '.cm-blockquote-depth-2': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px) !important',
        backgroundColor: 'rgba(180, 83, 9, 0.04) !important',
        paddingLeft: '28px !important',
        opacity: '0.94',
      },
      '.cm-blockquote-depth-3': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px, transparent 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 25px, transparent 25px) !important',
        backgroundColor: 'rgba(180, 83, 9, 0.06) !important',
        paddingLeft: '38px !important',
        opacity: '0.92',
      },
      '.cm-blockquote-depth-4': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px, transparent 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 25px, transparent 25px, transparent 33px, var(--border-accent, rgba(180, 83, 9, 0.45)) 33px, var(--border-accent, rgba(180, 83, 9, 0.45)) 36px, transparent 36px) !important',
        backgroundColor: 'rgba(180, 83, 9, 0.08) !important',
        paddingLeft: '48px !important',
        opacity: '0.90',
      },

      // Callout Alert Lines with balanced tight padding
      '.cm-callout-line': {
        paddingLeft: '14px',
        paddingRight: '14px',
        paddingTop: '2px !important',
        paddingBottom: '2px !important',
        borderLeftWidth: '3.5px',
        borderLeftStyle: 'solid',
        fontSize: '0.94em',
        lineHeight: `${settings.lineHeight}`,
      },
      '.cm-callout-first': {
        borderTopRightRadius: '8px',
      },
      '.cm-callout-last': {
        borderBottomRightRadius: '8px',
      },
      '.cm-callout-single': {
        borderRadius: '0 8px 8px 0',
      },
      '.cm-callout-note': {
        borderLeftColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.07)',
      },
      '.cm-callout-tip': {
        borderLeftColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.07)',
      },
      '.cm-callout-important': {
        borderLeftColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.07)',
      },
      '.cm-callout-warning': {
        borderLeftColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.07)',
      },
      '.cm-callout-caution': {
        borderLeftColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.07)',
      },

      // Unified Code Block Lines
      '.cm-code-block-line': {
        fontFamily: '"JetBrains Mono", Consolas, monospace !important',
        fontSize: '0.88em',
        backgroundColor: 'var(--code-block-bg, rgba(125, 125, 125, 0.05))',
        borderLeft: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        borderRight: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        paddingLeft: '16px !important',
        paddingRight: '16px !important',
        paddingTop: '2px !important',
        paddingBottom: '2px !important',
      },
      '.cm-code-block-header-line, .cm-code-block-line:has(.cm-code-block-header)': {
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important',
        lineHeight: '1 !important',
        fontSize: '0 !important',
        backgroundColor: 'transparent !important',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        overflow: 'hidden',
      },
      '.cm-code-block-header-line.cm-code-block-collapsed, .cm-code-block-collapsed': {
        borderBottomLeftRadius: '8px !important',
        borderBottomRightRadius: '8px !important',
        borderBottom: '1px solid var(--border-color, rgba(125, 125, 125, 0.2)) !important',
      },
      '.cm-code-block-header': {
        fontFamily: '"JetBrains Mono", Consolas, monospace !important',
        fontSize: '11px !important',
        lineHeight: '1.4 !important',
        width: '100%',
        boxSizing: 'border-box',
        verticalAlign: 'top',
      },
      '.cm-code-block-end-line': {
        lineHeight: '0.4 !important',
        fontSize: '0 !important',
        paddingTop: '0 !important',
        paddingBottom: '6px !important',
        minHeight: '0 !important',
      },
      // Code blocks nested cleanly inside blockquotes
      '.cm-code-in-q1': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 14px, var(--code-block-bg, rgba(125, 125, 125, 0.05)) 14px) !important',
        boxShadow: 'inset 14px 0 0 0 transparent, inset 15px 0 0 0 var(--border-color, rgba(125, 125, 125, 0.2)) !important',
        paddingLeft: '28px !important',
      },
      '.cm-code-in-q1.cm-code-block-header-line, .cm-code-in-q1:has(.cm-code-block-header)': {
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        backgroundImage: 'none !important',
      },
      '.cm-code-in-q2': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px, transparent 24px, var(--code-block-bg, rgba(125, 125, 125, 0.05)) 24px) !important',
        boxShadow: 'inset 24px 0 0 0 transparent, inset 25px 0 0 0 var(--border-color, rgba(125, 125, 125, 0.2)) !important',
        paddingLeft: '38px !important',
      },
      '.cm-code-in-q2.cm-code-block-header-line, .cm-code-in-q2:has(.cm-code-block-header)': {
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        backgroundImage: 'none !important',
      },
      '.cm-code-in-q3': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px, transparent 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 25px, transparent 25px, transparent 36px, var(--code-block-bg, rgba(125, 125, 125, 0.05)) 36px) !important',
        boxShadow: 'inset 36px 0 0 0 transparent, inset 37px 0 0 0 var(--border-color, rgba(125, 125, 125, 0.2)) !important',
        paddingLeft: '50px !important',
      },
      '.cm-code-in-q3.cm-code-block-header-line, .cm-code-in-q3:has(.cm-code-block-header)': {
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        backgroundImage: 'none !important',
      },
      '.cm-code-in-q4': {
        borderLeft: '3px solid var(--border-accent, rgba(180, 83, 9, 0.7)) !important',
        backgroundImage: 'linear-gradient(to right, transparent 0px, transparent 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 11px, var(--border-accent, rgba(180, 83, 9, 0.65)) 14px, transparent 14px, transparent 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 22px, var(--border-accent, rgba(180, 83, 9, 0.55)) 25px, transparent 25px, transparent 33px, var(--border-accent, rgba(180, 83, 9, 0.45)) 33px, var(--border-accent, rgba(180, 83, 9, 0.45)) 36px, transparent 36px, transparent 48px, var(--code-block-bg, rgba(125, 125, 125, 0.05)) 48px) !important',
        boxShadow: 'inset 48px 0 0 0 transparent, inset 49px 0 0 0 var(--border-color, rgba(125, 125, 125, 0.2)) !important',
        paddingLeft: '62px !important',
      },
      '.cm-code-in-q4.cm-code-block-header-line, .cm-code-in-q4:has(.cm-code-block-header)': {
        paddingLeft: '0 !important',
        paddingRight: '0 !important',
        backgroundImage: 'none !important',
      },
      '.cm-code-block-first': {
        borderTop: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        marginTop: '6px',
      },
      '.cm-code-block-last': {
        borderBottom: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        paddingBottom: '8px !important',
        marginBottom: '6px',
      },
      '.cm-code-block-single': {
        border: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        borderRadius: '8px',
        marginTop: '6px',
        marginBottom: '6px',
      },
      '.cm-code-lang-tag': {
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: '700',
        fontSize: '0.82em',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--border-accent, #B45309)',
        padding: '1px 5px',
        borderRadius: '3px',
        backgroundColor: 'var(--code-inline-bg, rgba(125, 125, 125, 0.1))',
      },

      // Frontmatter
      '.cm-frontmatter-line': {
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: '0.85em',
        backgroundColor: 'var(--code-block-bg, rgba(125, 125, 125, 0.05))',
        opacity: '0.7',
        paddingTop: '2px !important',
        paddingBottom: '2px !important',
      },

      // Live Markdown Syntax Fading
      '.cm-syntax-faded': {
        opacity: '0.35',
        transition: 'opacity 120ms ease',
      },
      '.cm-line-focused-active .cm-syntax-faded, .cm-activeLine .cm-syntax-faded': {
        opacity: '0.75',
      },

      // Line Numbers gutter if enabled
      '.cm-gutters': {
        backgroundColor: 'transparent',
        borderRight: '1px solid var(--border-color, rgba(125, 125, 125, 0.15))',
        color: 'var(--muted-color, #888)',
        opacity: '0.55',
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        userSelect: 'none',
        flexShrink: '0',
      },
      '.cm-lineNumbers': {
        minWidth: '44px',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        boxSizing: 'border-box !important',
        display: 'flex !important',
        flexDirection: 'row !important',
        justifyContent: 'flex-end !important',
        alignItems: 'flex-start !important',
        paddingTop: '2px !important',
        paddingBottom: '2px !important',
        paddingRight: '12px !important',
        paddingLeft: '6px !important',
        fontSize: `${Math.max(11, Math.round(settings.fontSize * 0.72))}px !important`,
        lineHeight: `${settings.lineHeight} !important`,
        fontVariantNumeric: 'tabular-nums !important',
        cursor: 'default',
      },

      // Theme-responsive markdown tables
      '.cm-table-widget-container': {
        border: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
        backgroundColor: 'var(--surface-color, rgba(125, 125, 125, 0.05))',
        color: 'var(--text-color, inherit)',
        borderRadius: '10px',
      },
      '.cm-table-widget-container table th': {
        color: 'var(--muted-color, #888)',
        borderBottom: '1px solid var(--border-color, rgba(125, 125, 125, 0.2))',
      },
      '.cm-table-widget-container table td': {
        color: 'var(--text-color, inherit)',
      },

      // Thematic break (horizontal rule) compact balanced spacing
      '.cm-line-hr': {
        display: 'flex !important',
        alignItems: 'center !important',
        height: '16px !important',
        minHeight: '16px !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important',
        lineHeight: '1 !important',
      },
      '.cm-line-hr .cm-widgetBuffer': {
        display: 'none !important',
      },
      '.cm-line-hr-gap': {
        height: '4px !important',
        minHeight: '4px !important',
        lineHeight: '4px !important',
        fontSize: '4px !important',
        padding: '0 !important',
        margin: '0 !important',
        overflow: 'hidden !important',
      },
      '.cm-hr-rendered': {
        width: '100% !important',
        border: 'none !important',
        borderTop: '1px solid var(--border-color, rgba(125, 125, 125, 0.25)) !important',
        margin: '0 !important',
        opacity: '0.6',
      },

      // Focus Mode (Paragraph Dimming)
      '&.cm-focus-mode .cm-line': {
        opacity: '0.32 !important',
        transition: 'opacity 320ms cubic-bezier(0.25, 1, 0.5, 1) !important',
      },
      '&.cm-focus-mode .cm-line.cm-line-focused-active': {
        opacity: '1 !important',
        transition: 'opacity 320ms cubic-bezier(0.25, 1, 0.5, 1) !important',
      },
      '&.cm-focus-mode .cm-line:hover': {
        opacity: '0.82 !important',
        transition: 'opacity 180ms cubic-bezier(0.25, 1, 0.5, 1) !important',
      },

      // Hidden block line for widgets
      '.cm-hidden-block-line': {
        display: 'none !important',
        height: '0 !important',
        margin: '0 !important',
        padding: '0 !important',
        border: 'none !important',
        overflow: 'hidden !important',
      },
    }),
  ];
}
