import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { DateRangeFilter, JobExecution, JobExecutionService } from '../../core/services/job-execution.service';
import { JobExecutionDetailDialogComponent } from './job-execution-detail-dialog.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-job-executions',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatButtonToggleModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule, MatCardModule,
    MatDialogModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  templateUrl: './job-executions.component.html',
  styleUrl: './job-executions.component.scss',
})
export class JobExecutionsComponent {
  readonly loading = simulatedLoading();
  readonly executionService = inject(JobExecutionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);

  /** Cancel/undo is a destructive-ish action gate — hidden until unlocked. */
  readonly actionsEnabled = this.executionService.actionsEnabled;

  // Column set never changes shape — only the "select" column's content
  // (checkbox vs. nothing) reacts to the toggle. Keeping the column count
  // stable avoids the table reflowing/jumping when actions are enabled.
  readonly displayedColumns = ['select', 'execution', 'steps', 'status', 'triggeredAt', 'duration', 'actions'];

  readonly trackByExecId = (_index: number, exec: JobExecution): string => exec.id;

  // ---- Filters ----
  readonly range = signal<DateRangeFilter>('week');
  readonly customDate = signal<Date | null>(null);

  readonly filtered = computed(() =>
    this.executionService.executions().filter(e => this.executionService.inRange(e, this.range(), this.customDate())),
  );

  // ---- Pagination (manual — no MatTableDataSource needed) ----
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly paged = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  // ---- Summary (reflects the active date filter) ----
  readonly summary = computed(() => {
    const list = this.filtered();
    return {
      total: list.length,
      running: list.filter(e => e.status === 'running').length,
      queued: list.filter(e => e.status === 'queued').length,
      completed: list.filter(e => e.status === 'completed').length,
      failed: list.filter(e => e.status === 'failed').length,
      cancelled: list.filter(e => e.status === 'cancelled').length,
    };
  });

  /** Status breakdown as a part-to-whole distribution — backs both the
   *  composition bar and the legend row, so counts and percentages always
   *  come from a single source. */
  readonly segments = computed(() => {
    const s = this.summary();
    const total = s.total || 1;
    const defs: { key: JobExecution['status']; label: string; value: number; color: string }[] = [
      { key: 'running',   label: 'Running',   value: s.running,   color: 'var(--app-primary)' },
      { key: 'queued',    label: 'Queued',    value: s.queued,    color: 'var(--text-muted)' },
      { key: 'completed', label: 'Completed', value: s.completed, color: 'var(--status-success)' },
      { key: 'failed',    label: 'Failed',    value: s.failed,    color: 'var(--status-error)' },
      { key: 'cancelled', label: 'Cancelled', value: s.cancelled, color: 'var(--status-warning)' },
    ];
    return defs.map(d => ({ ...d, pct: Math.round((d.value / total) * 1000) / 10 }));
  });

  // ---- Bulk selection ----
  readonly selection = new SelectionModel<string>(true, []);

  setRange(range: DateRangeFilter): void {
    this.range.set(range);
    if (range !== 'day') this.customDate.set(null);
    this.pageIndex.set(0);
    this.selection.clear();
  }

  onDateChange(date: Date | null): void {
    this.customDate.set(date);
    this.range.set('day');
    this.pageIndex.set(0);
    this.selection.clear();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  toggleActionsEnabled(enabled: boolean): void {
    this.actionsEnabled.set(enabled);
    if (!enabled) this.selection.clear();
  }

  get pageCancellableIds(): string[] {
    return this.paged().filter(e => this.executionService.canCancel(e)).map(e => e.id);
  }

  isAllPageSelected(): boolean {
    const ids = this.pageCancellableIds;
    return ids.length > 0 && ids.every(id => this.selection.isSelected(id));
  }

  isPageIndeterminate(): boolean {
    const ids = this.pageCancellableIds;
    const selected = ids.filter(id => this.selection.isSelected(id)).length;
    return selected > 0 && selected < ids.length;
  }

  masterToggle(): void {
    if (this.isAllPageSelected()) {
      this.pageCancellableIds.forEach(id => this.selection.deselect(id));
    } else {
      this.pageCancellableIds.forEach(id => this.selection.select(id));
    }
  }

  canCancel(exec: JobExecution): boolean {
    return this.executionService.canCancel(exec);
  }

  canUndo(exec: JobExecution): boolean {
    return this.executionService.canUndo(exec);
  }

  cancelOne(exec: JobExecution, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDialog.confirm({
      title: 'Cancel this execution?',
      message: `"${exec.name}" will stop and its remaining steps will be marked cancelled. You can undo this afterwards.`,
      icon: 'stop_circle',
      tone: 'warn',
      confirmLabel: 'Cancel execution',
    }).subscribe(ok => {
      if (!ok) return;
      this.executionService.cancelExecution(exec.id);
      this.selection.deselect(exec.id);
      this.snackBar.open(`"${exec.name}" cancelled`, 'Undo', { duration: 5000 })
        .onAction().subscribe(() => this.executionService.undoExecution(exec.id));
    });
  }

  undoOne(exec: JobExecution, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDialog.confirm({
      title: 'Undo this cancellation?',
      message: `"${exec.name}" will be restored to the state it was in right before it was cancelled.`,
      icon: 'undo',
      tone: 'primary',
      confirmLabel: 'Undo cancel',
    }).subscribe(ok => {
      if (!ok) return;
      this.executionService.undoExecution(exec.id);
      this.snackBar.open(`"${exec.name}" restored`, 'Dismiss', { duration: 3000 });
    });
  }

  cancelSelected(): void {
    const ids = [...this.selection.selected];
    this.confirmDialog.confirm({
      title: `Cancel ${ids.length} execution${ids.length === 1 ? '' : 's'}?`,
      message: 'Each selected execution will stop and its remaining steps will be marked cancelled. You can undo this afterwards.',
      icon: 'stop_circle',
      tone: 'warn',
      confirmLabel: 'Cancel selected',
    }).subscribe(ok => {
      if (!ok) return;
      const count = this.executionService.cancelMany(ids);
      this.selection.clear();
      this.snackBar.open(`${count} execution${count === 1 ? '' : 's'} cancelled`, 'Undo', { duration: 5000 })
        .onAction().subscribe(() => this.executionService.undoMany(ids));
    });
  }

  openDetails(exec: JobExecution): void {
    this.dialog.open(JobExecutionDetailDialogComponent, {
      width: '560px',
      maxWidth: '92vw',
      data: { id: exec.id },
    });
  }

  statusColor(status: JobExecution['status']): string {
    return this.executionService.statusColor(status);
  }

  statusIcon(status: JobExecution['status']): string {
    return this.executionService.statusIcon(status);
  }

  stepTypeIcon(type: string): string {
    return this.executionService.stepTypeIcon(type as any);
  }
}
