import {
  Component, ContentChild, Input, Output, EventEmitter, inject, booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DialogActionsDirective } from './dialog-actions.directive';

/**
 * Generic Material dialog shell: header (icon + title + subtitle + close),
 * scrollable projected body and a projected action bar.
 *
 * Body content goes in the default slot; actions in `[dialogActions]`.
 * Optional extra header content in `[dialogHeader]`.
 *
 *   <app-dialog title="Edit parameter" icon="tune" subtitle="PARAM_001">
 *     <form>...</form>
 *     <ng-container dialogActions>
 *       <button mat-button mat-dialog-close>Cancel</button>
 *       <button mat-flat-button color="primary">Save</button>
 *     </ng-container>
 *   </app-dialog>
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  // `title` is also a global HTML attribute; drop it so the browser doesn't
  // show a native tooltip over the whole dialog.
  host: { '[attr.title]': 'null' },
})
export class DialogComponent {
  /** Header title. */
  @Input() title?: string;
  /** Secondary line under the title. */
  @Input() subtitle?: string;
  /** Material icon name rendered before the title. */
  @Input() icon?: string;
  /** Tints the header icon (and its badge). */
  @Input() tone: 'primary' | 'accent' | 'success' | 'warn' | 'none' = 'primary';
  /** Render the icon in a tinted rounded square instead of bare. */
  @Input({ transform: booleanAttribute }) badge = false;
  /** Show the header close button. */
  @Input({ transform: booleanAttribute }) closable = true;
  /** Remove body padding — for edge-to-edge tables. */
  @Input({ transform: booleanAttribute }) flush = false;
  /** Draw the separator lines under the header and above the actions. */
  @Input({ transform: booleanAttribute }) dividers = true;
  /** Alignment of the projected actions. */
  @Input() actionsAlign: 'start' | 'center' | 'end' | 'between' = 'end';

  /** Emitted when the header close button is pressed. */
  @Output() closed = new EventEmitter<void>();

  /** Present only when the caller projected an action bar. */
  @ContentChild(DialogActionsDirective) private readonly actions?: DialogActionsDirective;

  private readonly ref = inject(MatDialogRef, { optional: true });

  get hasHeader(): boolean { return !!(this.title || this.icon || this.subtitle); }
  get hasActions(): boolean { return !!this.actions; }

  close(): void {
    this.closed.emit();
    this.ref?.close();
  }
}
