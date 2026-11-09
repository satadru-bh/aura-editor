import { syntaxTree, ensureSyntaxTree } from '@codemirror/language';
import { Range, StateField, EditorState, Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
} from '@codemirror/view';
import { TaskWidget } from './widgets/TaskWidget';
import { ImageWidget } from './widgets/ImageWidget';
import { LinkImageWidget } from './widgets/LinkImageWidget';
import { MathWidget } from './widgets/MathWidget';
import { HorizontalRuleWidget } from './widgets/HorizontalRuleWidget';
import { MermaidWidget } from './widgets/MermaidWidget';
import { CalloutHeaderWidget } from './widgets/CalloutHeaderWidget';
import { TableWidget } from './widgets/TableWidget';
import { DetailsWidget } from './widgets/DetailsWidget';
import { CodeBlockHeaderWidget } from './widgets/CodeBlockHeaderWidget';
import { ProgressBarWidget, MeterWidget, DefinitionListWidget } from './widgets/HTMLUIWidget';
import { collapsedCodeBlocksField } from './CodeCollapseEffect';

// Mark Decorations
const headingTextDeco = [
  Decoration.mark({ class: 'cm-h1' }),
  Decoration.mark({ class: 'cm-h2' }),
  Decoration.mark({ class: 'cm-h3' }),
  Decoration.mark({ class: 'cm-h4' }),
  Decoration.mark({ class: 'cm-h5' }),
  Decoration.mark({ class: 'cm-h6' }),
];

const boldDeco = Decoration.mark({ class: 'cm-bold' });
const italicDeco = Decoration.mark({ class: 'cm-italic' });
const strikethroughDeco = Decoration.mark({ class: 'cm-strikethrough' });
const inlineCodeDeco = Decoration.mark({
  attributes: { spellcheck: 'false', 'data-gramm': 'false' },
  class: 'cm-inline-code',
});
const highlightDeco = Decoration.mark({ class: 'cm-highlight' });
const footnoteRefDeco = Decoration.mark({ class: 'cm-footnote-ref' });
const linkTextDeco = Decoration.mark({ class: 'cm-link-text' });
const syntaxFadedDeco = Decoration.mark({ class: 'cm-syntax-faded' });
const codeLangTagDeco = Decoration.mark({ class: 'cm-code-lang-tag' });

// Micro-typography mark decorations
const subDeco = Decoration.mark({ class: 'cm-sub' });
const supDeco = Decoration.mark({ class: 'cm-sup' });
const kbdDeco = Decoration.mark({ class: 'cm-kbd' });
const underlineDeco = Decoration.mark({ class: 'cm-underline' });
const insDeco = Decoration.mark({ class: 'cm-ins' });
const smallDeco = Decoration.mark({ class: 'cm-small' });

// True Live Markdown Replace Collapse
const collapseDeco = Decoration.replace({});

