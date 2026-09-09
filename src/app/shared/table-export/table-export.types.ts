/** How a cell value is typed in the export output. */
export type ExportCellType = 'string' | 'number' | 'date' | 'boolean';

/**
 * Named number formats, or any custom Excel format string
 * (e.g. "0.000%", "dd-mmm-yyyy").
 */
export type ExportFormat =
  | 'integer' | 'decimal' | 'currency' | 'percent' | 'date' | 'datetime'
  | (string & {});

export interface ExportColumn<T = Record<string, unknown>> {
  /** Property read from each row (ignored when `value` is given). */
  key: string;
  header: string;
  type?: ExportCellType;
  /** Number/date format applied in Excel; ignored for CSV. */
  format?: ExportFormat;
  /** Column width in characters; omit to auto-size from the data. */
  width?: number;
  /** Accessor override for computed values. */
  value?: (row: T) => unknown;
}

export interface ExportRequest<T = Record<string, unknown>> {
  /** File name without extension. */
  fileName: string;
  columns: ExportColumn<T>[];
  rows: readonly T[];
}

export interface CsvOptions {
  delimiter?: ',' | ';' | '\t';
  /** UTF-8 BOM so Excel opens the file with correct encoding. Default true. */
  includeBom?: boolean;
  includeHeader?: boolean;
  lineEnding?: '\r\n' | '\n';
}

export interface XlsxHeaderStyle {
  bold?: boolean;
  /** Hex like "#1565C0". */
  background?: string;
  /** Hex font colour. */
  color?: string;
}

export interface XlsxOptions {
  sheetName?: string;
  /** Keep the header row visible while scrolling. Default true. */
  freezeHeader?: boolean;
  /** Excel filter dropdowns on the header row. Default true. */
  autoFilter?: boolean;
  headerStyle?: XlsxHeaderStyle;
  /** Auto-size columns from a sample of the data. Default true. */
  autoWidth?: boolean;
}
