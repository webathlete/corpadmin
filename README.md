# Corporate Admin Dashboard — Reusable Angular Material Design System

Angular 18 + Angular Material 18 — a fully themed, corporate-ready admin shell
(header, collapsible sidebar, breadcrumbs, theme engine with live customizer) plus
example pages. **Designed to be dropped into any Angular + Angular Material project
with little modification** — the shell is config-driven, and the whole look is built
on CSS custom properties.

## Quick Start (run this project)

```bash
npm install
npm start            # http://localhost:4200
```

---

## Reuse this design in another Angular Material project

Everything visual lives in a handful of self-contained, framework-idiomatic pieces.
To adopt the design elsewhere, copy these into the target project and wire up four
small things. No business logic is entangled with the shell.

### 1. Copy the design-system folders

| Copy from this repo | What it is |
|---|---|
| `src/styles.scss` | The entire theme engine: palettes, theme classes, and the CSS-variable contract. **This is the heart of the design.** |
| `src/app/core/services/theme.service.ts` | Signal-based theme state (active theme, custom colors, sidebar, font scale) with `localStorage` persistence. |
| `src/app/layout/` | `header/`, `sidebar/`, `footer/`, and `layout.config.ts` — the app shell, fully driven by `@Input()`s. |
| `src/app/shared/breadcrumb/` | Route-data-driven breadcrumb. |
| `src/app/shared/theme-customizer/` | Sliding panel to fine-tune colors live. |
| `src/app/shared/skeleton/` | Loading-skeleton component. |

The reusable parts have **no dependency** on the example `pages/` — leave those behind.

### 2. Add the dependency + fonts

Ensure `@angular/material` and `@angular/cdk` are installed (`ng add @angular/material`),
and add the icon + Inter fonts to `index.html`:

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3. Point the build at the global stylesheet

In `angular.json`, set `styles` to include the copied `src/styles.scss`.

### 4. Configure `app.config.ts` and compose the shell

```ts
// app.config.ts — needed for the breadcrumb route-param binding + animations
provideRouter(routes, withComponentInputBinding()),
provideAnimationsAsync(),
{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', floatLabel: 'always' } },
```

```html
<!-- app.component.html — the shell -->
<app-header [brand]="brand" [user]="user" (menuToggle)="theme.toggleSidebar()"
            (openCustomizer)="customizerOpen.set(true)"></app-header>
<aside [class.collapsed]="theme.sidebarCollapsed()">
  <app-sidebar [collapsed]="theme.sidebarCollapsed()"
               [brand]="brand" [user]="user" [navGroups]="nav"></app-sidebar>
</aside>
<main>
  <app-breadcrumb></app-breadcrumb>
  <router-outlet></router-outlet>
</main>
<app-theme-customizer [open]="customizerOpen()" (closed)="customizerOpen.set(false)"></app-theme-customizer>
```

That's it — the design now works in the new project.

---

## Configuring the shell (no component edits needed)

The header and sidebar are driven entirely by inputs typed in
[`src/app/layout/layout.config.ts`](src/app/layout/layout.config.ts). Bind your own
values from the host component:

```ts
import { BrandConfig, AppUser, NavGroup } from './layout/layout.config';

brand: BrandConfig = { name: 'Acme Cloud', icon: 'cloud', tagline: 'v1.0' };
user:  AppUser     = { initials: 'JD', name: 'Jane Doe', fullName: 'Jane Doe',
                       email: 'jane@acme.com', role: 'Owner' };
nav:   NavGroup[]  = [
  { title: 'Main', items: [{ label: 'Home', icon: 'home', route: '/home' }] },
];
```

Also overridable on `<app-header>`: `[notifications]` and `[roles]`. Every input has a
sensible placeholder default, so you can adopt the shell first and customize later.

## Breadcrumbs

Breadcrumbs are automatic and global (rendered once in the shell). Each route just
declares a label via route `data`:

```ts
{ path: 'reports', data: { breadcrumb: 'Reports' }, loadComponent: ... }
// dynamic label (e.g. a detail page):
{ path: ':id', data: { breadcrumb: (s) => s.paramMap.get('id') ?? 'Item' }, ... }
```

## App version / About drawer

The header's **ⓘ** icon opens an About drawer whose version, build number, build
date, commit, branch and framework versions are injected **at build time** — no
manual editing.

- [`scripts/generate-version.mjs`](scripts/generate-version.mjs) writes
  `src/app/core/version.ts` from `package.json`, git, and CI env vars. It runs
  automatically via the `postinstall` / `prestart` / `prebuild` / `prewatch` npm
  hooks, so `npm start` and `npm run build` always embed fresh metadata.
