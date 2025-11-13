import { ThemeConfig } from '../types';

const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    // Background colors
    bg: '220 14% 96%', // #FBFCFE
    surface: '0 0% 100%', // #FFFFFF
    panel: '220 13% 91%', // #F5F7FB
    border: '220 13% 86%', // #E6EAF2
    ring: '261 83% 58%', // #7C3AED

    // Text colors
    textStrong: '222 84% 8%', // #0B1220
    textBase: '222 23% 23%', // #1F2937
    textMuted: '220 9% 41%', // #5B6370 - Darkened from 46% to meet 4.5:1 on bg/panel

    // Brand colors
    primary: '253 61% 58%', // #6E56CF
    primaryForeground: '0 0% 100%', // #FFFFFF
    secondary: '174 80% 28%', // #008A7D - Darkened from 35% to meet 4.5:1 with white text
    accent: '43 96% 56%', // #FFB224

    // State colors - All meet WCAG AA 4.5:1 contrast ratio
    success: '142 71% 29%', // #1C7E33 - Darkened to meet 4.5:1
    warning: '32 100% 33%', // #A85400 - Darkened to meet 4.5:1
    danger: '2 94% 45%', // #D31927 - Darkened to meet 4.5:1
    info: '208 100% 40%', // #0073CC - Already passes at 4.70:1
  },
  radius: '0.5rem',
};

export default lightTheme;
