import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface MultiSelectOption {
  id: string;
  name: string;
  /** Optional 1-2 letter tag for 'tiles' mode — derived from `name` if omitted. */
  initials?: string;
}

export type MultiSelectMode = 'list' | 'dropdown' | 'chips' | 'tiles' | 'horizontal';

/**
 * One reusable multi-select-checkbox control, five layouts via `mode`:
 *  - list       always-visible checklist card (filter sidebars, settings)
 *  - dropdown   compact trigger + overlay panel with search + Apply/Cancel
 *  - chips      the chip itself is the checkbox — casual, short labels
 *  - tiles      icon-tile grid — more visual weight per option
 *  - horizontal single-row checklist — compact inline filter bar
 *
 * All five share the same selection state/behavior (toggle, select-all,
 * clear) so switching `mode` is a one-line template change, not a rewrite.
 * Every color/spacing value comes from the app's existing design tokens —
 * no new tokens introduced.
 */
@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatIconModule, MatButtonModule],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
})
export class MultiSelectComponent {
  readonly options = input.required<MultiSelectOption[]>();
  readonly mode = input<MultiSelectMode>('list');
  readonly label = input('Options');
  readonly placeholder = input('Select options');
  readonly selected = input<string[]>([]);
  readonly selectedChange = output<string[]>();

  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly searchTerm = signal('');
  readonly panelOpen = signal(false);
  private panelSnapshot: string[] = [];

  readonly filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.options();
    return term ? list.filter(o => o.name.toLowerCase().includes(term)) : list;
  });

  readonly allSelected = computed(() =>
    this.options().length > 0 && this.selected().length === this.options().length);
  readonly someSelected = computed(() =>
    this.selected().length > 0 && !this.allSelected());

  readonly triggerLabel = computed(() => {
    const n = this.selected().length;
    const total = this.options().length;
    if (n === 0) return this.placeholder();
    if (n === total) return `All ${this.label().toLowerCase()}`;
    return `${n} of ${total} selected`;
  });

  isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  toggle(id: string): void {
    const cur = this.selected();
    this.selectedChange.emit(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  }

  toggleAll(): void {
    this.selectedChange.emit(this.allSelected() ? [] : this.options().map(o => o.id));
  }

  clear(): void {
    this.selectedChange.emit([]);
  }

  openPanel(): void {
    this.panelSnapshot = this.selected();
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  cancelPanel(): void {
    this.selectedChange.emit(this.panelSnapshot);
    this.panelOpen.set(false);
  }

  initialsFor(o: MultiSelectOption): string {
    if (o.initials) return o.initials;
    const parts = o.name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.mode() === 'dropdown' && this.panelOpen() && !this.hostEl.nativeElement.contains(e.target as Node)) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.panelOpen()) this.closePanel();
  }
}
