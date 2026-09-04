import { Injectable, inject, signal } from '@angular/core';
import { AuthRoleService } from './auth-role.service';

export type AdminRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AdminOpKind = 'manual' | 'adhoc' | 'batch-file' | 'batch-text';

export interface ManualJobDef {
  id: string;
  name: string;
}

export type AdhocInputType = 'text' | 'number' | 'select' | 'date';

export interface AdhocInputDef {
  key: string;
  label: string;
  type: AdhocInputType;
  required: boolean;
  options?: string[];
  hint?: string;
}

export interface AdhocJobDef {
  id: string;
  name: string;
  description: string;
  inputs: AdhocInputDef[];
}

export interface ManualRunConfig {
  jobId: string;
  environment: string;
  region: string;
  runDate: Date;
  runName: string;
}

export interface BatchSubmission {
  jobId: string;
  mode: 'file' | 'text';
  /** File name, or a short label for pasted text. */
  label: string;
  /** Parsed record count (file rows or pasted lines). */
  records: number;
}

export interface AdminAuditEntry {
  id: string;
  kind: AdminOpKind;
  label: string;
  paramsSummary: string;
  triggeredBy: { name: string; initials: string };
  triggeredAt: Date;
  status: AdminRunStatus;
}

export const MANUAL_JOBS: ManualJobDef[] = [
  { id: 'warehouse-sync', name: 'Warehouse Sync' },
  { id: 'ledger-import', name: 'Finance Ledger Import' },
  { id: 'catalog-refresh', name: 'Product Catalog Refresh' },
  { id: 'customer-pipeline', name: 'Customer Data Pipeline' },
];
export const ENVIRONMENTS = ['Production', 'Staging', 'UAT'];
export const REGIONS = ['All regions', 'Americas', 'EMEA', 'APAC'];

export const ADHOC_JOBS: AdhocJobDef[] = [
  {
    id: 'reindex-search', name: 'Reindex customer search',
    description: 'Rebuilds the customer search index for a region.',
    inputs: [
      { key: 'scope', label: 'Scope', type: 'select', required: true, options: ['All customers', 'EU only', 'US only'] },
      { key: 'batchSize', label: 'Batch size', type: 'number', required: true, hint: '100–10,000' },
    ],
  },
  {
    id: 'purge-cache', name: 'Purge computed cache',
    description: 'Evicts cached aggregates older than a cutoff date.',
    inputs: [
      { key: 'namespace', label: 'Cache namespace', type: 'text', required: true, hint: 'e.g. pricing.v2' },
      { key: 'olderThan', label: 'Older than', type: 'date', required: true },
    ],
  },
  {
    id: 'regen-report', name: 'Regenerate report',
    description: 'Re-runs one report and replaces its stored output.',
    inputs: [
      { key: 'reportId', label: 'Report ID', type: 'text', required: true, hint: 'e.g. RPT-2041' },
      { key: 'format', label: 'Output format', type: 'select', required: true, options: ['PDF', 'CSV', 'XLSX'] },
      { key: 'notify', label: 'Notify (email, optional)', type: 'text', required: false },
    ],
  },
];

/** Batch jobs that accept a file or pasted records. */
export const BATCH_JOBS: ManualJobDef[] = [
  { id: 'payments-load', name: 'Payments batch load' },
  { id: 'customer-import', name: 'Customer bulk import' },
  { id: 'price-update', name: 'Price list update' },
];

let seq = 500;

@Injectable({ providedIn: 'root' })
export class AdminJobService {
  private readonly auth = inject(AuthRoleService);

  /** Newest first. */
  readonly audit = signal<AdminAuditEntry[]>(seedAudit());

  triggerManual(cfg: ManualRunConfig): void {
    const job = MANUAL_JOBS.find(j => j.id === cfg.jobId);
    this.enqueue({
      kind: 'manual',
      label: `Manual run · ${job?.name ?? cfg.jobId}`,
      paramsSummary: `${cfg.environment} · ${cfg.region} · ${cfg.runDate.toLocaleDateString()} · ${cfg.runName}`,
    });
  }

