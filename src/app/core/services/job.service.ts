import { Injectable, signal } from '@angular/core';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobLogEntry {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface Job {
  id: string;
  name: string;
  type: string;
  status: JobStatus;
  progress: number;
  startedAt: string;
  duration: string;
  owner: string;
  trigger: string;
  priority: 'low' | 'normal' | 'high';
  description: string;
  logs: JobLogEntry[];
}

@Injectable({ providedIn: 'root' })
export class JobService {
  readonly jobs = signal<Job[]>([
    { id: 'job-1042', name: 'Nightly Data Sync',       type: 'ETL',         status: 'running',   progress: 64,  startedAt: '02:14 AM', duration: '12m 04s', owner: 'data-pipeline', trigger: 'Scheduled (cron)', priority: 'high',   description: 'Synchronizes the analytics warehouse with production replicas.', logs: [{ time: '02:14 AM', level: 'info', message: 'Job started' }, { time: '02:18 AM', level: 'info', message: 'Extracted 1.2M rows from prod-db-01' }, { time: '02:22 AM', level: 'warn', message: 'Slow batch detected on table orders' }] },
    { id: 'job-1041', name: 'Invoice PDF Generation',  type: 'Report',      status: 'running',   progress: 28,  startedAt: '02:31 AM', duration: '03m 18s', owner: 'billing',       trigger: 'Manual',           priority: 'normal', description: 'Renders monthly invoice PDFs for all active accounts.', logs: [{ time: '02:31 AM', level: 'info', message: 'Job started' }, { time: '02:33 AM', level: 'info', message: 'Rendered 320 / 1140 invoices' }] },
    { id: 'job-1040', name: 'User Analytics Rollup',   type: 'Analytics',   status: 'queued',    progress: 0,   startedAt: '—',        duration: '—',       owner: 'analytics',     trigger: 'Scheduled (cron)', priority: 'normal', description: 'Aggregates per-user event data into daily rollups.', logs: [{ time: '02:35 AM', level: 'info', message: 'Queued behind 2 jobs' }] },
    { id: 'job-1039', name: 'Email Campaign Dispatch', type: 'Messaging',   status: 'completed', progress: 100, startedAt: '01:50 AM', duration: '08m 42s', owner: 'marketing',     trigger: 'Manual',           priority: 'high',   description: 'Sends the Q3 product announcement to the newsletter list.', logs: [{ time: '01:50 AM', level: 'info', message: 'Job started' }, { time: '01:58 AM', level: 'info', message: 'Dispatched 48,920 emails' }, { time: '01:58 AM', level: 'info', message: 'Job completed' }] },
    { id: 'job-1038', name: 'Backup: prod-db-01',      type: 'Backup',      status: 'completed', progress: 100, startedAt: '12:00 AM', duration: '22m 11s', owner: 'infra',         trigger: 'Scheduled (cron)', priority: 'high',   description: 'Full nightly snapshot of the primary production database.', logs: [{ time: '12:00 AM', level: 'info', message: 'Snapshot initiated' }, { time: '12:22 AM', level: 'info', message: 'Uploaded 84 GB to cold storage' }] },
    { id: 'job-1037', name: 'Image Thumbnail Resize',  type: 'Media',       status: 'failed',    progress: 47,  startedAt: '11:32 PM', duration: '01m 05s', owner: 'media',         trigger: 'Event',            priority: 'low',    description: 'Generates responsive thumbnail variants for uploaded media.', logs: [{ time: '11:32 PM', level: 'info', message: 'Job started' }, { time: '11:33 PM', level: 'error', message: 'OOM while processing asset 9f3a — worker crashed' }] },
    { id: 'job-1036', name: 'Stale Session Cleanup',   type: 'Maintenance', status: 'cancelled', progress: 19,  startedAt: '11:10 PM', duration: '00m 38s', owner: 'platform',      trigger: 'Scheduled (cron)', priority: 'low',    description: 'Purges expired authentication sessions from the cache.', logs: [{ time: '11:10 PM', level: 'info', message: 'Job started' }, { time: '11:11 PM', level: 'warn', message: 'Cancelled by operator' }] },
  ]);

  private jobSeq = 1043;

  constructor() {
    // Simulate live progress on running jobs across the whole app.
    setInterval(() => this.advanceRunning(), 1000);
  }

  getJob(id: string): Job | undefined {
    return this.jobs().find(j => j.id === id);
  }

  startJob(): Job {
    const id = `job-${this.jobSeq++}`;
    const job: Job = {
      id,
      name: `Ad-hoc Task ${id.slice(-4)}`,
      type: 'Manual',
      status: 'running',
      progress: 0,
      startedAt: this.now(),
      duration: '00m 00s',
      owner: 'you',
      trigger: 'Manual',
      priority: 'normal',
      description: 'Manually triggered ad-hoc job.',
      logs: [{ time: this.now(), level: 'info', message: 'Job started' }],
    };
    this.jobs.update(list => [job, ...list]);
    return job;
  }

  cancelJob(id: string): void {
    this.patch(id, j => ({
      ...j,
      status: 'cancelled',
      logs: [...j.logs, { time: this.now(), level: 'warn', message: 'Cancelled by operator' }],
    }));
  }

  retryJob(id: string): void {
    this.patch(id, j => ({
      ...j,
      status: 'running',
      progress: 0,
      startedAt: this.now(),
      logs: [...j.logs, { time: this.now(), level: 'info', message: 'Job restarted' }],
    }));
  }

  canCancel(job: Job): boolean {
    return job.status === 'running' || job.status === 'queued';
  }

  canRetry(job: Job): boolean {
    return job.status === 'failed' || job.status === 'cancelled';
  }

  statusColor(status: JobStatus): string {
    switch (status) {
      case 'running':   return '#1565c0';
      case 'queued':    return '#8e8e93';
      case 'completed': return '#27ae60';
      case 'failed':    return '#c0392b';
      case 'cancelled': return '#e67e22';
    }
  }

  statusIcon(status: JobStatus): string {
    switch (status) {
      case 'running':   return 'autorenew';
      case 'queued':    return 'schedule';
      case 'completed': return 'check_circle';
      case 'failed':    return 'error';
      case 'cancelled': return 'cancel';
    }
  }

  private patch(id: string, fn: (job: Job) => Job): void {
    this.jobs.update(list => list.map(j => (j.id === id ? fn(j) : j)));
  }

  private ticks = 0;

  /** Drives the live simulation once per second: progresses running jobs,
   *  promotes queued → running, and recycles finished jobs so the board keeps
   *  changing status continuously. */
  private advanceRunning(): void {
    this.ticks++;

    this.jobs.update(list =>
      list.map(j => {
        if (j.status !== 'running') return j;
        // Small chance a running job fails mid-flight.
        if (Math.random() < 0.015) {
          return { ...j, status: 'failed',
            logs: [...j.logs, { time: this.now(), level: 'error', message: 'Job failed' }] };
        }
        const progress = Math.min(100, j.progress + Math.round(Math.random() * 6) + 2);
        const done = progress >= 100;
        return {
          ...j,
          progress,
          status: done ? 'completed' : 'running',
          logs: done ? [...j.logs, { time: this.now(), level: 'info', message: 'Job completed' }] : j.logs,
        };
      }),
    );

    // Every 2s: keep the pipeline flowing — promote a queued job to running.
    if (this.ticks % 2 === 0) this.promoteQueued();
    // Every 6s: recycle a finished job back to the queue so the sim never stalls.
    if (this.ticks % 6 === 0) this.recycleFinished();
  }

  private promoteQueued(): void {
    const running = this.jobs().filter(j => j.status === 'running').length;
    if (running >= 4) return;
    this.jobs.update(list => {
      const idx = list.findIndex(j => j.status === 'queued');
      if (idx === -1) return list;
      return list.map((j, i) => i === idx
        ? { ...j, status: 'running', progress: 0, startedAt: this.now(), duration: '00m 00s',
            logs: [...j.logs, { time: this.now(), level: 'info', message: 'Job started' }] }
        : j);
    });
  }

  private recycleFinished(): void {
    this.jobs.update(list => {
      const idx = list.findIndex(j =>
        j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');
      if (idx === -1) return list;
      return list.map((j, i) => i === idx
        ? { ...j, status: 'queued', progress: 0, startedAt: '—', duration: '—',
            logs: [...j.logs, { time: this.now(), level: 'info', message: 'Re-queued' }] }
        : j);
    });
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
