import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

interface Project {
  id: number;
  name: string;
  client: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  due: string;
  tags: string[];
  members: string[];
  comments: number;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatMenuModule, MatTooltipModule,
    MatBadgeModule, MatDividerModule, MatExpansionModule, MatListModule,
    MatFormFieldModule, MatSelectModule,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  readonly loading = simulatedLoading();
  view: 'board' | 'list' = 'board';
  statusFilter = 'all';

  readonly statuses = ['all', 'On Track', 'At Risk', 'Delayed', 'Done'];

  readonly projects = signal<Project[]>([
    { id: 1, name: 'Website Redesign', client: 'Acme Corp', status: 'On Track', priority: 'High',
      progress: 72, due: 'Jul 28', tags: ['UX', 'Frontend'], members: ['SK', 'JR', 'AT'], comments: 12 },
    { id: 2, name: 'Mobile App v2', client: 'Globex', status: 'At Risk', priority: 'High',
      progress: 45, due: 'Aug 10', tags: ['iOS', 'Android'], members: ['ML', 'AT'], comments: 8 },
    { id: 3, name: 'Data Migration', client: 'Initech', status: 'Delayed', priority: 'Medium',
      progress: 30, due: 'Jul 15', tags: ['Backend', 'DevOps'], members: ['JR'], comments: 21 },
    { id: 4, name: 'Brand Guidelines', client: 'Umbrella', status: 'Done', priority: 'Low',
      progress: 100, due: 'Jun 30', tags: ['Design'], members: ['SK', 'ML'], comments: 4 },
    { id: 5, name: 'API Platform', client: 'Hooli', status: 'On Track', priority: 'High',
      progress: 58, due: 'Sep 02', tags: ['Backend', 'API'], members: ['AT', 'JR', 'ML', 'SK'], comments: 15 },
    { id: 6, name: 'Marketing Site', client: 'Stark Inc', status: 'On Track', priority: 'Medium',
      progress: 88, due: 'Jul 20', tags: ['Frontend', 'SEO'], members: ['ML'], comments: 6 },
  ]);

  readonly activity = [
    { icon: 'check_circle', color: 'var(--status-success)', text: 'Sarah completed “Hero section”', time: '10m ago' },
    { icon: 'comment',      color: 'var(--app-primary)',    text: 'James commented on Data Migration', time: '1h ago' },
    { icon: 'upload_file',  color: 'var(--status-info)',    text: 'Maria uploaded brand-assets.zip', time: '3h ago' },
    { icon: 'flag',         color: 'var(--status-warning)', text: 'Mobile App v2 flagged At Risk', time: 'Yesterday' },
  ];

  readonly milestones = [
    { name: 'Discovery & Research', done: true },
    { name: 'Wireframes Approved', done: true },
    { name: 'Visual Design', done: true },
    { name: 'Development Sprint 1', done: false },
    { name: 'QA & Launch', done: false },
  ];

  get filtered(): Project[] {
    const f = this.statusFilter;
    return this.projects().filter(p => f === 'all' || p.status === f);
  }

  statusClass(status: Project['status']): string {
    switch (status) {
      case 'On Track': return 'success';
      case 'At Risk':  return 'warning';
      case 'Delayed':  return 'error';
      case 'Done':     return 'info';
    }
  }
}