  triggerAdhoc(jobId: string, values: Record<string, unknown>): void {
    const job = ADHOC_JOBS.find(j => j.id === jobId);
    const summary = Object.entries(values)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v instanceof Date ? v.toLocaleDateString() : v}`)
      .join(' · ');
    this.enqueue({ kind: 'adhoc', label: `Adhoc · ${job?.name ?? jobId}`, paramsSummary: summary || '—' });
  }

  submitBatch(sub: BatchSubmission): void {
    const job = BATCH_JOBS.find(j => j.id === sub.jobId);
    this.enqueue({
      kind: sub.mode === 'file' ? 'batch-file' : 'batch-text',
      label: `${sub.mode === 'file' ? 'Batch upload' : 'Batch text'} · ${job?.name ?? sub.jobId}`,
      paramsSummary: `${sub.label} · ${sub.records.toLocaleString()} ${sub.mode === 'file' ? 'rows' : 'lines'}`,
    });
  }

  canCancel(e: AdminAuditEntry): boolean {
    return e.status === 'queued' || e.status === 'running';
  }

  canRemove(e: AdminAuditEntry): boolean {
    return !this.canCancel(e);
  }

  cancel(id: string): boolean {
    const entry = this.audit().find(e => e.id === id);
    if (!entry || !this.canCancel(entry)) return false;
    this.patch(id, e => ({ ...e, status: 'cancelled' }));
    return true;
  }

  /** Deletes a terminal entry from the audit records. */
  remove(id: string): boolean {
    const entry = this.audit().find(e => e.id === id);
    if (!entry || !this.canRemove(entry)) return false;
    this.audit.update(list => list.filter(e => e.id !== id));
    return true;
  }

  statusColor(status: AdminRunStatus): string {
    switch (status) {
      case 'queued':    return '#8e8e93';
      case 'running':   return '#1565c0';
      case 'completed': return '#27ae60';
      case 'failed':    return '#c0392b';
      case 'cancelled': return '#e67e22';
    }
  }

  statusIcon(status: AdminRunStatus): string {
    switch (status) {
      case 'queued':    return 'schedule';
      case 'running':   return 'autorenew';
      case 'completed': return 'check_circle';
      case 'failed':    return 'error';
      case 'cancelled': return 'cancel';
    }
  }

  statusLabel(status: AdminRunStatus): string {
    return status === 'queued' ? 'Queued' : status[0].toUpperCase() + status.slice(1);
  }

  kindIcon(kind: AdminOpKind): string {
    switch (kind) {
      case 'manual':     return 'play_circle';
      case 'adhoc':      return 'bolt';
      case 'batch-file': return 'upload_file';
      case 'batch-text': return 'notes';
    }
  }

  private enqueue(partial: Pick<AdminAuditEntry, 'kind' | 'label' | 'paramsSummary'>): void {
    const user = this.auth.currentUser();
    const entry: AdminAuditEntry = {
      ...partial,
      id: `adm-${seq++}`,
      triggeredBy: { name: user.name, initials: user.initials },
      triggeredAt: new Date(),
      status: 'queued',
    };
    this.audit.update(list => [entry, ...list]);

    // Simulated lifecycle: queued -> running -> completed (85%) / failed.
    setTimeout(() => this.patch(entry.id, e =>
      this.canCancel(e) ? { ...e, status: 'running' } : e), 900);
    setTimeout(() => this.patch(entry.id, e =>
      e.status === 'running' ? { ...e, status: Math.random() < 0.85 ? 'completed' : 'failed' } : e),
      2200 + Math.random() * 1800);
  }

  private patch(id: string, fn: (e: AdminAuditEntry) => AdminAuditEntry): void {
    this.audit.update(list => list.map(e => (e.id === id ? fn(e) : e)));
  }
}

function seedAudit(): AdminAuditEntry[] {
  const at = (h: number, m: number, daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d;
  };
  return [
    { id: 'adm-104', kind: 'manual', label: 'Manual run · Warehouse Sync', paramsSummary: 'Production · All regions · MonthEnd-01', triggeredBy: { name: 'Govind S.', initials: 'GS' }, triggeredAt: at(10, 42), status: 'running' },
    { id: 'adm-103', kind: 'adhoc', label: 'Adhoc · Reindex customer search', paramsSummary: 'scope: EU only · batchSize: 500', triggeredBy: { name: 'Priya Sharma', initials: 'PS' }, triggeredAt: at(9, 15), status: 'completed' },
    { id: 'adm-102', kind: 'batch-file', label: 'Batch upload · Payments batch load', paramsSummary: 'payments_0829.csv · 2,410 rows', triggeredBy: { name: 'James Rowe', initials: 'JR' }, triggeredAt: at(18, 3, 1), status: 'failed' },
    { id: 'adm-101', kind: 'batch-text', label: 'Batch text · Customer bulk import', paramsSummary: 'Inline paste · 312 lines', triggeredBy: { name: 'Maria Lopez', initials: 'ML' }, triggeredAt: at(16, 56, 1), status: 'completed' },
    { id: 'adm-100', kind: 'manual', label: 'Manual run · Finance Ledger Import', paramsSummary: 'Staging · EMEA · PreClose-3', triggeredBy: { name: 'Govind S.', initials: 'GS' }, triggeredAt: at(20, 20, 2), status: 'cancelled' },
  ];
}