- `version.ts` is **git-ignored** (a build artifact); `postinstall` regenerates it
  right after `npm install` so a fresh clone always has it.
- [`src/app/core/app-info.ts`](src/app/core/app-info.ts) assembles the drawer's
  `AppInfo` from that data plus `isDevMode()` (Environment = Development / Production).
- CI build number is picked up from `BUILD_NUMBER`, `GITHUB_RUN_NUMBER`, or
  `CI_PIPELINE_IID` (falls back to `local`); git commit/branch fall back gracefully
  when git isn't available.

---

## The CSS-variable contract

Every component (yours included) styles itself against these custom properties, so it
automatically follows the active theme and dark mode. The most-used ones:

| Variable | Purpose |
|---|---|
| `--app-primary` / `--app-accent` | Brand primary / accent |
| `--page-bg` | App background |
| `--surface-bg` / `--surface-border` | Card/panel background + border |
| `--text-primary` / `--text-secondary` / `--text-muted` | Text hierarchy |
| `--sidebar-bg` / `--header-bg` | Shell chrome |
| `--card-radius` / `--card-shadow` | Card shape + elevation |
| `--status-success/-warning/-error/-info` | Status colors |
| `--transition-fast/-normal/-slow` | Motion |

In your own components, write `color: var(--text-primary)` /
`background: var(--surface-bg)` instead of literal colors — that's the whole trick to
staying theme-aware.

## Themes

| Theme | Primary | Notes |
|---|---|---|
| Corporate Blue | #1565C0 | Classic enterprise default |
| Brand Cyan | #02A7DF | Sky blue |
| Growth Green | #74BA58 | Energising green |
| Sunset Orange | #FF6A1C | Bold orange |
| Midnight Dark | #BB86FC | Full dark mode |
| Aurora / Lagoon | #02A7DF | Tri-tone / light UI |

Switch via the **palette icon** in the header or **Settings → Appearance**. Open the
**Theme Customizer** to fine-tune colors live.

Theming uses **Angular Material 3 (M3)** via `mat.define-theme()` with predefined
M3 palettes; the exact brand colors are kept in CSS custom properties (so the custom
UI — sidebar, cards, header, charts — stays on-brand regardless of the M3 palette).

### Adding a theme

1. Add a `.theme-<id>` class in `styles.scss` setting `--app-primary`, `--sidebar-bg`, etc.
2. Add a `mat.define-theme((color: (theme-type: light, primary: …, tertiary: …)))`
   block and apply it with `mat.all-component-colors(...)` for the Material components.
3. Register it in `theme.service.ts` → `THEME_PRESETS`.

---

## Example pages (reference / delete when reusing)

| Route | Description |
|---|---|
| `/dashboard` | KPI cards, SVG sparklines, deals table, pipeline, activity feed |
| `/analytics` | Tabs: revenue bar chart, team performance, funnel |
| `/team` | Searchable member grid, performance bars, department accordion |
| `/projects` | Project cards |
| `/jobs` | **Job Manager** — Material data table with live status/progress, start/cancel/retry |
| `/jobs/:id` | **Job Detail** — progress, metadata, activity log |
| `/onboarding` | Multi-step onboarding flow |
| `/settings` | Profile, appearance, notifications, security |

## Project structure

```
scripts/
└── generate-version.mjs            ← Build-time version metadata generator
src/
├── app/
│   ├── core/
│   │   ├── services/theme.service.ts ← Signal-based theme state [reusable]
│   │   ├── services/job.service.ts   ← Job Manager demo data
│   │   ├── app-info.ts             ← Builds About-drawer info from build data
│   │   └── version.ts              ← AUTO-GENERATED build metadata (git-ignored)
│   ├── layout/
│   │   ├── layout.config.ts        ← Shell inputs + defaults   [reusable]
│   │   ├── header/                 ← Toolbar, theme menu, user [reusable]
│   │   ├── sidebar/                ← Collapsible nav           [reusable]
│   │   └── footer/                 ← Pinned footer             [reusable]
│   ├── shared/
│   │   ├── breadcrumb/             ← Route-driven breadcrumb   [reusable]
│   │   ├── theme-customizer/       ← Live color panel          [reusable]
│   │   ├── info-drawer/            ← About panel (right slide) [reusable]
│   │   └── skeleton/               ← Loading skeleton          [reusable]
│   └── pages/                      ← Example pages (reference)
└── styles.scss                     ← Theme engine + theme classes  [reusable]
```
