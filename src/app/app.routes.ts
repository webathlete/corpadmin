import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    data: { breadcrumb: 'Dashboard' },
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'analytics',
    data: { breadcrumb: 'Analytics' },
    loadComponent: () =>
      import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    data: { breadcrumb: 'Admin Console' },
    loadComponent: () =>
      import('./pages/admin/admin-console.component').then(m => m.AdminConsoleComponent),
  },
  {
    path: 'team',
    data: { breadcrumb: 'Team' },
    loadComponent: () =>
      import('./pages/team/team.component').then(m => m.TeamComponent),
  },
  {
    path: 'projects',
    data: { breadcrumb: 'Projects' },
    loadComponent: () =>
      import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
  },
  {
    path: 'operations',
    data: { breadcrumb: 'Operations' },
    loadComponent: () =>
      import('./pages/operations/operations.component').then(m => m.OperationsComponent),
  },
  {
    path: 'components',
    data: { breadcrumb: 'Components' },
    loadComponent: () =>
      import('./pages/showcase/showcase.component').then(m => m.ShowcaseComponent),
  },
  {
    path: 'jobs',
    data: { breadcrumb: 'Job Manager' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/job-manager/job-manager.component').then(m => m.JobManagerComponent),
      },
      {
        path: ':id',
        data: { breadcrumb: (route: { paramMap: { get: (k: string) => string | null } }) => route.paramMap.get('id') ?? 'Job' },
        loadComponent: () =>
          import('./pages/job-detail/job-detail.component').then(m => m.JobDetailComponent),
      },
    ],
  },
  {
    path: 'job-executions',
    data: { breadcrumb: 'Job Executions' },
    loadComponent: () =>
      import('./pages/job-executions/job-executions.component').then(m => m.JobExecutionsComponent),
  },
  {
    path: 'parameters',
    data: { breadcrumb: 'Parameter Configuration' },
    loadComponent: () =>
      import('./pages/parameter-config/parameter-config.component').then(m => m.ParameterConfigComponent),
  },
  {
    path: 'onboarding',
    data: { breadcrumb: 'Onboarding' },
    loadComponent: () =>
      import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent),
  },
  {
    path: 'settings',
    data: { breadcrumb: 'Settings' },
    loadComponent: () =>
      import('./pages/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
