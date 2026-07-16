/**
 * Page Layout — single-file drop-in (Angular 18+ / Material)
 * ----------------------------------------------------------
 * All three components (Breadcrumb, PageHeader, PageLayout) with inline
 * templates + styles in ONE file. Copy this file into your app and import
 * `PageLayoutComponent` (it re-exports the other two).
 *
 * Usage:
 *   <app-page-layout title="Job Manager" description="Monitor jobs"
 *     [breadcrumbs]="[{ label:'Home', link:'/' }, { label:'Jobs' }]">
 *     <button pageActions mat-raised-button color="primary">New</button>
 *     …page body…
 *   </app-page-layout>
 *
 * Design tokens (with baked-in fallbacks so it works without a token system).
 *
 * GLOBAL TOKENS — paste this block into your global `styles.scss` (`:root`) to
 * theme these components (and the rest of your app) from one place. The
 * component styles below already fall back to these same values, so this is
 * optional but recommended:
 *
 *   :root {
 *     // Brand
 *     --app-primary:      #1565c0;
 *     --app-accent:       #0288d1;
 *
 *     // Surfaces & text
 *     --page-bg:          #f0f4f8;
 *     --surface-bg:       #ffffff;
 *     --surface-border:   #e2e8f0;
 *     --text-primary:     #2d3748;   // strong slate (not near-black)
 *     --text-secondary:   #718096;
 *     --text-muted:       #a0aec0;
 *
 *     // Shape
 *     --radius-sm:        8px;
 *     --radius-md:        12px;
 *     --radius-lg:        16px;
 *     --radius-pill:      999px;
 *
 *     // Elevation
 *     --elevation-1:      0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.10);
 *     --elevation-2:      0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
 *     --elevation-3:      0 4px 8px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.10);
 *
 *     // Motion
 *     --ease-standard:    cubic-bezier(.4, 0, .2, 1);
 *     --duration-short:   150ms;
 *     --duration-medium:  250ms;
 *     --transition-fast:  var(--duration-short) var(--ease-standard);
 *     --transition-normal: var(--duration-medium) var(--ease-standard);
 *
 *     // Status
 *     --status-success:   #22c55e;
 *     --status-warning:   #f59e0b;
 *     --status-error:     #ef4444;
 *   }
 *
 * Tokens actually referenced by THIS file: --text-primary, --text-secondary,
 * --text-muted, --app-primary, --transition-fast.
 */
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** A single crumb. Omit `link` to render it as plain text (not a link). */
export interface Breadcrumb {
  label: string;
  link?: string | unknown[];
}

// ============================================================
// Breadcrumb — input-driven; hidden when empty; optional per-crumb link
// ============================================================
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    @if (items().length) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        @for (crumb of items(); track $index; let last = $last) {
          @if (crumb.link && !last) {
            <a class="breadcrumb-item link" [routerLink]="crumb.link">{{ crumb.label }}</a>
          } @else {
            <span class="breadcrumb-item" [class.current]="last"
                  [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span>
          }
          @if (!last) { <mat-icon class="breadcrumb-sep">chevron_right</mat-icon> }
        }
      </nav>
    }
  `,
  styles: [`
    :host { display: block; }
    .breadcrumb {
      display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
      font-size: 12px; line-height: 1;
    }
    .breadcrumb-item {
      color: var(--text-secondary, #718096); text-decoration: none;
      &.current { color: var(--text-primary, #2d3748); font-weight: 500; }
    }
    a.breadcrumb-item.link {
      cursor: pointer; transition: color var(--transition-fast, 150ms ease);
      &:hover { color: var(--app-primary, #1565c0); }
    }
    .breadcrumb-sep { font-size: 14px; width: 14px; height: 14px; color: var(--text-muted, #a0aec0); }
  `],
})
export class BreadcrumbComponent {
  readonly items = input<Breadcrumb[]>([]);
}

// ============================================================
// PageHeader — title + projected [pageActions]
// ============================================================
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="ph-title">{{ title() }}</h1>
    <div class="ph-actions"><ng-content select="[pageActions]"></ng-content></div>
  `,
  styles: [`
    :host {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 6px 16px;
    }
    .ph-title {
      margin: 0; font-size: 20px; font-weight: 600; line-height: 1.2;
      color: var(--text-primary, #2d3748);
    }
    .ph-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    @media (max-width: 599px) { .ph-title { font-size: 18px; } }
  `],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
}

// ============================================================
// PageLayout — composes header + optional breadcrumb + optional description + body
// ============================================================
@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, BreadcrumbComponent],
  template: `
    <section class="page-layout">
      <app-page-header [title]="title()">
        <ng-content select="[pageActions]"></ng-content>
      </app-page-header>

      @if (breadcrumbs().length) {
        <app-breadcrumb [items]="breadcrumbs()"></app-breadcrumb>
      }

      @if (description()) {
        <p class="pl-description">{{ description() }}</p>
      }

      <div class="pl-body"><ng-content></ng-content></div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page-layout { display: flex; flex-direction: column; }
    app-page-header { display: block; }
    app-breadcrumb { display: block; margin-top: 2px; }
    .pl-description {
      margin: 2px 0 0; font-size: 13px; line-height: 1.35;
      color: var(--text-secondary, #718096); max-width: 80ch;
    }
    .pl-body { margin-top: 12px; min-width: 0; }
    @media (max-width: 599px) { .pl-body { margin-top: 10px; } }
  `],
})
export class PageLayoutComponent {
  /** Page title (required). */
  readonly title = input.required<string>();
  /** Optional short description under the header/breadcrumb. */
  readonly description = input<string>('');
  /** Optional breadcrumb trail. Empty/omitted → not shown. A crumb without a
   *  `link` renders as plain text (not a link). */
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
