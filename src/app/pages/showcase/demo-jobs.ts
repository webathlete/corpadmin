import { JobItem, JobStatus } from '../../shared/job-panel/job-panel.types';

const NAMES = [
  'Extract customer records', 'Validate schema', 'Normalise addresses', 'Deduplicate contacts',
  'Enrich firmographics', 'Compute risk scores', 'Load staging tables', 'Reconcile ledgers',
  'Archive raw payloads', 'Refresh materialised views', 'Rebuild search index', 'Warm caches',
  'Publish analytics extract', 'Notify downstream systems', 'Generate audit trail',
  'Compress log files', 'Rotate credentials', 'Verify checksums', 'Purge expired records',
  'Emit completion metrics',
];

const STATUSES: JobStatus[] = [
  'completed', 'completed', 'completed', 'completed', 'failed', 'completed', 'running',
  'completed', 'completed', 'failed', 'pending', 'pending', 'pending', 'pending', 'pending',
  'completed', 'pending', 'completed', 'pending', 'pending',
];

const LOGS: Record<JobStatus, string[]> = {
  completed: [
    '[10:02:11] Starting job runner v2.4.1',
    '[10:02:12] Connected to warehouse pool (8 connections)',
    '[10:02:14] Read 128,441 rows from source',
    '[10:03:02] Wrote 128,441 rows — 0 rejected',
    '[10:03:04] Job completed successfully',
  ],
  failed: [
    '[10:02:11] Starting job runner v2.4.1',
    '[10:02:12] Connected to warehouse pool (8 connections)',
    '[10:02:19] Read 44,102 rows from source',
    '[10:02:41] ERROR constraint violation on column `account_id`',
    '[10:02:41] Rolled back transaction',
    '[10:02:42] Job failed after 31s',
  ],
  running: [
    '[10:02:11] Starting job runner v2.4.1',
    '[10:02:12] Connected to warehouse pool (8 connections)',
    '[10:02:20] Read 61,204 rows from source',
    '[10:04:55] Processing batch 14 of 22…',
  ],
  pending: [],
};

/** 20 jobs with a realistic status mix — enough to show the compact list. */
export function makeDemoJobs(): JobItem[] {
  const base = new Date();
  base.setHours(10, 2, 11, 0);

  return NAMES.map((name, i) => {
    const status = STATUSES[i];
    const startedAt = status === 'pending' ? null : new Date(base.getTime() + i * 47_000);
    const endedAt =
      status === 'completed' ? new Date(+startedAt! + (40 + i * 7) * 1000) :
      status === 'failed' ? new Date(+startedAt! + 31_000) : null;

    return {
      id: `JOB-${(1041 + i).toString()}`,
      name,
      status,
      startedAt,
      endedAt,
      messages: [...LOGS[status]],
    };
  });
}
