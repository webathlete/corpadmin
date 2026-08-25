import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { JobExecutionService, StepStatus } from '../../core/services/job-execution.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-job-execution-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule, DialogComponent, DialogActionsDirective,
  ],
  templateUrl: './job-execution-detail-dialog.component.html',
  styleUrl: './job-execution-detail-dialog.component.scss',
})
export class JobExecutionDetailDialogComponent {
  readonly ref = inject(MatDialogRef<JobExecutionDetailDialogComponent>);
  private readonly executionId = inject<{ id: string }>(MAT_DIALOG_DATA).id;
  readonly service = inject(JobExecutionService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly execution = computed(() => this.service.getExecution(this.executionId));
  readonly actionsEnabled = this.service.actionsEnabled;

  cancel(): void {
    const e = this.execution();
    if (!e) return;
    this.confirmDialog.confirm({
      title: 'Cancel this execution?',
      message: `"${e.name}" will stop and its remaining steps will be marked cancelled. You can undo this afterwards.`,
      icon: 'stop_circle',
      tone: 'warn',
      confirmLabel: 'Cancel execution',
    }).subscribe(ok => {
      if (ok) this.service.cancelExecution(this.executionId);
    });
  }

  undo(): void {
    const e = this.execution();
    if (!e) return;
    this.confirmDialog.confirm({
      title: 'Undo this cancellation?',
      message: `"${e.name}" will be restored to the state it was in right before it was cancelled.`,
      icon: 'undo',
      tone: 'primary',
      confirmLabel: 'Undo cancel',
    }).subscribe(ok => {
      if (ok) this.service.undoExecution(this.executionId);
    });
  }

  canCancel(): boolean {
    const e = this.execution();
    return !!e && this.actionsEnabled() && this.service.canCancel(e);
  }

  canUndo(): boolean {
    const e = this.execution();
    return !!e && this.actionsEnabled() && this.service.canUndo(e);
  }

  /** Whether cancel/undo would apply if the toolbar gate were unlocked — drives the lock hint. */
  isLocked(): boolean {
    const e = this.execution();
    if (!e || this.actionsEnabled()) return false;
    return this.service.canCancel(e) || this.service.canUndo(e);
  }

  statusLabel(status: StepStatus): string {
    return this.service.statusLabel(status);
  }

  statusColor(status: string): string {
    return this.service.statusColor(status as any);
  }

  statusIcon(status: string): string {
    return this.service.statusIcon(status as any);
  }

  stepTypeIcon(type: string): string {
    return this.service.stepTypeIcon(type as any);
  }
}
