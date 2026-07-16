import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Thin indeterminate Material progress bar for page/content loading.
 * Renders only while `loading` is true. Designed to sit pinned at the top of
 * a content area (see <app-page-layout>, which hosts it), so toggling it
 * doesn't shift the layout.
 *
 *   <app-loading-bar [loading]="isLoading()"></app-loading-bar>
 */
@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" aria-label="Loading"></mat-progress-bar>
    }
  `,
  styles: [`
    :host { display: block; }
    mat-progress-bar {
      /* Thin, rounded track */
      --mdc-linear-progress-track-height: 3px;
      --mdc-linear-progress-active-indicator-height: 3px;
      border-radius: var(--radius-pill, 999px);
      overflow: hidden;
    }
  `],
})
export class LoadingBarComponent {
  readonly loading = input<boolean>(false);
}
