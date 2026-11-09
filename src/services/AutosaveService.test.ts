import { describe, it, expect, beforeEach } from 'vitest';
import { AutosaveService } from './AutosaveService';

// Mock localStorage for node environment
class LocalStorageMock {
  store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

globalThis.localStorage = new LocalStorageMock() as any;

describe('AutosaveService', () => {
  let service: AutosaveService;

  beforeEach(() => {
    localStorage.clear();
    service = AutosaveService.getInstance();
  });

  it('saves and retrieves revision snapshots', () => {
    service.saveSnapshot('doc-1', 'Test.md', 'Hello world version 1');
    service.saveSnapshot('doc-1', 'Test.md', 'Hello world version 2');

    const snapshots = service.getSnapshots('doc-1');
    expect(snapshots.length).toBe(2);
    expect(snapshots[0].content).toBe('Hello world version 2');
    expect(snapshots[1].content).toBe('Hello world version 1');
  });

  it('does not duplicate identical consecutive content', () => {
    service.saveSnapshot('doc-1', 'Test.md', 'Identical content');
    service.saveSnapshot('doc-1', 'Test.md', 'Identical content');

    const snapshots = service.getSnapshots('doc-1');
    expect(snapshots.length).toBe(1);
  });

  it('clears snapshots for specific file', () => {
    service.saveSnapshot('doc-1', 'Test.md', 'Content 1');
    service.saveSnapshot('doc-2', 'Other.md', 'Content 2');

    service.clearSnapshotsForFile('doc-1');

    expect(service.getSnapshots('doc-1').length).toBe(0);
    expect(service.getSnapshots('doc-2').length).toBe(1);
  });
});
