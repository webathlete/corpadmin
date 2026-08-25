import { Directive } from '@angular/core';

/**
 * Marks the projected action bar. Purely a marker so `<app-dialog>` can tell
 * whether actions were supplied and collapse the footer when they weren't —
 * `:empty` can't be used because projection leaves comment nodes behind.
 */
@Directive({
  selector: '[dialogActions]',
  standalone: true,
})
export class DialogActionsDirective {}
