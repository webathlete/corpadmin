import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';
import {
  AdminJobService, ENVIRONMENTS, MANUAL_JOBS, REGIONS,
} from '../../core/services/admin-job.service';

/** Manual run: pick a configured job, environment/region, run date and name. */
@Component({
  selector: 'app-manual-run-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './manual-run-form.component.html',
  styleUrl: './admin-forms.scss',
})
export class ManualRunFormComponent {
  private readonly service = inject(AdminJobService);
  private readonly notify = inject(NotificationService);

  readonly jobs = MANUAL_JOBS;
  readonly environments = ENVIRONMENTS;
  readonly regions = REGIONS;

  /** Double-submit guard while the trigger round-trips. */
  readonly submitting = signal(false);

  readonly form = new FormGroup({
    jobId: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    environment: new FormControl<string>(ENVIRONMENTS[0], { nonNullable: true, validators: Validators.required }),
    region: new FormControl<string>(REGIONS[0], { nonNullable: true, validators: Validators.required }),
    runDate: new FormControl<Date | null>(new Date(), Validators.required),
    runName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-_]+$/)],
    }),
  });

  run(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.service.triggerManual({
      jobId: v.jobId, environment: v.environment, region: v.region,
      runDate: v.runDate!, runName: v.runName,
    });
    this.notify.success(`Run "${v.runName}" queued`);
    this.form.reset({ environment: ENVIRONMENTS[0], region: REGIONS[0], runDate: new Date() });
    this.submitting.set(false);
  }
}
