# Copilot quick prompt (Angular 18 + Material 3 design system)

Paste this into GitHub Copilot Chat (GPT Codex 5.3) for a single page/component/fix.
Replace the last line with your specific task. For a full from-scratch transformation,
use the larger prompt or the repo's `.github/copilot-instructions.md` instead.

```text
Apply this app's design system (Angular 18 + Angular Material 3). Rules:
- Token layer over M3: style everything with CSS vars, never hard-coded hex
  (--app-primary, --surface-bg, --text-primary[#2d3748], --surface-border,
   --radius-md, --elevation-2, --transition-fast, --status-*). No static style="..."
   in templates — use SCSS classes (dynamic [style.x] is fine).
- Buttons: bind .mat-primary to --app-primary (M3 drops color="primary" styling).
- Cards: --radius-md + --elevation-2, hover → --elevation-3.
- Compact: slide-toggle scale(.82); mat-option min-height 36px; font-weight 600 not 700.
- Tables: add MatSort + MatPaginator. Forms: outline appearance + floating labels.
- a11y: aria-label on icon buttons; :focus-visible ring; 48px touch targets.
- Standalone components, signals, @if/@for. Run `ng build` and fix errors.
Task: <describe the one thing you want here>
```
