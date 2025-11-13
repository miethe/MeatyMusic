import { ThemeConfig } from '../types';

const oceanTheme: ThemeConfig = {
  name: 'ocean',
  colors: {
    // Background colors - cool blue/teal tones
    bg: '193 100% 99%', // #F8FEFF
    surface: '0 0% 100%', // #FFFFFF
    panel: '180 100% 97%', // #F0FDFF
    border: '181 76% 94%', // #E0F7FA
    ring: '188 83% 35%', // #0891B2

    // Text colors
    textStrong: '222 47% 11%', // #0F172A
    textBase: '222 23% 23%', // #1E293B
    textMuted: '215 25% 46%', // #64748B

    // Brand colors - ocean blues and teals
    primary: '188 83% 35%', // #0891B2
    primaryForeground: '0 0% 100%', // #FFFFFF
    secondary: '188 94% 43%', // #06B6D4
    accent: '199 89% 48%', // #0EA5E9

    // State colors
    success: '160 69% 40%', // #10B981
    warning: '32 91% 50%', // #F59E0B
    danger: '0 84% 60%', // #EF4444
    info: '221 91% 59%', // #3B82F6
  },
  radius: '0.5rem',
};

export default oceanTheme;
