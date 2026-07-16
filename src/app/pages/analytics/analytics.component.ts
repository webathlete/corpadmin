import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, FormsModule,
    MatCardModule, MatTabsModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatGridListModule, MatDividerModule,
    SkeletonComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  selectedPeriod = '30d';

  /** Drives the ghost skeletons; flipped off after a simulated fetch. */
  readonly loading = signal(true);

  /** Bound to the Material button-toggle group. */
  chartView: 'bar' | 'line' = 'bar';

  constructor() {
    this.simulateLoad();
  }

  reload(): void {
    this.simulateLoad();
  }

  private simulateLoad(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1400);
  }

  /** Polyline points for the line-chart view of monthly revenue. */
  get linePoints(): string {
    return this.monthlyRevenue
      .map((b, i) => `${54 + i * 30},${160 - b.height}`)
      .join(' ');
  }

  readonly summaryChips = [
    { label: 'Revenue Up 12.5%', icon: 'trending_up', color: '#15803d', bg: 'rgba(34,197,94,0.1)' },
    { label: '41 Deals Closed', icon: 'handshake', color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Avg Deal: $58K', icon: 'attach_money', color: '#92400e', bg: 'rgba(245,158,11,0.1)' },
    { label: 'NPS Score: 72', icon: 'sentiment_satisfied', color: '#5b21b6', bg: 'rgba(139,92,246,0.1)' },
  ];

  readonly yLabels = [
    { y: 20, v: '$250K' }, { y: 60, v: '$180K' }, { y: 100, v: '$120K' }, { y: 140, v: '$60K' },
  ];

  readonly monthlyRevenue = [
    { month: 'Jan', height: 90 }, { month: 'Feb', height: 110 }, { month: 'Mar', height: 85 },
    { month: 'Apr', height: 130 }, { month: 'May', height: 105 }, { month: 'Jun', height: 145 },
    { month: 'Jul', height: 120 }, { month: 'Aug', height: 155 }, { month: 'Sep', height: 135 },
    { month: 'Oct', height: 160 }, { month: 'Nov', height: 140 }, { month: 'Dec', height: 0 },
  ];

  readonly revenueByRegion = [
    { region: 'North America', revenue: '$1.2M', deals: 124, percent: 84 },
    { region: 'Europe',        revenue: '$680K', deals: 87,  percent: 62 },
    { region: 'Asia Pacific',  revenue: '$420K', deals: 55,  percent: 45 },
    { region: 'Middle East',   revenue: '$180K', deals: 24,  percent: 28 },
  ];

  readonly topProducts = [
    { product: 'Enterprise Suite',   icon: 'business',      revenue: '$820K', units: 42,  growth: '+18%', trend: 1, share: 72 },
    { product: 'Analytics Pro',      icon: 'bar_chart',     revenue: '$540K', units: 158, growth: '+31%', trend: 1, share: 58 },
    { product: 'Consulting Hours',   icon: 'support_agent', revenue: '$310K', units: 820, growth: '+5%',  trend: 1, share: 34 },
    { product: 'Security Module',    icon: 'security',      revenue: '$220K', units: 95,  growth: '-3%',  trend: -1, share: 28 },
    { product: 'Mobile SDK',         icon: 'phone_android', revenue: '$90K',  units: 340, growth: '+44%', trend: 1, share: 15 },
  ];

  readonly productColumns = ['product', 'revenue', 'units', 'growth', 'share'];
  readonly productFilterColumns = ['product-f', 'revenue-f', 'units-f', 'growth-f', 'share-f'];

  // Per-column filter text for the Top Products table
  productFilters: Record<string, string> = { product: '', revenue: '', units: '', growth: '' };

  get filteredProducts() {
    const f = this.productFilters;
    const match = (val: unknown, q: string) =>
      String(val ?? '').toLowerCase().includes(q.trim().toLowerCase());
    return this.topProducts.filter(p =>
      match(p.product, f['product']) &&
      match(p.revenue, f['revenue']) &&
      match(p.units, f['units']) &&
      match(p.growth, f['growth'])
    );
  }

  clearProductFilters(): void {
    this.productFilters = { product: '', revenue: '', units: '', growth: '' };
  }

  get hasProductFilters(): boolean {
    return Object.values(this.productFilters).some(v => v.trim() !== '');
  }

  readonly teamPerf = [
    { name: 'Sarah K.',  initials: 'SK', role: 'Senior AE', status: 'Exceeded', score: '9.4',
      kpis: [{ label: 'Revenue', value: '$340K', percent: 95 }, { label: 'Deals', value: '12', percent: 80 }, { label: 'Activity', value: '88%', percent: 88 }] },
    { name: 'James R.',  initials: 'JR', role: 'Account Exec', status: 'On Track', score: '7.8',
      kpis: [{ label: 'Revenue', value: '$210K', percent: 70 }, { label: 'Deals', value: '8', percent: 67 }, { label: 'Activity', value: '75%', percent: 75 }] },
    { name: 'Maria L.',  initials: 'ML', role: 'SDR', status: 'At Risk', score: '6.1',
      kpis: [{ label: 'Calls',    value: '240',  percent: 48 }, { label: 'Meetings', value: '18', percent: 45 }, { label: 'Pipeline', value: '$180K', percent: 52 }] },
    { name: 'Alex T.',   initials: 'AT', role: 'Account Exec', status: 'On Track', score: '8.2',
      kpis: [{ label: 'Revenue', value: '$265K', percent: 78 }, { label: 'Deals', value: '9', percent: 75 }, { label: 'Activity', value: '82%', percent: 82 }] },
  ];

  readonly funnel = [
    { name: 'Website Visitors',  count: 124000, rate: '100%', width: 100 },
    { name: 'Leads Generated',   count: 8200,   rate: '6.6%', width: 66 },
    { name: 'Qualified Leads',   count: 2400,   rate: '1.9%', width: 48 },
    { name: 'Demo / Meeting',    count: 980,    rate: '0.8%', width: 34 },
    { name: 'Proposal Sent',     count: 420,    rate: '0.3%', width: 22 },
    { name: 'Closed Won',        count: 104,    rate: '0.08%', width: 12 },
  ];
}
