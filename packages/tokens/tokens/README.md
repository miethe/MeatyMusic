# @meaty/tokens

Design tokens for the MeatyPrompts design system, providing consistent colors, typography, spacing, and other design values across all applications.

## Installation

Install the package from the workspace:

```bash
pnpm add @meaty/tokens
```

## Usage

### CSS Variables

Import the CSS file in your application:

```css
@import '@meaty/tokens/css/tokens.css';
```

Use CSS variables in your styles:

```css
.my-component {
  background-color: var(--mp-color-surface);
  color: var(--mp-color-text-base);
  padding: var(--mp-spacing-4);
  border-radius: var(--mp-radius-md);
  box-shadow: var(--mp-elevation-1);
}
```

### Tailwind CSS

Add the preset to your Tailwind config:

```js
module.exports = {
  presets: [require('@meaty/tokens/dist/tailwind-preset')],
  // your config...
};
```

Use theme-aware classes:

```html
<div class="bg-surface text-base p-4 rounded-md shadow-elev1">
  Content
</div>
```

### TypeScript

Import tokens and types:

```ts
import { baseTokens, themes, type ThemeName } from '@meaty/tokens';

const currentTheme: ThemeName = 'dark';
const themeTokens = themes[currentTheme];
```

## Themes

Four themes are available:

- **Light**: Default light theme with violet primary
- **Dark**: Dark theme with adjusted contrast
- **Ocean**: Teal/blue themed variant
- **Sand**: Warm orange/amber themed variant

## Token Structure

### Colors
- `bg`, `surface`, `panel` - Background colors
- `border`, `ring` - Border and focus colors
- `text.strong`, `text.base`, `text.muted` - Text colors
- `primary`, `secondary`, `accent` - Brand colors
- `success`, `warning`, `danger`, `info` - State colors

### Spacing
- `1` through `8` - 4px increments (4px, 8px, 12px, 16px, 24px, 32px, 40px, 56px)

### Typography
- `fontFamily.ui`, `fontFamily.mono`, `fontFamily.display`
- `fontSize.1` through `fontSize.5` - Fluid responsive sizes
- `lineHeight.body`, `lineHeight.heading`

### Other
- `radius.sm/md/lg/pill` - Border radius values
- `elevation.0` through `elevation.4` - Box shadow elevations
- `motion.duration.*`, `motion.easing.*` - Animation values

## Development

Build tokens:

```bash
pnpm build
```

This generates:
- `css/tokens.css` - CSS custom properties
- `dist/tailwind-preset.js` - Tailwind configuration
- `src/tokens.ts` - TypeScript types and values

## Related Packages

- [`@meaty/ui`](../ui/README.md) – Components built on top of these tokens
- [`@meaty/store`](../store/README.md) – State management used with themed UI

## Troubleshooting

- **CSS variables not applied** – ensure `@meaty/tokens/css/tokens.css` is imported.
- **Tailwind classes missing** – include the preset in your `tailwind.config.js`.
- **Unknown theme name** – use one of the provided themes (`light`, `dark`, `ocean`, `sand`).
- **Type errors when importing** – check that your `tsconfig.json` references workspace packages.
- **Build output missing** – run `pnpm build` before publishing or testing.
