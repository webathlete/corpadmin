import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { ThemeService, THEME_PRESETS } from '../../core/services/theme.service';

interface ColorPreset {
  label: string;
  primary: string;
  accent: string;
  sidebarBg: string;
  headerBg: string;
}

@Component({
  selector: 'app-theme-customizer',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatTooltipModule, MatSlideToggleModule, MatRadioModule, MatChipsModule,
  ],
  templateUrl: './theme-customizer.component.html',
  styleUrl: './theme-customizer.component.scss',
})
export class ThemeCustomizerComponent {
  open = input<boolean>(false);
  closed = output<void>();

  readonly themeService = inject(ThemeService);
  readonly themes = THEME_PRESETS;

  customPrimary = '#1565C0';
  customAccent  = '#0288D1';
  customSidebar = '#1a237e';
  customHeader  = '#1565C0';

  readonly quickColors = [
    '#1565C0', '#02A7DF', '#74BA58', '#FF6A1C',
    '#7B1FA2', '#E91E63', '#009688', '#FF5722',
    '#607D8B', '#795548', '#F57F17', '#1B5E20',
  ];

  selectTheme(id: string): void {
    this.themeService.setTheme(id);
    const t = THEME_PRESETS.find(x => x.id === id)!;
    this.customPrimary = t.primaryColor;
    this.customAccent  = t.accentColor;
    // Sync color pickers from CSS vars after theme applies
    setTimeout(() => {
      const style = getComputedStyle(document.documentElement);
      this.customSidebar = style.getPropertyValue('--sidebar-bg').trim() || this.customSidebar;
      this.customHeader  = style.getPropertyValue('--header-bg').trim()  || this.customHeader;
    }, 50);
  }

  onPrimaryChange(e: Event): void {
    this.customPrimary = (e.target as HTMLInputElement).value;
    this.applyColors();
  }
  onAccentChange(e: Event): void {
    this.customAccent = (e.target as HTMLInputElement).value;
    this.applyColors();
  }
  onSidebarChange(e: Event): void {
    this.customSidebar = (e.target as HTMLInputElement).value;
    this.applyColors();
  }
  onHeaderChange(e: Event): void {
    this.customHeader = (e.target as HTMLInputElement).value;
    this.applyColors();
  }

  applyQuickColor(color: string): void {
    this.customPrimary = color;
    this.customHeader  = color;
    this.applyColors();
  }

  private applyColors(): void {
    this.themeService.applyCustomColors({
      primaryColor: this.customPrimary,
      accentColor:  this.customAccent,
      sidebarBg:    this.customSidebar,
      headerBg:     this.customHeader,
    });
  }

  resetColors(): void {
    this.themeService.resetCustomColors();
    const t = THEME_PRESETS.find(x => x.id === this.themeService.activeThemeId())!;
    this.customPrimary = t.primaryColor;
    this.customAccent  = t.accentColor;
    setTimeout(() => {
      const style = getComputedStyle(document.documentElement);
      this.customSidebar = style.getPropertyValue('--sidebar-bg').trim() || '#1a237e';
      this.customHeader  = style.getPropertyValue('--header-bg').trim()  || t.primaryColor;
    }, 50);
  }
}
