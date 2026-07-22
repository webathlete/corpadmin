import { FormBuilder, Validators } from '@angular/forms';
import { ParameterEntry, ParameterEntryDraft } from '../../core/services/parameter-config.service';

/** Reactive form shape shared by the dialog and inline CRUD variants. */
export function createParameterForm(fb: FormBuilder, entry?: ParameterEntry) {
  return fb.group({
    name: [entry?.name ?? '', Validators.required],
    description: [entry?.description ?? ''],
    categoryId: [entry?.categoryId ?? '', Validators.required],
    parameterTypeId: [entry?.parameterTypeId ?? '', Validators.required],
    condition1Id: [entry?.condition1Id ?? '', Validators.required],
    condition2Id: [entry?.condition2Id ?? '', Validators.required],
    condition3Id: [entry?.condition3Id ?? '', Validators.required],
    active: [entry?.active ?? false],
  });
}

export type ParameterForm = ReturnType<typeof createParameterForm>;

/** Reads a valid form's raw value into a service-ready draft. */
export function toParameterDraft(
  form: ParameterForm,
  type: ParameterEntry['type'],
): ParameterEntryDraft {
  const v = form.getRawValue();
  return {
    name: v.name!.trim(),
    description: (v.description ?? '').trim(),
    type,
    categoryId: v.categoryId!,
    parameterTypeId: v.parameterTypeId!,
    condition1Id: v.condition1Id!,
    condition2Id: v.condition2Id!,
    condition3Id: v.condition3Id!,
    active: !!v.active,
  };
}
