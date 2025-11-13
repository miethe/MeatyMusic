/**
 * High-Contrast Transform Utility
 *
 * Provides utilities to transform colors for WCAG AAA compliance (7:1 contrast ratio for normal text,
 * 4.5:1 for large text). This utility ensures that high-contrast themes maintain accessibility
 * while preserving brand identity where possible.
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA/AAA standards
 */
function meetsContrastRequirement(foreground, background, level = 'AAA', isLargeText = false) {
  const contrast = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? contrast >= 4.5 : contrast >= 7.0;
  } else if (level === 'AA') {
    return isLargeText ? contrast >= 3.0 : contrast >= 4.5;
  }

  return false;
}

/**
 * Adjust color brightness to achieve target contrast
 */
function adjustColorForContrast(color, background, targetContrast = 7.0, preferDarker = true) {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;
  const bgRgb = typeof background === 'string' ? hexToRgb(background) : background;

  if (!rgb || !bgRgb) return color;

  let currentContrast = getContrastRatio(rgb, bgRgb);

  // If already meets target, return as is
  if (currentContrast >= targetContrast) {
    return typeof color === 'string' ? color : rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // Try adjusting brightness
  let adjustedRgb = { ...rgb };
  let step = preferDarker ? -5 : 5;
  let adjustmentAttempts = 0;
  const maxIterations = 51; // Prevent infinite loop

  while (currentContrast < targetContrast && adjustmentAttempts < maxIterations) {
    // Adjust all channels
    adjustedRgb.r = Math.max(0, Math.min(255, adjustedRgb.r + step));
    adjustedRgb.g = Math.max(0, Math.min(255, adjustedRgb.g + step));
    adjustedRgb.b = Math.max(0, Math.min(255, adjustedRgb.b + step));

    currentContrast = getContrastRatio(adjustedRgb, bgRgb);
    adjustmentAttempts++;

    // If we hit bounds and still don't meet target, try opposite direction
    if ((step < 0 && adjustedRgb.r === 0 && adjustedRgb.g === 0 && adjustedRgb.b === 0) ||
        (step > 0 && adjustedRgb.r === 255 && adjustedRgb.g === 255 && adjustedRgb.b === 255)) {
      if (preferDarker && step < 0) {
        // Try going lighter instead
        adjustedRgb = { ...rgb };
        step = 5;
        preferDarker = false;
      } else {
        break;
      }
    }
  }

  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
}

/**
 * Transform a base theme into a high-contrast version
 */
function transformToHighContrast(baseTheme, variant = 'light') {
  const isLightTheme = variant === 'light';

  // Define base colors for high contrast
  const hcBg = isLightTheme ? '#FFFFFF' : '#000000';
  const hcSurface = isLightTheme ? '#FFFFFF' : '#0F0F0F';
  const hcPanel = isLightTheme ? '#F8F9FA' : '#1F1F1F';

  const result = {
    color: {
      // Background colors - pure for maximum contrast
      bg: {
        value: hcBg,
        type: "color",
        description: `High contrast ${variant} background`
      },
      surface: {
        value: hcSurface,
        type: "color",
        description: `High contrast ${variant} surface`
      },
      panel: {
        value: hcPanel,
        type: "color",
        description: `High contrast ${variant} panel`
      },

      // Borders - strong contrast
      border: {
        value: isLightTheme ? '#000000' : '#FFFFFF',
        type: "color",
        description: `High contrast ${variant} border`
      },

      // Focus ring - bright and visible (3px wide in CSS)
      ring: {
        value: isLightTheme ? '#FFD700' : '#FFFF00', // Gold/Yellow for visibility
        type: "color",
        description: `High contrast ${variant} focus ring`
      },

      // Text colors - maximum contrast
      text: {
        strong: {
          value: adjustColorForContrast(
            baseTheme.color?.text?.strong?.value || (isLightTheme ? '#000000' : '#FFFFFF'),
            hcBg,
            7.0
          ),
          type: "color",
          description: `High contrast ${variant} strong text`
        },
        base: {
          value: adjustColorForContrast(
            baseTheme.color?.text?.base?.value || (isLightTheme ? '#000000' : '#FFFFFF'),
            hcBg,
            7.0
          ),
          type: "color",
          description: `High contrast ${variant} base text`
        },
        muted: {
          value: adjustColorForContrast(
            baseTheme.color?.text?.muted?.value || (isLightTheme ? '#404040' : '#CCCCCC'),
            hcBg,
            7.0
          ),
          type: "color",
          description: `High contrast ${variant} muted text`
        }
      },

      // Brand colors - enhanced for contrast while preserving identity
      primary: {
        value: adjustColorForContrast(
          baseTheme.color?.primary?.value || '#6E56CF',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} primary`
      },
      primaryForeground: {
        value: isLightTheme ? '#FFFFFF' : '#000000',
        type: "color",
        description: `High contrast ${variant} primary foreground`
      },

      secondary: {
        value: adjustColorForContrast(
          baseTheme.color?.secondary?.value || '#00B3A4',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} secondary`
      },

      accent: {
        value: adjustColorForContrast(
          baseTheme.color?.accent?.value || '#FFB224',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} accent`
      },

      // State colors - high contrast versions
      success: {
        value: adjustColorForContrast(
          baseTheme.color?.success?.value || '#2BA84A',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} success`
      },

      warning: {
        value: adjustColorForContrast(
          baseTheme.color?.warning?.value || '#F59E0B',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} warning`
      },

      danger: {
        value: adjustColorForContrast(
          baseTheme.color?.danger?.value || '#E5484D',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} danger`
      },

      info: {
        value: adjustColorForContrast(
          baseTheme.color?.info?.value || '#0091FF',
          hcBg,
          7.0,
          !isLightTheme
        ),
        type: "color",
        description: `High contrast ${variant} info`
      }
    },

    // Enhanced focus indicators for HC themes
    focus: {
      ringWidth: {
        value: "3px",
        type: "dimension",
        description: "Enhanced focus ring width for high contrast"
      }
    }
  };

  return result;
}

module.exports = {
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  meetsContrastRequirement,
  adjustColorForContrast,
  transformToHighContrast
};
