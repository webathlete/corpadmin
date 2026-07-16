# Footer components

Two drop-in, theme-aware footers. Both read the shared design tokens
(`--surface-bg`, `--surface-border`, `--text-*`, `--app-primary`, `--fs-*`,
`--radius-*`) and fall back to sensible hex values when those tokens aren't
present — so they work in any Angular app, not just this one.

| File | Component | Use for |
|------|-----------|---------|
| `footer.component.*` | `app-footer` | Slim, pinned/inline app-shell footer (copyright · links · version) |
| `footer-rich.component.*` | `app-footer-rich` | Expanded, multi-column marketing/landing footer |

Copy the three files for whichever you need into your project (e.g.
`src/app/shared/footer-rich/`) and import the standalone component.

---

## 1. Simple footer — `app-footer`

```ts
import { FooterComponent } from './shared/footer/footer.component';

@Component({ imports: [FooterComponent], /* ... */ })
```

```html
<app-footer [config]="{ copyright: '© 2026 Acme', version: 'v1.4.0',
                        links: [{ label: 'Docs', url: '#' }] }" />
```

### Pinning it to the bottom of the app shell

Pin **sticky** (only sticks once the page is short enough) — no fixed heights:

```scss
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-content { flex: 1 1 auto; }   /* pushes the footer down */
app-footer   { margin-top: auto; }
```

Pin **fixed** (always glued to the viewport bottom, content scrolls under it):

```scss
app-footer {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 10;
}
.app-content { padding-bottom: 56px; }  /* reserve the footer's height */
```

---

## 2. Rich footer — `app-footer-rich`

Renders a brand blurb + social icons, three link columns, and a bottom
legal bar. Fully config-driven via the `[footer]` input; defaults ship in
`DEFAULT_RICH_FOOTER`.

```ts
import { FooterRichComponent, RichFooterConfig }
  from './shared/footer-rich/footer-rich.component';

readonly footerCfg: RichFooterConfig = {
  brandName: 'Acme',
  brandIcon: 'bolt',
  tagline: 'Ship faster with Acme.',
  columns: [
    { title: 'Product', links: [{ label: 'Pricing', url: '/pricing' }] },
    { title: 'Company', links: [{ label: 'About',   url: '/about' }] },
    { title: 'Legal',   links: [{ label: 'Terms',   url: '/terms' }] },
  ],
  social: [{ icon: 'public', url: '#', label: 'Website' }],
  copyright: '© 2026 Acme, Inc.',
  legal: [{ label: 'Privacy', url: '/privacy' }],
};
```

```html
<app-footer-rich [footer]="footerCfg" />
<!-- or just <app-footer-rich /> to use the built-in defaults -->
```

> **Icons:** Material Icons has no brand logos. The defaults use generic
> glyphs (`public`, `code`, `alternate_email`, `mail`). Swap in inline brand
> SVGs if you need real logos.

Responsive: the brand/columns grid collapses to one column at 900px and the
link columns become 2-up at 560px.
