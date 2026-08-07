import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ParamExecStatus, ParameterExecution, ParameterExecutionService } from '../../core/services/parameter-execution.service';

export type ExecSortField = 'status' | 'runDate' | 'duration' | 'records';
export type SortDir = 'asc' | 'desc';

/** Fixed, sensible display order — not alphabetical. */
const STATUS_ORDER: ParamExecStatus[] = ['completed', 'failed', 'running', 'queued', 'cancelled'];

/**
 * Expandable, sortable, filterable list of a parameter's job-run history —
 * the row/detail markup lives here once and is reused by both the dialog
 * variant (ParameterExecutionsDialogComponent) and the inline-panel variant
 * (ParameterInlinePanelComponent's "Executions" tab), so the two CRUD styles
 * show identical execution detail instead of two hand-maintained copies.
 */
@Component({
  selector: 'app-parameter-executions-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './parameter-executions-list.component.html',
  styleUrl: './parameter-executions-list.component.scss',
})
export class ParameterExecutionsListComponent {
  readonly executions = input.required<ParameterExecution[]>();

  private readonly execService = inject(ParameterExecutionService);

  readonly expandedId = signal<string | null>(null);
  readonly filterStatus = signal<'all' | ParamExecStatus>('all');
  readonly sortField = signal<ExecSortField>('runDate');
  readonly sortDir = signal<SortDir>('desc');

  /** Filter and expansion are scoped to "whichever parameter's data is
   *  currently shown" — reset them whenever the input list is swapped for a
   *  different parameter's (the inline panel reuses this same component
   *  instance across selections). Sort preference is left alone; that's a
   *  user choice that reasonably persists across rows. */
  constructor() {
    effect(() => {
      this.executions();
      this.filterStatus.set('all');
      this.expandedId.set(null);
    });
  }

  readonly statusCounts = computed(() => {
    const counts = new Map<ParamExecStatus, number>();
    for (const e of this.executions()) {
      counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
    }
    return counts;
  });

  /** Only statuses actually present, in a fixed display order — no empty
   *  zero-count chips cluttering the filter row. */
  readonly availableStatuses = computed(() =>
    STATUS_ORDER
      .map(status => ({ status, count: this.statusCounts().get(status) ?? 0 }))
      .filter(s => s.count > 0));

  readonly filteredExecutions = computed(() => {
    const status = this.filterStatus();
    return status === 'all' ? this.executions() : this.executions().filter(e => e.status === status);
  });

  readonly sortedExecutions = computed(() => {
    const list = [...this.filteredExecutions()];
    const field = this.sortField();
    const dirMul = this.sortDir() === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'status':   cmp = a.status.localeCompare(b.status); break;
        case 'runDate':  cmp = a.runDate.getTime() - b.runDate.getTime(); break;
        case 'duration': cmp = this.durationSeconds(a.duration) - this.durationSeconds(b.duration); break;
        case 'records':  cmp = a.recordsProcessed - b.recordsProcessed; break;
      }
      return cmp * dirMul;
    });
    return list;
  });

  setFilter(status: 'all' | ParamExecStatus): void {
    this.filterStatus.set(status);
  }

  setSort(field: ExecSortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  toggle(id: string): void {
    this.expandedId.update(cur => (cur === id ? null : id));
  }

  recordsLabel(ex: ParameterExecution): string {
    return ex.status === 'running' || ex.status === 'queued' ? '—' : `${ex.recordsProcessed.toLocaleString()} records`;
  }

  statusColor(status: ParamExecStatus): string { return this.execService.statusColor(status); }
  statusIcon(status: ParamExecStatus): string { return this.execService.statusIcon(status); }

  private durationSeconds(duration: string): number {
    const m = duration.match(/(\d+)m\s+(\d+)s/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : -1;
  }
}
