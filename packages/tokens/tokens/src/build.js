const fs = require('fs');
const path = require('path');

// Load base tokens and theme overrides
const baseTokens = require('./base.json');
const lightTheme = require('./themes/light.json');
const darkTheme = require('./themes/dark.json');
const oceanTheme = require('./themes/ocean.json');
const sandTheme = require('./themes/sand.json');
const lightHcTheme = require('./themes/light-hc.json');
const darkHcTheme = require('./themes/dark-hc.json');

const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  sand: sandTheme,
  'light-hc': lightHcTheme,
  'dark-hc': darkHcTheme
};

// Deep merge function
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Convert camelCase to kebab-case
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Convert token to CSS variable name
function tokenToCSSVar(path) {
  // Split by dots, convert each part to kebab-case, then join with dashes
  const parts = path.split('.').map(camelToKebab);
  return `--mp-${parts.join('-')}`;
}

// Extract value from token object
function extractValue(token) {
  if (typeof token === 'object' && token.value !== undefined) {
    return token.value;
  }
  return token;
}

// Recursively extract only values from a nested token object
// Useful for TypeScript generation or any context requiring plain values
function extractTokenValues(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(extractTokenValues);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      result[key] = value.value;
    } else if (typeof value === 'object') {
      result[key] = extractTokenValues(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Generate CSS variables from tokens
function generateCSSVariables(tokens, prefix = '') {
  let css = '';

  for (const [key, value] of Object.entries(tokens)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value.value === undefined && !Array.isArray(value)) {
      css += generateCSSVariables(value, currentPath);
    } else {
      const cssVar = tokenToCSSVar(currentPath);
      const cssValue = extractValue(value);

      if (Array.isArray(cssValue)) {
        css += `  ${cssVar}: ${cssValue.join(', ')};\n`;
      } else {
        css += `  ${cssVar}: ${cssValue};\n`;
      }
    }
  }

  return css;
}

// Generate theme CSS
function generateThemeCSS() {
  let css = '/* MeatyPrompts Design Tokens */\n\n';

  // Root variables (light theme as default)
  const lightTokens = deepMerge(baseTokens, lightTheme);
  css += ':root {\n';
  css += generateCSSVariables(lightTokens);
  css += '}\n\n';

  // Dark theme media query
  const darkTokens = deepMerge(baseTokens, darkTheme);
  css += '@media (prefers-color-scheme: dark) {\n';
  css += '  :root {\n';
  css += generateCSSVariables(darkTokens).replace(/^  /gm, '    ');
  css += '  }\n';
  css += '}\n\n';

  // Theme classes
  for (const [themeName, themeTokens] of Object.entries(themes)) {
    const mergedTokens = deepMerge(baseTokens, themeTokens);
    css += `[data-theme="${themeName}"] {\n`;
    css += generateCSSVariables(mergedTokens);
    css += '}\n\n';
  }

  return css;
}

// Generate Tailwind preset
function generateTailwindPreset() {
  const preset = {
    theme: {
      extend: {
        colors: {},
        spacing: {},
        borderRadius: {},
        boxShadow: {},
        fontFamily: {},
        fontSize: {},
        lineHeight: {},
        letterSpacing: {},
        transitionDuration: {},
        transitionTimingFunction: {}
      }
    }
  };

  // Colors
  const colorPaths = [
    'bg', 'surface', 'panel', 'border', 'ring',
    'text.strong', 'text.base', 'text.muted',
    'primary', 'primaryForeground', 'secondary', 'accent',
    'success', 'warning', 'danger', 'info'
  ];

  colorPaths.forEach(path => {
    const cssVar = tokenToCSSVar(`color.${path}`);
    const tailwindKey = path.replace('.', '-');
    preset.theme.extend.colors[tailwindKey] = `hsl(var(${cssVar}))`;
  });

  // Spacing
  for (let i = 1; i <= 8; i++) {
    const cssVar = tokenToCSSVar(`spacing.${i}`);
    preset.theme.extend.spacing[i] = `var(${cssVar})`;
  }

  // Border radius
  ['sm', 'md', 'lg', 'pill'].forEach(size => {
    const cssVar = tokenToCSSVar(`radius.${size}`);
    preset.theme.extend.borderRadius[size] = `var(${cssVar})`;
  });

  // Box shadows
  for (let i = 0; i <= 4; i++) {
    const cssVar = tokenToCSSVar(`elevation.${i}`);
    preset.theme.extend.boxShadow[`elev${i}`] = `var(${cssVar})`;
  }

  // Typography
  ['ui', 'mono', 'display'].forEach(family => {
    const cssVar = tokenToCSSVar(`typography.fontFamily.${family}`);
    preset.theme.extend.fontFamily[family] = `var(${cssVar})`;
  });

  for (let i = 1; i <= 5; i++) {
    const cssVar = tokenToCSSVar(`typography.fontSize.${i}`);
    preset.theme.extend.fontSize[`theme-${i}`] = `var(${cssVar})`;
  }

  ['body', 'heading'].forEach(type => {
    const cssVar = tokenToCSSVar(`typography.lineHeight.${type}`);
    preset.theme.extend.lineHeight[type] = `var(${cssVar})`;
  });

  ['default', 'tight'].forEach(spacing => {
    const cssVar = tokenToCSSVar(`typography.letterSpacing.${spacing}`);
    preset.theme.extend.letterSpacing[spacing] = `var(${cssVar})`;
  });

  // Motion
  ['micro', 'ui', 'panel', 'modal'].forEach(duration => {
    const cssVar = tokenToCSSVar(`motion.duration.${duration}`);
    preset.theme.extend.transitionDuration[duration] = `var(${cssVar})`;
  });

  ['enter', 'exit'].forEach(easing => {
    const cssVar = tokenToCSSVar(`motion.easing.${easing}`);
    preset.theme.extend.transitionTimingFunction[easing] = `var(${cssVar})`;
  });

  return `module.exports = ${JSON.stringify(preset, null, 2)};`;
}

// Generate TypeScript types
function generateTypes() {
  return `export interface DesignTokens {
  color: {
    bg: string;
    surface: string;
    panel: string;
    border: string;
    ring: string;
    text: {
      strong: string;
      base: string;
      muted: string;
    };
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    collection?: {
      primary: string;
      secondary: string;
      accent: string;
      purple: string;
      green: string;
      orange: string;
      blue: string;
      red: string;
    };
  };
  badge: {
    default: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      shadow: string;
    };
    secondary: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      shadow: string;
    };
    outline: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      hoverBorder: string;
      shadow: string;
    };
  };
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  elevation: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
  };
  focus?: {
    ringWidth?: string;
  };
  typography: {
    fontFamily: {
      ui: string[];
      mono: string[];
      display: string[];
    };
    fontSize: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
    lineHeight: {
      body: string;
      heading: string;
    };
    letterSpacing: {
      default: string;
      tight: string;
    };
  };
  motion: {
    duration: {
      micro: string;
      ui: string;
      panel: string;
      modal: string;
    };
    easing: {
      enter: string;
      exit: string;
    };
  };
}

export type ThemeName = 'light' | 'dark' | 'ocean' | 'sand' | 'light-hc' | 'dark-hc';

export const themes: Record<ThemeName, Partial<DesignTokens>> = ${JSON.stringify(extractTokenValues(themes), null, 2)};

export const baseTokens: DesignTokens = ${JSON.stringify(extractTokenValues(baseTokens), null, 2)};
`;
}

// Build tokens
function build() {
  const cssDir = path.join(__dirname, '..', 'css');
  const distDir = path.join(__dirname, '..', 'dist');

  // Ensure directories exist
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Generate CSS
  const css = generateThemeCSS();
  fs.writeFileSync(path.join(cssDir, 'tokens.css'), css);

  // Generate Tailwind preset
  const preset = generateTailwindPreset();
  fs.writeFileSync(path.join(distDir, 'tailwind-preset.js'), preset);

  // Generate TypeScript types
  const types = generateTypes();
  fs.writeFileSync(path.join(__dirname, 'tokens.ts'), types);

  // Generate index file
  const indexContent = `export * from './tokens';
export { default as tailwindPreset } from '../dist/tailwind-preset';
`;
  fs.writeFileSync(path.join(__dirname, 'index.ts'), indexContent);

  console.log('✅ Design tokens built successfully');
  console.log(`📁 CSS output: ${path.join(cssDir, 'tokens.css')}`);
  console.log(`📁 Tailwind preset: ${path.join(distDir, 'tailwind-preset.js')}`);
}

if (require.main === module) {
  build();
}

module.exports = { build };
