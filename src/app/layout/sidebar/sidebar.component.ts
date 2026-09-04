import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import {
  AppUser,
  BrandConfig,
  NavGroup,
  DEFAULT_BRAND,
  DEFAULT_USER,
  DEFAULT_NAV_GROUPS,
} from '../layout.config';
import { AuthRoleService } from '../../core/services/auth-role.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly collapsed = input<boolean>(false);

  /** Emitted when the edge handle is clicked; the shell flips the collapsed state. */
  readonly toggleCollapse = output<void>();

  // Bind your own, or rely on the placeholder defaults.
  readonly brand = input<BrandConfig>(DEFAULT_BRAND);
  readonly user = input<AppUser>(DEFAULT_USER);
  readonly navGroups = input<NavGroup[]>(DEFAULT_NAV_GROUPS);

  private readonly auth = inject(AuthRoleService);

  /** Nav with admin-only items stripped for non-admins (groups left empty vanish). */
  readonly visibleGroups = computed<NavGroup[]>(() => {
    const isAdmin = this.auth.hasRole('admin');
    return this.navGroups()
      .map(g => ({ ...g, items: g.items.filter(i => !i.adminOnly || isAdmin) }))
      .filter(g => g.items.length > 0);
  });
}
