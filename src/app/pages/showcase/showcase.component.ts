import { Component, TemplateRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { FooterRichComponent } from '../../shared/footer-rich/footer-rich.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataColumn } from '../../shared/data-table/data-table.types';
import { MultiSelectComponent, MultiSelectOption } from '../../shared/multi-select/multi-select.component';
import { ParamTableComponent, ParamTableRow } from '../../shared/param-table/param-table.component';
import { NotificationBellComponent } from '../../shared/notification-bell/notification-bell.component';
import { AnalyticsApiService, Transaction } from '../../core/services/analytics-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';
import { DialogService } from '../../shared/dialog/dialog.service';
import { DialogSize } from '../../shared/dialog/dialog.types';
import { MessageDialogDemo, FormDialogDemo, TableDialogDemo } from './demo-dialogs';
import { JobPanelComponent } from '../../shared/job-panel/job-panel.component';
import { JobActionEvent, JobItem, JobPanelVariant } from '../../shared/job-panel/job-panel.types';
import { makeDemoJobs } from './demo-jobs';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatButtonToggleModule, MatRadioModule, MatButtonModule, MatIconModule,
    MatBadgeModule, MatTooltipModule, MatChipsModule, MatDialogModule,
    PageLayoutComponent, DataTableComponent, FooterRichComponent, MultiSelectComponent, ParamTableComponent,
    NotificationBellComponent, DialogComponent, DialogActionsDirective, JobPanelComponent,
  ],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent {
  private readonly api = inject(AnalyticsApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialogs = inject(DialogService);

  // ---- Data table (async) ----
  readonly rows = signal<Transaction[]>([]);
  readonly loading = signal<boolean>(true);

  readonly columns: DataColumn<Transaction>[] = [
    { key: 'id',       header: 'Txn ID',   sortable: true },
    { key: 'customer', header: 'Customer',  sortable: true },
    { key: 'channel',  header: 'Channel',   sortable: true },
    { key: 'region',   header: 'Region',    sortable: true, hidden: true },
    { key: 'amount',   header: 'Amount',    sortable: true, type: 'currency', align: 'right' },
    { key: 'status',   header: 'Status',    sortable: true, type: 'badge',
      badge: (r) => r.status === 'Completed' ? 'success'
                  : r.status === 'Pending'   ? 'warning'
                  : r.status === 'Failed'    ? 'error' : 'neutral' },
    { key: 'date',     header: 'Date',      sortable: true, type: 'date' },
  ];

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.rows.set([]);
    this.api.getTransactions().subscribe(data => {
      this.rows.set(data);
      this.loading.set(false);
    });
  }

  // ---- Tabs ----
  readonly tabBadges = { open: 8, closed: 24, flagged: 3 };

  readonly modernTabs = [
    { label: 'Overview', hint: 'Summary & KPIs' },
    { label: 'Records',  hint: 'All transactions' },
    { label: 'Trends',   hint: 'Growth over time' },
    { label: 'Settings', hint: 'Configure view' },
  ];

  // ---- Toggle groups ----
  readonly view = signal<'grid' | 'list' | 'board'>('grid');
  readonly period = signal<'day' | 'week' | 'month' | 'year'>('week');
  readonly formats = signal<string[]>(['bold']);
  readonly channel = signal<string>('all');

  readonly channels = ['all', 'Web', 'Mobile', 'Partner', 'In-store'];
  readonly people = [
    { name: 'Sarah Kim',    channel: 'Web' },
    { name: 'James Rowe',   channel: 'Mobile' },
    { name: 'Maria Lopez',  channel: 'Partner' },
    { name: 'Alex Torres',  channel: 'Web' },
    { name: 'Priya Sharma', channel: 'In-store' },
    { name: 'David Chen',   channel: 'Mobile' },
    { name: 'Emma Wilson',  channel: 'Partner' },
    { name: 'Tom Bradley',  channel: 'Web' },
  ];
  readonly filteredPeople = computed(() =>
    this.channel() === 'all' ? this.people : this.people.filter(p => p.channel === this.channel()),
  );

  // ngModel accessors bridging the signals.
  get viewValue() { return this.view(); }
  set viewValue(v: 'grid' | 'list' | 'board') { this.view.set(v); }
  get periodValue() { return this.period(); }
  set periodValue(v: 'day' | 'week' | 'month' | 'year') { this.period.set(v); }
  get formatsValue() { return this.formats(); }
  set formatsValue(v: string[]) { this.formats.set(v); }
  get channelValue() { return this.channel(); }
  set channelValue(v: string) { this.channel.set(v); }

  // ---- Radio groups ----
  readonly plan = signal('pro');
  readonly plans = [
    { value: 'starter',    name: 'Starter',    price: '$0',  desc: 'For individuals',  icon: 'person' },
    { value: 'pro',        name: 'Pro',        price: '$29', desc: 'For small teams',   icon: 'workspace_premium' },
    { value: 'enterprise', name: 'Enterprise', price: '$99', desc: 'For organisations', icon: 'corporate_fare' },
  ];

  readonly delivery = signal('standard');
  readonly deliveries = [
    { value: 'economy',  label: 'Economy',  sub: '5–7 days' },
    { value: 'standard', label: 'Standard', sub: '2–3 days' },
    { value: 'express',  label: 'Express',  sub: 'Next day' },
  ];

  readonly swatch = signal('#1565C0');
  readonly swatches = ['#1565C0', '#02A7DF', '#74BA58', '#FF6A1C', '#7B1FA2', '#E91E63'];

  readonly plainSize = signal('m');

  // ---- Multi-select checkboxes (one component, five `mode`s) ----
  readonly departments: MultiSelectOption[] = [
    { id: 'finance',     name: 'Finance',             initials: 'FI' },
    { id: 'operations',  name: 'Operations',          initials: 'OP' },
    { id: 'compliance',  name: 'Compliance',          initials: 'CO' },
    { id: 'cx',          name: 'Customer Experience', initials: 'CX' },
    { id: 'engineering', name: 'Engineering',         initials: 'EN' },
    { id: 'marketing',   name: 'Marketing',           initials: 'MA' },
    { id: 'sales',       name: 'Sales',               initials: 'SA' },
    { id: 'hr',          name: 'Human Resources',     initials: 'HR' },
    { id: 'legal',       name: 'Legal',               initials: 'LE' },
    { id: 'itsec',       name: 'IT Security',         initials: 'IT' },
    { id: 'product',     name: 'Product',             initials: 'PR' },
    { id: 'datasci',     name: 'Data Science',        initials: 'DS' },
  ];

  private readonly defaultDeptSelection = ['finance', 'operations', 'engineering'];
  readonly msListSelected = signal<string[]>([...this.defaultDeptSelection]);
  readonly msDropdownSelected = signal<string[]>([...this.defaultDeptSelection]);
  readonly msChipsSelected = signal<string[]>([...this.defaultDeptSelection]);
  readonly msTilesSelected = signal<string[]>([...this.defaultDeptSelection]);
  readonly msHorizontalSelected = signal<string[]>([...this.defaultDeptSelection]);

  // ---- Editable parameter table (30% / 45% / 15% / 10% responsive columns) ----
  readonly paramRows = signal<ParamTableRow[]>([
    { id: 'p1', name: 'Retry Thresholds', values: [3, 5, 8, 13], dataType: 'Integer' },
    { id: 'p2', name: 'Batch Size Tiers', values: [100, 250, 500, 1000, 2500], dataType: 'Integer' },
    { id: 'p3', name: 'Latency SLA (ms)', values: [50, 120, 250], dataType: 'Decimal' },
    { id: 'p4', name: 'Discount Bands', values: [5, 10, 15, 20], dataType: 'Percentage' },
  ]);

  onParamRowsChange(rows: ParamTableRow[]): void {
    this.paramRows.set(rows);
  }

  // ---- Async queued notifications (NotificationService) ----
  readonly notifyQueueLength = this.notify.queueLength;
  readonly simulating = this.notify.simulating;

  // notify() enqueues eagerly — the toast fires whether or not the returned
  // Observable is subscribed, so these fire-and-forget calls don't need to.
  fireSuccess(): void { this.notify.success('Report exported successfully'); }
  fireWarning(): void { this.notify.warning('Storage is at 85% capacity'); }
  fireError(): void { this.notify.error('Failed to sync with the server'); }
  fireInfo(): void { this.notify.info('New version available — refresh to update'); }

  toggleSimulation(): void {
    if (this.notify.simulating()) this.notify.stopSimulation();
    else this.notify.startSimulation();
  }

  /** Fires 5 notifications back-to-back with no gap between them — proves
   *  they queue and play one at a time instead of clobbering each other,
   *  which is what plain MatSnackBar.open() would do. */
  fireBurst(): void {
    const steps = [
      'Step 1 of 5: Validating input…',
      'Step 2 of 5: Uploading file…',
      'Step 3 of 5: Processing data…',
      'Step 4 of 5: Generating report…',
      'Step 5 of 5: Done!',
    ];
    steps.forEach(message => this.notify.info(message, { duration: 1600 }));
  }

  // ---- Generic dialog shell (<app-dialog> + DialogService) ----
  readonly dialogSize = signal<DialogSize>('lg');
  readonly dialogResult = signal<string>('');

  readonly dialogSizes: { value: DialogSize; label: string; width: string }[] = [
    { value: 'sm',   label: 'sm',   width: '400px' },
    { value: 'md',   label: 'md',   width: '560px' },
    { value: 'lg',   label: 'lg',   width: '760px' },
    { value: 'xl',   label: 'xl',   width: '1040px' },
    { value: 'full', label: 'full', width: '96vw' },
  ];

  get dialogSizeValue() { return this.dialogSize(); }
  set dialogSizeValue(v: DialogSize) { this.dialogSize.set(v); }

  private record(label: string, result: unknown): void {
    this.dialogResult.set(
      result === undefined ? `${label} — dismissed` : `${label} — ${JSON.stringify(result)}`,
    );
  }

  async openMessageDialog(): Promise<void> {
    const r = await this.dialogs.openAsync(MessageDialogDemo, { size: 'sm' });
    this.record('Message', r);
  }

  async openFormDialog(): Promise<void> {
    const r = await this.dialogs.openAsync(FormDialogDemo, { size: this.dialogSize() });
    this.record('Form', r);
  }

  async openTableDialog(): Promise<void> {
    const r = await this.dialogs.openAsync(TableDialogDemo, {
      size: 'xl',
      data: { title: 'Recent job runs' },
    });
    this.record('Table', r);
  }

  /** Opens an inline <ng-template> instead of a component. */
  async openTemplateDialog(tpl: TemplateRef<unknown>): Promise<void> {
    const r = await this.dialogs.openAsync(tpl, { size: 'md' });
    this.record('Template', r);
  }

  // ---- Job panel (master–detail list + actions in one dialog) ----
  readonly jobs = signal<JobItem[]>(makeDemoJobs());
  readonly jobVariant = signal<JobPanelVariant>('grid');
  readonly busyJobId = signal<string | null>(null);

  readonly jobVariants: { value: JobPanelVariant; label: string; hint: string }[] = [
    { value: 'grid',  label: 'Grid',  hint: 'Multi-column — 20 jobs with no scrolling' },
    { value: 'rows',  label: 'Rows',  hint: 'One per line with a status pill' },
    { value: 'table', label: 'Table', hint: 'mat-table, edge to edge' },
  ];

  get jobVariantValue() { return this.jobVariant(); }
  set jobVariantValue(v: JobPanelVariant) { this.jobVariant.set(v); }

  openJobPanel(variant: JobPanelVariant = this.jobVariant()): void {
    const ref = this.dialogs.open<JobPanelComponent>(JobPanelComponent, {
      size: variant === 'grid' ? 'lg' : 'md',
      data: { jobs: this.jobs(), title: 'Pipeline jobs', variant },
    });

    // Keep the open dialog in sync as actions mutate the list.
    // `jobs` and `busyJobId` are models, so the open dialog is updated by
    // writing to its signals.
    const sync = () => {
      ref.componentInstance.jobs.set(this.jobs());
      ref.componentInstance.busyJobId.set(this.busyJobId());
    };
    ref.componentInstance.action.subscribe((e: JobActionEvent) => this.runJobAction(e, sync));
  }

  /** Applies an action optimistically, then settles the job after a beat so
   *  the busy state and the resulting status are both visible. */
  private runJobAction(event: JobActionEvent, sync: () => void): void {
    const { job, action } = event;

    if (action === 'cleanup') {
      this.jobs.update(list => list.filter(j => j.id !== job.id));
      sync();
      this.notify.success(`${job.name} cleaned up`);
      return;
    }

    this.busyJobId.set(job.id);
    this.patchJob(job.id, j => ({
      ...j, status: 'running', startedAt: new Date(), endedAt: null,
      messages: [...(j.messages ?? []), `[now] ${action === 'start' ? 'Started' : 'Re-run triggered'} by user`],
    }));
    sync();

    setTimeout(() => {
      this.busyJobId.set(null);
      this.patchJob(job.id, j => ({
        ...j, status: 'completed', endedAt: new Date(),
        messages: [...(j.messages ?? []), '[now] Job completed successfully'],
      }));
      sync();
      this.notify.success(`${job.name} finished`);
    }, 1800);
  }

  private patchJob(id: string, fn: (j: JobItem) => JobItem): void {
    this.jobs.update(list => list.map(j => (j.id === id ? fn(j) : j)));
  }

  resetJobs(): void {
    this.jobs.set(makeDemoJobs());
    this.busyJobId.set(null);
  }
}
