import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { LookupPickerComponent } from '../../shared/lookup-picker/lookup-picker.component';
import { CATEGORIES, CONDITIONS, PARAMETER_TYPES } from '../../core/services/parameter-config.service';
import { ParameterForm } from './parameter-form.util';

/**
 * The Name/Description/Category/Parameter Type/Criteria Set/Active fields —
 * shared, unchanged markup between the dialog and inline CRUD variants so
 * the two only differ in their surrounding chrome, never in the form itself.
 */
@Component({
  selector: 'app-parameter-form-fields',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSlideToggleModule, MatDividerModule, MatIconModule, LookupPickerComponent,
  ],
  templateUrl: './parameter-form-fields.component.html',
  styleUrl: './parameter-form-fields.component.scss',
})
export class ParameterFormFieldsComponent {
  readonly form = input.required<ParameterForm>();
  readonly typeLabel = input<string>('');
  /** Name of the entry that will be deactivated if this one saves as active. */
  readonly activeSiblingName = input<string | null>(null);

  readonly categories = CATEGORIES;
  readonly parameterTypes = PARAMETER_TYPES;
  readonly conditions = CONDITIONS;

  get showActiveSiblingHint(): boolean {
    return this.form().controls.active.value === true && !!this.activeSiblingName();
  }
}
