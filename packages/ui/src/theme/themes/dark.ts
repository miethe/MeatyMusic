import { ThemeConfig } from '../types';

const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    // Background colors
    bg: '222 47% 8%', // #0B0F17
    surface: '222 47% 11%', // #0F172A
    panel: '222 47% 16%', // #111827
    border: '222 34% 20%', // #232B3A
    ring: '253 91% 77%', // #9B8BFF

    // Text colors
    textStrong: '210 40% 92%', // #E6EAF2
    textBase: '220 14% 83%', // #D1D6E0
    textMuted: '215 16% 64%', // #8E96A3

    // Brand colors
    primary: '253 91% 77%', // #8E7CFF
    primaryForeground: '222 47% 8%', // #0B0F17
    secondary: '175 95% 44%', // #0BD1C5
    accent: '43 89% 76%', // #FFD285

    // State colors
    success: '142 69% 58%', // #48D26B
    warning: '32 80% 64%', // #F8B84E
    danger: '2 89% 74%', // #FF7A85
    info: '208 100% 67%', // #58AFFF
  },
  radius: '0.5rem',
};

export default darkTheme;
