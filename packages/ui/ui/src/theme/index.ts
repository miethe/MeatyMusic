export { ThemeProvider, useTheme } from './ThemeProvider';
export { ThemeSwitcher } from './ThemeSwitcher';
export * from './types';
export * from './utils';
export * from './storage';

// Export theme configurations
export { default as lightTheme } from './themes/light';
export { default as darkTheme } from './themes/dark';
export { default as midnightTheme } from './themes/midnight';
export { default as highContrastTheme } from './themes/high-contrast';
