import { ThemeColors } from './types';

// Map theme color keys to CSS variable names (single source of truth)
const colorMap: Record<keyof ThemeColors, string> = {
  bg: '--mp-color-bg',
  surface: '--mp-color-surface',
  panel: '--mp-color-panel',
  border: '--mp-color-border',
  ring: '--mp-color-ring',
  textStrong: '--mp-color-text-strong',
  textBase: '--mp-color-text-base',
  textMuted: '--mp-color-text-muted',
  primary: '--mp-color-primary',
  primaryForeground: '--mp-color-primary-foreground',
  secondary: '--mp-color-secondary',
  accent: '--mp-color-accent',
  success: '--mp-color-success',
  warning: '--mp-color-warning',
  danger: '--mp-color-danger',
  info: '--mp-color-info',
};

// Dark-based themes that should activate Tailwind's dark mode
const DARK_THEMES = ['dark', 'midnight', 'dark-high-contrast'];

// Convert hex to HSL without the "hsl()" wrapper for CSS custom properties
function hexToHsl(hex: string): string {
  // Expand 3-digit hex to 6-digit
  let normalizedHex = hex;
  if (hex.length === 4) {
    normalizedHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  const r = parseInt(normalizedHex.slice(1, 3), 16);
  const g = parseInt(normalizedHex.slice(3, 5), 16);
  const b = parseInt(normalizedHex.slice(5, 7), 16);

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Normalize color value - if it's a hex, convert to HSL, otherwise use as-is
function normalizeColor(color: string): string {
  if (color.startsWith('#')) {
    return hexToHsl(color);
  }
  return color;
}

// Apply theme colors to CSS custom properties and manage dark mode class
export function applyThemeColors(colors: ThemeColors, themeName: string = 'light'): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Manage Tailwind dark mode class
  const isDarkTheme = DARK_THEMES.includes(themeName);
  if (isDarkTheme) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Apply each color to --mp-color-* variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = colorMap[key as keyof ThemeColors];
    if (cssVar) {
      root.style.setProperty(cssVar, normalizeColor(value));
    }
  });

  // Bridge colors to HSL variables for shadcn/ui compatibility
  // This ensures components using both systems work correctly
  root.style.setProperty('--background', colors.bg);
  root.style.setProperty('--foreground', colors.textStrong);
  root.style.setProperty('--card', colors.surface);
  root.style.setProperty('--card-foreground', colors.textBase);
  root.style.setProperty('--popover', colors.surface);
  root.style.setProperty('--popover-foreground', colors.textBase);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.primaryForeground);
  root.style.setProperty('--muted', colors.panel);
  root.style.setProperty('--muted-foreground', colors.textMuted);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.textStrong);
  root.style.setProperty('--destructive', colors.danger);
  root.style.setProperty('--destructive-foreground', colors.primaryForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.border);
  root.style.setProperty('--ring', colors.ring);
  root.style.setProperty('--sidebar-background', colors.panel);
}

// Clear theme colors (reset to defaults)
export function clearThemeColors(): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Remove dark mode class
  root.classList.remove('dark');

  // Clear --mp-color-* variables
  Object.values(colorMap).forEach(variable => {
    root.style.removeProperty(variable);
  });

  // Clear HSL variables as well
  const hslVariables = [
    '--background', '--foreground', '--card', '--card-foreground',
    '--popover', '--popover-foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring', '--sidebar-background'
  ];

  hslVariables.forEach(variable => {
    root.style.removeProperty(variable);
  });
}
