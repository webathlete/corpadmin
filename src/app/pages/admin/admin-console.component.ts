import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { AdminJobService } from '../../core/services/admin-job.service';
import { ManualRunFormComponent } from './manual-run-form.component';
import { AdhocFormComponent } from './adhoc-form.component';
import { BatchInputComponent } from './batch-input.component';
import { AdminAuditTableComponent } from './audit-table.component';

type AdminOp = 'manual' | 'adhoc' | 'batch' | 'audit';

interface OpDef {
  id: AdminOp;
  label: string;
  icon: string;
  sub: string;
}

/**
 * Admin Console — split workspace: operations rail on the left, the selected
 * operation's form on the right, recent activity beneath it. The audit trail
 * is a first-class rail entry, not just a preview link.
 */
@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatCardModule,
    PageLayoutComponent, ManualRunFormComponent, AdhocFormComponent,
    BatchInputComponent, AdminAuditTableComponent,
  ],
  templateUrl: './admin-console.component.html',
  styleUrl: './admin-console.component.scss',
})
export class AdminConsoleComponent {
  private readonly service = inject(AdminJobService);

  readonly operations: OpDef[] = [
    { id: 'manual', label: 'Manual run', icon: 'play_circle', sub: 'Configured jobs with parameters' },
    { id: 'adhoc', label: 'Adhoc job', icon: 'bolt', sub: 'Pick a job, supply inputs' },
    { id: 'batch', label: 'Batch input', icon: 'upload_file', sub: 'Upload a file or paste records' },
    { id: 'audit', label: 'Audit trail', icon: 'history', sub: 'Every trigger — who, when, outcome' },
  ];

  readonly selected = signal<AdminOp>('manual');

  readonly selectedOp = computed(() =>
    this.operations.find(o => o.id === this.selected())!);

  readonly inFlight = computed(() =>
    this.service.audit().filter(e => this.service.canCancel(e)).length);
}
