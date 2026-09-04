// ============================================================
// Layout configuration contract
// ------------------------------------------------------------
// The header and sidebar are fully driven by these inputs, so the
// whole shell can be reused in any Angular Material project by
// binding your own values — no need to edit the components.
//
//   <app-header [brand]="myBrand" [user]="myUser"
//               [notifications]="myNotifs" [roles]="myRoles">
//   <app-sidebar [brand]="myBrand" [user]="myUser" [navGroups]="myNav">
//
// The DEFAULT_* constants below are sensible placeholders; override
// any (or all) of them from your own app.
// ============================================================

export interface BrandConfig {
  /** Product / app name shown in the header and sidebar. */
  name: string;
  /** Material icon name for the logo mark. */
  icon: string;
  /** Small caption under the name in the sidebar (e.g. version, edition). */
  tagline?: string;
}

export interface AppUser {
  /** Initials shown in avatars, e.g. "GS". */
  initials: string;
  /** Short name for compact spots (header button, sidebar). */
  name: string;
  /** Full name for the user menu. */
  fullName: string;
  email: string;
  /** Role label shown under the name in the sidebar. */
  role: string;
}

export interface NavItem {
  label: string;
  /** Material icon name. */
  icon: string;
  /** Router link, e.g. "/dashboard". */
  route: string;
  /** Optional badge text (count or label like "New"). */
  badge?: string;
  /** Shown only when the current user has the admin role. */
  adminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface UserRole {
  name: string;
  /** Where the role applies, e.g. "Finance". Shown as a tooltip. */
  scope: string;
  icon: string;
  /** Color encodes permission level (red = admin, blue = editor, …). */
  color: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

/** Content for the global footer pinned to the bottom of the shell. */
export interface FooterConfig {
  /** Copyright / left-side text. */
  copyright: string;
  /** Right-side quick links (Privacy, Terms, …). */
  links: FooterLink[];
  /** Optional version tag shown at the far right. */
  version?: string;
}

export interface AppInfoRow {
  label: string;
  value: string;
  icon: string;
}

export interface AppInfoLink {
  label: string;
  url: string;
  icon: string;
}

/** Content for the "About" drawer (header info icon → left slide-in panel). */
export interface AppInfo {
  name: string;
  icon: string;
  version: string;
  /** Short tag shown next to the version, e.g. "Stable", "Beta". */
  channel?: string;
  /** Detail rows — version, build date, environment, etc. */
  rows: AppInfoRow[];
  /** Optional external links (docs, release notes, support). */
  links: AppInfoLink[];
  copyright: string;
}

// ------------------------------------------------------------
// Default placeholders — override these from your app.
// ------------------------------------------------------------
export const DEFAULT_BRAND: BrandConfig = {
  name: 'CorpAdmin',
  icon: 'corporate_fare',
  tagline: 'v2.0 Enterprise',
};

export const DEFAULT_USER: AppUser = {
  initials: 'GS',
  name: 'Govind S.',
  fullName: 'Govind Sundaramoorthy',
  email: 'admin@example.com',
  role: 'Administrator',
};

export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard',   icon: 'dashboard',     route: '/dashboard' },
      { label: 'Operations',  icon: 'monitor_heart', route: '/operations' },
      { label: 'Analytics',   icon: 'bar_chart',     route: '/analytics' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Projects',    icon: 'folder_open',   route: '/projects' },
      { label: 'Components',  icon: 'table_chart',   route: '/components' },
      { label: 'Job Manager', icon: 'work_history',  route: '/jobs' },
      { label: 'Job Executions', icon: 'account_tree', route: '/job-executions' },
      { label: 'Parameter Configuration', icon: 'tune', route: '/parameters' },
      { label: 'Onboarding',  icon: 'person_add',    route: '/onboarding', badge: 'New' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Team',        icon: 'group',         route: '/team', badge: '4' },
      { label: 'Settings',    icon: 'settings',      route: '/settings' },
      { label: 'Admin Console', icon: 'admin_panel_settings', route: '/admin', adminOnly: true },
    ],
  },
];

export const DEFAULT_ROLES: UserRole[] = [
  { name: 'Admin',  scope: 'Acme HQ',        icon: 'admin_panel_settings', color: '#dc2626' },
  { name: 'Editor', scope: 'Marketing Team', icon: 'edit_note',            color: '#2563eb' },
  { name: 'Viewer', scope: 'Finance',        icon: 'visibility',           color: '#16a34a' },
];

export const DEFAULT_FOOTER: FooterConfig = {
  copyright: `© ${new Date().getFullYear()} CorpAdmin. All rights reserved.`,
  links: [
    { label: 'Privacy', url: '#' },
    { label: 'Terms', url: '#' },
    { label: 'Support', url: '#' },
    { label: 'Status', url: '#' },
  ],
  version: 'v2.0.0',
};

export const DEFAULT_APP_INFO: AppInfo = {
  name: 'CorpAdmin',
  icon: 'corporate_fare',
  version: '2.0.0',
  channel: 'Stable',
  rows: [
    { label: 'Version',          value: '2.0.0',                  icon: 'sell' },
    { label: 'Build',            value: '2.0.0+build.1042',       icon: 'tag' },
    { label: 'Build date',       value: 'Jun 22, 2026',           icon: 'event' },
    { label: 'Environment',      value: 'Production',             icon: 'dns' },
    { label: 'Angular',          value: '18.2',                   icon: 'code' },
    { label: 'Angular Material', value: '18.2',                   icon: 'widgets' },
    { label: 'Commit',           value: 'a1b2c3d',                icon: 'commit' },
    { label: 'License',          value: 'MIT',                    icon: 'gavel' },
  ],
  links: [
    { label: 'Documentation', url: '#', icon: 'menu_book' },
    { label: 'Release notes',  url: '#', icon: 'history' },
    { label: 'Support',        url: '#', icon: 'support_agent' },
  ],
  copyright: '© 2026 CorpAdmin. All rights reserved.',
};
