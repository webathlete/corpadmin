import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { Breadcrumb, BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';

/**
 * Generic, compact page frame composed of real sub-components, in sequence:
 *
 *   1. <app-page-header>   — title + projected [pageActions]
 *   2. <app-breadcrumb>    — optional (route-data driven); toggle with [breadcrumb]
 *   3. short description   — optional
 *   … then the projected page body.
 *
 * Usage:
 *   <app-page-layout title="Job Manager" description="Monitor jobs">
 *     <button pageActions mat-raised-button color="primary">New</button>
 *     …page body…
 *   </app-page-layout>
 */
@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent, LoadingBarComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
  // `title` is also a global HTML attribute; drop it so the browser doesn't
  // show a native tooltip over the whole component.
  host: { '[attr.title]': 'null' },
})
export class PageLayoutComponent {
  /** Page title (required). */
  readonly title = input.required<string>();
  /** Optional short description under the header/breadcrumb. */
  readonly description = input<string>('');
  /** Optional breadcrumb trail. Empty/omitted → breadcrumb is not shown.
   *  A crumb without a `link` renders as plain text (not a link). */
  readonly breadcrumbs = input<Breadcrumb[]>([]);
  /** Show the indeterminate loading bar pinned to the top of the page. */
  readonly loading = input<boolean>(false);
}
