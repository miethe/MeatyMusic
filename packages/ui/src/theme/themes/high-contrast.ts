import { ThemeConfig } from '../types';

const darkHighContrastTheme: ThemeConfig = {
  name: 'dark-hc',
  colors: {
    // Background colors - Pure blacks and whites for maximum contrast
    bg: '0 0% 0%', // #000000 - Pure black background
    surface: '0 0% 6%', // #0F0F0F - Very dark gray surface
    panel: '0 0% 12%', // #1F1F1F - Slightly lighter panel
    border: '0 0% 80%', // #CCCCCC - High contrast border
    ring: '60 100% 50%', // #FFFF00 - Bright yellow focus ring for visibility

    // Text colors - Maximum contrast white text
    textStrong: '0 0% 100%', // #FFFFFF - Pure white primary text
    textBase: '0 0% 95%', // #F2F2F2 - Near white secondary text
    textMuted: '0 0% 85%', // #D9D9D9 - Light gray muted text

    // Brand colors - High contrast accessible colors
    primary: '240 100% 60%', // #3333FF - Bright blue primary
    primaryForeground: '0 0% 100%', // #FFFFFF - White text on primary
    secondary: '180 100% 40%', // #00CCCC - Bright cyan secondary
    accent: '300 100% 60%', // #CC33CC - Bright magenta accent

    // State colors - High contrast state indicators
    success: '120 100% 35%', // #00B300 - Bright green success
    warning: '45 100% 50%', // #FFB300 - Bright orange warning
    danger: '0 100% 50%', // #FF0000 - Bright red danger
    info: '210 100% 60%', // #3366FF - Bright blue info
  },
  radius: '0.25rem', // Sharper corners for high contrast theme
  focusRingWidth: '3px', // Enhanced focus ring width for accessibility
};

export default darkHighContrastTheme;
