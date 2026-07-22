import { Injectable, signal } from '@angular/core';

export type ParamGroupType = 'System' | 'Validation' | 'Integration' | 'Workflow';

export const PARAM_GROUP_TYPES: { type: ParamGroupType; label: string }[] = [
  { type: 'System',      label: 'System Parameters' },
  { type: 'Validation',  label: 'Validation Parameters' },
  { type: 'Integration', label: 'Integration Parameters' },
  { type: 'Workflow',    label: 'Workflow Parameters' },
];

/** A lookup option — every Category / Parameter Type / Condition select is
 *  backed by an {id, name} pair, not a bare string, so the picker can search
 *  and display both. */
export interface LookupItem {
  id: string;
  name: string;
}

function lookup(prefix: string, names: string[]): LookupItem[] {
  return names.map((name, i) => ({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, name }));
}

export const CATEGORIES: LookupItem[] = lookup('CAT', ['General', 'Finance', 'Operations', 'Compliance', 'Customer Experience']);
export const PARAMETER_TYPES: LookupItem[] = lookup('PTY', ['String', 'Number', 'Boolean', 'Date', 'List']);
export const CONDITIONS: LookupItem[] = lookup('CND', ['Equals', 'Not Equals', 'Greater Than', 'Less Than', 'Contains', 'Between']);

/** Looks up a display name by id from any of the lookup lists above. */
export function lookupName(list: LookupItem[], id: string | null | undefined): string {
  return list.find(i => i.id === id)?.name ?? '—';
}

export interface ParameterEntry {
  id: string;
  name: string;
  description: string;
  type: ParamGroupType;
  categoryId: string;
  parameterTypeId: string;
  condition1Id: string;
  condition2Id: string;
  condition3Id: string;
  active: boolean;
  createdOn: Date;
  updatedOn: Date;
}

/** Fields the create/edit form collects — id/type/timestamps are assigned by the service. */
export type ParameterEntryDraft = Omit<ParameterEntry, 'id' | 'createdOn' | 'updatedOn'>;

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Extra synthetic rows generated per type, on top of the hand-written ones
 *  below — purely so list-heavy UI (table pagination, the inline panel's
 *  "Show more") has 1,000+ records to demonstrate against, matching a
 *  realistic "growing" dataset instead of a handful of demo rows. */
const EXTRA_PER_TYPE = 250;

const SEED_NAMES: Record<ParamGroupType, [string, string][]> = {
  System: [
    ['Max Session Timeout', 'Maximum idle time before a user session is force-expired.'],
    ['API Rate Limit Threshold', 'Caps the number of API calls allowed per client per minute.'],
    ['Cache Expiry Policy', 'Controls how long cached responses stay valid before refresh.'],
    ['Background Job Concurrency', 'Maximum number of background jobs allowed to run in parallel.'],
    ['Audit Log Retention', 'How long audit trail entries are kept before archival.'],
    ['Default Locale Setting', 'Fallback locale applied when a user has none configured.'],
  ],
  Validation: [
    ['Email Format Validation', 'Enforces a strict email pattern on registration and profile forms.'],
    ['Mandatory Field Enforcement', 'Blocks submission when a designated required field is empty.'],
    ['Duplicate Record Check', 'Flags records that match an existing entry on key fields.'],
    ['Age Eligibility Check', 'Confirms the submitter meets the minimum age requirement.'],
    ['Currency Precision Rule', 'Restricts monetary fields to a fixed number of decimal places.'],
    ['Address Verification Rule', 'Validates postal addresses against a reference database.'],
  ],
  Integration: [
    ['Payment Gateway Failover', 'Switches to a backup payment provider after repeated failures.'],
    ['CRM Sync Interval', 'How often customer records are synchronized with the CRM.'],
    ['Webhook Retry Policy', 'Defines retry attempts and backoff for failed webhook deliveries.'],
    ['Third-Party API Timeout', 'Maximum wait time before an outbound API call is aborted.'],
    ['Data Export Batch Size', 'Number of records processed per batch during scheduled exports.'],
    ['SFTP Connection Pool', 'Maximum concurrent SFTP connections held open to partners.'],
  ],
  Workflow: [
    ['Approval Escalation Rule', 'Escalates a pending approval to the next tier after a delay.'],
    ['Auto-Assignment Policy', 'Assigns incoming tasks automatically based on workload.'],
    ['SLA Breach Notification', 'Notifies stakeholders when a task exceeds its SLA window.'],
    ['Task Reminder Frequency', 'How often reminders are sent for an outstanding task.'],
    ['Multi-Level Sign-off Rule', 'Requires sequential approval from more than one role.'],
    ['Rejection Routing Rule', 'Determines where a rejected item is routed for rework.'],
  ],
};

