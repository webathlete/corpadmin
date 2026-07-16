import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface KpiCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  gradient: number;
  sparkData: number[];
}

interface Deal {
  id: string;
  client: string;
  amount: number;
  stage: string;
  status: 'active' | 'won' | 'lost' | 'pending';
  rep: string;
  avatar: string;
  probability: number;
}

interface Activity {
  id: number;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly loading = simulatedLoading();
  private snackBar = inject(MatSnackBar);
  readonly selectedPeriod = signal<'week' | 'month'>('week');

  readonly kpiCards: KpiCard[] = [
    { title: 'Total Revenue', value: '$2.48M', change: '+12.5%', trend: 'up', icon: 'attach_money', gradient: 1, sparkData: [40,55,45,60,75,65,80,72,88,95] },
    { title: 'Active Deals', value: '348', change: '+8.2%', trend: 'up', icon: 'handshake', gradient: 2, sparkData: [30,38,32,45,55,50,60,58,65,70] },
    { title: 'Conversion Rate', value: '24.7%', change: '-1.8%', trend: 'down', icon: 'percent', gradient: 3, sparkData: [28,25,30,26,29,27,25,28,24,25] },
    { title: 'New Clients', value: '127', change: '+22.4%', trend: 'up', icon: 'person_add', gradient: 4, sparkData: [10,15,12,18,22,20,25,28,24,30] },
  ];

  readonly pipeline = [
    { name: 'Qualification', count: 84, value: '$840K', percent: 85, color: 'primary' },
    { name: 'Proposal Sent', count: 52, value: '$1.2M', percent: 65, color: 'accent' },
    { name: 'Negotiation',   count: 28, value: '$680K', percent: 42, color: 'warn' },
    { name: 'Closed Won',    count: 41, value: '$2.1M', percent: 55, color: 'primary' },
  ];

  readonly activities: Activity[] = [
    { id: 1, user: 'Sarah K.', avatar: 'SK', action: 'closed deal with', target: 'Acme Corp — $120K', time: '5 min ago', icon: 'celebration', color: '#22c55e' },
    { id: 2, user: 'James R.', avatar: 'JR', action: 'sent proposal to', target: 'TechGiant Inc.', time: '32 min ago', icon: 'send', color: '#3b82f6' },
    { id: 3, user: 'Maria L.', avatar: 'ML', action: 'added comment on', target: 'Q3 Pipeline Review', time: '1h ago', icon: 'comment', color: '#f59e0b' },
    { id: 4, user: 'Dev Team', avatar: 'DT', action: 'deployed update to', target: 'CRM v3.2.1', time: '2h ago', icon: 'rocket_launch', color: '#8b5cf6' },
    { id: 5, user: 'Alex T.', avatar: 'AT', action: 'flagged issue with', target: 'Invoice #4892', time: '3h ago', icon: 'flag', color: '#ef4444' },
  ];

  readonly performanceMetrics = [
    { label: 'Revenue vs Target', value: '$2.48M / $2.8M', percent: 89, sub: '89% of monthly target reached' },
    { label: 'Deals Closed',      value: '41 / 60',        percent: 68, sub: '68% of monthly goal' },
    { label: 'Customer Sat.',     value: '4.6 / 5.0',      percent: 92, sub: '92% satisfaction rate' },
    { label: 'Team Utilisation',  value: '78%',             percent: 78, sub: '12 of 15 reps active today' },
  ];

  readonly deals: Deal[] = [
    { id: '1', client: 'Acme Corporation',    amount: 120000, stage: 'Closed Won',  status: 'won',     rep: 'Sarah K.', avatar: 'AC', probability: 100 },
    { id: '2', client: 'TechGiant Inc.',       amount: 85000,  stage: 'Negotiation', status: 'active',  rep: 'James R.', avatar: 'TG', probability: 72 },
    { id: '3', client: 'GreenPath Logistics',  amount: 47000,  stage: 'Proposal',    status: 'pending', rep: 'Maria L.', avatar: 'GP', probability: 55 },
    { id: '4', client: 'Northstar Finance',    amount: 230000, stage: 'Closed Won',  status: 'won',     rep: 'Alex T.',  avatar: 'NF', probability: 100 },
    { id: '5', client: 'Bluewave Media',       amount: 18000,  stage: 'Lost',        status: 'lost',    rep: 'John D.',  avatar: 'BM', probability: 0 },
    { id: '6', client: 'Prism Analytics',      amount: 67000,  stage: 'Qualification', status: 'active', rep: 'Sarah K.', avatar: 'PA', probability: 35 },
    { id: '7', client: 'ClearSky Systems',     amount: 155000, stage: 'Negotiation', status: 'active',  rep: 'Mike S.',  avatar: 'CS', probability: 80 },
  ];

  readonly displayedColumns = ['client', 'amount', 'stage', 'status', 'probability', 'rep', 'actions'];

  getSparkPoints(data: number[]): string {
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const w = 80;
    const h = 36;
    const step = w / (data.length - 1);

    return data.map((v, i) => {
      const x = i * step;
      const y = h - ((v - minVal) / range) * (h - 6) - 3;
      return `${x},${y}`;
    }).join(' ');
  }

  export(): void {
    this.snackBar.open('Report exported successfully!', 'Dismiss', { duration: 3000 });
  }

  addWidget(): void {
    this.snackBar.open('New report wizard coming soon!', 'OK', { duration: 3000 });
  }
}
