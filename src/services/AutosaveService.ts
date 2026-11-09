export interface RevisionSnapshot {
  id: string;
  fileId: string;
  timestamp: number;
  content: string;
  name: string;
}

const STORAGE_KEY_REVISIONS = 'aura_document_revisions_v1';
const MAX_REVISIONS_PER_DOC = 30;

export class AutosaveService {
  private static instance: AutosaveService;
  private timer: any = null;

  private constructor() {}

  public static getInstance(): AutosaveService {
    if (!AutosaveService.instance) {
      AutosaveService.instance = new AutosaveService();
    }
    return AutosaveService.instance;
  }

  // Save a snapshot for crash recovery
  public saveSnapshot(fileId: string, name: string, content: string): void {
    try {
      const allRevisions = this.getAllRevisions();
      const docRevisions = allRevisions.filter(r => r.fileId === fileId);

      // Check if identical to most recent snapshot
      if (docRevisions.length > 0 && docRevisions[0].content === content) {
        return;
      }

      const snapshot: RevisionSnapshot = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileId,
        timestamp: Date.now(),
        content,
        name,
      };

      const otherDocRevisions = allRevisions.filter(r => r.fileId !== fileId);
      const updatedDocRevisions = [snapshot, ...docRevisions].slice(0, MAX_REVISIONS_PER_DOC);

      const combined = [...updatedDocRevisions, ...otherDocRevisions];
      localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(combined));
    } catch (e) {
      console.warn('Failed to save revision snapshot:', e);
    }
  }

  public getSnapshots(fileId: string): RevisionSnapshot[] {
    const all = this.getAllRevisions();
    return all.filter(r => r.fileId === fileId).sort((a, b) => b.timestamp - a.timestamp);
  }

  private getAllRevisions(): RevisionSnapshot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVISIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Clear snapshots for a specific file when deleted
  public clearSnapshotsForFile(fileId: string): void {
    try {
      const all = this.getAllRevisions().filter(r => r.fileId !== fileId);
      localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(all));
    } catch {}
  }
}

export const autosaveService = AutosaveService.getInstance();
