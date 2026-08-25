import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  PARAM_GROUP_TYPES, ParamGroupType, ParameterConfigService, ParameterEntry,
} from '../../core/services/parameter-config.service';
import { createParameterForm, toParameterDraft } from './parameter-form.util';
import { ParameterFormFieldsComponent } from './parameter-form-fields.component';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DialogActionsDirective } from '../../shared/dialog/dialog-actions.directive';

export interface ParameterFormDialogData {
  type: ParamGroupType;
  entry?: ParameterEntry;
}

@Component({
  selector: 'app-parameter-form-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ParameterFormFieldsComponent, DialogComponent, DialogActionsDirective],
  templateUrl: './parameter-form-dialog.component.html',
})
export class ParameterFormDialogComponent {
  readonly ref = inject(MatDialogRef<ParameterFormDialogComponent, boolean>);
  readonly data = inject<ParameterFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ParameterConfigService);

  readonly isEdit = !!this.data.entry;
  readonly typeLabel = PARAM_GROUP_TYPES.find(t => t.type === this.data.type)?.label ?? this.data.type;

  readonly form = createParameterForm(this.fb, this.data.entry);

  /** The entry that would get deactivated if this one is saved as active. */
  readonly activeSiblingName = computed(() =>
    this.service.activeSibling(this.data.type, this.data.entry?.id)?.name ?? null);

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const draft = toParameterDraft(this.form, this.data.type);
    if (this.isEdit) {
      this.service.update(this.data.entry!.id, draft);
    } else {
      this.service.create(draft);
    }
    this.ref.close(true);
  }
}
