import { ThemeConfig } from '../types';

const sandTheme: ThemeConfig = {
  name: 'sand',
  colors: {
    // Background colors - warm sand/amber tones
    bg: '46 100% 99%', // #FFFEF7
    surface: '0 0% 100%', // #FFFFFF
    panel: '51 91% 95%', // #FEF9E7
    border: '48 65% 85%', // #F5E6C1
    ring: '32 91% 44%', // #D97706

    // Text colors
    textStrong: '30 25% 11%', // #1C1917
    textBase: '28 25% 26%', // #44403C
    textMuted: '28 25% 50%', // #78716C

    // Brand colors - warm oranges and ambers
    primary: '32 91% 44%', // #D97706
    primaryForeground: '0 0% 100%', // #FFFFFF
    secondary: '24 95% 53%', // #EA580C
    accent: '43 96% 56%', // #F59E0B

    // State colors
    success: '160 69% 40%', // #059669
    warning: '0 84% 50%', // #DC2626
    danger: '0 84% 50%', // #DC2626
    info: '224 91% 55%', // #2563EB
  },
  radius: '0.5rem',
};

export default sandTheme;
