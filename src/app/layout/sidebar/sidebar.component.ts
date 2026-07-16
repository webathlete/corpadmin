import { Component, input, output } from '@angular/core';
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
}
