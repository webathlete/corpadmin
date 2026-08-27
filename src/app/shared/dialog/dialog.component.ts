import {
  AfterViewInit, Component, ElementRef, Renderer2, booleanAttribute, contentChild,
  inject, input, output,
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
 *
 * Self-contained: no global stylesheet or service is required, so the folder
 * can be copied into any Angular Material project as-is.
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
export class DialogComponent implements AfterViewInit {
  /** Header title. */
  readonly title = input<string>();
  /** Secondary line under the title. */
  readonly subtitle = input<string>();
  /** Material icon name rendered before the title. */
  readonly icon = input<string>();
  /** Tints the header icon (and its badge). */
  readonly tone = input<'primary' | 'accent' | 'success' | 'warn' | 'none'>('primary');
  /** Render the icon in a tinted rounded square instead of bare. */
  readonly badge = input(false, { transform: booleanAttribute });
  /** Show the header close button. */
  readonly closable = input(true, { transform: booleanAttribute });
  /** Remove body padding — for edge-to-edge tables. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** Draw the separator lines under the header and above the actions. */
  readonly dividers = input(true, { transform: booleanAttribute });
  /** Alignment of the projected actions. */
  readonly actionsAlign = input<'start' | 'center' | 'end' | 'between'>('end');

  /** Emitted when the header close button is pressed. */
  readonly closed = output<void>();

  /** Present only when the caller projected an action bar. */
  private readonly actions = contentChild(DialogActionsDirective);

  private readonly ref = inject(MatDialogRef, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly hasHeader = () => !!(this.title() || this.icon() || this.subtitle());
  readonly hasActions = () => !!this.actions();

  ngAfterViewInit(): void {
    // Material leaves the dialog surface as `display: block`, which lets tall
    // content push the action bar off the bottom. Making it a flex column
    // here — rather than in a global stylesheet — keeps the pinned
    // header/footer working wherever this component is copied to.
    const surface = this.host.nativeElement.closest('.mat-mdc-dialog-surface');
    if (surface) {
      this.renderer.setStyle(surface, 'display', 'flex');
      this.renderer.setStyle(surface, 'flex-direction', 'column');
    }
  }

  close(): void {
    this.closed.emit();
    this.ref?.close();
  }
}
