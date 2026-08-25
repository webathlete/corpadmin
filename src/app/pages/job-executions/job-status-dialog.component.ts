import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';
import { ExecutionStep, JobExecutionService } from '../../core/services/job-execution.service';

export interface JobStatusDialogData {
  executionId: string;
  /** Job to open directly. Omit to list every job in the execution. */
  jobId?: string;
}

/**
 * Job status popup for an execution — opens either on a single job or on the
 * full list, and lets the user drill between the two without reopening.
 * Reads through the service signal so a live execution keeps updating while
 * the dialog is open.
 */
@Component({
  selector: 'app-job-status-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule,
    MatTooltipModule, DialogComponent, DialogActionsDirective,
  ],
  templateUrl: './job-status-dialog.component.html',
  styleUrl: './job-status-dialog.component.scss',
})
export class JobStatusDialogComponent {
  private readonly data = inject<JobStatusDialogData>(MAT_DIALOG_DATA);
  readonly service = inject(JobExecutionService);

  /** Tracked by id, not by object, so it survives the live tick replacing steps. */
  readonly selectedJobId = signal<string | undefined>(this.data.jobId);

  /** True when the dialog was opened on the whole list — drives the back button. */
  readonly openedOnList = !this.data.jobId;

  readonly execution = computed(() =>
    this.service.executions().find(e => e.id === this.data.executionId));

  readonly jobs = computed<ExecutionStep[]>(() => this.execution()?.steps ?? []);

  readonly selectedJob = computed(() =>
    this.jobs().find(j => j.id === this.selectedJobId()));

  readonly columns = ['job', 'status', 'started', 'ended', 'duration'];

  /** Sequence number shown as "Job 3 of 5". */
  jobIndex(job: ExecutionStep): number {
    return this.jobs().findIndex(j => j.id === job.id) + 1;
  }

  select(job: ExecutionStep): void { this.selectedJobId.set(job.id); }
  backToList(): void { this.selectedJobId.set(undefined); }
}
