/** CSV writer — framework-free, RFC 4180 quoting, Excel-friendly by default. */
import { CsvOptions, ExportColumn, ExportRequest } from './table-export.types';

function formatValue<T>(row: T, col: ExportColumn<T>): string {
  const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key];
  if (raw === null || raw === undefined) return '';
  if (raw instanceof Date) {
    return isNaN(+raw) ? '' : raw.toISOString();
  }
  return String(raw);
}

function quote(value: string, delimiter: string): string {
  // Quote when the value contains the delimiter, quotes, or line breaks.
  if (value.includes(delimiter) || value.includes('"') || /[\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/** Builds the CSV file content. */
export function buildCsv<T>(req: ExportRequest<T>, options: CsvOptions = {}): string {
  const delimiter = options.delimiter ?? ',';
  const eol = options.lineEnding ?? '\r\n';
  const lines: string[] = [];

  if (options.includeHeader ?? true) {
    lines.push(req.columns.map(c => quote(c.header, delimiter)).join(delimiter));
  }
  for (const row of req.rows) {
    lines.push(req.columns.map(c => quote(formatValue(row, c), delimiter)).join(delimiter));
  }

  // The BOM lets Excel detect UTF-8 (accented names, currency symbols).
  const bom = (options.includeBom ?? true) ? '﻿' : '';
  return bom + lines.join(eol) + eol;
}
