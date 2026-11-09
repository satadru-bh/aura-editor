import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetManagerService } from './AssetManagerService';

describe('AssetManagerService', () => {
  let assetManager: AssetManagerService;

  beforeEach(() => {
    (globalThis as any).window = globalThis;
    assetManager = AssetManagerService.getInstance();
    assetManager.setCurrentNotePath(null);
    delete (globalThis as any).electronAPI;
  });

  describe('generateAssetFilename', () => {
    it('generates a clean timestamped filename for untitled paste', () => {
      const filename = assetManager.generateAssetFilename(undefined, 'image/png');
      expect(filename).toMatch(/^pasted-image-\d{8}-\d{6}\.png$/);
    });

    it('preserves clean original names and extracts extension correctly', () => {
      const filename = assetManager.generateAssetFilename('Diagram Spec.jpeg', 'image/jpeg');
      expect(filename).toMatch(/^Diagram-Spec-\d{8}-\d{6}\.jpeg$/);
    });

    it('infers proper extension from mime type when original has no extension', () => {
      const webpFilename = assetManager.generateAssetFilename('screenshot', 'image/webp');
      expect(webpFilename).toMatch(/^screenshot-\d{8}-\d{6}\.webp$/);

      const svgFilename = assetManager.generateAssetFilename('vector', 'image/svg+xml');
      expect(svgFilename).toMatch(/^vector-\d{8}-\d{6}\.svg$/);
    });

    it('sanitizes unsafe characters like quotes and slashes', () => {
      const filename = assetManager.generateAssetFilename('my/photo "bad" name.png', 'image/png');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('"');
      expect(filename).toMatch(/^my-photo-bad-name-\d{8}-\d{6}\.png$/);
    });
  });

  describe('currentNotePath management', () => {
    it('tracks and updates currentNotePath', () => {
      expect(assetManager.getCurrentNotePath()).toBeNull();
      assetManager.setCurrentNotePath('C:/Notes/project.md');
      expect(assetManager.getCurrentNotePath()).toBe('C:/Notes/project.md');
    });
  });

  describe('resolveImageSrc', () => {
    it('returns web URLs without modification', async () => {
      const httpsUrl = 'https://example.com/logo.png';
      expect(await assetManager.resolveImageSrc(httpsUrl)).toBe(httpsUrl);

      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      expect(await assetManager.resolveImageSrc(dataUrl)).toBe(dataUrl);
    });

    it('calls electronAPI.resolveAssetPath in Electron environment', async () => {
      const resolveMock = vi.fn().mockResolvedValue('file:///C:/Notes/assets/photo.png');
      (window as any).electronAPI = { resolveAssetPath: resolveMock };

      const resolved = await assetManager.resolveImageSrc('./assets/photo.png', 'C:/Notes/my-note.md');
      expect(resolveMock).toHaveBeenCalledWith('C:/Notes/my-note.md', './assets/photo.png', undefined);
      expect(resolved).toBe('file:///C:/Notes/assets/photo.png');
    });
  });

  describe('saveImage', () => {
    it('calls electronAPI.saveAssetImage when running in Electron', async () => {
      const saveAssetMock = vi.fn().mockResolvedValue({
        success: true,
        relativePath: './assets/pasted-test.png',
        fullPath: 'C:/Vault/assets/pasted-test.png',
        fileName: 'pasted-test.png',
      });
      (window as any).electronAPI = { saveAssetImage: saveAssetMock };

      const blob = new Blob(['fake-image-bytes'], { type: 'image/png' });
      const result = await assetManager.saveImage(blob, 'C:/Vault/note.md');

      expect(result.success).toBe(true);
      expect(result.relativePath).toBe('./assets/pasted-test.png');
      expect(result.markdownLink).toContain('![Pasted image](./assets/pasted-test.png)');
      expect(saveAssetMock).toHaveBeenCalled();
    });
  });
});
