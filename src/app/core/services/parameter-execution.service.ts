import { Injectable } from '@angular/core';

export type ParamExecStatus = 'completed' | 'failed' | 'running' | 'queued' | 'cancelled';

/** One daily job run triggered by a parameter configuration. */
export interface ParameterExecution {
  id: string;
  parameterId: string;
  runDate: Date;
  status: ParamExecStatus;
  duration: string;
  recordsProcessed: number;
  triggeredBy: string;
  /** Only set for failed / cancelled runs. */
  message?: string;
}

const TRIGGERS = ['Scheduled (cron)', 'Scheduled (cron)', 'Scheduled (cron)', 'Manual'];
const FAILURE_MESSAGES = [
  'Timed out waiting on upstream response.',
  'Validation rule rejected 3 records; run halted.',
  'Downstream connector returned HTTP 503.',
  'Configuration value out of allowed range at run time.',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function randomDuration(): string {
  return `${randInt(1, 22)}m ${randInt(0, 59).toString().padStart(2, '0')}s`;
}

/** Generates a stable set of daily-run history for one parameter, most recent
 *  first. Called lazily and cached — with 1,000+ seeded parameters, building
 *  this eagerly for every row up front would be pure waste. */
function generateExecutions(parameterId: string): ParameterExecution[] {
  const runCount = randInt(8, 24);
  const list: ParameterExecution[] = [];
  const now = new Date();

  for (let i = 0; i < runCount; i++) {
    const runDate = new Date(now);
    runDate.setDate(runDate.getDate() - i);
    runDate.setHours(randInt(1, 5), randInt(0, 59), 0, 0);

    // Today's run (i === 0) may still be in flight; history is always settled.
    let status: ParamExecStatus;
    if (i === 0 && Math.random() < 0.25) {
      status = Math.random() < 0.6 ? 'running' : 'queued';
    } else {
      const roll = Math.random();
      status = roll < 0.82 ? 'completed' : roll < 0.94 ? 'failed' : 'cancelled';
    }

    const isSettled = status === 'completed' || status === 'failed' || status === 'cancelled';
    list.push({
      id: `${parameterId}-run-${runCount - i}`,
      parameterId,
      runDate,
      status,
      duration: isSettled ? randomDuration() : 'In progress',
      recordsProcessed: isSettled ? randInt(120, 8600) : 0,
      triggeredBy: pick(TRIGGERS, i),
      message: status === 'failed' ? pick(FAILURE_MESSAGES, i) : undefined,
    });
  }

  return list;
}

@Injectable({ providedIn: 'root' })
export class ParameterExecutionService {
  private readonly cache = new Map<string, ParameterExecution[]>();

  /** Job-run history for one parameter — generated once on first request,
   *  then cached so repeated views (list expand, dialog reopen) stay stable. */
  getExecutions(parameterId: string): ParameterExecution[] {
    let list = this.cache.get(parameterId);
    if (!list) {
      list = generateExecutions(parameterId);
      this.cache.set(parameterId, list);
    }
    return list;
  }

  statusColor(status: ParamExecStatus): string {
    switch (status) {
      case 'running':   return '#1565c0';
      case 'queued':    return '#8e8e93';
      case 'completed': return '#27ae60';
      case 'failed':    return '#c0392b';
      case 'cancelled': return '#e67e22';
    }
  }

  statusIcon(status: ParamExecStatus): string {
    switch (status) {
      case 'running':   return 'autorenew';
      case 'queued':    return 'schedule';
      case 'completed': return 'check_circle';
      case 'failed':    return 'error';
      case 'cancelled': return 'cancel';
    }
  }
}
