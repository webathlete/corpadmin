# Skill: Designing a Stunning, Modern, Vibrant & Corporate Angular 18 Material Theme

A practical playbook for building a polished, on-brand Angular 18 + Angular Material
(M3) UI. Distilled from this repo — every pattern here is implemented and shipping in
`src/`. Copy the patterns, not just the prose.

---

## 0. The one idea that makes it all work

**Theme with a CSS-variable token layer on top of Angular Material M3.**

- Angular Material M3 colors the *Material components* (buttons, form fields, tabs…).
- A layer of **CSS custom properties** (`--app-primary`, `--surface-bg`, `--text-primary`…)
  colors *your* UI (sidebar, cards, header, charts) **and** is what you flip at runtime
  to switch themes / dark mode.

This decoupling is why themes switch instantly (just swap a class on `<html>`), why dark
mode "just works", and why brand colors stay exact even when Material's palette only
approximates them. **Author every component against the tokens, never hard-coded hex.**

```scss
/* do this */            color: var(--text-primary);  background: var(--surface-bg);
/* never this */         color: #1a202c;              background: #fff;
```

---

## 1. Material 3 theme setup (Angular 18)

```scss
@use '@angular/material' as mat;
@include mat.core();

// Brand typography (M3 type scale, your font family)
$typography: ( brand-family: 'Inter, Roboto, sans-serif',
               plain-family: 'Inter, Roboto, sans-serif' );

// Base theme — emits color + typography + density once, on <html>.
$base: mat.define-theme((
  color: ( theme-type: light, primary: mat.$azure-palette, tertiary: mat.$cyan-palette ),
  typography: $typography,
  density: ( scale: -1 ),          // -1 = compact corporate feel; 0 = comfortable
));

// Color-only variants (typography/density inherited) applied via a class.
$cyan:  mat.define-theme((color: (theme-type: light, primary: mat.$cyan-palette,  tertiary: mat.$azure-palette)));
$dark:  mat.define-theme((color: (theme-type: dark,  primary: mat.$violet-palette, tertiary: mat.$cyan-palette)));

html              { @include mat.all-component-themes($base); }
.theme-brand-cyan { @include mat.all-component-colors($cyan); }
.theme-midnight   { @include mat.all-component-colors($dark); }
```

**Predefined M3 palettes** (v18): `red green blue azure cyan magenta orange yellow
chartreuse spring-green violet rose` — each `mat.$<name>-palette`. `primary` → brand,
`tertiary` → accent (M3 derives `secondary` from primary; `error` defaults to red).

**Pixel-exact brand colors on Material components?** Predefined palettes only *approximate*
your hex. For exact matches, generate custom palettes: `ng generate @angular/material:m3-theme`.
Otherwise keep exact brand color in the CSS tokens (section 3) and bind components to them
(section 5) — cheaper and recolors per theme for free.

---

## 2. The token system (define once in `:root`)

```scss
:root {
  // Brand (mirrors active palette; overridden per-theme class)
  --app-primary: #1565C0;  --app-accent: #0288D1;

  // Surfaces & text
  --page-bg: #f0f4f8;  --surface-bg: #fff;  --surface-border: #e2e8f0;
  --text-primary: #2d3748;   // strong slate, NOT near-black (bold reads softer)
  --text-secondary: #718096; --text-muted: #a0aec0;

  // Chrome
  --header-bg: #1565C0;  --sidebar-bg: #1a237e;

  // Shape — one radius scale, used everywhere
  --radius-sm: 8px;  --radius-md: 12px;  --radius-lg: 16px;  --radius-pill: 999px;

  // Elevation — Material dp levels
  --elevation-1: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.10);
  --elevation-2: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
  --elevation-3: 0 4px 8px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.10);

  // Motion — Material easing + durations
  --ease-standard:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);   // large surfaces / drawers
  --duration-short: 150ms; --duration-medium: 250ms; --duration-long: 350ms;
  --transition-fast: var(--duration-short) var(--ease-standard);

  // Status
  --status-success: #22c55e; --status-warning: #f59e0b; --status-error: #ef4444;
}
```

Dark mode = the same variable names re-declared under a theme class:

```scss
.theme-midnight {
  --page-bg: #121212;  --surface-bg: #1e1e1e;  --surface-border: rgba(255,255,255,.1);
  --text-primary: rgba(255,255,255,.87);  --text-secondary: rgba(255,255,255,.6);
  color-scheme: dark;
}
```

---

## 3. Vibrant + corporate palette recipes

Corporate ≠ dull. Pair a confident primary with a **lively tertiary** and a near-white
page background so color pops. Proven set from this repo:

| Theme | Primary | Accent | Vibe |
|---|---|---|---|
| Corporate Blue | `#1565C0` | `#0288D1` | Trusted enterprise default |
| Brand Cyan | `#02A7DF` | `#00BCD4` | Fresh, modern |
| Growth Green | `#74BA58` | `#26A69A` | Energetic, forward |
| Sunset Orange | `#FF6A1C` | `#FF9800` | Bold, dynamic |
| Midnight (dark) | `#BB86FC` | `#03DAC6` | Sleek dark mode |
| Aurora | `#02A7DF` | `#FF6A1C` | Vivid tri-tone |

