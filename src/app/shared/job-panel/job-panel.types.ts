/** Lifecycle state of a job. */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/** Operations the panel can offer for a job. */
export type JobAction = 'start' | 'rerun' | 'cleanup';

export interface JobItem {
  id: string;
  name: string;
  status: JobStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  /** Job log, newest last. Rendered as a monospace block in the detail view. */
  messages?: string[];
}

export interface JobActionEvent {
  job: JobItem;
  action: JobAction;
}

/** How the job list is laid out. */
export type JobPanelVariant = 'grid' | 'rows' | 'table';

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const JOB_STATUS_ICONS: Record<JobStatus, string> = {
  pending: 'schedule',
  running: 'autorenew',
  completed: 'check_circle',
  failed: 'error',
};

export const JOB_ACTION_LABELS: Record<JobAction, string> = {
  start: 'Start job',
  rerun: 'Re-run job',
  cleanup: 'Clean up job',
};

export const JOB_ACTION_ICONS: Record<JobAction, string> = {
  start: 'play_arrow',
  rerun: 'replay',
  cleanup: 'cleaning_services',
};

/**
 * Default action matrix. A pending job can be started; a finished one can be
 * re-run or cleaned up; a running job offers nothing, since interrupting it
 * isn't one of the three supported operations.
 */
export function defaultJobActions(status: JobStatus): JobAction[] {
  switch (status) {
    case 'pending':   return ['start'];
    case 'running':   return [];
    case 'completed': return ['rerun', 'cleanup'];
    case 'failed':    return ['rerun', 'cleanup'];
  }
}
