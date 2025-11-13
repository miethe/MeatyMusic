import { ThemeConfig } from '../types';

const midnightTheme: ThemeConfig = {
  name: 'midnight',
  colors: {
    // Background colors - Deep purple/blue night sky
    bg: '222 47% 8%', // #0B0F17 - Very dark background
    surface: '234 47% 12%', // #131725 - Slightly lighter surface
    panel: '240 47% 16%', // #1A1E2E - Panel background
    border: '245 34% 24%', // #2A3441 - Subtle borders
    ring: '269 87% 70%', // #9B7FFF - Purple focus ring

    // Text colors - High contrast on dark
    textStrong: '210 40% 96%', // #F1F5F9 - Primary text
    textBase: '220 14% 87%', // #E0E7FF - Secondary text
    textMuted: '215 16% 68%', // #94A3B8 - Muted text

    // Brand colors - Purple and teal gradient theme
    primary: '269 87% 70%', // #9B7FFF - Purple primary
    primaryForeground: '222 47% 8%', // #0B0F17 - Text on primary
    secondary: '174 80% 60%', // #20D9CC - Teal secondary
    accent: '269 60% 80%', // #B794F6 - Light purple accent

    // State colors - Optimized for dark theme
    success: '142 69% 62%', // #4ADE80 - Green success
    warning: '32 95% 68%', // #FBBF24 - Amber warning
    danger: '0 84% 68%', // #F87171 - Red danger
    info: '208 100% 70%', // #60A5FA - Blue info
  },
  radius: '0.5rem',
};

export default midnightTheme;
