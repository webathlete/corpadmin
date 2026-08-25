import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

export interface ParamTableRow {
  id: string;
  name: string;
  values: number[];
  dataType: string;
}

/**
 * Inline-editable parameter table — 4 columns sized by proportion
 * (30 / 45 / 15 / 10) via `table-layout: fixed` so they scale together at
 * any container width instead of overflowing on narrower laptop screens.
 * Save/cancel is the 4th column; only the row being edited swaps its cells
 * for inputs, the rest stay read-only.
 */
@Component({
  selector: 'app-param-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatIconModule, MatTooltipModule, MatChipsModule],
  templateUrl: './param-table.component.html',
  styleUrl: './param-table.component.scss',
})
export class ParamTableComponent {
  readonly rows = input.required<ParamTableRow[]>();
  readonly dataTypes = input<string[]>(['Integer', 'Decimal', 'Percentage', 'Currency']);
  readonly rowsChange = output<ParamTableRow[]>();

  readonly displayedColumns = ['name', 'values', 'type', 'actions'];
  readonly separatorKeys = [ENTER, COMMA];

  readonly editingId = signal<string | null>(null);
  readonly draft = signal<ParamTableRow | null>(null);

  trackByRowId(_index: number, row: ParamTableRow): string {
    return row.id;
  }

  isEditing(row: ParamTableRow): boolean {
    return this.editingId() === row.id;
  }

  startEdit(row: ParamTableRow): void {
    this.editingId.set(row.id);
    this.draft.set({ ...row, values: [...row.values] });
  }

  cancel(): void {
    this.editingId.set(null);
    this.draft.set(null);
  }

  save(): void {
    const d = this.draft();
    if (!d || !d.name.trim()) return;
    this.rowsChange.emit(this.rows().map(r => (r.id === d.id ? d : r)));
    this.cancel();
  }

  addValue(event: MatChipInputEvent): void {
    const num = Number((event.value ?? '').trim());
    const d = this.draft();
    if (d && !Number.isNaN(num) && event.value?.trim()) {
      this.draft.set({ ...d, values: [...d.values, num] });
    }
    event.chipInput.clear();
  }

  removeValue(index: number): void {
    const d = this.draft();
    if (!d) return;
    this.draft.set({ ...d, values: d.values.filter((_, i) => i !== index) });
  }
}
