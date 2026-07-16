import { AfterViewInit, Component, OnDestroy, computed, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { simulatedLoading } from '../../core/loading.util';
import { PageLayoutComponent } from '../../shared/page-layout/page-layout.component';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Job, JobService } from '../../core/services/job.service';

@Component({
  selector: 'app-job-manager',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './job-manager.component.html',
  styleUrl: './job-manager.component.scss',
})
export class JobManagerComponent implements AfterViewInit, OnDestroy {
  readonly loading = simulatedLoading();
  private syncTimer?: ReturnType<typeof setInterval>;
  private readonly router = inject(Router);
  readonly jobService = inject(JobService);

  readonly displayedColumns = ['name', 'type', 'status', 'progress', 'startedAt', 'duration', 'actions'];

  readonly jobs = this.jobService.jobs;

  // Material data table with sorting + pagination, kept in sync with the
  // live job signal.
  readonly dataSource = new MatTableDataSource<Job>([]);
  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort() ?? null;
    this.dataSource.paginator = this.paginator() ?? null;
    // Initial populate + keep the table synced with the live job signal every
    // second (imperative sync — reliably reflects status/progress changes).
    this.dataSource.data = this.jobs();
    this.syncTimer = setInterval(() => { this.dataSource.data = this.jobs(); }, 1000);
  }

  ngOnDestroy(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  readonly runningCount = computed(() => this.jobs().filter(j => j.status === 'running').length);
  readonly queuedCount = computed(() => this.jobs().filter(j => j.status === 'queued').length);
  readonly completedCount = computed(() => this.jobs().filter(j => j.status === 'completed').length);
  readonly failedCount = computed(() => this.jobs().filter(j => j.status === 'failed' || j.status === 'cancelled').length);

  startJob(): void {
    const job = this.jobService.startJob();
    this.router.navigate(['/jobs', job.id]);
  }

  cancelJob(job: Job, event: MouseEvent): void {
    event.stopPropagation();
    this.jobService.cancelJob(job.id);
  }

  retryJob(job: Job, event: MouseEvent): void {
    event.stopPropagation();
    this.jobService.retryJob(job.id);
  }

  openJob(job: Job): void {
    this.router.navigate(['/jobs', job.id]);
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
}
