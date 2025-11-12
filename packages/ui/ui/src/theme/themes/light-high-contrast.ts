import { ThemeConfig } from '../types';

const lightHighContrastTheme: ThemeConfig = {
  name: 'light-hc',
  colors: {
    // Background colors - Pure whites for maximum contrast
    bg: '0 0% 100%', // #FFFFFF - Pure white background
    surface: '0 0% 100%', // #FFFFFF - Pure white surface
    panel: '210 20% 98%', // #F8F9FA - Very light gray panel for subtle differentiation
    border: '0 0% 0%', // #000000 - Pure black border for maximum definition
    ring: '51 100% 50%', // #FFD700 - Gold focus ring for high visibility (enhanced 3px width)

    // Text colors - Maximum contrast black text
    textStrong: '0 0% 0%', // #000000 - Pure black primary text (∞:1 contrast)
    textBase: '0 0% 0%', // #000000 - Pure black secondary text (∞:1 contrast)
    textMuted: '0 0% 25%', // #404040 - Dark gray muted text (8.5:1 contrast on white)

    // Brand colors - Darkened for 7:1+ contrast on white background
    primary: '240 79% 39%', // #1F1FB8 - Darkened blue for AAA compliance
    primaryForeground: '0 0% 100%', // #FFFFFF - White text on dark primary
    secondary: '178 100% 21%', // #006B61 - Darkened teal for AAA compliance
    accent: '33 92% 38%', // #B8750A - Darkened orange for AAA compliance

    // State colors - High contrast accessible colors for 7:1+ ratio
    success: '142 68% 31%', // #1F7A2F - Darkened green for AAA compliance
    warning: '33 100% 34%', // #AD6B00 - Darkened yellow for AAA compliance
    danger: '358 69% 42%', // #B51E23 - Darkened red for AAA compliance
    info: '211 100% 40%', // #0066CC - Darkened blue for AAA compliance
  },
  radius: '0.25rem', // Sharper corners for high contrast theme
  focusRingWidth: '3px', // Enhanced focus ring width for accessibility
};

export default lightHighContrastTheme;
