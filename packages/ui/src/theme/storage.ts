import { ThemeConfig } from './types';

const STORAGE_KEY = 'mp-theme';
const CUSTOM_THEMES_KEY = 'meaty-custom-themes';

export const themeStorage = {
  // Get saved theme name
  getTheme(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },

  // Set theme name
  setTheme(themeName: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  // Remove saved theme
  removeTheme(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  // Get custom themes
  getCustomThemes(): ThemeConfig[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Save custom theme
  setCustomTheme(theme: ThemeConfig): void {
    if (typeof window === 'undefined') return;
    try {
      const customThemes = this.getCustomThemes();
      const existingIndex = customThemes.findIndex(t => t.name === theme.name);

      if (existingIndex >= 0) {
        customThemes[existingIndex] = theme;
      } else {
        customThemes.push(theme);
      }

      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  // Remove custom theme
  removeCustomTheme(themeName: string): void {
    if (typeof window === 'undefined') return;
    try {
      const customThemes = this.getCustomThemes();
      const filtered = customThemes.filter(theme => theme.name !== themeName);
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(filtered));
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  // Clear all custom themes
  clearCustomThemes(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CUSTOM_THEMES_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};
