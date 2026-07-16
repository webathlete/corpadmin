import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** A single crumb. Omit `link` to render it as plain text (not a link). */
export interface Breadcrumb {
  label: string;
  link?: string | unknown[];
}

/**
 * Input-driven breadcrumb. Renders nothing when no items are passed; each
 * crumb is a router link only if it has a `link`, otherwise plain text. The
 * last crumb is always the current (non-link) page.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  readonly items = input<Breadcrumb[]>([]);
}
