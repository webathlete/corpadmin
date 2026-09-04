import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';
import { AdminJobService, BATCH_JOBS } from '../../core/services/admin-job.service';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Batch job input: a CSV/TXT dropzone, or pasted records via the toggle. */
@Component({
  selector: 'app-batch-input',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatButtonToggleModule, MatIconModule,
  ],
  templateUrl: './batch-input.component.html',
  styleUrl: './batch-input.component.scss',
})
export class BatchInputComponent {
  private readonly service = inject(AdminJobService);
  private readonly notify = inject(NotificationService);

  readonly jobs = BATCH_JOBS;
  readonly jobId = signal<string>('');
  readonly mode = signal<'file' | 'text'>('file');
  readonly dragging = signal(false);
  readonly submitting = signal(false);

  readonly file = signal<{ name: string; size: number; lines: number } | null>(null);
  readonly text = signal('');

  readonly textLines = computed(() =>
    this.text().split('\n').filter(l => l.trim().length > 0).length);

  readonly canSubmit = computed(() =>
    !!this.jobId() && !this.submitting() &&
    (this.mode() === 'file' ? !!this.file() : this.textLines() > 0));

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const f = event.dataTransfer?.files?.[0];
    if (f) this.readFile(f);
  }

  onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.readFile(f);
    input.value = '';
  }

  private readFile(f: File): void {
    if (!/\.(csv|txt)$/i.test(f.name)) {
      this.notify.error('Only .csv or .txt files are accepted');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      this.notify.error('File exceeds the 5 MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result ?? '').split('\n').filter(l => l.trim()).length;
      this.file.set({ name: f.name, size: f.size, lines });
    };
    reader.readAsText(f);
  }

  clearFile(): void { this.file.set(null); }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    const mode = this.mode();
    const records = mode === 'file' ? this.file()!.lines : this.textLines();
    this.service.submitBatch({
      jobId: this.jobId(), mode,
      label: mode === 'file' ? this.file()!.name : 'Inline paste',
      records,
    });
    this.notify.success(`${records.toLocaleString()} record${records === 1 ? '' : 's'} submitted`);
    this.file.set(null);
    this.text.set('');
    this.submitting.set(false);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
