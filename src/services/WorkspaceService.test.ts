import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService, WorkspaceNode } from './WorkspaceService';

class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

globalThis.localStorage = new LocalStorageMock() as any;

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(() => {
    localStorage.clear();
    service = WorkspaceService.getInstance();
    service.clearWorkspace();
  });

  it('initializes with empty state when no saved workspace', () => {
    const state = service.getState();
    expect(state.folderPath).toBeNull();
    expect(state.folderName).toBeNull();
    expect(state.tree).toEqual([]);
  });

  it('correctly sets and persists workspace path', async () => {
    await service.setWorkspace('C:\\Users\\satad\\Notes', 'Notes');
    const state = service.getState();
    expect(state.folderPath).toBe('C:\\Users\\satad\\Notes');
    expect(state.folderName).toBe('Notes');
    expect(localStorage.getItem('aura_last_workspace_path_v1')).toBe('C:\\Users\\satad\\Notes');
  });

  it('flattens nested files correctly for search and linking', () => {
    const mockTree: WorkspaceNode[] = [
      {
        name: 'Daily',
        path: 'C:\\Notes\\Daily',
        isDirectory: true,
        children: [
          { name: '2026-11-09.md', path: 'C:\\Notes\\Daily\\2026-11-09.md', isDirectory: false },
          { name: '2026-11-08.md', path: 'C:\\Notes\\Daily\\2026-11-08.md', isDirectory: false },
        ],
      },
      {
        name: 'Projects',
        path: 'C:\\Notes\\Projects',
        isDirectory: true,
        children: [
          { name: 'Aura.md', path: 'C:\\Notes\\Projects\\Aura.md', isDirectory: false },
        ],
      },
      { name: 'Index.md', path: 'C:\\Notes\\Index.md', isDirectory: false },
    ];

    const flattened = service.flattenFiles(mockTree);
    expect(flattened).toHaveLength(4);
    expect(flattened.map((f) => f.name)).toEqual([
      '2026-11-09.md',
      '2026-11-08.md',
      'Aura.md',
      'Index.md',
    ]);
  });

  it('finds node by path case-insensitively and across slashes', () => {
    const mockTree: WorkspaceNode[] = [
      {
        name: 'Subfolder',
        path: 'C:/Notes/Subfolder',
        isDirectory: true,
        children: [
          { name: 'Idea.md', path: 'C:\\Notes\\Subfolder\\Idea.md', isDirectory: false },
        ],
      },
    ];

    const found = service.findNodeByPath('c:/notes/subfolder/idea.md', mockTree);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Idea.md');
  });

  it('clears workspace and removes storage key', async () => {
    await service.setWorkspace('C:\\Notes', 'Notes');
    expect(service.getState().folderPath).toBe('C:\\Notes');

    service.clearWorkspace();
    expect(service.getState().folderPath).toBeNull();
    expect(localStorage.getItem('aura_last_workspace_path_v1')).toBeNull();
  });
});