function buildLiveMarkdownDecorations(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const selection = state.selection;
  // Use incremental syntax tree to keep keystrokes instant and fluid
  const tree = syntaxTree(state);
  const doc = state.doc;

  // Multi-class accumulation map for orthogonal feature composition
  const lineClassesMap = new Map<number, Set<string>>();
  const codeRanges: { from: number; to: number }[] = [];
  const collapsedBlocks = state.field(collapsedCodeBlocksField, false) || new Set<number>();

  const addLineClass = (lineNum: number, cls: string) => {
    let set = lineClassesMap.get(lineNum);
    if (!set) {
      set = new Set<string>();
      lineClassesMap.set(lineNum, set);
    }
    set.add(cls);
  };

  // Collect cursor lines
  const activeLineNumbers = new Set<number>();
  for (const range of selection.ranges) {
    const startLine = doc.lineAt(range.from).number;
    const endLine = doc.lineAt(range.to).number;
    for (let l = startLine; l <= endLine; l++) {
      activeLineNumbers.add(l);
    }
  }

  const isRangeActive = (from: number, to: number): boolean => {
    for (const range of selection.ranges) {
      if (range.from <= to && range.to >= from) {
        return true;
      }
    }
    return false;
  };

  const isLineActive = (lineNum: number): boolean => {
    return activeLineNumbers.has(lineNum);
  };

  const safeCollapse = (from: number, to: number) => {
    if (from >= to) return;
    const startLine = doc.lineAt(from);
    const endLine = doc.lineAt(to);
    if (startLine.number === endLine.number) {
      ranges.push(collapseDeco.range(from, to));
    } else {
      for (let l = startLine.number; l <= endLine.number; l++) {
        const line = doc.line(l);
        const lFrom = Math.max(from, line.from);
        const lTo = Math.min(to, line.to);
        if (lFrom < lTo) {
          ranges.push(collapseDeco.range(lFrom, lTo));
        }
      }
    }
  };

  // 1. Traverse syntax tree over the document
  tree.iterate({
    from: 0,
    to: doc.length,
    enter: (node) => {
      const nodeName = node.name;
      const nodeFrom = node.from;
      const nodeTo = node.to;
      if (nodeFrom > nodeTo || nodeTo > doc.length) return;

      const line = doc.lineAt(nodeFrom);
      const isCurrentLineActive = isLineActive(line.number);
      const isCurrentRangeActive = isRangeActive(nodeFrom, nodeTo);

      // Record code block boundaries
      if (
        nodeName === 'FencedCode' ||
        nodeName === 'InlineCode' ||
        nodeName === 'CodeBlock'
      ) {
        codeRanges.push({ from: nodeFrom, to: nodeTo });
      }

      // Real Visual Table Rendering (Block Widget via StateField)
      if (nodeName === 'Table') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        if (!isRangeActive(nodeFrom, nodeTo)) {
          const tableRaw = doc.sliceString(nodeFrom, nodeTo);
          ranges.push(
            Decoration.replace({
              widget: new TableWidget(tableRaw),
              block: true,
            }).range(doc.line(startL).from, doc.line(endL).to)
          );
          return;
        }
      }

      // Headings (ATXHeading1 - ATXHeading6)
      const headingMatch = nodeName.match(/^ATXHeading(\d)$/);
      if (headingMatch) {
        const level = parseInt(headingMatch[1], 10);
        if (level >= 1 && level <= 6) {
          addLineClass(line.number, `cm-line-h${level}`);
          if (nodeFrom < nodeTo) {
            ranges.push(headingTextDeco[level - 1].range(nodeFrom, nodeTo));
          }
        }
      }

      // Setext Headings
      // Setext Headings
      if (nodeName === 'SetextHeading1') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        addLineClass(startL, 'cm-line-h1');
        ranges.push(headingTextDeco[0].range(doc.line(startL).from, doc.line(startL).to));
        if (startL !== endL && !isLineActive(endL)) {
          safeCollapse(doc.line(endL).from, doc.line(endL).to);
        } else if (startL !== endL) {
          ranges.push(syntaxFadedDeco.range(doc.line(endL).from, doc.line(endL).to));
        }
      }
      if (nodeName === 'SetextHeading2') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        addLineClass(startL, 'cm-line-h2');
        ranges.push(headingTextDeco[1].range(doc.line(startL).from, doc.line(startL).to));
        if (startL !== endL && !isLineActive(endL)) {
          safeCollapse(doc.line(endL).from, doc.line(endL).to);
        } else if (startL !== endL) {
          ranges.push(syntaxFadedDeco.range(doc.line(endL).from, doc.line(endL).to));
        }
      }

      // Heading Markers (#, ##, etc.)
      if (nodeName === 'HeaderMark') {
        const nextChar = doc.sliceString(nodeTo, nodeTo + 1);
        const hideEnd = nextChar === ' ' ? nodeTo + 1 : nodeTo;
        if (!isCurrentLineActive && nodeFrom < hideEnd && hideEnd <= line.to) {
          safeCollapse(nodeFrom, hideEnd);
        } else if (nodeFrom < nodeTo) {
          ranges.push(syntaxFadedDeco.range(nodeFrom, nodeTo));
        }
      }

      // Bold & Italic & Strikethrough
      if (nodeName === 'StrongEmphasis') {
        if (nodeFrom < nodeTo) {
          ranges.push(boldDeco.range(nodeFrom, nodeTo));
        }
      }
      if (nodeName === 'Emphasis') {
        if (nodeFrom < nodeTo) {
          ranges.push(italicDeco.range(nodeFrom, nodeTo));
        }
      }
      if (nodeName === 'Strikethrough') {
        if (nodeFrom < nodeTo) {
          ranges.push(strikethroughDeco.range(nodeFrom, nodeTo));
        }
      }

      // Markdown formatting markers (*, **, ~~, _)
      if (nodeName === 'EmphasisMark' || nodeName === 'StrikethroughMark') {
        if (!isCurrentLineActive && nodeFrom < nodeTo) {
          safeCollapse(nodeFrom, nodeTo);
        } else if (nodeFrom < nodeTo) {
          ranges.push(syntaxFadedDeco.range(nodeFrom, nodeTo));
        }
      }

      // Inline Code (`code`)
      if (nodeName === 'InlineCode') {
        if (nodeFrom < nodeTo) {
          ranges.push(inlineCodeDeco.range(nodeFrom, nodeTo));
        }
      }
      if (nodeName === 'CodeMark' && node.node.parent?.name === 'InlineCode') {
        if (!isCurrentLineActive && nodeFrom < nodeTo) {
          safeCollapse(nodeFrom, nodeTo);
        } else if (nodeFrom < nodeTo) {
          ranges.push(syntaxFadedDeco.range(nodeFrom, nodeTo));
        }
      }

      // List Items (independent of whether inside blockquotes)
      if (nodeName === 'ListItem') {
        const l = doc.lineAt(nodeFrom);
        const textWithoutQuote = l.text.replace(/^(\s*>\s*)+/, '');
        const quoteMatch = l.text.match(/^(\s*>\s*)+/);
        const quoteDepth = quoteMatch ? (quoteMatch[0].match(/>/g) || []).length : 0;
        const indentMatch = textWithoutQuote.match(/^(\s*)/);
        const spaces = indentMatch ? indentMatch[1].length : 0;
        const depth = Math.min(4, Math.floor(spaces / 2));

        if (quoteDepth > 0) {
          addLineClass(l.number, `cm-list-q${Math.min(4, quoteDepth)}-d${depth}`);
        } else {
          addLineClass(l.number, `cm-list-depth-${depth}`);
        }
      }

      // List markers (*, -, +)
      if (nodeName === 'ListMark') {
        if (!isCurrentLineActive && nodeFrom < nodeTo) {
          ranges.push(syntaxFadedDeco.range(nodeFrom, nodeTo));
        }
      }

      // Blockquotes & Callouts
      if (nodeName === 'Blockquote') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        const firstLine = doc.line(startL);
        const calloutMatch = firstLine.text.match(/^>\s*\[!([A-Za-z0-9_-]+)\](?:\s+(.*))?/i);

        let calloutType = '';
        if (calloutMatch) {
          calloutType = calloutMatch[1].toUpperCase();
          const customTitle = calloutMatch[2]?.trim() || undefined;

          if (!isLineActive(startL)) {
            const cFrom = firstLine.from;
            const cTo = customTitle ? firstLine.to : Math.min(firstLine.to, firstLine.from + calloutMatch[0].length);
            if (cFrom < cTo) {
              ranges.push(
                Decoration.replace({
                  widget: new CalloutHeaderWidget(calloutType, customTitle),
                }).range(cFrom, cTo)
              );
            }
          }
        }

        for (let l = startL; l <= endL; l++) {
          const currLine = doc.line(l);
          if (calloutMatch) {
            addLineClass(l, 'cm-callout-line');
            addLineClass(l, `cm-callout-${calloutType.toLowerCase()}`);
            if (startL === endL) addLineClass(l, 'cm-callout-single');
            else if (l === startL) addLineClass(l, 'cm-callout-first');
            else if (l === endL) addLineClass(l, 'cm-callout-last');
          } else {
            const quoteMatch = currLine.text.match(/^(\s*>\s*)+/);
            const quoteDepth = quoteMatch ? (quoteMatch[0].match(/>/g) || []).length : 1;
            addLineClass(l, 'cm-blockquote-line');
            addLineClass(l, `cm-blockquote-depth-${Math.min(4, quoteDepth)}`);
          }
        }
      }

      // Quote marks (collapse `>` and space cleanly)
      if (nodeName === 'QuoteMark') {
        const nextChar = doc.sliceString(nodeTo, nodeTo + 1);
        const hideEnd = nextChar === ' ' ? nodeTo + 1 : nodeTo;
        if (!isCurrentLineActive && nodeFrom < hideEnd && hideEnd <= line.to) {
          safeCollapse(nodeFrom, hideEnd);
        } else if (nodeFrom < nodeTo) {
          ranges.push(syntaxFadedDeco.range(nodeFrom, nodeTo));
        }
      }

      // Tasks Checkboxes (- [ ] / - [x])
      if (nodeName === 'TaskMarker') {
        if (nodeFrom < nodeTo) {
          const text = doc.sliceString(nodeFrom, nodeTo);
          const isChecked = text.toLowerCase().includes('x');
          ranges.push(
            Decoration.replace({
              widget: new TaskWidget(isChecked, nodeFrom),
            }).range(nodeFrom, nodeTo)
          );
        }
      }

      // Horizontal Rule (---)
      if (nodeName === 'HorizontalRule') {
        const hrLine = doc.lineAt(nodeFrom);
        addLineClass(hrLine.number, 'cm-line-hr');

        // Compact adjacent blank spacer lines when not focused
        if (hrLine.number > 1) {
          const prevLine = doc.line(hrLine.number - 1);
          if (prevLine.text.trim() === '' && !isLineActive(prevLine.number)) {
            addLineClass(prevLine.number, 'cm-line-hr-gap');
          }
        }
        if (hrLine.number < doc.lines) {
          const nextLine = doc.line(hrLine.number + 1);
          if (nextLine.text.trim() === '' && !isLineActive(nextLine.number)) {
            addLineClass(nextLine.number, 'cm-line-hr-gap');
          }
        }

        if (!isCurrentLineActive && nodeFrom < nodeTo) {
          ranges.push(
            Decoration.replace({
              widget: new HorizontalRuleWidget(),
            }).range(nodeFrom, nodeTo)
          );
        }
      }

      // Links: [Label](URL) and Badge Links: [![Alt](Src)](URL)
      if (nodeName === 'Link') {
        const linkRaw = doc.sliceString(nodeFrom, nodeTo);
        const badgeMatch = linkRaw.match(/^\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)$/);

        if (badgeMatch && !isCurrentRangeActive && !isCurrentLineActive && nodeFrom < nodeTo) {
          const alt = badgeMatch[1];
          const imgSrc = badgeMatch[2];
          const href = badgeMatch[3];
          ranges.push(
            Decoration.replace({
              widget: new LinkImageWidget(alt, imgSrc, href),
            }).range(nodeFrom, nodeTo)
          );
        } else if (nodeFrom < nodeTo) {
          const stdMatch = linkRaw.match(/^\[(.*?)\]\((.*?)\)$/);
          if (stdMatch) {
            const label = stdMatch[1];
            const labelFrom = nodeFrom + 1;
            const labelTo = labelFrom + label.length;
            const closeParenTo = nodeTo;

            if (!isCurrentLineActive && !isCurrentRangeActive) {
              safeCollapse(nodeFrom, labelFrom);
              if (labelFrom < labelTo) {
                ranges.push(linkTextDeco.range(labelFrom, labelTo));
              }
              if (labelTo < closeParenTo) {
                safeCollapse(labelTo, closeParenTo);
              }
            } else {
              ranges.push(syntaxFadedDeco.range(nodeFrom, labelFrom));
              if (labelFrom < labelTo) {
                ranges.push(linkTextDeco.range(labelFrom, labelTo));
              }
              ranges.push(syntaxFadedDeco.range(labelTo, closeParenTo));
            }
          }
        }
      }

      // Standalone Images: ![Alt](Src)
      if (nodeName === 'Image') {
        const parentName = node.node.parent?.name;
        if (parentName !== 'Link') {
          const imageRaw = doc.sliceString(nodeFrom, nodeTo);
          const match = imageRaw.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (match && !isCurrentLineActive && !isCurrentRangeActive && nodeFrom < nodeTo) {
            const alt = match[1];
            const src = match[2];
            ranges.push(
              Decoration.replace({
                widget: new ImageWidget(alt, src),
              }).range(nodeFrom, nodeTo)
            );
          }
        }
      }

      // Fenced Code Blocks (```lang ... ``` anywhere, including inside blockquotes)
      if (nodeName === 'FencedCode') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        const firstLine = doc.line(startL);
        const endLine = doc.line(endL);

        const firstLineText = firstLine.text;
        const fenceIdx = firstLineText.indexOf('```');
        let lang = '';
        if (fenceIdx !== -1) {
          const langMatch = firstLineText.slice(fenceIdx).match(/^`{3,4}\s*([a-zA-Z0-9_\-#+]*)/);
          lang = langMatch ? langMatch[1].toLowerCase() : '';
        }

        // If Mermaid diagram and NOT actively editing inside, render live diagram!
        if (lang === 'mermaid' && !isCurrentRangeActive) {
          const codeBody = doc.sliceString(
            doc.line(Math.min(doc.lines, startL + 1)).from,
            doc.line(Math.max(startL, endL - 1)).to
          );
          ranges.push(
            Decoration.replace({
              widget: new MermaidWidget(codeBody),
              block: true,
            }).range(firstLine.from, endLine.to)
          );
          return;
        }

        const isCollapsed = collapsedBlocks.has(startL);
        const linesCount = Math.max(1, endL - startL - 1);
        const firstLineQuoteMatch = firstLineText.match(/^(\s*>\s*)+/);
        const firstLineQuoteDepth = firstLineQuoteMatch ? (firstLineQuoteMatch[0].match(/>/g) || []).length : 0;
        const codeBody = startL + 1 <= endL - 1
          ? doc.sliceString(doc.line(startL + 1).from, doc.line(endL - 1).to)
          : '';

        if (isCollapsed) {
          addLineClass(startL, 'cm-code-block-header-line');
          addLineClass(startL, 'cm-code-block-collapsed');
          if (firstLineQuoteDepth > 0) {
            addLineClass(startL, `cm-code-in-q${Math.min(4, firstLineQuoteDepth)}`);
          }
          ranges.push(
            Decoration.replace({
              widget: new CodeBlockHeaderWidget(
                lang,
                codeBody,
                firstLineQuoteDepth,
                true,
                linesCount,
                startL
              ),
            }).range(firstLine.from, endLine.to)
          );
          return false;
        }

        // Decorate lines with continuous code card classes
        for (let l = startL; l <= endL; l++) {
          const currLine = doc.line(l);
          const quoteMatch = currLine.text.match(/^(\s*>\s*)+/);
          const quoteDepth = quoteMatch ? (quoteMatch[0].match(/>/g) || []).length : 0;

          addLineClass(l, 'cm-code-block-line');
          if (quoteDepth > 0) {
            addLineClass(l, `cm-code-in-q${Math.min(4, quoteDepth)}`);
            if (!isLineActive(l)) {
              const prefixLen = quoteMatch![0].length;
              safeCollapse(currLine.from, currLine.from + prefixLen);
            } else {
              const prefixLen = quoteMatch![0].length;
              ranges.push(syntaxFadedDeco.range(currLine.from, currLine.from + prefixLen));
            }
          }

          if (startL === endL) addLineClass(l, 'cm-code-block-single');
          else if (l === startL) addLineClass(l, 'cm-code-block-first');
          else if (l === endL) addLineClass(l, 'cm-code-block-last');
          else addLineClass(l, 'cm-code-block-mid');
        }

        // First line: render full CodeBlockHeaderWidget (● LANG + Copy + Collapse) or fade prefix when active
        if (!isLineActive(startL)) {
          addLineClass(startL, 'cm-code-block-header-line');
          ranges.push(
            Decoration.replace({
              widget: new CodeBlockHeaderWidget(
                lang,
                codeBody,
                firstLineQuoteDepth,
                false,
                linesCount,
                startL
              ),
            }).range(firstLine.from, firstLine.to)
          );
        } else if (fenceIdx !== -1) {
          const afterFence = firstLineText.slice(fenceIdx);
          const matchFence = afterFence.match(/^(`{3,4})\s*([a-zA-Z0-9_\-#+]*)/);
          if (matchFence) {
            const fenceLen = matchFence[1].length;
            const fenceFrom = firstLine.from + fenceIdx;
            const fenceTo = fenceFrom + fenceLen;
            ranges.push(syntaxFadedDeco.range(fenceFrom, fenceTo));
            if (matchFence[2]) {
              const langFrom = fenceTo + matchFence[0].slice(fenceLen).indexOf(matchFence[2]);
              const langTo = langFrom + matchFence[2].length;
              if (langFrom < langTo) {
                ranges.push(codeLangTagDeco.range(langFrom, langTo));
              }
            }
          }
        }

        // Last line: fade or collapse ``` (independent of position on line)
        if (startL !== endL) {
          const endLineText = endLine.text;
          const closeIdx = endLineText.lastIndexOf('```');
          if (closeIdx !== -1) {
            const isEndActive = isLineActive(endL);
            const closeMatch = endLineText.slice(closeIdx).match(/^`{3,4}/);
            const closeLen = closeMatch ? closeMatch[0].length : 3;
            const closeFrom = endLine.from + closeIdx;
            const closeTo = closeFrom + closeLen;
            if (!isEndActive) {
              addLineClass(endL, 'cm-code-block-end-line');
              safeCollapse(closeFrom, closeTo);
            } else {
              ranges.push(syntaxFadedDeco.range(closeFrom, closeTo));
            }
          }
        }
      }

      // Frontmatter
      if (nodeName === 'Frontmatter') {
        const startL = doc.lineAt(nodeFrom).number;
        const endL = doc.lineAt(nodeTo).number;
        for (let l = startL; l <= endL; l++) {
          addLineClass(l, 'cm-frontmatter-line');
        }
      }
    },
  });

  const isInsideCode = (from: number, to: number) => {
    return codeRanges.some(
      (cr) =>
        (from >= cr.from && from <= cr.to) ||
        (to >= cr.from && to <= cr.to) ||
        (from <= cr.from && to >= cr.to)
    );
  };

  // 2. Extra regex pass over the document text
  const fullDocText = doc.toString();

  // Strikethrough fallback: ~~text~~
  const strikeRegex = /~~([^~\n]+)~~/g;
  let stMatch: RegExpExecArray | null;
  while ((stMatch = strikeRegex.exec(fullDocText)) !== null) {
    const mFrom = stMatch.index;
    const mTo = mFrom + stMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (mFrom < mTo) {
      ranges.push(strikethroughDeco.range(mFrom, mTo));
      if (!isEditing) {
        safeCollapse(mFrom, mFrom + 2);
        safeCollapse(mTo - 2, mTo);
      } else {
        ranges.push(syntaxFadedDeco.range(mFrom, mFrom + 2));
        ranges.push(syntaxFadedDeco.range(mTo - 2, mTo));
      }
    }
  }

  // Native Progress Bar: <progress value="..." max="..."></progress>
  const progRegex = /<progress\s+value="(\d+)"\s+max="(\d+)"(?:\s*\/?>|>\s*<\/progress>)/gi;
  let progMatch: RegExpExecArray | null;
  while ((progMatch = progRegex.exec(fullDocText)) !== null) {
    const mFrom = progMatch.index;
    const mTo = mFrom + progMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing && mFrom < mTo) {
      const val = parseInt(progMatch[1], 10);
      const max = parseInt(progMatch[2], 10);
      ranges.push(
        Decoration.replace({
          widget: new ProgressBarWidget(val, max),
        }).range(mFrom, mTo)
      );
    }
  }

  // Native Value Meter: <meter value="..." ...></meter>
  const meterRegex = /<meter\s+value="([\d\.]+)"(?:\s+min="([\d\.]+)")?(?:\s+max="([\d\.]+)")?(?:\s*\/?>|>\s*<\/meter>)/gi;
  let meterMatch: RegExpExecArray | null;
  while ((meterMatch = meterRegex.exec(fullDocText)) !== null) {
    const mFrom = meterMatch.index;
    const mTo = mFrom + meterMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing && mFrom < mTo) {
      const val = parseFloat(meterMatch[1]);
      const min = meterMatch[2] ? parseFloat(meterMatch[2]) : 0;
      const max = meterMatch[3] ? parseFloat(meterMatch[3]) : 100;
      ranges.push(
        Decoration.replace({
          widget: new MeterWidget(val, min, max),
        }).range(mFrom, mTo)
      );
    }
  }

  // Semantic Definition Lists: <dl> ... </dl>
  const dlRegex = /<dl>([\s\S]*?)<\/dl>/gi;
  let dlMatch: RegExpExecArray | null;
  while ((dlMatch = dlRegex.exec(fullDocText)) !== null) {
    const mFrom = dlMatch.index;
    const mTo = mFrom + dlMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing && mFrom < mTo) {
      const startL = doc.lineAt(mFrom).number;
      const endL = doc.lineAt(mTo).number;
      ranges.push(
        Decoration.replace({
          widget: new DefinitionListWidget(dlMatch[0]),
          block: true,
        }).range(doc.line(startL).from, doc.line(endL).to)
      );
    }
  }

  // Native Details / Summary Accordions: <details>...</details>
  const detailsRegex = /<details(?:\s+[^>]*)?>([\s\S]*?)<\/details>/gi;
  let dtMatch: RegExpExecArray | null;
  while ((dtMatch = detailsRegex.exec(fullDocText)) !== null) {
    const mFrom = dtMatch.index;
    const mTo = mFrom + dtMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing && mFrom < mTo) {
      const startL = doc.lineAt(mFrom).number;
      const endL = doc.lineAt(mTo).number;
      const fullDetails = dtMatch[0];
      const sumMatch = fullDetails.match(/<summary>([\s\S]*?)<\/summary>/i);
      const summaryText = sumMatch ? sumMatch[1] : 'Details';
      const bodyText = fullDetails.replace(/<details(?:\s+[^>]*)?>/i, '').replace(/<\/details>/i, '').replace(/<summary>[\s\S]*?<\/summary>/i, '');

      ranges.push(
        Decoration.replace({
          widget: new DetailsWidget(summaryText, bodyText),
          block: true,
        }).range(doc.line(startL).from, doc.line(endL).to)
      );
    }
  }

  // Center alignment blocks: <div align="center"> ... </div>
  const centerRegex = /<div\s+align="center">([\s\S]*?)<\/div>/gi;
  let centerMatch: RegExpExecArray | null;
  while ((centerMatch = centerRegex.exec(fullDocText)) !== null) {
    const mFrom = centerMatch.index;
    const mTo = mFrom + centerMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const openTagLen = centerMatch[0].indexOf('>') + 1;
    const closeTagLen = 6; // </div>

    const startL = doc.lineAt(mFrom).number;
    const endL = doc.lineAt(mTo).number;

    if (!isLineActive(startL)) {
      safeCollapse(mFrom, mFrom + openTagLen);
    }
    if (!isLineActive(endL)) {
      safeCollapse(mTo - closeTagLen, mTo);
    }

    for (let l = startL; l <= endL; l++) {
      addLineClass(l, 'cm-align-center');
    }
  }

  // HTML Mark: <mark style="...">text</mark>
  const markRegex = /<mark(?:\s+[^>]*)?>([\s\S]*?)<\/mark>/gi;
  let markMatch: RegExpExecArray | null;
  while ((markMatch = markRegex.exec(fullDocText)) !== null) {
    const mFrom = markMatch.index;
    const mTo = mFrom + markMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const openTagLen = markMatch[0].indexOf('>') + 1;
    const contentFrom = mFrom + openTagLen;
    const contentTo = mTo - 7; // </mark>

    if (contentFrom < contentTo) {
      ranges.push(highlightDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // HTML Span: <span style="...">text</span>
  const spanRegex = /<span\s+style="([^"]*)">([\s\S]*?)<\/span>/gi;
  let spanMatch: RegExpExecArray | null;
  while ((spanMatch = spanRegex.exec(fullDocText)) !== null) {
    const mFrom = spanMatch.index;
    const mTo = mFrom + spanMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const openTagLen = spanMatch[0].indexOf('>') + 1;
    const contentFrom = mFrom + openTagLen;
    const contentTo = mTo - 7; // </span>

    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Subscript: <sub>text</sub>
  const subRegex = /<sub>(.*?)<\/sub>/gi;
  let subMatch: RegExpExecArray | null;
  while ((subMatch = subRegex.exec(fullDocText)) !== null) {
    const mFrom = subMatch.index;
    const mTo = mFrom + subMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 5;
    const contentTo = mTo - 6;
    if (contentFrom < contentTo) {
      ranges.push(subDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Superscript: <sup>text</sup>
  const supRegex = /<sup>(.*?)<\/sup>/gi;
  let supMatch: RegExpExecArray | null;
  while ((supMatch = supRegex.exec(fullDocText)) !== null) {
    const mFrom = supMatch.index;
    const mTo = mFrom + supMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 5;
    const contentTo = mTo - 6;
    if (contentFrom < contentTo) {
      ranges.push(supDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Keyboard input: <kbd>key</kbd>
  const kbdRegex = /<kbd>(.*?)<\/kbd>/gi;
  let kbdMatch: RegExpExecArray | null;
  while ((kbdMatch = kbdRegex.exec(fullDocText)) !== null) {
    const mFrom = kbdMatch.index;
    const mTo = mFrom + kbdMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 5;
    const contentTo = mTo - 6;
    if (contentFrom < contentTo) {
      ranges.push(kbdDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Underline: <u>text</u>
  const uRegex = /<u>(.*?)<\/u>/gi;
  let uMatch: RegExpExecArray | null;
  while ((uMatch = uRegex.exec(fullDocText)) !== null) {
    const mFrom = uMatch.index;
    const mTo = mFrom + uMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 3;
    const contentTo = mTo - 4;
    if (contentFrom < contentTo) {
      ranges.push(underlineDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Insertion: <ins>text</ins>
  const insRegex = /<ins>(.*?)<\/ins>/gi;
  let insMatch: RegExpExecArray | null;
  while ((insMatch = insRegex.exec(fullDocText)) !== null) {
    const mFrom = insMatch.index;
    const mTo = mFrom + insMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 5;
    const contentTo = mTo - 6;
    if (contentFrom < contentTo) {
      ranges.push(insDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Deletion: <del>text</del>
  const delRegex = /<del>(.*?)<\/del>/gi;
  let delMatch: RegExpExecArray | null;
  while ((delMatch = delRegex.exec(fullDocText)) !== null) {
    const mFrom = delMatch.index;
    const mTo = mFrom + delMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 5;
    const contentTo = mTo - 6;
    if (contentFrom < contentTo) {
      ranges.push(strikethroughDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // Small print: <small>text</small>
  const smallRegex = /<small>(.*?)<\/small>/gi;
  let smallMatch: RegExpExecArray | null;
  while ((smallMatch = smallRegex.exec(fullDocText)) !== null) {
    const mFrom = smallMatch.index;
    const mTo = mFrom + smallMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    const contentFrom = mFrom + 7;
    const contentTo = mTo - 8;
    if (contentFrom < contentTo) {
      ranges.push(smallDeco.range(contentFrom, contentTo));
    }
    if (!isEditing) {
      safeCollapse(mFrom, contentFrom);
      safeCollapse(contentTo, mTo);
    }
  }

  // CommonMark / GFM standard backslash escapes: \! \" \# \$ \% \& \' \( \) \* \+ \, \- \. \/ \: \; \< \= \> \? \@ \[ \\ \] \^ \_ \` \{ \| \} \~
  const escapeRegex = /\\([!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~])/g;
  let escMatch: RegExpExecArray | null;
  while ((escMatch = escapeRegex.exec(fullDocText)) !== null) {
    const mFrom = escMatch.index;
    const mTo = mFrom + escMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing) {
      safeCollapse(mFrom, mFrom + 1);
    }
  }

  // Highlights: ==highlight==
  const highlightRegex = /==([^=\n]+)==/g;
  let hlMatch: RegExpExecArray | null;
  while ((hlMatch = highlightRegex.exec(fullDocText)) !== null) {
    const mFrom = hlMatch.index;
    const mTo = mFrom + hlMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (mFrom < mTo) {
      ranges.push(highlightDeco.range(mFrom, mTo));
      if (!isEditing) {
        safeCollapse(mFrom, mFrom + 2);
        safeCollapse(mTo - 2, mTo);
      } else {
        ranges.push(syntaxFadedDeco.range(mFrom, mFrom + 2));
        ranges.push(syntaxFadedDeco.range(mTo - 2, mTo));
      }
    }
  }

  // Footnote references: [^1]
  const footnoteRegex = /\[\^([a-zA-Z0-9_\-]+)\](?!\:)/g;
  let fnMatch: RegExpExecArray | null;
  while ((fnMatch = footnoteRegex.exec(fullDocText)) !== null) {
    const mFrom = fnMatch.index;
    const mTo = mFrom + fnMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    if (mFrom < mTo) {
      ranges.push(footnoteRefDeco.range(mFrom, mTo));
    }
  }

  // KaTeX $$ block math $$
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let bMathMatch: RegExpExecArray | null;
  while ((bMathMatch = blockMathRegex.exec(fullDocText)) !== null) {
    const mFrom = bMathMatch.index;
    const mTo = mFrom + bMathMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const startL = doc.lineAt(mFrom).number;
    const endL = doc.lineAt(mTo).number;
    let isEditing = isRangeActive(mFrom, mTo);
    if (!isEditing) {
      for (let l = startL; l <= endL; l++) {
        if (isLineActive(l)) {
          isEditing = true;
          break;
        }
      }
    }

    if (!isEditing && mFrom < mTo) {
      const latex = bMathMatch[1];
      ranges.push(
        Decoration.replace({
          widget: new MathWidget(latex, true),
          block: true,
        }).range(doc.line(startL).from, doc.line(endL).to)
      );
    }
  }

  // KaTeX $ inline math $
  const inlineMathRegex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;
  let iMathMatch: RegExpExecArray | null;
  while ((iMathMatch = inlineMathRegex.exec(fullDocText)) !== null) {
    const mFrom = iMathMatch.index;
    const mTo = mFrom + iMathMatch[0].length;
    if (isInsideCode(mFrom, mTo)) continue;

    const isEditing = isRangeActive(mFrom, mTo) || isLineActive(doc.lineAt(mFrom).number);
    if (!isEditing && mFrom < mTo) {
      const latex = iMathMatch[1];
      ranges.push(
        Decoration.replace({
          widget: new MathWidget(latex, false),
        }).range(mFrom, mTo)
      );
    }
  }

  // 3. Guarantee any line with blockquote prefix has continuous blockquote classes
  for (let l = 1; l <= doc.lines; l++) {
    const line = doc.line(l);
    const quoteMatch = line.text.match(/^(\s*>\s*)+/);
    if (quoteMatch) {
      const quoteDepth = (quoteMatch[0].match(/>/g) || []).length;
      if (quoteDepth > 0) {
        addLineClass(l, 'cm-blockquote-line');
        addLineClass(l, `cm-blockquote-depth-${Math.min(4, quoteDepth)}`);
      }
    }
  }

  // 4. Emit accumulated composite line decorations cleanly
  for (let l = 1; l <= doc.lines; l++) {
    const classes = lineClassesMap.get(l);
    if (classes && classes.size > 0) {
      // Code blocks and callouts are self-contained cards: do not mix with blockquote border lines
      if (classes.has('cm-code-block-line') || classes.has('cm-callout-line')) {
        classes.delete('cm-blockquote-line');
        classes.delete('cm-blockquote-depth-1');
        classes.delete('cm-blockquote-depth-2');
        classes.delete('cm-blockquote-depth-3');
        classes.delete('cm-blockquote-depth-4');
      }
      if (classes.size > 0) {
        ranges.push(
          Decoration.line({ class: Array.from(classes).join(' ') }).range(doc.line(l).from)
        );
      }
    }
  }

  // Build sorted decoration set safely
  try {
    return Decoration.set(ranges, true);
  } catch (e) {
    console.warn('LiveMarkdownPlugin decoration build error:', e);
    return Decoration.none;
  }
}

// StateField for Live Markdown: correctly manages block decorations and smooth rendering
export const liveMarkdownField = StateField.define<DecorationSet>({
  create(state) {
    return buildLiveMarkdownDecorations(state);
  },
  update(decorations, tr) {
    if (
      tr.docChanged ||
      tr.selection ||
      tr.effects.length > 0 ||
      syntaxTree(tr.state) !== syntaxTree(tr.startState)
    ) {
      return buildLiveMarkdownDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function createLiveMarkdownPlugin(enabled: boolean = true): Extension {
  if (!enabled) {
    return [];
  }
  return [collapsedCodeBlocksField, liveMarkdownField];
}