function seedEntries(): ParameterEntry[] {
  const list: ParameterEntry[] = [];
  let seq = 1;
  for (const { type } of PARAM_GROUP_TYPES) {
    SEED_NAMES[type].forEach(([name, description], i) => {
      list.push({
        id: `param-${String(seq).padStart(4, '0')}`,
        name,
        description,
        type,
        categoryId: pick(CATEGORIES, seq + i).id,
        parameterTypeId: pick(PARAMETER_TYPES, seq + i * 2).id,
        condition1Id: pick(CONDITIONS, seq).id,
        condition2Id: pick(CONDITIONS, seq + 1).id,
        condition3Id: pick(CONDITIONS, seq + 2).id,
        active: i === 1, // one active entry per type, to start from a valid state
        createdOn: daysAgo(120 - seq * 2),
        updatedOn: daysAgo(30 - i * 3),
      });
      seq++;
    });

    // Bulk synthetic rows — cycles through the same base names/descriptions
    // with a variant suffix, spread across ~2 years so "latest updated"
    // sorting has real spread to show.
    for (let i = 0; i < EXTRA_PER_TYPE; i++) {
      const [baseName, description] = SEED_NAMES[type][i % SEED_NAMES[type].length];
      const age = randInt(1, 720);
      list.push({
        id: `param-${String(seq).padStart(4, '0')}`,
        name: `${baseName} (Variant ${i + 1})`,
        description,
        type,
        categoryId: pick(CATEGORIES, seq + i).id,
        parameterTypeId: pick(PARAMETER_TYPES, seq + i * 2).id,
        condition1Id: pick(CONDITIONS, seq).id,
        condition2Id: pick(CONDITIONS, seq + 1).id,
        condition3Id: pick(CONDITIONS, seq + 2).id,
        active: false, // only one active entry per type is allowed — already seeded above
        createdOn: daysAgo(age + randInt(0, 30)),
        updatedOn: daysAgo(age),
      });
      seq++;
    }
  }
  return list;
}

@Injectable({ providedIn: 'root' })
export class ParameterConfigService {
  readonly entries = signal<ParameterEntry[]>(seedEntries());
  private seq = this.entries().length + 1;

  getById(id: string): ParameterEntry | undefined {
    return this.entries().find(e => e.id === id);
  }

  /** The entry currently active for a type, if any (excluding `excludeId`). */
  activeSibling(type: ParamGroupType, excludeId?: string): ParameterEntry | undefined {
    return this.entries().find(e => e.type === type && e.active && e.id !== excludeId);
  }

  create(draft: ParameterEntryDraft): ParameterEntry {
    const id = `param-${String(this.seq++).padStart(4, '0')}`;
    const now = new Date();
    const entry: ParameterEntry = { ...draft, id, createdOn: now, updatedOn: now };
    if (entry.active) this.deactivateOthers(entry.type, id);
    this.entries.update(list => [entry, ...list]);
    return entry;
  }

  update(id: string, draft: ParameterEntryDraft): void {
    if (draft.active) this.deactivateOthers(draft.type, id);
    this.entries.update(list => list.map(e =>
      e.id === id ? { ...e, ...draft, updatedOn: new Date() } : e));
  }

  delete(id: string): void {
    this.entries.update(list => list.filter(e => e.id !== id));
  }

  private deactivateOthers(type: ParamGroupType, exceptId: string): void {
    this.entries.update(list => list.map(e =>
      (e.type === type && e.id !== exceptId && e.active) ? { ...e, active: false } : e));
  }
}
