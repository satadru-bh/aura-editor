import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { EditorState, Extension, StateEffect } from '@codemirror/state';
import { EditorView, drawSelection, dropCursor, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { forceParsing } from '@codemirror/language';
import { GFM, Subscript, Superscript, Table, TaskList, Strikethrough } from '@lezer/markdown';
import { languages } from '@codemirror/language-data';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lineNumbers } from '@codemirror/view';
import { createLiveMarkdownPlugin } from '../editor/LiveMarkdownPlugin';
import { createEditorTheme } from '../editor/ThemeExtension';
import { createTypewriterPlugin } from '../editor/TypewriterPlugin';
import { createSyntaxHighlighting } from '../editor/SyntaxHighlighting';
import { createEditorKeybindings } from '../editor/Keymaps';
import { createWordTriggerPlugin } from '../editor/WordTriggerPlugin';
import { createTablePlugin } from '../editor/TablePlugin';
import { createFocusModePlugin } from '../editor/FocusPlugin';
import { createBionicReadingPlugin } from '../editor/BionicReadingPlugin';
import { createHemingwayPlugin } from '../editor/HemingwayPlugin';
import { createWikiLinkPlugin, createWikiLinkAutocompletion } from '../editor/WikiLinkPlugin';
import { WikiLinkPreviewPopover, WikiLinkPreviewData } from './WikiLinkPreviewPopover';
import { AudioService } from '../services/AudioService';
import { assetManager } from '../services/AssetManagerService';
import { workspaceService } from '../services/WorkspaceService';
import { EditorSettings, FileItem } from '../types';

export interface EditorHandle {
  getText: () => string;
  setText: (newText: string) => void;
  focus: () => void;
  jumpToPos: (pos: number) => void;
  insertText: (text: string) => void;
  getEditorView: () => EditorView | null;
}

