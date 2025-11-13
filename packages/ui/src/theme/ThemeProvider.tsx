'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeConfig, ThemeContextValue } from './types';
import { applyThemeColors, clearThemeColors } from './utils';
import { themeStorage } from './storage';
import lightTheme from './themes/light';
import darkTheme from './themes/dark';
import midnightTheme from './themes/midnight';
import darkHighContrastTheme from './themes/high-contrast';
import lightHighContrastTheme from './themes/light-high-contrast';
import oceanTheme from './themes/ocean';
import sandTheme from './themes/sand';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
  onThemeChange?: (previous: string, current: string, source: string) => void;
}

// Built-in themes
const BUILT_IN_THEMES: ThemeConfig[] = [
  lightTheme,
  darkTheme,
  midnightTheme,
  lightHighContrastTheme,
  darkHighContrastTheme,
  oceanTheme,
  sandTheme,
];

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
  onThemeChange,
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(lightTheme);
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>(BUILT_IN_THEMES);

  // Load saved theme and custom themes on mount
  useEffect(() => {
    const loadThemes = () => {
      // Load custom themes
      const savedCustomThemes = themeStorage.getCustomThemes();
      setCustomThemes(savedCustomThemes);

      // Combine built-in and custom themes
      const allThemes = [...BUILT_IN_THEMES, ...savedCustomThemes];
      setAvailableThemes(allThemes);

      // Load saved theme preference
      const savedThemeName = themeStorage.getTheme();

      if (savedThemeName) {
        const savedTheme = allThemes.find(t => t.name === savedThemeName);
        if (savedTheme) {
          setCurrentTheme(savedTheme);
          applyThemeColors(savedTheme.colors, savedTheme.name);
          return;
        }
      }

      // Fall back to system preference if enabled
      if (enableSystem && typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? darkTheme : lightTheme;
        setCurrentTheme(systemTheme);
        applyThemeColors(systemTheme.colors, systemTheme.name);
        return;
      }

      // Use default theme
      const defaultThemeConfig = allThemes.find(t => t.name === defaultTheme) || lightTheme;
      setCurrentTheme(defaultThemeConfig);
      applyThemeColors(defaultThemeConfig.colors, defaultThemeConfig.name);
    };

    loadThemes();
  }, [defaultTheme, enableSystem]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply system theme if no manual theme is saved
      const savedTheme = themeStorage.getTheme();
      if (!savedTheme) {
        const systemTheme = e.matches ? darkTheme : lightTheme;
        const previousTheme = currentTheme.name;
        setCurrentTheme(systemTheme);
        applyThemeColors(systemTheme.colors, systemTheme.name);

        // Call analytics callback for system change
        if (onThemeChange) {
          onThemeChange(previousTheme, systemTheme.name, 'system');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystem, currentTheme.name, onThemeChange]);

  const setTheme = (themeName: string, source: string = 'manual') => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    const previousTheme = currentTheme.name;
    setCurrentTheme(theme);
    applyThemeColors(theme.colors, theme.name);
    themeStorage.setTheme(themeName);

    // Call analytics callback if provided
    if (onThemeChange) {
      onThemeChange(previousTheme, themeName, source);
    }
  };

  const setCustomTheme = (theme: ThemeConfig) => {
    // Validate theme
    if (!theme.name || !theme.colors) {
      console.warn('Invalid theme configuration');
      return;
    }

    // Save custom theme
    themeStorage.setCustomTheme(theme);

    // Update state
    const newCustomThemes = [...customThemes];
    const existingIndex = newCustomThemes.findIndex(t => t.name === theme.name);

    if (existingIndex >= 0) {
      newCustomThemes[existingIndex] = theme;
    } else {
      newCustomThemes.push(theme);
    }

    setCustomThemes(newCustomThemes);

    // Update available themes
    const newAvailableThemes = [...BUILT_IN_THEMES, ...newCustomThemes];
    setAvailableThemes(newAvailableThemes);

    // Apply the theme
    const previousTheme = currentTheme.name;
    setCurrentTheme(theme);
    applyThemeColors(theme.colors, theme.name);
    themeStorage.setTheme(theme.name);

    // Call analytics callback for custom theme
    if (onThemeChange) {
      onThemeChange(previousTheme, theme.name, 'custom');
    }
  };

  const resetTheme = () => {
    const previousTheme = currentTheme.name;
    clearThemeColors();
    themeStorage.removeTheme();

    let newTheme: ThemeConfig;
    if (enableSystem && typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      newTheme = prefersDark ? darkTheme : lightTheme;
    } else {
      newTheme = availableThemes.find(t => t.name === defaultTheme) || lightTheme;
    }

    setCurrentTheme(newTheme);
    applyThemeColors(newTheme.colors, newTheme.name);

    // Call analytics callback for reset
    if (onThemeChange) {
      onThemeChange(previousTheme, newTheme.name, 'system');
    }
  };

  const contextValue: ThemeContextValue = {
    currentTheme,
    availableThemes,
    setTheme,
    setCustomTheme,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
