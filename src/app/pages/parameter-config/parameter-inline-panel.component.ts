import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ParamGroupType, ParameterConfigService, ParameterEntry } from '../../core/services/parameter-config.service';
import { ParameterExecutionService } from '../../core/services/parameter-execution.service';
import { createParameterForm, toParameterDraft } from './parameter-form.util';
import { ParameterFormFieldsComponent } from './parameter-form-fields.component';
import { ParameterExecutionsListComponent } from './parameter-executions-list.component';

export type InlineDetailView = 'details' | 'executions';

const PAGE_INCREMENT = 100;

/**
 * "Inline panel" CRUD variant — a master-detail layout: a searchable list of
 * the type's parameters (latest-updated first) on the left, an always-open
 * inline edit form on the right. No dialogs at all — kept side by side with
 * the dialog-based variant (ParameterFormDialogComponent + ParameterViewDialogComponent)
 * so the two interaction styles can be compared on the same dataset.
 */
@Component({
  selector: 'app-parameter-inline-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatDividerModule, MatSnackBarModule, SkeletonComponent, ParameterFormFieldsComponent,
    ParameterExecutionsListComponent,
  ],
  templateUrl: './parameter-inline-panel.component.html',
  styleUrl: './parameter-inline-panel.component.scss',
})
export class ParameterInlinePanelComponent implements OnInit {
  readonly type = input.required<ParamGroupType>();
  readonly typeLabel = input<string>('');
  readonly loading = input<boolean>(false);

  readonly refresh = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ParameterConfigService);
  private readonly execService = inject(ParameterExecutionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly searchTerm = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly isCreating = signal(false);
  readonly form = signal(createParameterForm(this.fb));
  /** "Details" (the edit form) vs "Executions" (job-run history) — an
   *  explicit opt-in tab so the history list only builds when asked for. */
  readonly detailView = signal<InlineDetailView>('details');
  /** How many of the (search-)filtered entries are currently rendered in the
   *  list — grows via "Show more" instead of rendering everything at once. */
  readonly visibleCount = signal(PAGE_INCREMENT);

  readonly entries = computed(() =>
    [...this.service.entries()]
      .filter(e => e.type === this.type())
      .sort((a, b) => b.updatedOn.getTime() - a.updatedOn.getTime()));

  readonly filteredEntries = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.entries();
    return term ? list.filter(e => e.name.toLowerCase().includes(term)) : list;
  });

  readonly visibleEntries = computed(() => this.filteredEntries().slice(0, this.visibleCount()));
  readonly remainingCount = computed(() => this.filteredEntries().length - this.visibleCount());

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.visibleCount.set(PAGE_INCREMENT); // fresh results start from the top again
  }

  showMore(): void {
    this.visibleCount.update(n => n + PAGE_INCREMENT);
  }

  readonly selectedEntry = computed<ParameterEntry | null>(() =>
    this.entries().find(e => e.id === this.selectedId()) ?? null);

  readonly activeSiblingName = computed(() =>
    this.service.activeSibling(this.type(), this.selectedId() ?? undefined)?.name ?? null);

  /** Job-run history for the selected entry — generated lazily on first
   *  access via the service's cache, not eagerly for every row in the list. */
  readonly executions = computed(() => {
    const id = this.selectedId();
    return id ? this.execService.getExecutions(id) : [];
  });

  ngOnInit(): void {
    const latest = this.entries()[0];
    if (latest) this.select(latest);
  }

  select(entry: ParameterEntry): void {
    this.isCreating.set(false);
    this.selectedId.set(entry.id);
    this.form.set(createParameterForm(this.fb, entry));
    this.detailView.set('details');
  }

  startNew(): void {
    this.isCreating.set(true);
    this.selectedId.set(null);
    this.form.set(createParameterForm(this.fb));
    this.detailView.set('details');
  }

  discard(): void {
    const e = this.selectedEntry();
    this.form.set(createParameterForm(this.fb, e ?? undefined));
  }

  save(): void {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    const draft = toParameterDraft(form, this.type());
    if (this.isCreating()) {
      const created = this.service.create(draft);
      this.select(created);
      this.snackBar.open('Parameter created', 'Dismiss', { duration: 3000 });
    } else {
      const id = this.selectedId()!;
      this.service.update(id, draft);
      const updated = this.service.getById(id);
      if (updated) this.form.set(createParameterForm(this.fb, updated));
      this.snackBar.open('Parameter updated', 'Dismiss', { duration: 3000 });
    }
  }

  delete(): void {
    const e = this.selectedEntry();
    if (!e) return;
    this.confirmDialog.confirm({
      title: 'Delete this parameter?',
      message: `"${e.name}" will be permanently removed. This action cannot be undone.`,
      icon: 'delete',
      tone: 'warn',
      confirmLabel: 'Delete',
    }).subscribe(ok => {
      if (!ok) return;
      this.service.delete(e.id);
      this.snackBar.open(`"${e.name}" deleted`, 'Dismiss', { duration: 3000 });
      const next = this.entries()[0];
      if (next) this.select(next); else this.startNew();
    });
  }
}
