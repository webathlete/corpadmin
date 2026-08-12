import { Component, computed, inject, signal } from '@angular/core';
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
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { FooterRichComponent } from '../../shared/footer-rich/footer-rich.component';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataColumn } from '../../shared/data-table/data-table.types';
import { MultiSelectComponent, MultiSelectOption } from '../../shared/multi-select/multi-select.component';
import { AnalyticsApiService, Transaction } from '../../core/services/analytics-api.service';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatButtonToggleModule, MatRadioModule, MatButtonModule, MatIconModule,
    MatBadgeModule, MatTooltipModule, MatChipsModule,
    PageLayoutComponent, DataTableComponent, FooterRichComponent, MultiSelectComponent,
  ],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent {
  private readonly api = inject(AnalyticsApiService);

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
}