interface EditorProps {
  initialContent: string;
  fileId?: string;
  settings: EditorSettings;
  files?: FileItem[];
  onChange: (content: string) => void;
  onCursorChange: (pos: { line: number; col: number; offset: number }) => void;
  onSave: () => void;
  onOpen: () => void;
  onNew: () => void;
  onFind: () => void;
  onReplace: () => void;
  onCommandPalette: () => void;
  onToggleOutline: () => void;
  onToggleFocus: () => void;
  onDropImage?: (name: string, dataUrl: string) => void;
  onDropFiles?: (files: FileList) => void;
  onOpenWikiLink?: (target: string) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(
  (
    {
      initialContent,
      fileId,
      settings,
      files = [],
      onChange,
      onCursorChange,
      onSave,
      onOpen,
      onNew,
      onFind,
      onReplace,
      onCommandPalette,
      onToggleOutline,
      onToggleFocus,
      onDropImage,
      onDropFiles,
      onOpenWikiLink,
    },
    ref
  ) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const isProgrammaticChangeRef = useRef(false);
    const currentFileIdRef = useRef<string | undefined>(fileId);
    currentFileIdRef.current = fileId;
    const filesRef = useRef(files);
    filesRef.current = files;
    const scrollAnimRef = useRef<number | null>(null);
    const [previewData, setPreviewData] = useState<WikiLinkPreviewData | null>(null);
    const previewTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
      const cur = files.find((f) => f.id === fileId);
      assetManager.setCurrentNotePath(cur?.path || null);
    }, [fileId, files]);

    useEffect(() => {
      return () => {
        if (scrollAnimRef.current !== null) {
          cancelAnimationFrame(scrollAnimRef.current);
          scrollAnimRef.current = null;
        }
        if (previewTimeoutRef.current !== null) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getText: () => {
        return editorViewRef.current ? editorViewRef.current.state.doc.toString() : '';
      },
      setText: (newText: string) => {
        if (editorViewRef.current) {
          const current = editorViewRef.current.state.doc.toString();
          if (current !== newText) {
            isProgrammaticChangeRef.current = true;
            try {
              editorViewRef.current.dispatch({
                changes: { from: 0, to: current.length, insert: newText },
              });
              if (settings.liveMarkdown) {
                forceParsing(editorViewRef.current, editorViewRef.current.state.doc.length, 5000);
              }
            } finally {
              isProgrammaticChangeRef.current = false;
            }
          }
        }
      },
      focus: () => {
        editorViewRef.current?.focus();
      },
      jumpToPos: (pos: number) => {
        if (editorViewRef.current) {
          const view = editorViewRef.current;
          const safePos = Math.min(Math.max(0, pos), view.state.doc.length);

          // Update selection smoothly without an abrupt instant jump
          view.dispatch({
            selection: { anchor: safePos, head: safePos },
            scrollIntoView: false,
          });
          view.focus();

          const scroller = view.scrollDOM;
          if (!scroller) return;

          // Cancel any running animation
          if (scrollAnimRef.current !== null) {
            cancelAnimationFrame(scrollAnimRef.current);
            scrollAnimRef.current = null;
          }

          const lineBlock = view.lineBlockAt(safePos);
          const scrollerHeight = scroller.clientHeight;
          const contentPaddingTop = parseFloat(window.getComputedStyle(view.contentDOM).paddingTop) || 0;
          // Calculate the target scrollTop that centers the section in the vertical middle of the screen
          const targetTop = Math.max(0, lineBlock.top + contentPaddingTop - (scrollerHeight / 2) + (lineBlock.height / 2));
          const startTop = scroller.scrollTop;
          const distance = targetTop - startTop;

          // If already at or within 2px of center, stop
          if (Math.abs(distance) < 2) {
            scroller.scrollTop = targetTop;
            return;
          }

          const startTime = performance.now();
          // Silky adaptive duration between 320ms and 480ms
          const duration = Math.min(480, Math.max(320, Math.abs(distance) * 0.35));

          const cancelAnim = () => {
            if (scrollAnimRef.current !== null) {
              cancelAnimationFrame(scrollAnimRef.current);
              scrollAnimRef.current = null;
            }
            scroller.removeEventListener('wheel', cancelAnim);
            scroller.removeEventListener('touchstart', cancelAnim);
          };

          scroller.addEventListener('wheel', cancelAnim, { passive: true, once: true });
          scroller.addEventListener('touchstart', cancelAnim, { passive: true, once: true });

          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Butter-smooth easeOutCubic curve
            const ease = 1 - Math.pow(1 - progress, 3);
            scroller.scrollTop = startTop + distance * ease;

            if (progress < 1) {
              scrollAnimRef.current = requestAnimationFrame(step);
            } else {
              scrollAnimRef.current = null;
              scroller.removeEventListener('wheel', cancelAnim);
              scroller.removeEventListener('touchstart', cancelAnim);

              // Fine-tune centering after line rendering and measurement
              requestAnimationFrame(() => {
                try {
                  const coords = view.coordsAtPos(safePos);
                  if (coords) {
                    const scrollerRect = scroller.getBoundingClientRect();
                    const scrollerCenterY = scrollerRect.top + scrollerRect.height / 2;
                    const headingCenterY = coords.top + (coords.bottom - coords.top) / 2;
                    const offsetDiff = headingCenterY - scrollerCenterY;
                    if (Math.abs(offsetDiff) > 1.5) {
                      scroller.scrollTop += offsetDiff;
                    }
                  }
                } catch {
                  // fallback
                }
              });
            }
          };

          scrollAnimRef.current = requestAnimationFrame(step);
        }
      },
      insertText: (text: string) => {
        if (editorViewRef.current) {
          const view = editorViewRef.current;
          const head = view.state.selection.main.head;
          view.dispatch({
            changes: { from: head, to: head, insert: text },
            selection: { anchor: head + text.length },
          });
        }
      },
      getEditorView: () => editorViewRef.current,
    }));

    const buildExtensions = (): Extension[] => {
      const customKeybindings = createEditorKeybindings();

      const extensions: Extension[] = [
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        markdown({
          base: markdownLanguage,
          codeLanguages: languages,
          extensions: [GFM, Subscript, Superscript, Table, TaskList, Strikethrough],
        }),
        createLiveMarkdownPlugin(settings.liveMarkdown),
        createTypewriterPlugin(settings.typewriterMode),
        createFocusModePlugin(settings.focusMode),
        createBionicReadingPlugin(!!settings.bionicReading),
        createHemingwayPlugin(!!settings.hemingwayMode),
        createWikiLinkPlugin(onOpenWikiLink),
        createWikiLinkAutocompletion(() => filesRef.current),
        createWordTriggerPlugin(() => settings.wordTriggers || []),
        createTablePlugin(),
        createSyntaxHighlighting(settings.theme),
        createEditorTheme(settings),
        highlightSelectionMatches(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isProgrammaticChangeRef.current) {
            const content = update.state.doc.toString();
            onChange(content);
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const lineObj = update.state.doc.lineAt(head);
            onCursorChange({
              line: lineObj.number,
              col: head - lineObj.from + 1,
              offset: head,
            });
          }
        }),
        keymap.of([
          indentWithTab,
          ...customKeybindings,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        EditorView.domEventHandlers({
          mouseover: (e) => {
            const el = (e.target as HTMLElement).closest('[data-wikilink-target]');
            if (el) {
              const targetName = el.getAttribute('data-wikilink-target') || '';
              const labelName = el.getAttribute('data-wikilink-label') || targetName;
              const rect = el.getBoundingClientRect();

              if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
              previewTimeoutRef.current = window.setTimeout(() => {
                const clean = targetName.toLowerCase();
                const match = filesRef.current.find(
                  (f) => f.name.replace(/\.(md|txt)$/i, '').toLowerCase() === clean
                );
                const previewContent = match ? match.content.slice(0, 320).trim() : undefined;
                setPreviewData({
                  target: targetName,
                  label: labelName,
                  x: rect.left,
                  y: rect.bottom,
                  previewContent,
                  filePath: match?.path,
                  exists: !!match,
                });
              }, 180);
            }
          },
          mouseout: (e) => {
            const related = e.relatedTarget as HTMLElement;
            if (!related || !related.closest('[data-wikilink-target]')) {
              if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
                previewTimeoutRef.current = null;
              }
              setPreviewData(null);
            }
          },
          keydown: (e) => {
            if (settings.audio?.keystrokeEnabled && settings.audio?.keystrokeSound !== 'none') {
              if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
                AudioService.playKeystroke(settings.audio.keystrokeSound, e.key);
              }
            }
            return false;
          },
          paste: (e, view) => {
            if (e.clipboardData?.items) {
              for (const item of Array.from(e.clipboardData.items)) {
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    e.preventDefault();
                    const cur = filesRef.current.find((f) => f.id === currentFileIdRef.current);
                    const notePath = cur?.path || null;
                    const wsPath = workspaceService.getState().folderPath;
                    assetManager.saveImage(file, notePath, wsPath).then((res) => {
                      if (res.success && res.markdownLink) {
                        const pos = view.state.selection.main.head;
                        view.dispatch({
                          changes: { from: pos, to: pos, insert: res.markdownLink },
                          selection: { anchor: pos + res.markdownLink.length },
                        });
                        onDropImage?.(res.fileName, res.relativePath);
                      }
                    });
                    return true;
                  }
                }
              }
            }
            return false;
          },
          dragover: (e) => {
            if (e.dataTransfer?.types.includes('application/x-aura-tab-id')) {
              e.preventDefault();
              return true;
            }
            e.preventDefault();
            return true;
          },
          drop: (e, view) => {
            if (e.dataTransfer?.types.includes('application/x-aura-tab-id')) {
              e.preventDefault();
              e.stopPropagation();
              return true;
            }
            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith('image/')) {
                e.preventDefault();
                const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }) || view.state.selection.main.head;
                const cur = filesRef.current.find((f) => f.id === currentFileIdRef.current);
                const notePath = cur?.path || null;
                const wsPath = workspaceService.getState().folderPath;

                assetManager.saveImage(file, notePath, wsPath).then((res) => {
                  if (res.success && res.markdownLink) {
                    view.dispatch({
                      changes: { from: pos, to: pos, insert: res.markdownLink },
                      selection: { anchor: pos + res.markdownLink.length },
                    });
                    onDropImage?.(res.fileName, res.relativePath);
                  }
                });
                return true;
              } else {
                // Document file dropped onto editor -> open as new document file
                e.preventDefault();
                e.stopPropagation();
                onDropFiles?.(e.dataTransfer.files);
                return true;
              }
            }
            return false;
          },
        }),
      ];

      // Line numbers are only shown in Source Mode, never in Live Rendering Mode
      if (settings.showLineNumbers && !settings.liveMarkdown) {
        extensions.push(lineNumbers());
      }

      if (settings.spellcheck) {
        extensions.push(EditorView.contentAttributes.of({ spellcheck: 'true' }));
      }

      return extensions;
    };

    // Initialize CodeMirror instance
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const state = EditorState.create({
        doc: initialContent,
        extensions: buildExtensions(),
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      editorViewRef.current = view;
      (window as any).__AURA_EDITOR_VIEW__ = view;

      // Ensure CodeMirror recalculates character geometry and line metrics when web/system fonts finish loading
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (editorViewRef.current) {
            editorViewRef.current.requestMeasure();
          }
        });
      }

      if (settings.liveMarkdown) {
        forceParsing(view, view.state.doc.length, 5000);
      }

      return () => {
        view.destroy();
      };
    }, []);

    // Update dynamic extensions when settings change smoothly
    useEffect(() => {
      if (!editorViewRef.current) return;
      const view = editorViewRef.current;
      view.dispatch({
        effects: StateEffect.reconfigure.of(buildExtensions()),
      });
      view.requestMeasure();
    }, [settings]);

    // Synchronize document content ONLY when switching files (driven by fileId)
    useEffect(() => {
      if (fileId !== undefined && fileId !== currentFileIdRef.current) {
        currentFileIdRef.current = fileId;
        const view = editorViewRef.current;
        if (!view) return;

        isProgrammaticChangeRef.current = true;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: initialContent },
          selection: { anchor: 0, head: 0 },
        });
        if (view.scrollDOM) {
          view.scrollDOM.scrollTop = 0;
        }
        isProgrammaticChangeRef.current = false;
      }
    }, [fileId, initialContent]);

    return (
      <div className="w-full h-full flex-1 flex flex-col items-stretch overflow-hidden relative">
        <div
          ref={editorContainerRef}
          className={`w-full h-full flex-1 overflow-hidden select-text flex flex-col ${settings.focusMode ? 'cm-focus-mode' : ''}`}
        />
        <WikiLinkPreviewPopover data={previewData} />
      </div>
    );
  }
);
