import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Create custom theme
const meatyPromptsTheme = create({
  base: 'light',

  // Brand
  brandTitle: 'MeatyPrompts Design System',
  brandUrl: 'https://meatyprompts.com',
  brandImage: undefined, // Add logo URL when available
  brandTarget: '_self',

  // Colors
  colorPrimary: '#3b82f6', // Primary blue
  colorSecondary: '#64748b', // Slate gray

  // UI colors
  appBg: '#ffffff',
  appContentBg: '#f8fafc',
  appBorderColor: '#e2e8f0',
  appBorderRadius: 8,

  // Text colors
  textColor: '#1e293b',
  textInverseColor: '#ffffff',
  textMutedColor: '#64748b',

  // Toolbar default and active colors
  barTextColor: '#64748b',
  barSelectedColor: '#3b82f6',
  barBg: '#ffffff',

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1e293b',
  inputBorderRadius: 6,

  // Font
  fontBase: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

// Configure Storybook addons
addons.setConfig({
  theme: meatyPromptsTheme,
  panelPosition: 'bottom',
  selectedPanel: 'storybook/docs/panel',
  showNav: true,
  showPanel: true,
  sidebarAnimations: true,
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
