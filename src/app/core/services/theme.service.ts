import { Injectable, signal, computed, effect } from '@angular/core';

// ============================================================
// Theme Definitions
// ============================================================
export interface ThemePreset {
  id: string;
  name: string;
  cssClass: string;
  primaryColor: string;
  accentColor: string;
  isDark: boolean;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    cssClass: 'theme-corporate-blue',
    primaryColor: '#1565C0',
    accentColor: '#0288D1',
    isDark: false,
    description: 'Classic professional blue — trusted by enterprise',
  },
  {
    id: 'brand-cyan',
    name: 'Brand Cyan',
    cssClass: 'theme-brand-cyan',
    primaryColor: '#02A7DF',
    accentColor: '#00BCD4',
    isDark: false,
    description: 'Fresh sky blue — modern and vibrant',
  },
  {
    id: 'growth-green',
    name: 'Growth Green',
    cssClass: 'theme-growth-green',
    primaryColor: '#74BA58',
    accentColor: '#26A69A',
    isDark: false,
    description: 'Energising green — forward-thinking teams',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    cssClass: 'theme-sunset-orange',
    primaryColor: '#FF6A1C',
    accentColor: '#FF9800',
    isDark: false,
    description: 'Bold orange — dynamic and energetic',
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    cssClass: 'theme-midnight',
    primaryColor: '#82B1FF',
    accentColor: '#80CBC4',
    isDark: true,
    description: 'Dark mode — easy on the eyes',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    cssClass: 'theme-aurora',
    primaryColor: '#02A7DF',
    accentColor: '#FF6A1C',
    isDark: false,
    description: 'Vivid tri-tone — cyan, green & orange',
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    cssClass: 'theme-lagoon',
    primaryColor: '#02A7DF',
    accentColor: '#38B19B',
    isDark: false,
    description: 'Fresh light UI — cyan, teal & green with a white sidebar',
  },
];

export interface CustomColors {
  primaryColor: string;
  accentColor: string;
  sidebarBg: string;
  headerBg: string;
}

// ============================================================
// Theme Service (signal-based)
// ============================================================
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // State signals
  readonly activeThemeId = signal<string>('corporate-blue');
  readonly customColors = signal<CustomColors | null>(null);
  readonly sidebarCollapsed = signal<boolean>(false);
  readonly fontScale = signal<number>(1); // 0.875 | 1 | 1.125

  // Derived
  readonly activeTheme = computed(() =>
    THEME_PRESETS.find(t => t.id === this.activeThemeId()) ?? THEME_PRESETS[0]
  );
  readonly isDarkMode = computed(() => this.activeTheme().isDark);

  constructor() {
    this.loadFromStorage();

    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme(this.activeThemeId());
    });

    // Apply font scale
    effect(() => {
      document.documentElement.style.setProperty('--app-font-scale', String(this.fontScale()));
    });
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------
  setTheme(id: string): void {
    this.activeThemeId.set(id);
    this.customColors.set(null);
    this.saveToStorage();
  }

  applyCustomColors(colors: Partial<CustomColors>): void {
    const current = this.customColors() ?? this.getThemeColors();
    const next = { ...current, ...colors };
    this.customColors.set(next);
    this.applyCustomCssVars(next);
    this.saveToStorage();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  setFontScale(scale: number): void {
    this.fontScale.set(scale);
    this.saveToStorage();
  }

  resetCustomColors(): void {
    this.customColors.set(null);
    this.applyTheme(this.activeThemeId());
    this.saveToStorage();
  }

  getThemeColors(): CustomColors {
    const theme = this.activeTheme();
    return {
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      sidebarBg: getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-bg').trim() || '#1a237e',
      headerBg: getComputedStyle(document.documentElement)
        .getPropertyValue('--header-bg').trim() || theme.primaryColor,
    };
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------
  private applyTheme(themeId: string): void {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    THEME_PRESETS.forEach(t => {
      root.classList.remove(t.cssClass);
      body.classList.remove(t.cssClass);
    });

    // Apply new theme
    const theme = THEME_PRESETS.find(t => t.id === themeId) ?? THEME_PRESETS[0];
    root.classList.add(theme.cssClass);
    body.classList.add(theme.cssClass);

    // Re-apply custom colors if any
    const custom = this.customColors();
    if (custom) {
      this.applyCustomCssVars(custom);
    }
  }

  private applyCustomCssVars(colors: CustomColors): void {
    const root = document.documentElement;
    root.style.setProperty('--app-primary', colors.primaryColor);
    root.style.setProperty('--header-bg', colors.headerBg);
    root.style.setProperty('--sidebar-bg', colors.sidebarBg);
    root.style.setProperty('--app-accent', colors.accentColor);
  }

  private saveToStorage(): void {
    try {
      const state = {
        themeId: this.activeThemeId(),
        customColors: this.customColors(),
        sidebarCollapsed: this.sidebarCollapsed(),
        fontScale: this.fontScale(),
      };
      localStorage.setItem('app-theme-state', JSON.stringify(state));
    } catch { /* ignore */ }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem('app-theme-state');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.themeId) this.activeThemeId.set(state.themeId);
      if (state.customColors) this.customColors.set(state.customColors);
      if (state.sidebarCollapsed !== undefined) this.sidebarCollapsed.set(state.sidebarCollapsed);
      if (state.fontScale) this.fontScale.set(state.fontScale);
    } catch { /* ignore */ }
  }
}
