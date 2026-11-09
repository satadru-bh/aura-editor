import { EditorView, KeyBinding, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';

export function isTableLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.includes('|')) return false;
  const pipes = (trimmed.match(/\|/g) || []).length;
  return pipes >= 2 || (pipes >= 1 && (trimmed.startsWith('|') || trimmed.endsWith('|')));
}

export function isTableDelimiterLine(text: string): boolean {
  const trimmed = text.trim();
  if (!isTableLine(trimmed)) return false;
  return /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(trimmed);
}

export interface CellRange {
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
}

export function getRowCells(lineText: string, lineFrom: number): CellRange[] {
  const pipeIndices: number[] = [];
  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === '|') {
      // Ignore escaped pipes \|
      if (i > 0 && lineText[i - 1] === '\\') continue;
      pipeIndices.push(i);
    }
  }

  if (pipeIndices.length < 2) return [];

  const cells: CellRange[] = [];
  for (let i = 0; i < pipeIndices.length - 1; i++) {
    const pStart = pipeIndices[i];
    const pEnd = pipeIndices[i + 1];
    const rawContent = lineText.slice(pStart + 1, pEnd);

    // Trim outer single space if present
    let startOffset = 1;
    let endOffset = 0;
    if (rawContent.startsWith(' ')) startOffset = 2;
    if (rawContent.endsWith(' ') && pEnd - 1 >= pStart + startOffset) endOffset = 1;

    cells.push({
      from: lineFrom + pStart + 1,
      to: lineFrom + pEnd,
      contentFrom: lineFrom + pStart + startOffset,
      contentTo: lineFrom + pEnd - endOffset,
    });
  }

  return cells;
}

export function getTableBounds(view: EditorView, lineNum: number): { startLine: number; endLine: number; numCols: number } | null {
  const doc = view.state.doc;
  const currentLine = doc.line(lineNum);
  if (!isTableLine(currentLine.text)) return null;

  let startLine = lineNum;
  while (startLine > 1) {
    const prev = doc.line(startLine - 1);
    if (isTableLine(prev.text)) {
      startLine--;
    } else {
      break;
    }
  }

  let endLine = lineNum;
  while (endLine < doc.lines) {
    const next = doc.line(endLine + 1);
    if (isTableLine(next.text)) {
      endLine++;
    } else {
      break;
    }
  }

  // Count columns from the header or delimiter line
  let numCols = 2;
  for (let l = startLine; l <= endLine; l++) {
    const text = doc.line(l).text;
    const cells = getRowCells(text, 0);
    if (cells.length > 0) {
      numCols = cells.length;
      break;
    }
  }

  return { startLine, endLine, numCols };
}

