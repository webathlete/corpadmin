import { Injectable, signal } from '@angular/core';

export type StepStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepType = 'Extract' | 'Transform' | 'Load' | 'Validate';
export type DateRangeFilter = 'day' | 'week' | 'month' | '2months';

export const STEP_TYPES: StepType[] = ['Extract', 'Transform', 'Load', 'Validate'];

export interface ExecutionStep {
  type: StepType;
  status: StepStatus;
  progress: number;
  duration: string;
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

/** Builds the 4 fixed-order steps (Extract → Transform → Load → Validate)
 *  consistent with a target overall status. */
function makeSteps(overall: StepStatus): ExecutionStep[] {
  if (overall === 'completed') {
    return STEP_TYPES.map(type => ({ type, status: 'completed', progress: 100, duration: randomDuration() }));
  }
  if (overall === 'queued') {
    return STEP_TYPES.map(type => ({ type, status: 'queued', progress: 0, duration: '—' }));
  }
  if (overall === 'running') {
    const activeIdx = randInt(0, 3);
    return STEP_TYPES.map((type, i) => ({
      type,
      status: i < activeIdx ? 'completed' : i === activeIdx ? 'running' : 'queued',
      progress: i < activeIdx ? 100 : i === activeIdx ? randInt(5, 90) : 0,
      duration: i < activeIdx ? randomDuration() : i === activeIdx ? 'In progress' : '—',
    }));
  }
  // failed / cancelled: stops partway through a random step.
  const stopIdx = randInt(0, 3);
  return STEP_TYPES.map((type, i) => ({
    type,
    status: i < stopIdx ? 'completed' : i === stopIdx ? overall : 'queued',
    progress: i < stopIdx ? 100 : i === stopIdx ? randInt(10, 80) : 0,
    duration: i <= stopIdx ? randomDuration() : '—',
  }));
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
    const steps = makeSteps(overall);
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
    const steps = makeSteps(overall);
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
      const steps = e.steps.map(s =>
        (s.status === 'running' || s.status === 'queued')
          ? { ...s, status: 'cancelled' as StepStatus }
          : s);
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
          const steps = e.steps.map((s, i) => (i === 0 ? { ...s, status: 'running' as StepStatus, progress: 2 } : s));
          return { ...e, steps, status: 'running', duration: 'In progress' };
        }
        return e;
      }

      if (e.status !== 'running') return e;
      const activeIdx = e.steps.findIndex(s => s.status === 'running');
      if (activeIdx === -1) return e;

      if (Math.random() < 0.015) {
        const steps = e.steps.map((s, i) => (i === activeIdx ? { ...s, status: 'failed' as StepStatus } : s));
        return { ...e, steps, status: 'failed', duration: randomDuration(), isLive: false };
      }

      const progress = Math.min(100, e.steps[activeIdx].progress + randInt(3, 10));
      const done = progress >= 100;
      let steps = e.steps.map((s, i) =>
        i === activeIdx ? { ...s, progress, status: (done ? 'completed' : 'running') as StepStatus, duration: done ? randomDuration() : s.duration } : s);

      if (done && activeIdx < steps.length - 1) {
        steps = steps.map((s, i) => (i === activeIdx + 1 ? { ...s, status: 'running' as StepStatus, progress: 2 } : s));
      }

      const status = deriveStatus(steps);
      return { ...e, steps, status, duration: status === 'completed' ? randomDuration() : 'In progress', isLive: status !== 'completed' };
    }));
  }
}
