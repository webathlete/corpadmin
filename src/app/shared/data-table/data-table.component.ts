import {
  AfterViewInit, Component, Input, OnInit, computed, input, output, signal, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { DataColumn, RowAction, RowActionEvent, TableState } from './data-table.types';

/**
 * Generic, reusable, theme-aware Material data table for analytics.
 *
 * Features: column sort, per-column filters, global quick-filter, a column
 * chooser (show/hide columns), pagination, a loading bar, and an empty state.
 * Fully config-driven via `columns`; emits `stateChange` on sort/page/filter.
 *
 *   <app-data-table [columns]="cols" [data]="rows()" [loading]="loading()"
 *                   title="Transactions" (stateChange)="onState($event)">
 *   </app-data-table>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatCheckboxModule, MatTooltipModule,
    SkeletonComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  // `title` is also a global HTML attribute; drop it so the browser doesn't
  // show a native tooltip over the whole component.
  host: { '[attr.title]': 'null' },
})
export class DataTableComponent implements OnInit, AfterViewInit {
  // ---- Inputs ---- (row type is intentionally permissive so any typed
  // DataColumn<Foo>[] / Foo[] can be bound without generic-inference friction)
  readonly columns = input<DataColumn<any>[]>([]);
  /** Row data — classic input setter feeds the MatTableDataSource directly
   *  (robust for async data; no effect/signal-timing subtlety). */
  @Input() set data(rows: any[] | null | undefined) { this.dataSource.data = rows ?? []; }
  readonly loading = input<boolean>(false);
  readonly title = input<string>('');
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  /** Trailing icon-button column (view/edit/delete, …). Omit to skip it entirely. */
  readonly rowActions = input<RowAction<any>[]>([]);
  /** Label for the primary "add" button rendered in the table's own toolbar
   *  (next to search/filter). Omit to skip it — the listing has no built-in
   *  opinion on whether creating belongs to it or lives elsewhere. */
  readonly addLabel = input<string>('');
  /** Shows a refresh icon-button in the toolbar. Omit to skip it. */
  readonly showRefresh = input<boolean>(false);

  // ---- Outputs ----
  readonly stateChange = output<TableState>();
  readonly rowAction = output<RowActionEvent<any>>();
  readonly add = output<void>();
  readonly refresh = output<void>();

  // ---- Internal state ----
  readonly dataSource = new MatTableDataSource<any>([]);
  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  /** Column keys the user has hidden via the column chooser. */
  private readonly hiddenKeys = signal<Set<string>>(new Set());
  /** Per-column filter values. */
  readonly filters = signal<Record<string, string>>({});
  /** Global quick-filter term. */
  readonly quickFilter = signal<string>('');
  /** Whether the per-column filter row is shown (visible by default). */
  readonly showFilterRow = signal<boolean>(true);

  readonly visibleColumns = computed(() =>
    this.columns().filter(c => !this.hiddenKeys().has(c.key)),
  );
  readonly displayedColumns = computed(() =>
    [...this.visibleColumns().map(c => c.key), ...(this.rowActions().length ? ['__actions'] : [])]);
  readonly filterColumns = computed(() =>
    [...this.visibleColumns().map(c => c.key + '_f'), ...(this.rowActions().length ? ['__actions_f'] : [])]);
  readonly hideableColumns = computed(() => this.columns().filter(c => c.hideable !== false));

  // ---- Skeleton loading placeholder ----
  readonly skeletonRows = [0, 1, 2, 3, 4, 5];
  readonly skeletonColArray = computed(() =>
    Array.from({ length: this.visibleColumns().length + (this.rowActions().length ? 1 : 0) }));

  constructor() {
    this.dataSource.filterPredicate = (row, raw) => this.matchesFilters(row, JSON.parse(raw));
  }

  ngOnInit(): void {
    // Seed hidden columns from the config.
    this.hiddenKeys.set(new Set(this.columns().filter(c => c.hidden).map(c => c.key)));
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort() ?? null;
    this.dataSource.paginator = this.paginator() ?? null;
    // Sort by the raw property value (works for text/number/date).
    this.dataSource.sortingDataAccessor = (row, key) => {
      const v = row[key];
      return typeof v === 'number' ? v : String(v ?? '').toLowerCase();
    };
    this.sort()?.sortChange.subscribe(() => this.emitState());
    this.paginator()?.page.subscribe(() => this.emitState());
  }

  // ---- Filtering ----
  setColumnFilter(key: string, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.applyFilter();
  }
  setQuickFilter(value: string): void {
    this.quickFilter.set(value);
    this.applyFilter();
  }
  clearFilters(): void {
    this.filters.set({});
    this.quickFilter.set('');
    this.applyFilter();
  }
  get hasActiveFilters(): boolean {
    return !!this.quickFilter() || Object.values(this.filters()).some(v => !!v);
  }

  private applyFilter(): void {
    // Bumping .filter re-runs the predicate; the value carries both sets.
    this.dataSource.filter = JSON.stringify({
      quick: this.quickFilter().trim().toLowerCase(),
      cols: this.filters(),
    });
    this.dataSource.paginator?.firstPage();
    this.emitState();
  }

  private matchesFilters(row: any, f: { quick: string; cols: Record<string, string> }): boolean {
    // Global quick filter — any visible column's displayed value contains the term.
    if (f.quick) {
      const hit = this.visibleColumns().some(c =>
        this.displayValue(c, row).toLowerCase().includes(f.quick),
      );
      if (!hit) return false;
    }
    // Per-column filters (AND) — matched against the displayed value.
    for (const [key, term] of Object.entries(f.cols)) {
      if (!term) continue;
      const col = this.columns().find(c => c.key === key);
      const value = col ? this.displayValue(col, row) : String(row[key] ?? '');
      if (!value.toLowerCase().includes(term.toLowerCase())) return false;
    }
    return true;
  }

  /** The string the user sees for a cell — so filtering matches the display. */
  private displayValue(col: DataColumn<any>, row: any): string {
    const v = row[col.key];
    switch (col.type) {
      case 'date':     return v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      case 'currency': return v != null ? '$' + Number(v).toLocaleString('en-US') : '';
      case 'number':   return v != null ? Number(v).toLocaleString('en-US') : '';
      default:         return col.format ? col.format(row) : String(v ?? '');
    }
  }

  // ---- Column chooser ----
  isVisible(key: string): boolean {
    return !this.hiddenKeys().has(key);
  }
  toggleColumn(key: string): void {
    this.hiddenKeys.update(set => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  toggleFilterRow(): void {
    this.showFilterRow.update(v => !v);
    if (!this.showFilterRow()) this.clearFilters();
  }

  // ---- State ----
  private emitState(): void {
    const s = this.sort();
    const p = this.paginator();
    this.stateChange.emit({
      sortActive: s?.active ?? '',
      sortDirection: (s?.direction ?? '') as Sort['direction'],
      pageIndex: p?.pageIndex ?? 0,
      pageSize: p?.pageSize ?? this.pageSize(),
      filters: this.filters(),
    });
  }

  cellText(col: DataColumn<any>, row: any): string {
    return col.format ? col.format(row) : String(row[col.key] ?? '');
  }
}
