# Parameter Configuration Page — Design & Development Prompt

## Overview
Build a comprehensive Parameter Configuration CRUD interface with two interaction variants (Dialog-based and Inline Panel) across 4 parameter type tabs. Use Angular 18+ with Material Design 3, existing design tokens, and zero custom CSS overhead.

**Scope**: Standalone page component routing to `/parameters` with 1000+ synthetic test rows (~250 per type).

---

## Functional Requirements

### 1. Page Structure
- **4 Tabs** (radio-button or tab-group style):
  - System Parameters
  - Validation Parameters
  - Integration Parameters
  - Workflow Parameters

- **Mode Toggle**: Switch between Dialog-based and Inline Panel variants
  - Dialog: Traditional modal form for CRUD
  - Inline Panel: Master-detail side-by-side layout

- **Toolbar**:
  - "+ Add Entry" button
  - Optional refresh button
  - Mode toggle (radio buttons or switch)

### 2. List View (Data Table)
**Columns** (in order):
- ID (narrow, monospace)
- Name (flex)
- Description (flex, text-overflow)
- Enabled (boolean badge/icon)
- Type (displays parameter type name via lookup)
- Created On (date, sortable)
- Updated On (date, sortable)
- Actions (view, edit, delete icons)

**Features**:
- Material table with sticky header
- Pagination: 100 rows per page (data-table component handles this)
- Skeleton loading placeholders (replaced progress bar)
- Sorting by any column
- Row selection optional (checkboxes)

### 3. Dialog-Based CRUD
**Create/Edit Dialog**:
- Modal with tighter corners (var(--radius-md))
- Header badge with icon (add_circle / edit)
- Type label as subtitle
- Form fields in shared component (see below)
- Action buttons: Cancel, Save Changes / Create Parameter

**View Dialog** (read-only):
- Shows all entry metadata
- Lookup names resolved (id → lookup name)
- Edit button jumps to form dialog
- Close button only

### 4. Inline Panel CRUD (Alternative)
**Master Panel** (left, 30-40% width):
- Searchable list of entries (latest updated first)
- Selection highlights current entry
- Show More button (increments by 100 rows)
- Sticky top with search box
- Refresh automatically when form saves/deletes

**Detail Panel** (right, 60-70% width):
- Always-open edit form
- Save/Cancel buttons
- Delete button with confirmation
- Loads entry on selection from left panel
- Disables form in initial/empty state

### 5. Form Fields (Shared Component)
**Layout**: 2-column grid (grid-template-columns: 1fr 1fr)

**Field Order**:
1. Name (full-width, text input)
2. Description (full-width, textarea)
3. Category (left col 2, single-select lookup)
4. Parameter Type (right col 2, single-select lookup)
5. Condition 1 (left col 3, single-select lookup)
6. Condition 2 (right col 3, single-select lookup)
7. Condition 3 (left col 4, single-select lookup)
8. Active (right col 4, toggle + warning text)

**Controls**:
- Text inputs: standard Material text-field
- Textarea: auto-expand, 3 lines min
- Lookups: Custom LookupPickerComponent (ControlValueAccessor)
  - Searchable by id and name (case-insensitive)
  - Display as chip with id+name when selected
  - Dropdown panel on focus/type
  - Error state: "Required" label (reserved height 18px)
- Active toggle: mat-slide-toggle
  - Shows warning if another entry is active (auto-deactivates on save)
  - Label: "Active" (above toggle, using global .field-label)

**Validation**:
- Name, Category, Parameter Type, all 3 Conditions: required
- Description, Active: optional

### 6. Mutual Exclusivity
**Rule**: Only one entry per tab type can be active.
- Activating entry A auto-deactivates entry B (same type)
- Warning shown in form: "Deactivates: [Entry B Name]"
- Enforced at service level (deactivateOthers() method)

### 7. Lookup Data
**4 Lookup Arrays** (all: {id: string, name: string}[]):
- CATEGORIES: ~10 items (Finance, Compliance, Reporting, etc.)
- PARAMETER_TYPES: ~8 items (Integer, String, Date, Boolean, Decimal, Enum, etc.)
- CONDITIONS: ~12 items (Equals, NotEquals, GreaterThan, LessThan, Contains, etc.)

**Seeded Test Data**:
- ~250 entries per type (1000 total)
- Realistic names (procedurally generated with industry keywords)
- Dates spread across 2 years (created/updated)
- Active flags: one per type marked active

---

## Technical Architecture

