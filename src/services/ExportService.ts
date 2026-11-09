import { ImportExportService } from './ImportExportService';

export class ExportService {
  public static downloadFile(filename: string, content: string, mimeType: string): void {
    ImportExportService.downloadText(filename, content, mimeType);
  }

  public static exportMarkdown(title: string, markdown: string): void {
    ImportExportService.exportMarkdown(title, markdown);
  }

  public static exportPlainText(title: string, markdown: string): void {
    ImportExportService.exportPlainText(title, markdown);
  }

  public static async exportHTML(title: string, markdown: string, theme: string = 'canvas'): Promise<void> {
    await ImportExportService.exportHTML(title, markdown, theme);
  }

  public static async copyRichText(markdown: string): Promise<boolean> {
    return await ImportExportService.copyRichText(markdown);
  }

  public static async printDocument(title: string = 'Document', markdown: string = ''): Promise<void> {
    await ImportExportService.exportPDF(title, markdown);
  }
}
