import { Injectable, signal } from '@angular/core';

export type StepStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepType = 'Extract' | 'Transform' | 'Load' | 'Validate' | 'Publish';
export type DateRangeFilter = 'day' | 'week' | 'month' | '2months';

export const STEP_TYPES: StepType[] = ['Extract', 'Transform', 'Load', 'Validate', 'Publish'];

/** UI wording for the internal status union. `cancelled` has no user-facing
 *  synonym but is kept because cancel/undo depends on it. */
const STATUS_LABELS: Record<StepStatus, string> = {
  queued: 'Pending',
  running: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export interface ExecutionStep {
  /** Stable per-execution job id, e.g. "exec-2001-job2". */
  id: string;
  type: StepType;
  status: StepStatus;
  progress: number;
  duration: string;
  /** Unset while the job is still pending. */
  startedAt?: Date;
  /** Set only once the job reached a terminal state. */
  endedAt?: Date;
}

export interface JobExecution {
  id: string;
  name: string;
  triggeredAt: Date;
  owner: string;
  trigger: string;
  steps: ExecutionStep[];
  status: StepStatus;
  duration: string;
  /** Only "today" executions are simulated live; historical rows stay static. */
  isLive: boolean;
}

const PIPELINE_NAMES = [
  'Customer Data Pipeline', 'Sales ETL Run', 'Warehouse Sync', 'Inventory Reconciliation',
  'Finance Ledger Import', 'Marketing Attribution Load', 'HR Records Sync', 'Product Catalog Refresh',
];
const OWNERS = ['data-pipeline', 'analytics', 'finance-ops', 'platform'];
const TRIGGERS = ['Scheduled (cron)', 'Manual', 'Event'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function randomDuration(): string {
  return `${randInt(2, 48)}m ${randInt(0, 59).toString().padStart(2, '0')}s`;
}

function deriveStatus(steps: ExecutionStep[]): StepStatus {
  if (steps.some(s => s.status === 'failed')) return 'failed';
  if (steps.some(s => s.status === 'cancelled')) return 'cancelled';
  if (steps.some(s => s.status === 'running')) return 'running';
  if (steps.some(s => s.status === 'queued')) return 'queued';
  return 'completed';
}

/** Formats a span between two instants the same way `randomDuration()` reads. */
function spanDuration(from: Date, to: Date): string {
  const secs = Math.max(1, Math.round((to.getTime() - from.getTime()) / 1000));
  return `${Math.floor(secs / 60)}m ${(secs % 60).toString().padStart(2, '0')}s`;
}

/** Builds the 5 fixed-order jobs (Extract → Transform → Load → Validate →
 *  Publish) consistent with a target overall status. Jobs run back to back,
 *  so each one starts where the previous finished. */
function makeSteps(overall: StepStatus, execId: string, triggeredAt: Date): ExecutionStep[] {
  // How far through the pipeline this execution got, and what happened there.
  const activeIdx =
    overall === 'completed' ? STEP_TYPES.length :
    overall === 'queued' ? -1 :
    randInt(0, STEP_TYPES.length - 1);

  let cursor = new Date(triggeredAt);

  return STEP_TYPES.map((type, i) => {
    const id = `${execId}-job${i + 1}`;
    const base = { id, type };

    // Not reached yet.
    if (i > activeIdx) {
      return { ...base, status: 'queued' as StepStatus, progress: 0, duration: '—' };
    }

    const startedAt = new Date(cursor);

    // Finished cleanly.
    if (i < activeIdx) {
      const endedAt = new Date(startedAt.getTime() + randInt(30, 900) * 1000);
      cursor = endedAt;
      return {
        ...base, status: 'completed' as StepStatus, progress: 100,
        duration: spanDuration(startedAt, endedAt), startedAt, endedAt,
      };
    }

    // The job the execution is sitting on right now.
    if (overall === 'running') {
      return { ...base, status: 'running' as StepStatus, progress: randInt(5, 90), duration: 'In progress', startedAt };
    }

    // failed / cancelled stop here.
    const endedAt = new Date(startedAt.getTime() + randInt(20, 600) * 1000);
    return {
      ...base, status: overall, progress: randInt(10, 80),
      duration: spanDuration(startedAt, endedAt), startedAt, endedAt,
    };
  });
}

function seedExecutions(): JobExecution[] {
  const list: JobExecution[] = [];
  const now = new Date();

  // 36 historical executions spread across the last 60 days.
  const historicalStatuses: StepStatus[] = ['completed', 'completed', 'completed', 'failed', 'cancelled'];
  for (let i = 0; i < 36; i++) {
    const daysAgo = randInt(1, 60);
    const triggeredAt = new Date(now);
    triggeredAt.setDate(triggeredAt.getDate() - daysAgo);
    triggeredAt.setHours(randInt(0, 23), randInt(0, 59), 0, 0);
    const overall = pick(historicalStatuses, randInt(0, historicalStatuses.length - 1));
    const steps = makeSteps(overall, `exec-${2000 + i}`, triggeredAt);
    list.push({
      id: `exec-${2000 + i}`,
      name: `${pick(PIPELINE_NAMES, i)} #${100 - i}`,
      triggeredAt,
      owner: pick(OWNERS, i),
      trigger: pick(TRIGGERS, i),
      steps,
      status: deriveStatus(steps),
      duration: randomDuration(),
      isLive: false,
    });
  }

  // 4 "live" executions triggered earlier today — these keep progressing.
  const liveStatuses: StepStatus[] = ['running', 'running', 'queued', 'completed'];
  for (let i = 0; i < 4; i++) {
    const triggeredAt = new Date(now);
    triggeredAt.setHours(now.getHours(), Math.max(0, now.getMinutes() - i * 12), 0, 0);
    const overall = liveStatuses[i];
    const steps = makeSteps(overall, `exec-${3000 + i}`, triggeredAt);
    list.push({
      id: `exec-${3000 + i}`,
      name: `${pick(PIPELINE_NAMES, i + 2)} #${201 + i}`,
      triggeredAt,
      owner: pick(OWNERS, i + 1),
      trigger: pick(TRIGGERS, i + 1),
      steps,
      status: overall,
      duration: overall === 'completed' ? randomDuration() : 'In progress',
      isLive: overall === 'running' || overall === 'queued',
    });
  }

  return list.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
}

@Injectable({ providedIn: 'root' })
export class JobExecutionService {
  readonly executions = signal<JobExecution[]>(seedExecutions());

  /** Safety gate: cancel/undo controls stay hidden across the feature
   *  (list, bulk bar, detail popup) until explicitly unlocked. */
  readonly actionsEnabled = signal(false);

  /** Snapshot of an execution taken right before it was cancelled, so a
   *  cancel can be undone exactly (per-step statuses included). */
  private readonly stash = new Map<string, JobExecution>();

  constructor() {
    setInterval(() => this.tick(), 1000);
  }

  getExecution(id: string): JobExecution | undefined {
    return this.executions().find(e => e.id === id);
  }

  canCancel(exec: JobExecution): boolean {
    return exec.status === 'running' || exec.status === 'queued';
  }

  canUndo(exec: JobExecution): boolean {
    return exec.status === 'cancelled' && this.stash.has(exec.id);
  }

  cancelExecution(id: string): boolean {
    const exec = this.getExecution(id);
    if (!exec || !this.canCancel(exec)) return false;
    this.stash.set(id, { ...exec, steps: exec.steps.map(s => ({ ...s })) });
    this.patch(id, e => {
      const now = new Date();
      const steps = e.steps.map(s => {
        if (s.status !== 'running' && s.status !== 'queued') return s;
        // A job that never started has no span to report.
        const ended = s.startedAt ? { endedAt: now, duration: spanDuration(s.startedAt, now) } : {};
        return { ...s, status: 'cancelled' as StepStatus, ...ended };
      });
      return { ...e, steps, status: deriveStatus(steps), duration: 'Cancelled' };
    });
    return true;
  }

  undoExecution(id: string): boolean {
    const snap = this.stash.get(id);
    if (!snap) return false;
    this.executions.update(list => list.map(e => (e.id === id ? snap : e)));
    this.stash.delete(id);
    return true;
  }

  /** Cancels every cancellable execution in the given id set; returns how many changed. */
  cancelMany(ids: string[]): number {
    return ids.reduce((count, id) => count + (this.cancelExecution(id) ? 1 : 0), 0);
  }

  undoMany(ids: string[]): number {
    return ids.reduce((count, id) => count + (this.undoExecution(id) ? 1 : 0), 0);
  }

  inRange(exec: JobExecution, range: DateRangeFilter, customDate: Date | null): boolean {
    const now = new Date();
    if (range === 'day') {
      const target = customDate ?? now;
      return exec.triggeredAt.toDateString() === target.toDateString();
    }
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 60;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return exec.triggeredAt >= cutoff;
  }

  statusColor(status: StepStatus): string {
    switch (status) {
      case 'running':   return '#1565c0';
      case 'queued':    return '#8e8e93';
      case 'completed': return '#27ae60';
      case 'failed':    return '#c0392b';
      case 'cancelled': return '#e67e22';
    }
  }

  /** User-facing wording: Pending / In progress / Completed / Failed. */
  statusLabel(status: StepStatus): string {
    return STATUS_LABELS[status];
  }

  statusIcon(status: StepStatus): string {
    switch (status) {
      case 'running':   return 'autorenew';
      case 'queued':    return 'schedule';
      case 'completed': return 'check_circle';
      case 'failed':    return 'error';
      case 'cancelled': return 'cancel';
    }
  }

  stepTypeIcon(type: StepType): string {
    switch (type) {
      case 'Extract':   return 'input';
      case 'Transform':  return 'sync_alt';
      case 'Load':       return 'upload';
      case 'Validate':   return 'fact_check';
      case 'Publish':    return 'publish';
    }
  }

  private patch(id: string, fn: (e: JobExecution) => JobExecution): void {
    this.executions.update(list => list.map(e => (e.id === id ? fn(e) : e)));
  }

  /** Drives the live simulation once per second for "today" executions only. */
  private tick(): void {
    this.executions.update(list => list.map(e => {
      if (!e.isLive) return e;

      if (e.status === 'queued') {
        if (Math.random() < 0.3) {
          const steps = e.steps.map((s, i) => (i === 0 ? { ...s, status: 'running' as StepStatus, progress: 2, startedAt: new Date() } : s));
          return { ...e, steps, status: 'running', duration: 'In progress' };
        }
        return e;
      }

      if (e.status !== 'running') return e;
      const activeIdx = e.steps.findIndex(s => s.status === 'running');
      if (activeIdx === -1) return e;

      if (Math.random() < 0.015) {
        const steps = e.steps.map((s, i) => {
          if (i !== activeIdx) return s;
          const endedAt = new Date();
          const startedAt = s.startedAt ?? endedAt;
          return { ...s, status: 'failed' as StepStatus, endedAt, duration: spanDuration(startedAt, endedAt) };
        });
        return { ...e, steps, status: 'failed', duration: randomDuration(), isLive: false };
      }

      const progress = Math.min(100, e.steps[activeIdx].progress + randInt(3, 10));
      const done = progress >= 100;
      const now = new Date();
      let steps = e.steps.map((s, i) => {
        if (i !== activeIdx) return s;
        if (!done) return { ...s, progress, status: 'running' as StepStatus };
        const startedAt = s.startedAt ?? now;
        return { ...s, progress, status: 'completed' as StepStatus, endedAt: now, duration: spanDuration(startedAt, now) };
      });

      if (done && activeIdx < steps.length - 1) {
        steps = steps.map((s, i) => (i === activeIdx + 1 ? { ...s, status: 'running' as StepStatus, progress: 2, startedAt: now } : s));
      }

      const status = deriveStatus(steps);
      return { ...e, steps, status, duration: status === 'completed' ? randomDuration() : 'In progress', isLive: status !== 'completed' };
    }));
  }
}