### Component Structure
```
parameter-config/
├── parameter-config.component.ts          (page shell, tabs, mode toggle)
├── parameter-config.component.html
├── parameter-config.component.scss        (minimal: layout only, no colors)
├── parameter-form-fields.component.ts     (shared form layout)
├── parameter-form-fields.component.html   (2-column grid, all controls)
├── parameter-form-fields.component.scss   (grid layout only)
├── parameter-form-dialog.component.ts     (dialog wrapper, create/edit)
├── parameter-form-dialog.component.html   (mat-dialog shell)
├── parameter-form-dialog.component.scss   (dialog badge styling)
├── parameter-view-dialog.component.ts     (read-only popup)
├── parameter-view-dialog.component.html
├── parameter-view-dialog.component.scss
└── parameter-inline-panel.component.ts    (master-detail variant)
    parameter-inline-panel.component.html
    parameter-inline-panel.component.scss

shared/
├── lookup-picker/
│   ├── lookup-picker.component.ts         (CVA for searchable single-select)
│   ├── lookup-picker.component.html
│   └── lookup-picker.component.scss       (minimal styling, tokenized)
└── data-table/
    ├── data-table.component.ts            (reusable table with row-actions)
    ├── data-table.component.html
    └── data-table.component.scss

core/services/
└── parameter-config.service.ts            (data, CRUD, lookups)
```

### Key Patterns

**1. Reactive Forms (FormBuilder)**
```typescript
createParameterForm(fb: FormBuilder, entry?: ParameterEntry) {
  return fb.group({
    name: [entry?.name ?? '', Validators.required],
    description: [entry?.description ?? ''],
    categoryId: [entry?.categoryId ?? '', Validators.required],
    parameterTypeId: [entry?.parameterTypeId ?? '', Validators.required],
    condition1Id: [entry?.condition1Id ?? '', Validators.required],
    condition2Id: [entry?.condition2Id ?? '', Validators.required],
    condition3Id: [entry?.condition3Id ?? '', Validators.required],
    active: [entry?.active ?? false],
  });
}
```

**2. ControlValueAccessor for LookupPicker**
- Implements get/set value, register on change/blur
- Stores only ID in form
- Displays "id + name" in chip for UX
- Error state managed via touchedAtLeast() / invalid

**3. Master-Detail in Inline Panel**
- visibleEntries = computed(() => entries.slice(0, pageSize()))
- showMore() increments pageSize by 100
- Selected entry binds form fields
- Save/delete trigger list refresh

**4. Service-Level CRUD**
- create(draft) → generates id, enforces mutual exclusivity
- update(id, draft) → deactivateOthers() if active
- delete(id) → removes entry
- getById(id) → returns entry
- activeSibling(type, excludeId) → returns active entry for type

---

## Design Tokens & Styling Rules

### ✅ DO
- **Use existing CSS custom properties** (--app-primary, --app-secondary, --radius-sm, --radius-md, --fs-xs, --fs-lg, --text-secondary, --border-color, etc.)
- **Tokenize shared patterns** in global styles.scss:
  - .field-label (4px margin-bottom, --fs-xs, 500 weight, --text-secondary)
  - .status-pill (icon + label badge)
  - .status-icon (sizing inside pill)
  - .lookup-id-tag (font-size --fs-2xs, font-weight 700, margin-right 6px)
  - .spin animation for rotating icons
- **Use Material shape tokens** (override if needed):
  - Dialog: var(--radius-md) not 28px
  - Buttons: var(--radius-sm) not 9999px
- **Grid for form layouts** (not flexbox for control alignment)
- **Skeleton loading** (matched to table column count)
- **Reserved error space** (18px min-height on all form fields to prevent reflow)

### ❌ DON'T
- Hardcode colors (use --app-primary, --app-secondary, --text-primary, etc.)
- Create new CSS tokens; reuse existing ones
- Add component-local CSS that duplicates global patterns
- Use magic-number padding to fake alignment
- Apply border-radius values directly (use var(--radius-*))
- Bloat SCSS with unused mixins or utilities
- Import Material themes outside the global styles.scss

### Material Design 3 Overrides (Global styles.scss)
```scss
// Shape token fixes for corporate aesthetic
--mdc-dialog-container-shape: var(--radius-md);
--mdc-filled-button-container-shape: var(--radius-sm);
--mdc-outlined-button-container-shape: var(--radius-sm);
--mdc-protected-button-container-shape: var(--radius-sm);
--mdc-text-button-container-shape: var(--radius-sm);
```

### Theming
- Light/dark theme support via CSS custom properties
- No hardcoded #hex colors in component SCSS
- Material theme applies automatically (respects system preference)

---

## Implementation Notes for GitHub Copilot (GPT Codex 5.3)

