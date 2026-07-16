import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Job, JobService } from '../../core/services/job.service';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
})
export class JobDetailComponent {
  readonly loading = simulatedLoading();
  private readonly router = inject(Router);
  readonly jobService = inject(JobService);

  // Bound from the route param via withComponentInputBinding().
  readonly id = input<string>('');

  readonly job = computed<Job | undefined>(() =>
    this.jobService.jobs().find(j => j.id === this.id()),
  );

  back(): void {
    this.router.navigate(['/jobs']);
  }

  cancel(job: Job): void {
    this.jobService.cancelJob(job.id);
  }

  retry(job: Job): void {
    this.jobService.retryJob(job.id);
  }

  canCancel(job: Job): boolean {
    return this.jobService.canCancel(job);
  }

  canRetry(job: Job): boolean {
    return this.jobService.canRetry(job);
  }

  statusColor(status: Job['status']): string {
    return this.jobService.statusColor(status);
  }

  statusIcon(status: Job['status']): string {
    return this.jobService.statusIcon(status);
  }

  logColor(level: string): string {
    switch (level) {
      case 'error': return '#c0392b';
      case 'warn':  return '#e67e22';
      default:      return 'var(--text-secondary)';
    }
  }
}
