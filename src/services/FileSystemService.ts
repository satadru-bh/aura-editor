import { FileItem } from '../types';

const STORAGE_KEY_FILES = 'aura_virtual_files_v1';
const STORAGE_KEY_RECENT = 'aura_recent_files_v1';
const STORAGE_KEY_ACTIVE = 'aura_active_file_id_v1';

// Unified File System Service
export class FileSystemService {
  private static instance: FileSystemService;
  private isElectron: boolean = false;
  private isOpening: boolean = false;

  private constructor() {
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  public isDesktop(): boolean {
    return this.isElectron;
  }

  // Load all saved files from local store or electron
  public async loadAllFiles(): Promise<FileItem[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FILES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load files from storage:', e);
    }
    return [];
  }

  // Save all files array to persistent storage
  public async saveAllFiles(files: FileItem[]): Promise<void> {
    try {
      // Strip heavy or non-serializable objects (e.g. fileHandle) before storing to localStorage
      const cleanFiles = files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        content: f.content,
        isEncrypted: f.isEncrypted,
        lastModified: f.lastModified,
        createdAt: f.createdAt,
        isFavorite: f.isFavorite,
        isRecent: f.isRecent,
      }));
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(cleanFiles));
    } catch (e) {
      console.warn('Failed to save files to storage:', e);
    }
  }

  // Active file ID persistence
  public getActiveFileId(): string | null {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  }

  public setActiveFileId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  }

  // Open file using native desktop dialog or File System Access API
  public async openFileFromDisk(): Promise<{ name: string; content: string; path?: string; handle?: any } | null> {
    if (this.isOpening) {
      return null;
    }
    this.isOpening = true;

    try {
      if (this.isElectron) {
        try {
          const result = await (window as any).electronAPI.openFileDialog();
          if (result && !result.canceled && result.filePath) {
            return {
              name: result.fileName,
              content: result.content,
              path: result.filePath,
            };
          }
        } catch (err) {
          console.error('Electron open dialog failed:', err);
        }
        // In Electron, if canceled or failed, NEVER fall through to Web file pickers
        return null;
      }

      // Web File System Access API
      if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [
              {
                description: 'Markdown & Text Files',
                accept: {
                  'text/plain': ['.md', '.markdown', '.txt', '.text'],
                  'text/markdown': ['.md', '.markdown'],
                  'text/html': ['.html', '.htm'],
                  'application/json': ['.json'],
                  'text/*': ['.md', '.markdown', '.txt', '.text', '.html', '.json', '.yaml', '.yml'],
                },
              },
            ],
            multiple: false,
          });

          const file = await handle.getFile();
          const content = await file.text();
          return {
            name: file.name,
            content,
            handle,
          };
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error('File picker failed:', e);
          }
          return null;
        }
      }

      // Fallback standard HTML file input
      return await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt,.text,.html,.json,.yaml,.yml';
        input.onchange = async (event: any) => {
          const file = event.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              content: (e.target?.result as string) || '',
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsText(file);
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    } finally {
      this.isOpening = false;
    }
  }

  // Save or Save As to disk
  public async saveFileToDisk(
    fileItem: FileItem,
    forceSaveAs: boolean = false
  ): Promise<{ success: boolean; path?: string; name?: string; handle?: any }> {
    // Electron Desktop Save
    if (this.isElectron) {
      try {
        if (!forceSaveAs && fileItem.path) {
          await (window as any).electronAPI.saveFile(fileItem.path, fileItem.content);
          return { success: true, path: fileItem.path, name: fileItem.name };
        } else {
          const result = await (window as any).electronAPI.saveFileDialog(
            fileItem.name || 'Untitled.md',
            fileItem.content
          );
          if (result && !result.canceled && result.filePath) {
            return {
              success: true,
              path: result.filePath,
              name: result.fileName,
            };
          }
          return { success: false };
        }
      } catch (err) {
        console.error('Electron save failed:', err);
        return { success: false };
      }
    }

    // Web File System Access API
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        let handle = fileItem.fileHandle;
        if (forceSaveAs || !handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: fileItem.name.endsWith('.md') ? fileItem.name : `${fileItem.name}.md`,
            types: [
              {
                description: 'Markdown Document',
                accept: { 'text/markdown': ['.md'] },
              },
              {
                description: 'Plain Text',
                accept: { 'text/plain': ['.txt'] },
              },
            ],
          });
        }

        const writable = await handle.createWritable();
        await writable.write(fileItem.content);
        await writable.close();

        const file = await handle.getFile();
        return {
          success: true,
          name: file.name,
          handle,
        };
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Web save failed:', e);
        }
        return { success: false };
      }
    }

    // Fallback Web Browser Download
    try {
      const blob = new Blob([fileItem.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileItem.name.endsWith('.md') ? fileItem.name : `${fileItem.name}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, name: link.download };
    } catch (e) {
      console.error('Download fallback failed:', e);
      return { success: false };
    }
  }
}

export const fileSystem = FileSystemService.getInstance();