### Capabilities to Leverage
- **Angular 18 signals**: Use signal() for reactive state (entries, selectedEntry, pageSize)
- **Computed properties**: computed(() => ...) for derived state (visibleEntries, activeSiblingName)
- **Standalone components**: No NgModule, just imports: [] in decorator
- **FormBuilder API**: Familiar reactive forms patterns
- **Material directives**: [matSort], [matSortHeader], mat-table, mat-paginator, mat-dialog, etc.
- **CSS Grid**: Single-line grid-template-columns for 2-column form layout

### Limitations to Work Around
- **No context-long analysis**: Break large components into smaller files
- **Repeated scaffolding**: Copilot will re-suggest same patterns; copy-paste is OK
- **Limited custom logic inference**: Explicit method names (deactivateOthers, visibleEntries) help
- **CSS generation**: Ask for "Tailwind utility class" or "Material token" style to avoid bloat

### Prompting Strategy for Copilot
Use these prefixes in your Copilot comments/prompts:
```
// TODO: Generate form fields using FormBuilder (name, description, categoryId, parameterTypeId, condition1Id, condition2Id, condition3Id, active)
// TODO: Implement ControlValueAccessor for searchable single-select lookup (store id, display id+name)
// TODO: Create 2-column grid for form layout (grid-template-columns: 1fr 1fr; use global .field-label utility)
// TODO: Add mutual exclusivity logic: if active is true, deactivate all other entries of same type
// TODO: Implement master-detail list with computed visibleEntries and showMore() pagination
```

---

## Acceptance Criteria

### Functional
- [ ] 4 tabs render correctly, switching loads data per type
- [ ] Dialog variant: add, edit, view, delete work for all types
- [ ] Inline panel variant: list search, selection, form binding, save/delete work
- [ ] Mode toggle switches between dialog and inline panel
- [ ] Mutual exclusivity enforced: activating one entry auto-deactivates others
- [ ] Form validation shows errors (required fields, invalid states)
- [ ] Pagination: table shows 100 rows, inline panel shows "show more" every 100
- [ ] Skeleton loading shows while data is fetched
- [ ] All 1000 rows can be accessed via pagination/show-more

### Visual/UX
- [ ] Form fields aligned in perfect 2-column grid (no misalignment)
- [ ] Lookup dropdowns have no visual artifacts (stray lines, overlaps)
- [ ] Active toggle aligns with Condition 3 baseline (both 40px control height)
- [ ] Dialog corners use var(--radius-md), buttons use var(--radius-sm)
- [ ] Error messages show without causing row reflow (18px reserved space)
- [ ] Dark/light theme support works (no hardcoded colors)
- [ ] Skeleton rows match column count and layout

### Code Quality
- [ ] Zero hardcoded colors or border-radius values in component SCSS
- [ ] No duplicated utility classes (.status-pill, .field-label, .lookup-id-tag are global)
- [ ] Component imports minimal (only used modules)
- [ ] Form utility centralized (createParameterForm, toParameterDraft in shared util)
- [ ] Build succeeds with no warnings

---

## Sample Screenshots
Refer to:
- `snippets/screenshots/paramconfig1.png` — Dialog variant with tabs and table
- `snippets/screenshots/paramconfig2.png` — Inline panel variant with master-detail
- `snippets/screenshots/paramconfig3_popup.png` — View/edit dialog detail

---

## Files to Reference
- Design tokens: `src/styles.scss` (root CSS custom properties)
- M3 overrides: `src/styles.scss` (--mdc-* tokens)
- Data table: `src/app/shared/data-table/data-table.component.ts` (pagination, skeleton)
- Job Manager: `src/app/pages/job-manager/` (reference for similar CRUD patterns)
- Layout config: `src/app/layout/layout.config.ts` (brand, nav structure)

---

## Deliverables
1. **Components**: All 7 parameter-config files (ts, html, scss)
2. **Shared Components**: lookup-picker improvements, data-table row-actions
3. **Service**: parameter-config.service.ts with seed data (~1000 rows)
4. **Global Styles**: Consolidated utilities in styles.scss
5. **Route**: Add `/parameters` to routing module
6. **Test Data**: ~250 per type with realistic procedurally-generated names

---

## Quick Start
```bash
# Run dev server
ng serve

# Navigate to http://localhost:4200/parameters

# Toggle between Dialog and Inline Panel using radio buttons in toolbar
# Switch tabs to see System/Validation/Integration/Workflow parameters
# Click "Show More" in inline panel to load next 100 rows
# Click "Add Entry" to create new parameter
# Click row "Edit" icon to modify existing parameter
```
