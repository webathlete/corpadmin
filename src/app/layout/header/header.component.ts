import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { ThemeService, THEME_PRESETS } from '../../core/services/theme.service';
import { NotificationBellComponent } from '../../shared/notification-bell/notification-bell.component';
import {
  AppUser,
  BrandConfig,
  UserRole,
  DEFAULT_BRAND,
  DEFAULT_USER,
  DEFAULT_ROLES,
} from '../layout.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    NotificationBellComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuToggle = output<void>();
  openCustomizer = output<void>();
  openInfo = output<void>();

  // Branding & content — bind your own, or rely on the placeholder defaults.
  readonly brand = input<BrandConfig>(DEFAULT_BRAND);
  readonly user = input<AppUser>(DEFAULT_USER);
  // Roles this user is assigned to (read-only — a user may have many).
  // color = permission level: Admin (red) > Editor (blue) > Viewer (green).
  readonly roles = input<UserRole[]>(DEFAULT_ROLES);

  readonly themeService = inject(ThemeService);
  readonly themes = THEME_PRESETS;

  // Text-size options for the theme menu (value = --app-font-scale multiplier).
  readonly fontSizes = [
    { label: 'Small',  value: 0.875 },
    { label: 'Medium', value: 1 },
    { label: 'Large',  value: 1.125 },
  ];

  selectTheme(id: string): void {
    this.themeService.setTheme(id);
  }
}