Rules of thumb: page bg `#f0f4f8` (cool near-white) not pure `#fff`; one saturated brand
hue + one complementary accent; gradients for hero/KPI cards
(`linear-gradient(135deg, primary, accent)`); reserve fully saturated color for CTAs,
charts, and status — keep large surfaces calm.

---

## 4. Runtime theme switching

A signal-based service toggles a class on `<html>`/`<body>` and persists to `localStorage`.

```ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly activeThemeId = signal('corporate-blue');
  constructor() { effect(() => this.apply(this.activeThemeId())); }
  private apply(id: string) {
    const root = document.documentElement;
    PRESETS.forEach(t => root.classList.remove(t.cssClass));
    root.classList.add(PRESETS.find(t => t.id === id)!.cssClass);
  }
}
```

Each `.theme-*` class supplies (a) the `mat.all-component-colors(...)` block and (b) the
CSS-variable overrides. Switching = swap one class. No rebuild, no flash.

---

## 5. Component patterns & M3 gotchas

**Buttons lost their color in M3?** M3 ships *no* CSS for `color="primary"` — but the input
still adds the `.mat-primary` DOM class. Target it yourself and bind to your brand token so
CTAs match the brand and recolor per theme:

```scss
.mat-mdc-raised-button.mat-primary, .mat-mdc-unelevated-button.mat-primary {
  --mdc-protected-button-container-color: var(--app-primary);
  --mdc-protected-button-label-text-color: #fff;
  --mdc-filled-button-container-color: var(--app-primary);
  .mat-icon { color: #fff; }
}
.mat-mdc-button.mat-primary, .mat-mdc-stroked-button.mat-primary {
  color: var(--app-primary);
}
```

**Cards** — bind to tokens + a hover lift:
```scss
.mat-mdc-card {
  border-radius: var(--card-radius) !important;
  box-shadow: var(--elevation-2) !important;
  background: var(--surface-bg) !important;
  transition: box-shadow var(--transition-fast);
  &:hover { box-shadow: var(--elevation-3) !important; }
}
```

**Other M3 sizing tweaks worth knowing:** the switch (`mat-slide-toggle`) is larger than
M2 — `transform: scale(.82)` to slim it; `mat-option { min-height: 36px }` for compact
dropdowns; drive form-field height from `.mat-mdc-form-field-infix` `min-height`/padding
(never a fixed wrapper height — it breaks label centering).

**Typography polish:** prefer `font-weight: 600` over `700` for headings/emphasis, and a
strong slate (`#2d3748`) over near-black — bold then reads modern, not heavy.

---

## 6. Layout shell (the corporate frame)

Fixed header (`position: fixed`) + flex-column shell so a **footer pins to the bottom** and
the body flexes between:

```
.app-shell (flex column, 100vh)
  ├─ app-header     (position: fixed, top)
  ├─ .app-body      (flex: 1; margin-top: header-height) → sidebar + scrolling main
  └─ app-footer     (flex-shrink: 0)  ← always visible
```

Make the shell **config-driven** (brand, user, nav, footer as `@Input()`s) so it's reusable
across apps with zero component edits. Add: collapsible sidebar, route-data breadcrumbs, a
right slide-in drawer for "About"/info, and a theme customizer panel.

---

## 7. Accessibility (non-negotiable for corporate)

- `aria-label` on every icon-only button.
- Keyboard focus ring: `:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 2px; }`
- 48×48 min touch targets (`--mdc-icon-button-state-layer-size: 48px`).
- `@media (prefers-reduced-motion: reduce)` → near-zero transitions.
- Keep text ≥ 4.5:1 contrast in **every** theme incl. dark (`#2d3748` on white ≈ 10:1, AAA).

---

## 8. Build-time polish

- Inject real version/build metadata at build time (a `prebuild` node script → `version.ts`)
  for an About panel — never hardcode.
- Realistic `angular.json` budgets (a full Material app is ~1.4 MB; 500 kB/1 MB caps fail).
- Zero inline `style="…"` in templates — extract to classes + spacing utilities (8px grid).

---

## 9. Ship checklist

- [ ] All color/spacing/radius/elevation/motion via tokens; no hard-coded hex
- [ ] M3 `define-theme`; brand colors exact in tokens; CTAs bound to `--app-primary`
- [ ] Light **and** dark theme verified (contrast, surfaces, tables, form fields)
- [ ] Theme switch is instant and persists
- [ ] Header / sidebar / footer / breadcrumb all token-driven and config-driven
- [ ] a11y: aria-labels, focus-visible, 48px targets, reduced-motion
- [ ] Typography: 600 weights, slate (not black) text, Inter (or brand font) loaded
- [ ] Production build passes; budgets realistic; no inline styles
```
