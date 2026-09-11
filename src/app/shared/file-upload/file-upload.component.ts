import {
  Component, OnDestroy, booleanAttribute, computed, effect, inject, input, model,
  numberAttribute, output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileRejection, UploadFile } from './file-upload.types';

let seq = 0;

/**
 * Generic drag-and-drop file upload.
 *
 * Self-contained and app-agnostic — no services, no global styles, tokens
 * resolve from the host app with literal fallbacks — so the folder can be
 * copied into any Angular Material project.
 *
 *   <app-file-upload [(files)]="files" multiple accept=".csv,image/*"
 *                    [maxSizeMb]="10" [maxFiles]="5" (rejected)="warn($event)" />
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent implements OnDestroy {
  /** Selected files. Two-way bindable; the host can also clear or patch it. */
  readonly files = model<UploadFile[]>([]);

  /** Allow more than one file. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Accept list, as the native input takes it: ".csv,.xlsx" or "image/*". */
  readonly accept = input<string>('');
  /** Per-file size cap in MB. 0 disables the check. */
  readonly maxSizeMb = input(0, { transform: numberAttribute });
  /** Maximum number of files. 0 means unlimited (when `multiple`). */
  readonly maxFiles = input(0, { transform: numberAttribute });
  /** Block the same name+size being added twice. */
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  /** Render thumbnails for image files. */
  readonly showPreviews = input(true, { transform: booleanAttribute });
  /** Disable all interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Headline inside the dropzone. */
  readonly label = input('Drop files here, or click to browse');
  /** Secondary line; defaults to a summary of the active restrictions. */
  readonly hint = input<string>('');

  /** Files that failed validation, so the host can toast them. */
  readonly rejected = output<FileRejection[]>();
  /** Emitted whenever the accepted set changes. */
  readonly filesChanged = output<UploadFile[]>();

  readonly dragging = signal(false);

  /** Auto-generated hint: "CSV, XLSX · up to 5 MB · max 3 files". */
  readonly effectiveHint = computed(() => {
    if (this.hint()) return this.hint();
    const bits: string[] = [];
    if (this.accept()) {
      bits.push(this.accept().split(',')
        .map(a => a.trim().replace(/^\./, '').replace('/*', ' files').toUpperCase())
        .join(', '));
    }
    if (this.maxSizeMb() > 0) bits.push(`up to ${this.maxSizeMb()} MB`);
    if (this.multiple() && this.maxFiles() > 0) bits.push(`max ${this.maxFiles()} files`);
    if (!this.multiple()) bits.push('single file');
    return bits.join(' · ');
  });

  readonly totalSize = computed(() => this.files().reduce((n, f) => n + f.size, 0));

  constructor() {
    // Keep the host informed without it having to diff the model itself.
    effect(() => this.filesChanged.emit(this.files()));
  }

  ngOnDestroy(): void {
    for (const f of this.files()) this.revoke(f);
  }

  // ---- Input handling ----
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) return;
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.dragging.set(true);
  }

  onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    // Reset so picking the same file twice still fires a change event.
    input.value = '';
  }

  /** Validates and appends; single mode replaces instead of appending. */
  addFiles(incoming: File[]): void {
    if (this.disabled() || incoming.length === 0) return;

    const rejections: FileRejection[] = [];
    const accepted: UploadFile[] = [];
    const existing = this.multiple() ? [...this.files()] : [];
    const limit = this.multiple() ? (this.maxFiles() || Infinity) : 1;

    for (const file of incoming) {
      if (!this.typeAllowed(file)) {
        rejections.push({ file, reason: 'type', message: `${file.name}: file type not allowed` });
        continue;
      }
      if (this.maxSizeMb() > 0 && file.size > this.maxSizeMb() * 1024 * 1024) {
        rejections.push({ file, reason: 'size', message: `${file.name}: exceeds ${this.maxSizeMb()} MB` });
        continue;
      }
      if (!this.allowDuplicates() &&
          [...existing, ...accepted].some(f => f.name === file.name && f.size === file.size)) {
        rejections.push({ file, reason: 'duplicate', message: `${file.name}: already added` });
        continue;
      }
      if (existing.length + accepted.length >= limit) {
        rejections.push({ file, reason: 'count', message: `${file.name}: limit of ${limit} file${limit === 1 ? '' : 's'} reached` });
        continue;
      }
      accepted.push(this.toUploadFile(file));
    }

    if (accepted.length) {
      // Single mode: the new file replaces the old one, URLs and all.
      if (!this.multiple()) this.files().forEach(f => this.revoke(f));
      this.files.set([...existing, ...accepted]);
    }
    if (rejections.length) this.rejected.emit(rejections);
  }

  remove(target: UploadFile): void {
    this.revoke(target);
    this.files.update(list => list.filter(f => f.id !== target.id));
  }

  clear(): void {
    this.files().forEach(f => this.revoke(f));
    this.files.set([]);
  }

  // ---- Progress API for the host ----
  setProgress(id: string, progress: number): void {
    this.patch(id, f => ({ ...f, status: progress >= 100 ? 'done' : 'uploading', progress }));
  }

  setError(id: string, error: string): void {
    this.patch(id, f => ({ ...f, status: 'error', error }));
  }

  // ---- Display helpers ----
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /** Material icon chosen from the extension/MIME type. */
  fileIcon(f: UploadFile): string {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (f.type.startsWith('image/')) return 'image';
    if (f.type.startsWith('video/')) return 'movie';
    if (f.type.startsWith('audio/')) return 'audiotrack';
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['csv', 'xls', 'xlsx'].includes(ext)) return 'table_chart';
    if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'description';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    if (['json', 'xml', 'yml', 'yaml', 'ts', 'js', 'html', 'scss'].includes(ext)) return 'code';
    return 'insert_drive_file';
  }

  private typeAllowed(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;
    const name = file.name.toLowerCase();
    return accept.split(',').map(a => a.trim().toLowerCase()).some(rule => {
      if (!rule) return false;
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1));
      return file.type === rule;
    });
  }

  private toUploadFile(file: File): UploadFile {
    const isImage = file.type.startsWith('image/');
    return {
      id: `f${++seq}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready',
      progress: 0,
      previewUrl: isImage && this.showPreviews() ? URL.createObjectURL(file) : undefined,
    };
  }

  private patch(id: string, fn: (f: UploadFile) => UploadFile): void {
    this.files.update(list => list.map(f => (f.id === id ? fn(f) : f)));
  }

  private revoke(f: UploadFile): void {
    if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
  }
}
