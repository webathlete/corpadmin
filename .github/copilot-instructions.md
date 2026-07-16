# Copilot instructions — Angular 18 + Material 3 corporate design system

These conventions apply to ALL edits in this repo. Match the existing code: standalone
components, signals, new control flow (`@if`/`@for`), Angular Material 3 (M3).

## Theming model (most important)
- Theme with a **CSS custom-property token layer on top of Material 3**. Material 3 colors
  the Material components; CSS variables color the custom UI and are what we flip to switch
  theme/dark mode.
- **Author every component against tokens; never hard-code hex.**
  Good: `color: var(--text-primary); background: var(--surface-bg);`
  Bad: `color: #1a202c; background: #fff;`
- **No static `style="..."` in templates.** Extract to component SCSS classes or shared
  utilities. Dynamic `[style.x]` bindings (data-driven values) are allowed.

## Tokens (defined in `src/styles.scss` `:root`; re-declared per `.theme-*` class)
- Color: `--app-primary`, `--app-accent`, `--page-bg`, `--surface-bg`, `--surface-border`,
  `--text-primary` (#2d3748 slate, not near-black), `--text-secondary`, `--text-muted`,
  `--header-bg`, `--sidebar-bg`, `--status-success|warning|error`.
- Shape: `--radius-sm|md|lg|pill`. Elevation: `--elevation-1|2|3`.
- Motion: `--ease-standard`, `--ease-emphasized`, `--duration-short|medium|long`,
  `--transition-fast|normal`. Use these instead of literal timings/easings.
- Layout: `--header-height`, `--sidebar-width`, `--footer-height`.

## Material 3 theme setup
- `mat.define-theme()` with predefined M3 palettes (azure, cyan, green, orange, violet, …);
  `primary` = brand, `tertiary` = accent. Base theme on `html`; per-theme color-only classes
  via `mat.all-component-colors(...)`. Typography family Inter; `density: (scale: -1)`.

## M3 gotchas (handle in `styles.scss`)
- `color="primary"` has no M3 CSS but still adds the `.mat-primary` class — target it and bind
  buttons to `--app-primary` (raised/flat = filled brand bg + white label; text/stroked = brand label).
- `mat-slide-toggle` is oversized → `transform: scale(.82)`.
- `.mat-mdc-option { min-height: 36px; }` for compact dropdowns.
- Form-field height: drive via `.mat-mdc-form-field-infix` min-height/padding, never a fixed
  wrapper height. Toolbar fields use an `.inline-field` variant.
- Cards: token-bound radius/elevation + hover lift.
- Typography: prefer `font-weight: 600` over `700`.

## Layout shell
- Fixed header + flex-column `.app-shell` (100vh); `.app-body` flexes; `app-footer` pinned bottom.
- Header (brand, theme switcher, notifications, info/About, user menu), collapsible sidebar
  (260↔68px) with a circular edge collapse handle, global route-data breadcrumbs, right slide-in
  About drawer + Theme Customizer.
- Header/sidebar/footer are **config-driven via `@Input()`s** from `layout/layout.config.ts`
  (`DEFAULT_*` constants). Sidebar emits `toggleCollapse`; the shell wires it to `ThemeService`.

## Theme switching
- Signal-based `ThemeService` (`providedIn: 'root'`): toggles a `.theme-<id>` class on
  `document.documentElement` via `effect()`, persists to `localStorage`. Also owns
  `sidebarCollapsed` and `fontScale`.

## Accessibility (always)
- `aria-label` on every icon-only button.
- `:focus-visible` ring using `--app-primary`; 48×48 min touch targets on icon buttons.
- Honor `prefers-reduced-motion`. Keep ≥4.5:1 text contrast in every theme incl. dark.

## Data & build
- Every data table gets **MatSort + MatPaginator**; forms use outline appearance + floating labels.
- Build-time version metadata via `scripts/generate-version.mjs` → `src/app/core/version.ts`
  (npm pre-hooks; gitignored). Keep `angular.json` budgets realistic (~2MB initial).
- After changes, ensure `ng build` passes.
