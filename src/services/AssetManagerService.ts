export interface SavedAssetResult {
  success: boolean;
  markdownLink: string;
  relativePath: string;
  fullPath?: string;
  fileName: string;
  error?: string;
}

export class AssetManagerService {
  private static instance: AssetManagerService;
  private currentNotePath: string | null = null;

  private constructor() {}

  public static getInstance(): AssetManagerService {
    if (!AssetManagerService.instance) {
      AssetManagerService.instance = new AssetManagerService();
    }
    return AssetManagerService.instance;
  }

  public setCurrentNotePath(path: string | null): void {
    this.currentNotePath = path;
  }

  public getCurrentNotePath(): string | null {
    return this.currentNotePath;
  }

  // Generate clean, sanitized asset filename
  public generateAssetFilename(originalName?: string, mimeType: string = 'image/png'): string {
    let ext = '.png';
    if (originalName && originalName.includes('.')) {
      ext = '.' + originalName.split('.').pop()!.toLowerCase();
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      ext = '.jpg';
    } else if (mimeType.includes('gif')) {
      ext = '.gif';
    } else if (mimeType.includes('svg')) {
      ext = '.svg';
    } else if (mimeType.includes('webp')) {
      ext = '.webp';
    }

    const baseName = originalName
      ? originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, '-').replace(/-+/g, '-')
      : 'pasted-image';

    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

    return `${baseName || 'image'}-${timestamp}${ext}`;
  }

  // Save image file or blob to disk assets directory
  public async saveImage(
    file: File | Blob,
    notePath?: string | null,
    workspacePath?: string | null
  ): Promise<SavedAssetResult> {
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.saveAssetImage;
    const resolvedNotePath = notePath !== undefined ? notePath : this.currentNotePath;
    const fileName = (file as File).name || this.generateAssetFilename(undefined, file.type);

    if (isElectron) {
      try {
        const buffer = await file.arrayBuffer();
        const res = await (window as any).electronAPI.saveAssetImage({
          notePath: resolvedNotePath || undefined,
          workspacePath: workspacePath || undefined,
          dataBuffer: Array.from(new Uint8Array(buffer)),
          fileName,
          mimeType: file.type,
        });

        if (res && res.success && res.relativePath) {
          const altText = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'Pasted image';
          return {
            success: true,
            markdownLink: `\n![${altText}](${res.relativePath})\n`,
            relativePath: res.relativePath,
            fullPath: res.fullPath,
            fileName: res.fileName,
          };
        }
      } catch (err: any) {
        console.error('Failed to save asset via Electron:', err);
      }
    }

    // Web Fallback: create object URL or base64
    const altText = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'Pasted image';
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        const blobUrl = URL.createObjectURL(file);
        return {
          success: true,
          markdownLink: `\n![${altText}](${blobUrl})\n`,
          relativePath: blobUrl,
          fileName,
        };
      } catch {
        // Fallback below
      }
    }

    return {
      success: false,
      markdownLink: '',
      relativePath: '',
      fileName,
      error: 'Unable to save image in current environment',
    };
  }

  // Resolve relative markdown image path to valid file:/// URL in Electron
  public async resolveImageSrc(src: string, notePath?: string | null, workspacePath?: string | null): Promise<string> {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('file:///')) {
      return src;
    }

    const resolvedNotePath = notePath !== undefined ? notePath : this.currentNotePath;
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.resolveAssetPath;
    if (isElectron) {
      try {
        const resolved = await (window as any).electronAPI.resolveAssetPath(resolvedNotePath, src, workspacePath);
        if (resolved) return resolved;
      } catch (err) {
        console.warn('Failed to resolve asset path:', err);
      }
    }

    return src;
  }
}

export const assetManager = AssetManagerService.getInstance();
