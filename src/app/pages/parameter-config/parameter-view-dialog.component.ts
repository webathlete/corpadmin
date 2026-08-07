import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import {
  CATEGORIES, CONDITIONS, PARAM_GROUP_TYPES, PARAMETER_TYPES,
  ParameterConfigService, lookupName,
} from '../../core/services/parameter-config.service';
import { ParameterFormDialogComponent } from './parameter-form-dialog.component';
import { ParameterExecutionsDialogComponent } from './parameter-executions-dialog.component';

@Component({
  selector: 'app-parameter-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './parameter-view-dialog.component.html',
  styleUrl: './parameter-view-dialog.component.scss',
})
export class ParameterViewDialogComponent {
  readonly ref = inject(MatDialogRef<ParameterViewDialogComponent>);
  private readonly entryId = inject<{ id: string }>(MAT_DIALOG_DATA).id;
  private readonly service = inject(ParameterConfigService);
  private readonly dialog = inject(MatDialog);

  readonly entry = computed(() => this.service.getById(this.entryId));

  typeLabel(): string {
    const e = this.entry();
    return e ? (PARAM_GROUP_TYPES.find(t => t.type === e.type)?.label ?? e.type) : '';
  }

  categoryName(id: string): string { return lookupName(CATEGORIES, id); }
  parameterTypeName(id: string): string { return lookupName(PARAMETER_TYPES, id); }
  conditionName(id: string): string { return lookupName(CONDITIONS, id); }

  edit(): void {
    const e = this.entry();
    if (!e) return;
    this.ref.close();
    this.dialog.open(ParameterFormDialogComponent, {
      width: '640px',
      maxWidth: '92vw',
      data: { type: e.type, entry: e },
    });
  }

  viewExecutions(): void {
    const e = this.entry();
    if (!e) return;
    this.dialog.open(ParameterExecutionsDialogComponent, {
      width: '680px',
      maxWidth: '92vw',
      data: { parameterId: e.id, parameterName: e.name },
    });
  }
}
