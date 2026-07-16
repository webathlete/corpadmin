import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppInfo, DEFAULT_APP_INFO } from '../../layout/layout.config';

/**
 * Left slide-in drawer showing app metadata (version, build date, etc.).
 * Triggered from the header's info icon. Content is fully configurable via
 * the `info` input — bind your own AppInfo or rely on the default.
 */
@Component({
  selector: 'app-info-drawer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule],
  templateUrl: './info-drawer.component.html',
  styleUrl: './info-drawer.component.scss',
})
export class InfoDrawerComponent {
  readonly open = input<boolean>(false);
  readonly info = input<AppInfo>(DEFAULT_APP_INFO);
  readonly closed = output<void>();
}
