import { Component, booleanAttribute, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminAuditEntry, AdminJobService, AdminRunStatus } from '../../core/services/admin-job.service';

const STATUS_ORDER: AdminRunStatus[] = ['queued', 'running', 'completed', 'failed', 'cancelled'];

/**
 * The audit trail: who triggered what, when, and how it ended — with cancel
 * for in-flight entries and delete for terminal ones, both confirmed.
 */
@Component({
  selector: 'app-admin-audit-table',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './audit-table.component.html',
  styleUrl: './audit-table.component.scss',
})
export class AdminAuditTableComponent {
  readonly service = inject(AdminJobService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly notify = inject(NotificationService);

  /** Compact preview mode: latest rows, no filters or search. */
  readonly preview = input(false, { transform: booleanAttribute });
  readonly previewCount = input(5);

  readonly statusFilter = signal<AdminRunStatus | 'all'>('all');
  readonly search = signal('');

  readonly columns = ['operation', 'triggeredBy', 'timestamp', 'status', 'actions'];

  /** Only statuses that occur, with counts — no zero-count chips. */
  readonly statusChips = computed(() => {
    const list = this.service.audit();
    return STATUS_ORDER
      .map(status => ({ status, count: list.filter(e => e.status === status).length }))
      .filter(c => c.count > 0);
  });

  readonly filtered = computed(() => {
    let list = this.service.audit();
    if (this.preview()) return list.slice(0, this.previewCount());
    if (this.statusFilter() !== 'all') list = list.filter(e => e.status === this.statusFilter());
    const q = this.search().trim().toLowerCase();
    if (q) {
      list = list.filter(e =>
        e.label.toLowerCase().includes(q) ||
        e.paramsSummary.toLowerCase().includes(q) ||
        e.triggeredBy.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q));
    }
    return list;
  });

  toggleStatus(status: AdminRunStatus): void {
    this.statusFilter.set(this.statusFilter() === status ? 'all' : status);
  }

  cancel(entry: AdminAuditEntry): void {
    this.confirm.confirm({
      title: 'Cancel this run?',
      message: `"${entry.label}" will stop. This is recorded in the audit trail.`,
      icon: 'stop_circle', tone: 'warn', confirmLabel: 'Cancel run',
    }).subscribe(ok => {
      if (ok && this.service.cancel(entry.id)) this.notify.info(`"${entry.label}" cancelled`);
    });
  }

  remove(entry: AdminAuditEntry): void {
    this.confirm.confirm({
      title: 'Delete this record?',
      message: `The audit entry for "${entry.label}" will be permanently removed.`,
      icon: 'delete', tone: 'warn', confirmLabel: 'Delete record',
    }).subscribe(ok => {
      if (ok && this.service.remove(entry.id)) this.notify.success('Record deleted');
    });
  }

  readonly trackById = (_i: number, e: AdminAuditEntry): string => e.id;
}
