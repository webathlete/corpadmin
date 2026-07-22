/** Cell rendering type for a data-table column. */
export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'badge';

/** Status-badge visual variants (map onto the global .status-badge classes). */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface DataColumn<T = Record<string, unknown>> {
  /** Property key on the row object. */
  key: string;
  /** Column header label. */
  header: string;
  /** How the cell value is rendered. Default: 'text'. */
  type?: ColumnType;
  /** Enable click-to-sort on this column. Default: true. */
  sortable?: boolean;
  /** Show a per-column filter input. Default: true. */
  filterable?: boolean;
  /** Allow the user to hide/show this column via the column chooser. Default: true. */
  hideable?: boolean;
  /** Start hidden. Default: false. */
  hidden?: boolean;
  /** Cell text alignment. */
  align?: 'left' | 'right' | 'center';
  /** Optional formatter → the displayed string (used for text/badge). */
  format?: (row: T) => string;
  /** For type 'badge' → which status variant to use for the row. */
  badge?: (row: T) => BadgeVariant;
}

/** Emitted whenever sort / page / filters change. */
export interface TableState {
  sortActive: string;
  sortDirection: 'asc' | 'desc' | '';
  pageIndex: number;
  pageSize: number;
  filters: Record<string, string>;
}

/** A single icon-button in the trailing row-actions column. */
export interface RowAction<T = Record<string, unknown>> {
  action: string;
  label: string;
  icon: string;
  color?: 'primary' | 'warn';
  /** Show this action for a given row. Default: always shown. */
  show?: (row: T) => boolean;
}

/** Emitted when a row-action button is clicked. */
export interface RowActionEvent<T = Record<string, unknown>> {
  action: string;
  row: T;
}
