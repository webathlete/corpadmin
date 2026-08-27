import { Component, computed, inject, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogComponent } from '../dialog/dialog.component';
import { DialogActionsDirective } from '../dialog/dialog-actions.directive';
import {
  JOB_ACTION_ICONS, JOB_ACTION_LABELS, JOB_STATUS_ICONS, JOB_STATUS_LABELS,
  JobAction, JobActionEvent, JobItem, JobPanelVariant, JobStatus, defaultJobActions,
} from './job-panel.types';

/** Shape accepted when the panel is opened through `MatDialog`. */
export interface JobPanelDialogData {
  jobs: JobItem[];
  title?: string;
  variant?: JobPanelVariant;
  selectedId?: string | null;
}

/**
 * Master–detail job browser: a compact list of jobs that swaps in place for a
 * single job's details, with status-appropriate actions and a way back.
 *
 * Self-contained and app-agnostic — it holds no services and reads no global
 * styles, so it can be copied into any Angular Material project alongside
 * `shared/dialog`. Colours resolve from host tokens where present and fall
 * back to literals otherwise.
 *
 * Usable two ways:
 *   inline   <app-job-panel [jobs]="jobs()" (action)="run($event)" />
 *   dialog   dialogService.open(JobPanelComponent, { size: 'lg', data: { jobs } })
 *            — `data` seeds the same inputs, and because `jobs`, `selectedId`
 *            and `busyJobId` are models the host can keep an open dialog in
 *            sync with `ref.componentInstance.jobs.set(...)`.
 */
@Component({
  selector: 'app-job-panel',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule,
    MatProgressBarModule, MatDialogModule, DialogComponent, DialogActionsDirective,
  ],
  templateUrl: './job-panel.component.html',
  styleUrl: './job-panel.component.scss',
  // `title` doubles as a global HTML attribute; drop it so the browser
  // doesn't tooltip the whole panel.
  host: { '[attr.title]': 'null' },
})
export class JobPanelComponent {
  /** The jobs to browse. Writable so a host can refresh an open dialog. */
  readonly jobs = model<JobItem[]>([]);
  /** Id of the job to open on. Null shows the list. Two-way bindable. */
  readonly selectedId = model<string | null>(null);
  /** Job whose action is in flight — disables the action bar. */
  readonly busyJobId = model<string | null>(null);

  /** Layout of the job list. */
  readonly variant = input<JobPanelVariant>('grid');
  /** Header title shown on the list view. */
  readonly title = input('Jobs');
  /** Override which actions each status offers. */
  readonly actionsFor = input<(status: JobStatus) => JobAction[]>(defaultJobActions);

  readonly action = output<JobActionEvent>();

  /** Resolved by id, so a refreshed `jobs` array keeps the detail view live. */
  readonly selected = computed(() =>
    this.jobs().find(j => j.id === this.selectedId()) ?? null);

  readonly counts = computed(() => {
    const by = { pending: 0, running: 0, completed: 0, failed: 0 } as Record<JobStatus, number>;
    for (const j of this.jobs()) by[j.status]++;
    return by;
  });

  /** Status buckets that actually occur, so the summary shows no empty chips. */
  readonly summary = computed(() =>
    (Object.keys(JOB_STATUS_LABELS) as JobStatus[])
      .map(status => ({ status, count: this.counts()[status] }))
      .filter(s => s.count > 0));

  readonly detailActions = computed(() => {
    const job = this.selected();
    return job ? this.actionsFor()(job.status) : [];
  });

  readonly tableColumns = ['status', 'id', 'name'];

  /** False when rendered inline, so the Close button is hidden there. */
  readonly inDialog = !!inject(MatDialogRef, { optional: true });

  readonly statusLabel = (s: JobStatus) => JOB_STATUS_LABELS[s];
  readonly statusIcon = (s: JobStatus) => JOB_STATUS_ICONS[s];
  readonly actionLabel = (a: JobAction) => JOB_ACTION_LABELS[a];
  readonly actionIcon = (a: JobAction) => JOB_ACTION_ICONS[a];

  constructor() {
    // Seed from dialog data when opened as a dialog. Models are writable, so
    // this and later host updates use the same path.
    const data = inject<JobPanelDialogData | null>(MAT_DIALOG_DATA, { optional: true });
    if (data) {
      this.jobs.set(data.jobs ?? []);
      if (data.selectedId !== undefined) this.selectedId.set(data.selectedId);
    }
    this.dialogData = data;
  }

  /** Dialog-supplied title/variant, used as the default when no input is bound. */
  private readonly dialogData: JobPanelDialogData | null;

  readonly headerTitle = computed(() => this.dialogData?.title ?? this.title());
  readonly view = computed(() => this.dialogData?.variant ?? this.variant());

  select(job: JobItem): void { this.selectedId.set(job.id); }
  backToList(): void { this.selectedId.set(null); }

  run(action: JobAction): void {
    const job = this.selected();
    if (job) this.action.emit({ job, action });
  }

  logText(job: JobItem): string {
    return (job.messages ?? []).join('\n');
  }

  /** Elapsed time, or the running/not-started state when there's no span. */
  duration(job: JobItem): string {
    if (!job.startedAt) return '—';
    const end = job.endedAt ?? (job.status === 'running' ? new Date() : null);
    if (!end) return '—';
    const secs = Math.max(0, Math.round((+end - +job.startedAt) / 1000));
    return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${(secs % 60).toString().padStart(2, '0')}s`;
  }
}
