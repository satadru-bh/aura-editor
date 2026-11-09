export interface WorkspaceNode {
  name: string;
  path: string;
  isDirectory: boolean;
  extension?: string;
  children?: WorkspaceNode[];
}

export interface WorkspaceState {
  folderPath: string | null;
  folderName: string | null;
  tree: WorkspaceNode[];
  isLoaded: boolean;
}

const STORAGE_KEY_LAST_WORKSPACE = 'aura_last_workspace_path_v1';

export class WorkspaceService {
  private static instance: WorkspaceService;
  private currentPath: string | null = null;
  private currentName: string | null = null;
  private tree: WorkspaceNode[] = [];
  private isLoaded: boolean = false;
  private listeners: Set<(state: WorkspaceState) => void> = new Set();
  private unwatchCallback: (() => void) | null = null;

  private constructor() {
    this.initFromStorage();
  }

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  private initFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedPath = localStorage.getItem(STORAGE_KEY_LAST_WORKSPACE);
      if (savedPath) {
        this.currentPath = savedPath;
        const parts = savedPath.split(/[/\\]/);
        this.currentName = parts[parts.length - 1] || 'Workspace';
      }
    } catch {
      // Ignore storage errors
    }
  }

  public getState(): WorkspaceState {
    return {
      folderPath: this.currentPath,
      folderName: this.currentName,
      tree: this.tree,
      isLoaded: this.isLoaded,
    };
  }

  public subscribe(listener: (state: WorkspaceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public async openWorkspaceDialog(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const api = (window as any).electronAPI;
    if (!api?.openWorkspaceDialog) return false;

    try {
      const res = await api.openWorkspaceDialog();
      if (!res || res.canceled || !res.folderPath) return false;

      await this.setWorkspace(res.folderPath, res.folderName || 'Workspace');
      return true;
    } catch (err) {
      console.error('Failed to open workspace dialog:', err);
      return false;
    }
  }

  public async setWorkspace(folderPath: string, folderName?: string): Promise<void> {
    this.currentPath = folderPath;
    const parts = folderPath.split(/[/\\]/);
    this.currentName = folderName || parts[parts.length - 1] || 'Workspace';

    try {
      localStorage.setItem(STORAGE_KEY_LAST_WORKSPACE, folderPath);
    } catch {}

    await this.refreshTree();
    this.startWatcher();
  }

  public async refreshTree(): Promise<WorkspaceNode[]> {
    if (!this.currentPath) {
      this.tree = [];
      this.isLoaded = true;
      this.notify();
      return [];
    }

    const api = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (api?.readWorkspaceTree) {
      try {
        const res = await api.readWorkspaceTree(this.currentPath);
        if (res && res.success && Array.isArray(res.tree)) {
          this.tree = res.tree;
        } else {
          this.tree = [];
        }
      } catch (err) {
        console.warn('Failed to read workspace tree:', err);
        this.tree = [];
      }
    } else {
      this.tree = [];
    }

    this.isLoaded = true;
    this.notify();
    return this.tree;
  }

  public clearWorkspace(): void {
    this.currentPath = null;
    this.currentName = null;
    this.tree = [];
    this.isLoaded = false;
    try {
      localStorage.removeItem(STORAGE_KEY_LAST_WORKSPACE);
    } catch {}
    this.stopWatcher();
    this.notify();
  }

  private startWatcher(): void {
    if (typeof window === 'undefined') return;
    const api = (window as any).electronAPI;
    if (!api || !this.currentPath) return;

    this.stopWatcher();
    if (api.watchWorkspace) {
      api.watchWorkspace(this.currentPath);
    }
    if (api.onWorkspaceChanged) {
      this.unwatchCallback = api.onWorkspaceChanged(() => {
        this.refreshTree();
      });
    }
  }

  private stopWatcher(): void {
    if (this.unwatchCallback) {
      this.unwatchCallback();
      this.unwatchCallback = null;
    }
    const api = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (api?.unwatchWorkspace) {
      api.unwatchWorkspace();
    }
  }

  // Helper: Flatten all markdown files in workspace tree for search & autocomplete
  public flattenFiles(nodes: WorkspaceNode[] = this.tree): { name: string; path: string }[] {
    const result: { name: string; path: string }[] = [];

    function traverse(list: WorkspaceNode[]) {
      for (const item of list) {
        if (item.isDirectory && item.children) {
          traverse(item.children);
        } else if (!item.isDirectory) {
          result.push({ name: item.name, path: item.path });
        }
      }
    }

    traverse(nodes);
    return result;
  }

  // Helper: Find a specific node by full path
  public findNodeByPath(targetPath: string, nodes: WorkspaceNode[] = this.tree): WorkspaceNode | null {
    const normalized = targetPath.toLowerCase().replace(/\\/g, '/');

    for (const item of nodes) {
      const itemNorm = item.path.toLowerCase().replace(/\\/g, '/');
      if (itemNorm === normalized) return item;
      if (item.isDirectory && item.children) {
        const found = this.findNodeByPath(targetPath, item.children);
        if (found) return found;
      }
    }
    return null;
  }
}

export const workspaceService = WorkspaceService.getInstance();

