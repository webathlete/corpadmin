import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';

interface JobRow {
  id: string;
  title: string;
  date: string;
  runtime: string;
  state: 'active' | 'completed';
}

interface HistoryRow {
  id: string;
  title: string;
  owner: string;
  date: string;
  runtime: string;
  status: 'Completed' | 'Failed' | 'Running' | 'Cancelled';
}

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatTabsModule, MatTableModule, MatPaginatorModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    PageLayoutComponent,
  ],
  templateUrl: './operations.component.html',
  styleUrl: './operations.component.scss',
})
export class OperationsComponent {
  // ---- Card 1: status + statistics ----
  readonly system = {
    ok: true,
    label: 'All systems operational',
    uptime: '99.98%',
    checked: 'just now',
  };
  readonly stats = [
    { label: 'Total Jobs',     value: '1,284',  icon: 'work_history', tone: '',        delta: '+3.2%', trend: 'up',   good: true },
    { label: 'Success Rate',   value: '96.4%',  icon: 'check_circle', tone: 'success', delta: '+0.8%', trend: 'up',   good: true },
    { label: 'Avg Runtime',    value: '3m 12s', icon: 'timer',        tone: '',        delta: '−6s',   trend: 'down', good: true },
    { label: 'Failures (24h)', value: '4',      icon: 'error',        tone: 'error',   delta: '+1',    trend: 'up',   good: false },
  ];

  // ---- Card 2: title + 2 tabs + scrollable table (15 records) ----
  readonly jobTab = signal(0);
  readonly miniColumns = ['id', 'title', 'date'];
  private readonly allJobs: JobRow[] = Array.from({ length: 15 }, (_, i) => {
    const active = i % 2 === 0;
    return {
      id: `JOB-${4120 + i}`,
      title: ['Nightly ETL Sync', 'Invoice Render', 'Analytics Rollup', 'Email Dispatch',
              'DB Backup', 'Thumbnail Resize', 'Session Cleanup', 'Index Rebuild'][i % 8],
      date: `Jul ${(i % 28) + 1}, 09:${(i * 7 % 60).toString().padStart(2, '0')}`,
      runtime: `${(i % 12) + 1}m ${((i * 13) % 60).toString().padStart(2, '0')}s`,
      state: active ? 'active' : 'completed',
    };
  });
  readonly shownJobs = computed(() =>
    this.allJobs.filter(j => (this.jobTab() === 0 ? j.state === 'active' : j.state === 'completed')),
  );

  // Pagination — 5 rows per page.
  readonly pageSize = 5;
  readonly pageIndex = signal(0);
  readonly renderedJobs = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.shownJobs().slice(start, start + this.pageSize);
  });

  onTab(index: number): void { this.jobTab.set(index); this.pageIndex.set(0); }
  onPage(e: PageEvent): void { this.pageIndex.set(e.pageIndex); }

  // ---- Card 3: clickable status chips ----
  readonly chips = [
    { key: 'running',   label: 'Running',   count: 8,  color: '#1565c0' },
    { key: 'queued',    label: 'Queued',    count: 5,  color: '#8e8e93' },
    { key: 'completed', label: 'Completed', count: 42, color: '#27ae60' },
    { key: 'failed',    label: 'Failed',    count: 3,  color: '#c0392b' },
    { key: 'cancelled', label: 'Cancelled', count: 2,  color: '#e67e22' },
    { key: 'paused',    label: 'Paused',    count: 1,  color: '#7b1fa2' },
  ];
  readonly selectedChip = signal('running');
  readonly selectedChipLabel = computed(() =>
    this.chips.find(c => c.key === this.selectedChip())?.label ?? '',
  );
  readonly totalQueue = this.chips.reduce((s, c) => s + c.count, 0);
  readonly maxCount = Math.max(...this.chips.map(c => c.count));

  // ---- Below: full-width history table ----
  readonly historyColumns = ['id', 'title', 'owner', 'date', 'runtime', 'status'];
  readonly history: HistoryRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: `JOB-${4020 + i}`,
    title: ['Nightly ETL Sync', 'Invoice Render', 'Analytics Rollup', 'Email Dispatch', 'DB Backup'][i % 5],
    owner: ['data-pipeline', 'billing', 'analytics', 'marketing', 'infra'][i % 5],
    date: `Jul ${(i % 28) + 1}, 2026`,
    runtime: `${(i % 20) + 2}m ${((i * 11) % 60).toString().padStart(2, '0')}s`,
    status: (['Completed', 'Failed', 'Running', 'Cancelled', 'Completed'] as const)[i % 5],
  }));

  statusClass(s: string): string {
    switch (s) {
      case 'Completed': return 'success';
      case 'Failed':    return 'error';
      case 'Running':   return 'info';
      case 'Cancelled': return 'warning';
      default:          return 'neutral';
    }
  }
}