export function navigateTable(view: EditorView, direction: 'next' | 'prev'): boolean {
  const sel = view.state.selection.main;
  const doc = view.state.doc;
  const curLine = doc.lineAt(sel.head);

  if (!isTableLine(curLine.text)) return false;

  const bounds = getTableBounds(view, curLine.number);
  if (!bounds) return false;

  const cells = getRowCells(curLine.text, curLine.from);
  if (cells.length === 0) return false;

  if (direction === 'next') {
    // Find if there is a cell to the right on this row
    const curIdx = cells.findIndex((c) => sel.head < c.to);
    if (curIdx !== -1 && curIdx < cells.length - 1) {
      const nextCell = cells[curIdx + 1];
      view.dispatch({
        selection: { anchor: nextCell.contentFrom, head: nextCell.contentTo },
      });
      return true;
    }

    // Otherwise, move to next row
    let nextLineNum = curLine.number + 1;
    if (nextLineNum <= bounds.endLine) {
      let nextLine = doc.line(nextLineNum);
      if (isTableDelimiterLine(nextLine.text)) {
        nextLineNum++;
        if (nextLineNum <= bounds.endLine) {
          nextLine = doc.line(nextLineNum);
        } else {
          nextLine = null as any;
        }
      }

      if (nextLine) {
        const nextCells = getRowCells(nextLine.text, nextLine.from);
        if (nextCells.length > 0) {
          view.dispatch({
            selection: { anchor: nextCells[0].contentFrom, head: nextCells[0].contentTo },
          });
          return true;
        }
      }
    }

    // At the end of the table: add a new row
    const newRow = '\n| ' + Array(bounds.numCols).fill('    ').join(' | ') + ' |';
    const insertPos = doc.line(bounds.endLine).to;
    view.dispatch({
      changes: { from: insertPos, to: insertPos, insert: newRow },
    });

    // Place selection in the first cell of the newly inserted row
    const addedLine = view.state.doc.line(bounds.endLine + 1);
    const addedCells = getRowCells(addedLine.text, addedLine.from);
    if (addedCells.length > 0) {
      view.dispatch({
        selection: { anchor: addedCells[0].contentFrom, head: addedCells[0].contentTo },
      });
    }
    return true;
  } else {
    // Direction: 'prev'
    const curIdx = cells.findLastIndex((c) => sel.head > c.from);
    if (curIdx > 0) {
      const prevCell = cells[curIdx - 1];
      view.dispatch({
        selection: { anchor: prevCell.contentFrom, head: prevCell.contentTo },
      });
      return true;
    }

    // Move to previous row
    let prevLineNum = curLine.number - 1;
    if (prevLineNum >= bounds.startLine) {
      let prevLine = doc.line(prevLineNum);
      if (isTableDelimiterLine(prevLine.text)) {
        prevLineNum--;
        if (prevLineNum >= bounds.startLine) {
          prevLine = doc.line(prevLineNum);
        } else {
          prevLine = null as any;
        }
      }

      if (prevLine) {
        const prevCells = getRowCells(prevLine.text, prevLine.from);
        if (prevCells.length > 0) {
          const lastCell = prevCells[prevCells.length - 1];
          view.dispatch({
            selection: { anchor: lastCell.contentFrom, head: lastCell.contentTo },
          });
          return true;
        }
      }
    }

    return true;
  }
}

export function handleTableEnter(view: EditorView): boolean {
  const sel = view.state.selection.main;
  const doc = view.state.doc;
  const curLine = doc.lineAt(sel.head);

  if (!isTableLine(curLine.text)) return false;

  const bounds = getTableBounds(view, curLine.number);
  if (!bounds) return false;

  // Check if current row is completely empty (user wants to exit the table)
  const cells = getRowCells(curLine.text, curLine.from);
  const isEmptyRow = cells.every((c) => {
    const content = doc.sliceString(c.contentFrom, c.contentTo).trim();
    return content.length === 0;
  });

  if (isEmptyRow && curLine.number > bounds.startLine) {
    // Cleanly exit table: replace empty row with a blank line
    view.dispatch({
      changes: { from: curLine.from, to: curLine.to, insert: '' },
      selection: { anchor: curLine.from },
    });
    return true;
  }

  // Insert a new row below current line
  const numCols = bounds.numCols || 2;
  const newRow = '\n| ' + Array(numCols).fill('    ').join(' | ') + ' |';
  const insertPos = curLine.to;

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert: newRow },
  });

  const nextLine = view.state.doc.line(curLine.number + 1);
  const nextCells = getRowCells(nextLine.text, nextLine.from);
  if (nextCells.length > 0) {
    view.dispatch({
      selection: { anchor: nextCells[0].contentFrom, head: nextCells[0].contentTo },
    });
  }

  return true;
}

export function createTableKeymap(): KeyBinding[] {
  return [
    {
      key: 'Tab',
      run: (view) => navigateTable(view, 'next'),
    },
    {
      key: 'Shift-Tab',
      run: (view) => navigateTable(view, 'prev'),
    },
    {
      key: 'Enter',
      run: (view) => handleTableEnter(view),
    },
  ];
}

export function createTablePlugin() {
  return Prec.high(keymap.of(createTableKeymap()));
}

