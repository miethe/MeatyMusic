export interface ThemeColors extends Record<string, string> {
  // Background colors
  bg: string;
  surface: string;
  panel: string;
  border: string;
  ring: string;

  // Text colors
  textStrong: string;
  textBase: string;
  textMuted: string;

  // Brand colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;

  // State colors
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  radius: string;
  focusRingWidth?: string; // Enhanced focus ring width for accessibility themes
}

export interface ThemeContextValue {
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  setTheme: (themeName: string, source?: string) => void;
  setCustomTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
}
