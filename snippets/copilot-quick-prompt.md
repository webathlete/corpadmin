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


You are working in an Angular 18.2 standalone-components codebase (no NgModules) using Angular Material 18 (M3), Angular signals, and SCSS. Build a complete, access-driven Admin Console feature. Follow every convention below exactly; do not introduce new patterns where an existing one is named.

## Chosen layout
Implement layout: <<< Option A — tabbed console | Option B — split workspace (left operations rail + right form, activity preview below) | Option C — launch cards opening dialogs + full-page audit trail >>>

## Project conventions you MUST reuse (all already exist)
- Design tokens in src/styles.scss: --app-primary (#1565C0), --status-success/--status-warning/--status-error/--status-info, --text-primary/--text-secondary/--text-muted, --surface-border, --overlay-hover, --radius-sm/md/lg, --fs-* type ramp. Never hardcode a colour that has a token. Never add global CSS.
- Page shell: wrap the page in <app-page-layout title="Admin Console" description="..." [breadcrumbs]="...">.
- Dialogs: use the shared shell src/app/shared/dialog/ — <app-dialog> (signal inputs: title, subtitle, icon, badge, tone, flush, actionsAlign; project the footer with the [dialogActions] marker directive) opened via DialogService.open(Component, { size: 'sm'|'md'|'lg'|'xl', data }). NEVER call MatDialog.open directly and never hand-roll mat-dialog-title/content/actions.
- Confirmations: ConfirmDialogService.confirm({ title, message, icon, tone: 'warn'|'primary', confirmLabel }) returns Observable<boolean>. Every destructive action (cancel run, delete audit entry, remove upload) goes through it.
- Toasts: NotificationService (core/services) — .success/.error/.info/.warning; it queues, so fire-and-forget is fine.
- Status pills: global classes .status-pill (sm/lg modifiers) + mat-icon.status-icon; colour via [style.color] and [style.background]="color + '1f'". A .spin class exists for running states.
- Component style: standalone: true, signal(), computed(), input()/output()/model() — no decorators @Input/@Output, no constructor-param DI (use inject()). Components carrying a `title` input add host: { '[attr.title]': 'null' } to suppress the native tooltip.
- Keep SCSS minimal: one small file per component, tokens with literal fallbacks, no duplicated pill/table styles.

## Access control (simulated, swappable)
1. core/services/auth-role.service.ts: AuthRoleService with readonly role = signal<'admin'|'user'>('admin') and hasRole(r). One clearly commented seam saying: replace this signal with IdP/OIDC claims; guard and consumers stay unchanged.
2. core/guards/admin.guard.ts: functional CanMatch guard. Non-admins: route does not match; redirect to /dashboard. Use canMatch (not canActivate) so the admin lazy chunk is never loaded for non-admins.
3. Route in app.routes.ts: path 'admin', canMatch: [adminGuard], loadComponent -> pages/admin/admin-console.component. Sidebar: render the "Admin Console" nav item (shield icon, small ADMIN lock badge) only when hasRole('admin'); place it under the MANAGEMENT group.

## Domain model + service (pages/admin/ or core/services/)
admin-job.service.ts, all signal-based, with simulated async execution (setTimeout ticks like the existing JobExecutionService):
- ManualJobDef: id, name, configs: { environments: string[], regions: string[] } — form fields: job dropdown, environment dropdown, region dropdown, run date (matDatepicker), run name (text, required, pattern [A-Za-z0-9-_]+).
- AdhocJobDef: id, name, inputs: AdhocInputDef[] where AdhocInputDef = { key, label, type: 'text'|'number'|'select'|'date', options?: string[], required: boolean }. The adhoc form is GENERATED from these descriptors with a typed FormGroup — never hardcoded per job.
- Batch: BatchSubmission = file mode (name, size, parsed row count) OR text mode (pasted records, line count). One component, a segmented toggle switches file-drop <-> textarea. Validate: file .csv/.txt max 5 MB; text non-empty, show live line count.
- AdminAuditEntry: id, kind: 'manual'|'adhoc'|'batch-file'|'batch-text', label, paramsSummary, triggeredBy: { name, initials }, triggeredAt: Date, status: 'queued'|'running'|'completed'|'failed', canCancel/canDelete derived from status.
- API: triggerManual(cfg), triggerAdhoc(id, values), submitBatch(sub), cancel(id) (only queued/running), remove(id) (only terminal states), audit = signal<AdminAuditEntry[]> newest first. triggeredBy comes from AuthRoleService's current user. Simulate: queued -> running (1–2s) -> completed (85%) or failed (15%).

## Features
1. Manual run form: the dropdowns/date/name above; disable the Run button while invalid or while a submission is in flight (double-submit guard); on success NotificationService.success + reset.
2. Adhoc: dropdown of AdhocJobDefs; on selection render its generated inputs; Run with same guards.
3. Batch: dropzone (drag-over highlight, click to browse) with the file/text toggle; on submit show parsed count in the toast and in the audit entry.
4. Audit trail: columns Operation (icon + label + params summary), Triggered by (initials avatar + name), Timestamp (MMM d, h:mm a), Status (status-pill, spin while running), row action: cancel icon (stop_circle) for queued/running, delete (delete_outline) for terminal — each behind ConfirmDialogService. Status filter chips with counts (hide zero-count) + a text search over label/id/user. Empty state with icon + message.
5. Access-denied: a simple /admin fallback is unnecessary (canMatch hides it) but add a guard unit test proving non-admins are redirected and the chunk is not matched.

## Quality bar
- No 'any'. Typed reactive forms. TrackBy on all @for loops.
- a11y: aria-labels on icon-only buttons, the dropzone keyboard-operable (Enter opens file picker), focus not stolen into destructive buttons.
- Tests: adminGuard (admin passes, user redirected), AdminJobService action matrix (cancel only while queued/running; remove only terminal), audit filtering.
- Deliver: guard + service + page + subcomponents (manual-run-form, adhoc-form, batch-input, audit-table) each in its own file pair, wired route, sidebar entry. Build must pass with ng build.



You are working in an Angular 18.2 standalone-components codebase (no NgModules) using Angular Material 18 (M3), Angular signals, and SCSS. Build a complete, access-driven Admin Console. Follow every convention below exactly; do not introduce new patterns where an existing one is named.

## Layout (decided): Option B — split workspace
A left operations rail (~290px, sticky) with one entry per admin function; the selected operation's form renders in a card on the right; a compact "Recent activity" card sits beneath every form. "Audit trail" is itself a first-class rail entry that swaps the workspace to the full filterable table. New admin functions added later = one new rail entry + one form component; nothing else changes. Stack the rail above the workspace below 900px.

## Project conventions you MUST reuse (all already exist)
- Design tokens in src/styles.scss: --app-primary (#1565C0), --status-success/-warning/-error/-info, --text-primary/-secondary/-muted, --surface-bg, --surface-border, --overlay-hover, --radius-sm/md/lg/pill, --fs-* type ramp. Never hardcode a colour that has a token; never add global CSS.
- Page shell: <app-page-layout title="Admin Console" description="..." [breadcrumbs]="...">.
- Confirmations: ConfirmDialogService.confirm({ title, message, icon, tone: 'warn'|'primary', confirmLabel }) -> Observable<boolean>. Every destructive action (cancel run, delete audit record) goes through it.
- Toasts: NotificationService (core/services) — .success/.error/.info/.warning; it queues, fire-and-forget is fine.
- Status pills: global .status-pill (sm/lg) + mat-icon.status-icon; colour via [style.color]="c" and [style.background]="c + '1f'"; .spin animates running states.
- Dialogs (if any are needed): the shared <app-dialog> shell via DialogService.open(Component, { size, data }); never raw MatDialog.open, never hand-rolled mat-dialog-title/content/actions.
- Component style: standalone: true; signal()/computed(); input()/output()/model() signal APIs — no @Input/@Output decorators; inject() only, no constructor-param DI. Inputs named `title` add host: { '[attr.title]': 'null' }.
- SCSS: one small file per component; shared form layout may live in one shared partial (admin-forms.scss) used as styleUrl by the form components.

## Access control (simulated, swappable)
1. core/services/auth-role.service.ts: AuthRoleService { readonly role = signal<'admin'|'user'>('admin'); currentUser = computed(() => ({ name, initials, role })); hasRole(r) }. One commented SWAP SEAM: replace the signal's value with the role claim from your OIDC/JWT token; guard and consumers stay unchanged.
2. core/guards/admin.guard.ts: functional CanMatchFn returning hasRole('admin') || router.createUrlTree(['/dashboard']). Use canMatch (NOT canActivate) so the /admin route never matches for non-admins and its lazy chunk is never downloaded — verify in DevTools that no admin chunk request occurs as a non-admin.
3. app.routes.ts: { path: 'admin', canMatch: [adminGuard], data: { breadcrumb: 'Admin Console' }, loadComponent: ... }.
4. Sidebar: add `adminOnly?: boolean` to the NavItem interface; add { label: 'Admin Console', icon: 'admin_panel_settings', route: '/admin', adminOnly: true } under the Management group; SidebarComponent computes visibleGroups = navGroups with adminOnly items filtered out for non-admins (empty groups vanish) and the template iterates visibleGroups().

## Domain model + service — core/services/admin-job.service.ts (signals, simulated async)
- ManualJobDef { id, name }; constants MANUAL_JOBS, ENVIRONMENTS, REGIONS, BATCH_JOBS.
- AdhocInputDef { key, label, type: 'text'|'number'|'select'|'date', required, options?, hint? }; AdhocJobDef { id, name, description, inputs: AdhocInputDef[] }; ADHOC_JOBS with 3 sample jobs. The adhoc form is GENERATED from these descriptors — adding an adhoc job is a data change only.
- AdminAuditEntry { id, kind: 'manual'|'adhoc'|'batch-file'|'batch-text', label, paramsSummary, triggeredBy: { name, initials }, triggeredAt: Date, status: 'queued'|'running'|'completed'|'failed'|'cancelled' }.
- API: audit = signal<AdminAuditEntry[]> (newest first, seeded with ~5 rows); triggerManual(cfg), triggerAdhoc(id, values), submitBatch({ jobId, mode: 'file'|'text', label, records }); canCancel(e) (queued|running), canRemove(e) (terminal); cancel(id) -> 'cancelled'; remove(id) deletes the record. triggeredBy comes from AuthRoleService.currentUser(). Simulate: queued -> running (~0.9s) -> completed (85%) or failed (~2–4s). statusColor/statusIcon/statusLabel/kindIcon helper maps.

## Feature components (pages/admin/)
1. admin-console.component: the Option B shell. Rail entries: Manual run, Adhoc job, Batch input, Audit trail — icon in a tinted square, label + one-line sub, active state = primary-tinted border/background. Audit entry shows an "N live" badge computed from in-flight entries. Below the rail, a lock note: "Visible to the admin role only. All actions are attributed and kept in the audit trail." Workspace: @switch on the selected signal; when not on audit, a second card renders <app-admin-audit-table preview> with a "Full audit trail →" button that selects the audit entry.
2. manual-run-form: typed reactive FormGroup — Job (select, required), Environment, Region, Run date (matDatepicker), Run name (required, pattern ^[A-Za-z0-9-_]+$ with mat-error). Reset + "Run job" (disabled while submitting — double-submit guard). On success: NotificationService.success + form reset to defaults.
3. adhoc-form: job mat-select; on selection rebuild a FormGroup<Record<string, FormControl<unknown>>> from the descriptors inside an effect(); render with @switch on input.type. IMPORTANT: give the 'date' type its own mat-form-field branch via @if — a mat-datepicker-toggle inside a @case with sibling nodes misses the [matIconSuffix] slot (NG8011). Show mat-hint from descriptor hints.
4. batch-input: batch-job select + a mat-button-toggle-group File | Text. File mode: a dropzone (dashed border, drag-over highlight, click or Enter opens a hidden <input type="file" accept=".csv,.txt">; role="button", tabindex="0", aria-label). Validate extension .csv/.txt and size ≤ 5 MB (toast errors); read the file with FileReader and count non-empty lines; show a picked-file card (name, size, row count, remove button). Text mode: textarea with live non-empty line count in mat-hint. Submit disabled until a job is chosen AND (file present | lines > 0); on submit toast "N records submitted" and clear.
5. audit-table (selector app-admin-audit-table): input preview (booleanAttribute transform; preview = latest 5, no toolbar). Full mode toolbar: clickable status chips styled as .status-pill sm with counts (zero-count statuses hidden, click toggles filter, non-active chips dimmed, aria-pressed), plus an outlined search field (subscriptSizing="dynamic") over label/params/user/id. mat-table columns: Operation (kind icon in tinted square + label + params summary, both ellipsized), Triggered by (initials avatar + name), Timestamp (date:'MMM d, h:mm a'), Status (status-pill, .spin while running), Actions (stop_circle "Cancel run" while canCancel, else delete_outline "Delete record" — each behind ConfirmDialogService, success/info toast after). trackBy on id. Empty state: history icon + "No audit entries match."

## Quality bar
- No `any`. Typed reactive forms. trackBy/track on every loop. aria-labels on all icon-only buttons.
- Tests: adminGuard (admin matches; non-admin gets UrlTree to /dashboard), AdminJobService action matrix (cancel only queued/running; remove only terminal), audit filter/search.
- `ng build` must pass with zero errors and zero template warnings.


