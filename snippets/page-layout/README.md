# Page Layout component set (Angular 18 + Material)

A compact, reusable page frame composed of three standalone components:

```
<app-page-layout>
  ├─ <app-page-header>   title + projected [pageActions]
  ├─ <app-breadcrumb>    optional; hidden when no crumbs passed
  ├─ short description   optional
  └─ <ng-content>        page body
```

## Files (copy this folder into your app, e.g. src/app/shared/)
- `breadcrumb.component.*`   — input-driven breadcrumb (`items`), optional per-crumb link
- `page-header.component.*`  — title + `[pageActions]` slot (`:host` layout, no class collisions)
- `page-layout.component.*`  — composes the above + optional description + body

Imports here are flat (`./page-header.component`, `./breadcrumb.component`), so the
folder works as-is. Split into subfolders if you prefer — just fix the two import paths
in `page-layout.component.ts`.

## Usage

```html
<app-page-layout
  title="Job Manager"
  description="Monitor, start and cancel background jobs"
  [breadcrumbs]="[
    { label: 'Home', link: '/dashboard' },   // link → router link
    { label: 'Job Manager' }                  // no link → plain text (current)
  ]">

  <!-- right-aligned header actions -->
  <button pageActions mat-raised-button color="primary">
    <mat-icon>play_arrow</mat-icon> Start Job
  </button>

  <!-- page body -->
  <mat-card> … </mat-card>
</app-page-layout>
```

Rules:
- **Breadcrumb is optional** — omit `[breadcrumbs]` (or pass `[]`) and it isn't rendered.
- **Each crumb's link is optional** — a crumb without `link` renders as plain text, not a link.
  The last crumb is always the current (non-link) page.
- **Actions** project into the header's right side via the `pageActions` attribute.

## Design tokens

The SCSS references these CSS variables (with baked-in fallbacks so it works even
without a token system): `--text-primary` (#2d3748), `--text-secondary` (#718096),
`--text-muted` (#a0aec0), `--app-primary` (#1565c0), `--transition-fast` (150ms ease).
Define them once in `:root` to theme all three components at once.

## Compactness

Title 20px, breadcrumb 12px, description 13px; gaps are 2px (header→breadcrumb→description)
and 12px (→ body). Tweak these in `page-layout.component.scss` / `page-header.component.scss`.
```
