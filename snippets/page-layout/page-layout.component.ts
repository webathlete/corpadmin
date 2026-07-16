import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from './page-header.component';
import { Breadcrumb, BreadcrumbComponent } from './breadcrumb.component';

/**
 * Generic, compact page frame composed of real sub-components, in sequence:
 *
 *   1. <app-page-header>   — title + projected [pageActions]
 *   2. <app-breadcrumb>    — optional; hidden when no `breadcrumbs` are passed
 *   3. short description   — optional
 *   … then the projected page body.
 *
 * Usage:
 *   <app-page-layout title="Job Manager" description="Monitor jobs"
 *     [breadcrumbs]="[{ label: 'Home', link: '/' }, { label: 'Jobs' }]">
 *     <button pageActions mat-raised-button color="primary">New</button>
 *     …page body…
 *   </app-page-layout>
 */
@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {
  /** Page title (required). */
  readonly title = input.required<string>();
  /** Optional short description under the header/breadcrumb. */
  readonly description = input<string>('');
  /** Optional breadcrumb trail. Empty/omitted → breadcrumb is not shown.
   *  A crumb without a `link` renders as plain text (not a link). */
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
