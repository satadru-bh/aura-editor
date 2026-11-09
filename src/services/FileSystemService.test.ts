import { describe, it, expect, beforeEach } from 'vitest';
import { FileSystemService } from './FileSystemService';
import { FileItem } from '../types';

class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

globalThis.localStorage = new LocalStorageMock() as any;

describe('FileSystemService', () => {
  let fs: FileSystemService;

  beforeEach(() => {
    localStorage.clear();
    fs = FileSystemService.getInstance();
  });

  it('saves and loads all virtual files', async () => {
    const files: FileItem[] = [
      {
        id: 'file-1',
        name: 'Chapter 1.md',
        content: '# Chapter 1\nIt was a dark and stormy night.',
        lastModified: 1000,
        createdAt: 1000,
        isFavorite: true,
      },
      {
        id: 'file-2',
        name: 'Notes.txt',
        content: 'Remember to edit draft.',
        lastModified: 2000,
        createdAt: 2000,
      },
    ];

    await fs.saveAllFiles(files);
    const loaded = await fs.loadAllFiles();

    expect(loaded.length).toBe(2);
    expect(loaded[0].name).toBe('Chapter 1.md');
    expect(loaded[0].isFavorite).toBe(true);
    expect(loaded[1].content).toBe('Remember to edit draft.');
  });

  it('manages active file id', () => {
    fs.setActiveFileId('doc-42');
    expect(fs.getActiveFileId()).toBe('doc-42');
  });

  it('openFileFromDisk returns null on cancel in Electron without falling back', async () => {
    (fs as any).isElectron = true;
    (globalThis as any).window = {
      electronAPI: {
        openFileDialog: async () => ({ canceled: true }),
      },
      showOpenFilePicker: async () => {
        throw new Error('Should not call web picker in Electron');
      },
    };

    const res = await fs.openFileFromDisk();
    expect(res).toBeNull();
  });

  it('openFileFromDisk returns file data on success in Electron', async () => {
    (fs as any).isElectron = true;
    (globalThis as any).window = {
      electronAPI: {
        openFileDialog: async () => ({
          canceled: false,
          fileName: 'Test.md',
          filePath: '/path/to/Test.md',
          content: '# Test Content',
        }),
      },
    };

    const res = await fs.openFileFromDisk();
    expect(res).toEqual({
      name: 'Test.md',
      content: '# Test Content',
      path: '/path/to/Test.md',
    });
  });

  it('openFileFromDisk returns file data from Web showOpenFilePicker', async () => {
    (fs as any).isElectron = false;
    const mockFile = {
      name: 'WebDoc.md',
      text: async () => '# Web Document Content',
    };
    const mockHandle = {
      getFile: async () => mockFile,
    };
    (globalThis as any).window = {
      showOpenFilePicker: async () => [mockHandle],
    };

    const res = await fs.openFileFromDisk();
    expect(res).toEqual({
      name: 'WebDoc.md',
      content: '# Web Document Content',
      handle: mockHandle,
    });
  });
});
