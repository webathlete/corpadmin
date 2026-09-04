import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { ADHOC_JOBS, AdminJobService } from '../../core/services/admin-job.service';

/**
 * Adhoc run: pick a job from the catalogue; its input form is GENERATED from
 * the job's `AdhocInputDef[]` descriptors — adding an adhoc job is a data
 * change in the service, never a template change here.
 */
@Component({
  selector: 'app-adhoc-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './adhoc-form.component.html',
  styleUrl: './admin-forms.scss',
})
export class AdhocFormComponent {
  private readonly service = inject(AdminJobService);
  private readonly notify = inject(NotificationService);

  readonly jobs = ADHOC_JOBS;
  readonly selectedId = signal<string>('');
  readonly submitting = signal(false);

  readonly selected = computed(() => this.jobs.find(j => j.id === this.selectedId()) ?? null);

  /** Rebuilt whenever the selected job changes. */
  form = new FormGroup<Record<string, FormControl<unknown>>>({});

  constructor() {
    effect(() => {
      const job = this.selected();
      const controls: Record<string, FormControl<unknown>> = {};
      for (const input of job?.inputs ?? []) {
        controls[input.key] = new FormControl<unknown>(
          input.type === 'date' ? null : '',
          input.required ? Validators.required : [],
        );
      }
      this.form = new FormGroup(controls);
    });
  }

  run(): void {
    const job = this.selected();
    if (!job) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.service.triggerAdhoc(job.id, this.form.getRawValue());
    this.notify.success(`"${job.name}" queued`);
    this.selectedId.set('');
    this.submitting.set(false);
  }
}
