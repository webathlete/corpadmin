import { Injectable } from '@angular/core';
import { buildCsv } from './csv';
import { buildXlsx } from './xlsx';
import { CsvOptions, ExportRequest, XlsxOptions } from './table-export.types';

/**
 * Table export — CSV and real .xlsx from any row/column definition, with no
 * third-party dependency (the XLSX and ZIP writers in this folder are
 * original code against the open ECMA-376 spec).
 *
 * Portable: this folder imports nothing from the host app — copy
 * `shared/table-export/` into any Angular project. The builders themselves
 * (`buildCsv`, `buildXlsx`) are framework-free and also run under Node.
 */
@Injectable({ providedIn: 'root' })
export class TableExportService {
  exportCsv<T>(req: ExportRequest<T>, options?: CsvOptions): void {
    const csv = buildCsv(req, options);
    this.download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${req.fileName}.csv`);
  }

  async exportXlsx<T>(req: ExportRequest<T>, options?: XlsxOptions): Promise<void> {
    const bytes = await buildXlsx(req, options);
    this.download(
      new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${req.fileName}.xlsx`,
    );
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    // Revoke on the next tick so the click has consumed the URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
