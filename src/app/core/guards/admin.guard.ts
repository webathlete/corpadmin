import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';

/**
 * `CanMatch` (not `CanActivate`) on purpose: for non-admins the /admin route
 * never matches, so its lazy chunk is never even downloaded — the module
 * stays genuinely isolated rather than merely hidden.
 */
export const adminGuard: CanMatchFn = () =>
  inject(AuthRoleService).hasRole('admin') || inject(Router).createUrlTree(['/dashboard']);
