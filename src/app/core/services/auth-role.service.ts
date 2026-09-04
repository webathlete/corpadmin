import { Injectable, computed, signal } from '@angular/core';

export type AppRole = 'admin' | 'user';

export interface CurrentUser {
  name: string;
  initials: string;
  role: AppRole;
}

/**
 * Simulated access control.
 *
 * SWAP SEAM: to integrate a real IdP, replace the `role` signal's value with
 * the role claim from your OIDC/JWT token (e.g. set it in an auth callback).
 * `adminGuard`, the sidebar filtering and every consumer read through
 * `hasRole()` and stay unchanged.
 */
@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  readonly role = signal<AppRole>('admin');

  readonly currentUser = computed<CurrentUser>(() => ({
    name: 'Govind S.',
    initials: 'GS',
    role: this.role(),
  }));

  hasRole(role: AppRole): boolean {
    return this.role() === role;
  }
}
