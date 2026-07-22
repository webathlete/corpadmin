import { Component, Optional, Self, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NgControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LookupItem } from '../../core/services/parameter-config.service';

/**
 * Searchable single-select lookup: type to filter an {id, name} list; once
 * picked, the value collapses into a removable chip showing both. Works as
 * a normal reactive-form control (`formControlName="category"`) — the value
 * is the lookup id.
 *
 *   <app-lookup-picker label="Category" [items]="categories" formControlName="category" />
 */
@Component({
  selector: 'app-lookup-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule, MatChipsModule, MatIconModule],
  templateUrl: './lookup-picker.component.html',
  styleUrl: './lookup-picker.component.scss',
})
export class LookupPickerComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Search…');
  readonly items = input<LookupItem[]>([]);

  readonly selectedId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly disabled = signal(false);

  readonly selectedItem = computed(() => this.items().find(i => i.id === this.selectedId()) ?? null);
  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    return this.items().filter(i =>
      i.name.toLowerCase().includes(term) || i.id.toLowerCase().includes(term));
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor(@Optional() @Self() public ngControl?: NgControl) {
    if (ngControl) ngControl.valueAccessor = this;
  }

  get showError(): boolean {
    return !!this.ngControl && this.ngControl.invalid === true && !!this.ngControl.touched;
  }

  writeValue(id: string | null): void {
    this.selectedId.set(id);
    this.searchTerm.set('');
  }
  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouchedFn = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  select(item: LookupItem): void {
    this.selectedId.set(item.id);
    this.searchTerm.set('');
    this.onChange(item.id);
    this.onTouchedFn();
  }

  clear(): void {
    if (this.disabled()) return;
    this.selectedId.set(null);
    this.onChange(null);
    this.onTouchedFn();
  }

  onBlur(): void {
    this.onTouchedFn();
  }
}
