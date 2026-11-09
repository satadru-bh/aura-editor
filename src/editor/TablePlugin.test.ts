import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  isTableLine,
  isTableDelimiterLine,
  getRowCells,
  navigateTable,
  handleTableEnter,
} from './TablePlugin';

function createMockView(initialText: string, cursorOffset: number): EditorView {
  let state = EditorState.create({
    doc: initialText,
    selection: { anchor: cursorOffset },
  });
  const mock = {
    get state() {
      return state;
    },
    dispatch(spec: any) {
      const tr = state.update(spec);
      state = tr.state;
    },
  };
  return mock as unknown as EditorView;
}

describe('TablePlugin', () => {
  describe('isTableLine', () => {
    it('detects standard markdown table lines', () => {
      expect(isTableLine('| Header 1 | Header 2 |')).toBe(true);
      expect(isTableLine('|---|---|')).toBe(true);
      expect(isTableLine('| Cell A | Cell B |')).toBe(true);
    });

    it('rejects regular markdown paragraphs', () => {
      expect(isTableLine('Just a regular paragraph of text.')).toBe(false);
      expect(isTableLine('## Heading 2')).toBe(false);
      expect(isTableLine('- list item with single | character')).toBe(false);
    });
  });

  describe('isTableDelimiterLine', () => {
    it('detects standard dashes and alignments', () => {
      expect(isTableDelimiterLine('|---|---|')).toBe(true);
      expect(isTableDelimiterLine('|:---|:---:|---:|')).toBe(true);
      expect(isTableDelimiterLine('| --- | --- |')).toBe(true);
    });

    it('rejects content rows', () => {
      expect(isTableDelimiterLine('| Item | Price |')).toBe(false);
      expect(isTableDelimiterLine('| Apple | $1.50 |')).toBe(false);
    });
  });

  describe('getRowCells', () => {
    it('extracts cell positions properly', () => {
      const line = '| Col A | Col B |';
      const cells = getRowCells(line, 0);
      expect(cells.length).toBe(2);
      expect(line.slice(cells[0].contentFrom, cells[0].contentTo)).toBe('Col A');
      expect(line.slice(cells[1].contentFrom, cells[1].contentTo)).toBe('Col B');
    });
  });

  describe('navigateTable (Tab navigation)', () => {
    it('moves cursor from first cell to second cell on Tab', () => {
      const initialText = '| Alpha | Beta |\n|---|---|\n| One | Two |';
      const view = createMockView(initialText, 2); // inside "Alpha"

      const handled = navigateTable(view, 'next');
      expect(handled).toBe(true);
      const sel = view.state.selection.main;
      expect(view.state.doc.sliceString(sel.from, sel.to)).toBe('Beta');
    });

    it('skips delimiter row and navigates to next data row', () => {
      const initialText = '| Alpha | Beta |\n|---|---|\n| One | Two |';
      const view = createMockView(initialText, 10); // inside "Beta"

      const handled = navigateTable(view, 'next');
      expect(handled).toBe(true);
      const sel = view.state.selection.main;
      expect(view.state.doc.sliceString(sel.from, sel.to)).toBe('One');
    });

    it('appends a new row at end of table when Tab is pressed on last cell', () => {
      const initialText = '| Alpha | Beta |\n|---|---|\n| One | Two |';
      const lastLineOffset = initialText.indexOf('Two');
      const view = createMockView(initialText, lastLineOffset + 1);

      const handled = navigateTable(view, 'next');
      expect(handled).toBe(true);
      // Doc should now have 4 lines
      expect(view.state.doc.lines).toBe(4);
    });
  });

  describe('handleTableEnter', () => {
    it('inserts a new row below current row', () => {
      const initialText = '| Alpha | Beta |\n|---|---|\n| One | Two |';
      const line1Offset = initialText.indexOf('One');
      const view = createMockView(initialText, line1Offset + 1);

      const handled = handleTableEnter(view);
      expect(handled).toBe(true);
      expect(view.state.doc.lines).toBe(4);
    });

    it('exits table when Enter is pressed on an empty row', () => {
      const initialText = '| Alpha | Beta |\n|---|---|\n| One | Two |\n|      |      |';
      const lastLine = initialText.lastIndexOf('|');
      const view = createMockView(initialText, lastLine - 2);

      const handled = handleTableEnter(view);
      expect(handled).toBe(true);
      expect(view.state.doc.line(4).text.trim()).toBe('');
    });
  });
});
