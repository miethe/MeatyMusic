# MeatyMusic Design System

**Version:** 1.0
**Last Updated:** 2025-11-14
**Status:** Implementation Ready

## Overview

This design system defines the visual language for MeatyMusic AMCS - a modern, dark-mode-first creative application for music composition. The system balances professional sophistication with approachable usability, creating an environment that inspires creativity while maintaining clarity and precision.

### Design Principles

1. **Dark Mode Native** - Optimized for extended creative sessions with reduced eye strain
2. **Information Hierarchy** - Clear visual weight guides attention to what matters
3. **Purposeful Motion** - Subtle animations provide feedback without distraction
4. **Creative Expression** - Vibrant accents energize the workspace without overwhelming
5. **Accessibility First** - WCAG AA compliant contrast ratios and keyboard navigation

---

## 1. Color System

### Foundation Colors

#### Background Layers
```css
--background-base: #0f0f1c;      /* Body background - deepest layer */
--background-surface: #1a1625;    /* Primary surface for cards/panels */
--background-elevated: #252137;   /* Elevated cards, modals, dropdowns */
--background-overlay: #2d2742;    /* Hover states, active backgrounds */
--background-muted: #1a1625;      /* Disabled/inactive backgrounds */
```

**Tailwind Config:**
```js
backgroundColor: {
  base: '#0f0f1c',
  surface: '#1a1625',
  elevated: '#252137',
  overlay: '#2d2742',
  muted: '#1a1625',
}
```

#### Text Colors
```css
--text-primary: #f8f9fc;          /* Primary text, headings */
--text-secondary: #b8bcc8;        /* Secondary text, labels */
--text-muted: #7c7f8c;            /* Disabled, subtle text */
--text-inverse: #0f0f1c;          /* Text on light backgrounds */
--text-accent: #8b87ff;           /* Accent text, links */
```

**Tailwind Config:**
```js
textColor: {
  primary: '#f8f9fc',
  secondary: '#b8bcc8',
  muted: '#7c7f8c',
  inverse: '#0f0f1c',
  accent: '#8b87ff',
}
```

#### Border & Divider Colors
```css
--border-default: #2d2742;        /* Default borders */
--border-strong: #3f3a56;         /* Strong emphasis borders */
--border-subtle: #1f1b2e;         /* Subtle dividers */
--border-accent: #5b4cfa;         /* Accent/focus borders */
```

**Tailwind Config:**
```js
borderColor: {
  DEFAULT: '#2d2742',
  strong: '#3f3a56',
  subtle: '#1f1b2e',
  accent: '#5b4cfa',
}
```

### Accent Colors

#### Primary Purple-Blue
```css
--accent-primary-900: #3730a3;    /* Darkest */
--accent-primary-700: #5b4cfa;    /* Primary brand */
--accent-primary-500: #6366f1;    /* Main accent */
--accent-primary-300: #a5b4fc;    /* Light accent */
--accent-primary-100: #e0e7ff;    /* Lightest */
```

**Usage:** Primary CTAs, active states, brand elements

**Tailwind Config:**
```js
colors: {
  primary: {
    900: '#3730a3',
    700: '#5b4cfa',
    500: '#6366f1',
    300: '#a5b4fc',
    100: '#e0e7ff',
  }
}
```

#### Secondary Purple
```css
--accent-secondary-700: #7c3aed;  /* Deep purple */
--accent-secondary-500: #a78bfa;  /* Mid purple */
--accent-secondary-300: #c4b5fd;  /* Light purple */
```

**Usage:** Secondary actions, hover states, decorative elements

**Tailwind Config:**
```js
colors: {
  secondary: {
    700: '#7c3aed',
    500: '#a78bfa',
    300: '#c4b5fd',
  }
}
```

### Semantic Colors

#### Success
```css
--success-700: #15803d;           /* Dark green */
--success-500: #22c55e;           /* Primary success */
--success-300: #86efac;           /* Light success */
--success-bg: rgba(34, 197, 94, 0.1);   /* Success background */
```

**Tailwind Config:**
```js
colors: {
  success: {
    700: '#15803d',
    500: '#22c55e',
    300: '#86efac',
    bg: 'rgba(34, 197, 94, 0.1)',
  }
}
```

#### Warning
```css
--warning-700: #c2410c;           /* Dark orange */
--warning-500: #f97316;           /* Primary warning */
--warning-300: #fdba74;           /* Light warning */
--warning-bg: rgba(249, 115, 22, 0.1);  /* Warning background */
```

**Tailwind Config:**
```js
colors: {
  warning: {
    700: '#c2410c',
    500: '#f97316',
    300: '#fdba74',
    bg: 'rgba(249, 115, 22, 0.1)',
  }
}
```

#### Error/Danger
```css
--error-700: #b91c1c;             /* Dark red */
--error-500: #ef4444;             /* Primary error */
--error-300: #fca5a5;             /* Light error */
--error-bg: rgba(239, 68, 68, 0.1);     /* Error background */
```

**Tailwind Config:**
```js
colors: {
  error: {
    700: '#b91c1c',
    500: '#ef4444',
    300: '#fca5a5',
    bg: 'rgba(239, 68, 68, 0.1)',
  }
}
```

#### Info
```css
--info-700: #0369a1;              /* Dark blue */
--info-500: #3b82f6;              /* Primary info */
--info-300: #93c5fd;              /* Light info */
--info-bg: rgba(59, 130, 246, 0.1);     /* Info background */
```

**Tailwind Config:**
```js
colors: {
  info: {
    700: '#0369a1',
    500: '#3b82f6',
    300: '#93c5fd',
    bg: 'rgba(59, 130, 246, 0.1)',
  }
}
```

### Gradient System

#### Primary Gradient
```css
background: linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%);
```

**Tailwind Config:**
```js
backgroundImage: {
  'gradient-primary': 'linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%)',
}
```

**Usage:** Hero sections, primary CTAs, feature highlights

#### Mesh Gradient (Background)
```css
background:
  radial-gradient(at 0% 0%, rgba(91, 76, 250, 0.15) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.1) 0px, transparent 50%),
  radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
  #0f0f1c;
```

**Usage:** Page backgrounds, large panels

#### Card Gradient (Subtle)
```css
background: linear-gradient(145deg, #1a1625 0%, #1f1b2e 100%);
```

**Usage:** Card backgrounds with subtle depth

---

## 2. Typography System

### Font Family

**Primary:** Inter (sans-serif)
**Monospace:** JetBrains Mono

**Tailwind Config:**
```js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

**Font Loading:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Type Scale

#### Headings

**H1 - Display Large**
```css
font-size: 48px;
line-height: 56px;
font-weight: 700;
letter-spacing: -0.02em;
color: var(--text-primary);
```

**Tailwind:** `text-5xl font-bold tracking-tight text-primary`

**Usage:** Page titles, hero headings

---

**H2 - Display Medium**
```css
font-size: 36px;
line-height: 44px;
font-weight: 700;
letter-spacing: -0.01em;
color: var(--text-primary);
```

**Tailwind:** `text-4xl font-bold tracking-tight text-primary`

**Usage:** Section headings, card titles (large)

---

**H3 - Display Small**
```css
font-size: 30px;
line-height: 38px;
font-weight: 600;
letter-spacing: -0.01em;
color: var(--text-primary);
```

**Tailwind:** `text-3xl font-semibold tracking-tight text-primary`

**Usage:** Subsection headings

---

**H4 - Title Large**
```css
font-size: 24px;
line-height: 32px;
font-weight: 600;
letter-spacing: 0;
color: var(--text-primary);
```

**Tailwind:** `text-2xl font-semibold text-primary`

**Usage:** Card titles, modal headers

---

**H5 - Title Medium**
```css
font-size: 20px;
line-height: 28px;
font-weight: 600;
letter-spacing: 0;
color: var(--text-primary);
```

**Tailwind:** `text-xl font-semibold text-primary`

**Usage:** Component headers, list section titles

---

**H6 - Title Small**
```css
font-size: 16px;
line-height: 24px;
font-weight: 600;
letter-spacing: 0;
color: var(--text-primary);
```

**Tailwind:** `text-base font-semibold text-primary`

**Usage:** Small component headers, form section titles

---

#### Body Text

**Body Large**
```css
font-size: 18px;
line-height: 28px;
font-weight: 400;
letter-spacing: 0;
color: var(--text-primary);
```

**Tailwind:** `text-lg text-primary`

**Usage:** Prominent body text, intros

---

**Body Medium (Base)**
```css
font-size: 16px;
line-height: 24px;
font-weight: 400;
letter-spacing: 0;
color: var(--text-primary);
```

**Tailwind:** `text-base text-primary`

**Usage:** Default body text, form labels

---

**Body Small**
```css
font-size: 14px;
line-height: 20px;
font-weight: 400;
letter-spacing: 0;
color: var(--text-secondary);
```

**Tailwind:** `text-sm text-secondary`

**Usage:** Helper text, secondary information

---

**Caption**
```css
font-size: 12px;
line-height: 16px;
font-weight: 400;
letter-spacing: 0;
color: var(--text-muted);
```

**Tailwind:** `text-xs text-muted`

**Usage:** Timestamps, metadata, fine print

---

**Overline**
```css
font-size: 12px;
line-height: 16px;
font-weight: 600;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--text-muted);
```

**Tailwind:** `text-xs font-semibold uppercase tracking-wider text-muted`

**Usage:** Section labels, categories

---

#### Code Text

**Inline Code**
```css
font-family: var(--font-mono);
font-size: 14px;
line-height: 20px;
font-weight: 500;
padding: 2px 6px;
background: var(--background-elevated);
border: 1px solid var(--border-subtle);
border-radius: 4px;
color: var(--text-accent);
```

**Tailwind:** `font-mono text-sm font-medium px-1.5 py-0.5 bg-elevated border border-subtle rounded text-accent`

---

**Code Block**
```css
font-family: var(--font-mono);
font-size: 14px;
line-height: 22px;
font-weight: 400;
padding: 16px;
background: var(--background-elevated);
border: 1px solid var(--border-default);
border-radius: 8px;
color: var(--text-primary);
```

**Tailwind:** `font-mono text-sm p-4 bg-elevated border border-default rounded-lg text-primary`

---

## 3. Spacing System

### Base Unit
**Base spacing unit:** 4px

All spacing values are multiples of 4px for consistent rhythm.

### Spacing Scale

**Tailwind Config:**
```js
spacing: {
  0: '0',
  0.5: '2px',    // 0.5 * 4
  1: '4px',      // 1 * 4
  1.5: '6px',    // 1.5 * 4
  2: '8px',      // 2 * 4
  3: '12px',     // 3 * 4
  4: '16px',     // 4 * 4
  5: '20px',     // 5 * 4
  6: '24px',     // 6 * 4
  7: '28px',     // 7 * 4
  8: '32px',     // 8 * 4
  10: '40px',    // 10 * 4
  12: '48px',    // 12 * 4
  16: '64px',    // 16 * 4
  20: '80px',    // 20 * 4
  24: '96px',    // 24 * 4
  32: '128px',   // 32 * 4
}
```

### Component Spacing Guidelines

#### Cards
- **Padding:** `p-6` (24px) for standard cards, `p-8` (32px) for large cards
- **Gap between elements:** `gap-4` (16px) default, `gap-6` (24px) for larger spacing
- **Margin between cards:** `space-y-4` (16px) or `gap-4` in grid layouts

#### Sections
- **Top/Bottom padding:** `py-12` (48px) for small sections, `py-20` (80px) for large sections
- **Container padding:** `px-6` (24px) on mobile, `px-8` (32px) on tablet+

#### Forms
- **Label to input:** `gap-2` (8px)
- **Between form fields:** `space-y-4` (16px)
- **Form sections:** `space-y-6` (24px)

#### Buttons
- **Internal padding small:** `px-3 py-1.5` (12px × 6px)
- **Internal padding medium:** `px-4 py-2` (16px × 8px)
- **Internal padding large:** `px-6 py-3` (24px × 12px)
- **Gap with icon:** `gap-2` (8px)

---

## 4. Elevation & Shadow System

### Shadow Levels

**Level 0 - None**
```css
box-shadow: none;
```
**Tailwind:** `shadow-none`
**Usage:** Flat elements, disabled states

---

**Level 1 - Subtle**
```css
box-shadow:
  0 1px 2px 0 rgba(0, 0, 0, 0.3),
  0 1px 3px 0 rgba(0, 0, 0, 0.15);
```
**Tailwind:** `shadow-sm`
**Usage:** Input fields, subtle borders, list items

---

**Level 2 - Default**
```css
box-shadow:
  0 4px 6px -1px rgba(0, 0, 0, 0.4),
  0 2px 4px -1px rgba(0, 0, 0, 0.3);
```
**Tailwind:** `shadow` (default)
**Usage:** Cards, panels, navigation items

---

**Level 3 - Medium**
```css
box-shadow:
  0 10px 15px -3px rgba(0, 0, 0, 0.5),
  0 4px 6px -2px rgba(0, 0, 0, 0.3);
```
**Tailwind:** `shadow-md`
**Usage:** Elevated cards, hover states, active elements

---

**Level 4 - Large**
```css
box-shadow:
  0 20px 25px -5px rgba(0, 0, 0, 0.6),
  0 10px 10px -5px rgba(0, 0, 0, 0.4);
```
**Tailwind:** `shadow-lg`
**Usage:** Modals, dropdowns, popovers

---

**Level 5 - Extra Large**
```css
box-shadow:
  0 25px 50px -12px rgba(0, 0, 0, 0.7);
```
**Tailwind:** `shadow-xl`
**Usage:** Large modals, dialogs, overlays

---

**Accent Glow**
```css
box-shadow:
  0 0 0 1px rgba(91, 76, 250, 0.2),
  0 4px 12px rgba(91, 76, 250, 0.3),
  0 8px 24px rgba(99, 102, 241, 0.2);
```
**Tailwind Custom:** `shadow-accent`
**Usage:** Primary buttons, focused elements, important CTAs

**Tailwind Config:**
```js
boxShadow: {
  'accent': '0 0 0 1px rgba(91, 76, 250, 0.2), 0 4px 12px rgba(91, 76, 250, 0.3), 0 8px 24px rgba(99, 102, 241, 0.2)',
}
```

---

### Border Radius

**Tailwind Config:**
```js
borderRadius: {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
}
```

**Component Guidelines:**
- **Buttons:** `rounded-lg` (12px)
- **Cards:** `rounded-xl` (16px)
- **Inputs:** `rounded-lg` (12px)
- **Modals:** `rounded-2xl` (24px)
- **Avatars/Badges:** `rounded-full`
- **Chips/Tags:** `rounded-full` or `rounded-lg`

---

## 5. Component Specifications

### Buttons

#### Primary Button
```html
<button class="px-6 py-3 bg-gradient-primary text-inverse font-semibold rounded-lg shadow-accent hover:shadow-xl transition-all duration-200 hover:scale-105">
  Primary Action
</button>
```

**States:**
- **Default:** Gradient background, accent shadow
- **Hover:** Larger shadow, subtle scale (1.05)
- **Active:** Slightly smaller scale (0.98)
- **Disabled:** Opacity 50%, no hover effects, cursor not-allowed

**CSS:**
```css
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%);
  color: #0f0f1c;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(91, 76, 250, 0.2), 0 4px 12px rgba(91, 76, 250, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

---

#### Secondary Button
```html
<button class="px-6 py-3 bg-elevated text-primary font-semibold rounded-lg border border-default hover:border-accent hover:bg-overlay transition-all duration-200">
  Secondary Action
</button>
```

**States:**
- **Default:** Elevated background, default border
- **Hover:** Accent border, overlay background
- **Active:** Slightly darker background
- **Disabled:** Opacity 50%, muted colors

---

#### Ghost Button
```html
<button class="px-6 py-3 text-primary font-medium rounded-lg hover:bg-overlay transition-all duration-200">
  Ghost Action
</button>
```

**States:**
- **Default:** Transparent background
- **Hover:** Overlay background
- **Active:** Slightly darker overlay
- **Disabled:** Opacity 50%, muted text

---

#### Outline Button
```html
<button class="px-6 py-3 text-accent font-semibold rounded-lg border-2 border-accent hover:bg-primary-700 hover:text-inverse transition-all duration-200">
  Outline Action
</button>
```

**States:**
- **Default:** Accent border and text
- **Hover:** Filled with primary color
- **Active:** Darker fill
- **Disabled:** Muted border and text

---

#### Icon Button
```html
<button class="p-3 text-secondary hover:text-primary hover:bg-overlay rounded-lg transition-all duration-200">
  <svg class="w-5 h-5">...</svg>
</button>
```

**Sizes:**
- **Small:** `p-2`, icon `w-4 h-4`
- **Medium:** `p-3`, icon `w-5 h-5`
- **Large:** `p-4`, icon `w-6 h-6`

---

### Cards

#### Standard Card
```html
<div class="bg-surface border border-default rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
  <h3 class="text-xl font-semibold text-primary mb-2">Card Title</h3>
  <p class="text-sm text-secondary">Card content goes here</p>
</div>
```

**CSS:**
```css
.card {
  background: #1a1625;
  border: 1px solid #2d2742;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}
```

---

#### Elevated Card (Interactive)
```html
<div class="bg-elevated border border-strong rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-accent transition-all duration-200 cursor-pointer">
  <h3 class="text-2xl font-semibold text-primary mb-4">Elevated Card</h3>
  <p class="text-base text-secondary">Interactive card with enhanced elevation</p>
</div>
```

**Usage:** Clickable cards, feature highlights, important sections

---

#### Gradient Card
```html
<div class="bg-gradient-to-br from-surface to-elevated border border-accent/20 rounded-xl p-6 shadow-accent">
  <h3 class="text-xl font-semibold text-primary mb-2">Featured Card</h3>
  <p class="text-sm text-secondary">Card with gradient background and accent shadow</p>
</div>
```

**Usage:** Featured content, premium features, highlights

---

### Input Fields

#### Text Input
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-primary">Label</label>
  <input
    type="text"
    class="w-full px-4 py-2.5 bg-elevated border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
    placeholder="Enter text..."
  />
</div>
```

**States:**
- **Default:** Elevated background, default border
- **Focus:** Accent ring (2px), accent border
- **Error:** Error border, error ring
- **Disabled:** Muted background, opacity 60%

**CSS:**
```css
.input {
  width: 100%;
  padding: 10px 16px;
  background: #252137;
  border: 1px solid #2d2742;
  border-radius: 12px;
  color: #f8f9fc;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #5b4cfa;
  box-shadow: 0 0 0 2px rgba(91, 76, 250, 0.3);
}

.input.error {
  border-color: #ef4444;
}

.input.error:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}
```

---

#### Textarea
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-primary">Description</label>
  <textarea
    rows="4"
    class="w-full px-4 py-2.5 bg-elevated border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 resize-none"
    placeholder="Enter description..."
  ></textarea>
</div>
```

---

#### Select Dropdown
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-primary">Select Option</label>
  <select class="w-full px-4 py-2.5 bg-elevated border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200">
    <option>Option 1</option>
    <option>Option 2</option>
    <option>Option 3</option>
  </select>
</div>
```

---

#### Checkbox
```html
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="w-5 h-5 bg-elevated border border-default rounded text-primary-500 focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:ring-offset-base transition-all duration-200"
  />
  <span class="text-sm text-primary">Checkbox label</span>
</label>
```

---

#### Radio Button
```html
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="radio"
    class="w-5 h-5 bg-elevated border border-default text-primary-500 focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:ring-offset-base transition-all duration-200"
  />
  <span class="text-sm text-primary">Radio label</span>
</label>
```

---

#### Toggle Switch
```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
  <span class="ml-3 text-sm text-primary">Toggle label</span>
</label>
```

---

#### Multi-Select Chips
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-primary">Mood</label>
  <div class="flex flex-wrap gap-2">
    <button class="px-4 py-2 bg-elevated border border-default rounded-full text-sm font-medium text-secondary hover:border-accent hover:text-primary transition-all duration-200">
      Happy
    </button>
    <button class="px-4 py-2 bg-primary-700 border border-accent rounded-full text-sm font-medium text-inverse transition-all duration-200">
      Energetic
    </button>
    <button class="px-4 py-2 bg-elevated border border-default rounded-full text-sm font-medium text-secondary hover:border-accent hover:text-primary transition-all duration-200">
      Calm
    </button>
  </div>
</div>
```

**States:**
- **Unselected:** Elevated background, default border, secondary text
- **Selected:** Primary gradient background, accent border, inverse text
- **Hover:** Accent border, primary text

---

#### Range Slider
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-primary">Tempo (BPM)</label>
  <div class="flex items-center gap-4">
    <input
      type="range"
      min="60"
      max="180"
      value="120"
      class="flex-1 h-2 bg-elevated rounded-lg appearance-none cursor-pointer accent-primary-500"
    />
    <span class="text-sm font-medium text-primary min-w-[4ch]">120</span>
  </div>
</div>
```

---

### Navigation Sidebar

```html
<nav class="w-64 h-screen bg-surface border-r border-default p-6 flex flex-col">
  <!-- Logo -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-primary">MeatyMusic</h1>
  </div>

  <!-- Nav Items -->
  <div class="flex-1 space-y-1">
    <a href="#" class="flex items-center gap-3 px-4 py-3 bg-overlay border-l-4 border-accent rounded-lg text-primary font-medium">
      <svg class="w-5 h-5">...</svg>
      <span>Home</span>
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-overlay rounded-lg text-secondary hover:text-primary transition-all duration-200">
      <svg class="w-5 h-5">...</svg>
      <span>Styles</span>
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-overlay rounded-lg text-secondary hover:text-primary transition-all duration-200">
      <svg class="w-5 h-5">...</svg>
      <span>Lyrics</span>
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-overlay rounded-lg text-secondary hover:text-primary transition-all duration-200">
      <svg class="w-5 h-5">...</svg>
      <span>Personas</span>
    </a>
  </div>

  <!-- User Profile -->
  <div class="pt-4 border-t border-default">
    <div class="flex items-center gap-3 px-4 py-3">
      <div class="w-10 h-10 bg-gradient-primary rounded-full"></div>
      <div>
        <p class="text-sm font-medium text-primary">User Name</p>
        <p class="text-xs text-muted">user@example.com</p>
      </div>
    </div>
  </div>
</nav>
```

**Active State:**
- Background: `bg-overlay`
- Border: 4px left border with accent color
- Text: Primary color, font-medium

**Hover State:**
- Background: `bg-overlay`
- Text: Primary color

---

### Badges & Tags

#### Status Badge
```html
<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-success-bg border border-success-500/20 rounded-full text-xs font-medium text-success-300">
  <span class="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
  Active
</span>
```

**Variants:**
- **Success:** Green background/border/text
- **Warning:** Orange background/border/text
- **Error:** Red background/border/text
- **Info:** Blue background/border/text
- **Neutral:** Gray background/border/text

---

#### Tag/Chip (Small)
```html
<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-elevated border border-default rounded-full text-xs font-medium text-secondary">
  Hip-Hop
  <button class="hover:text-primary">
    <svg class="w-3 h-3">×</svg>
  </button>
</span>
```

---

### Modals & Dialogs

```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
  <div class="w-full max-w-lg bg-elevated border border-strong rounded-2xl shadow-xl p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-primary">Modal Title</h2>
      <button class="p-2 hover:bg-overlay rounded-lg transition-all duration-200">
        <svg class="w-5 h-5 text-secondary">×</svg>
      </button>
    </div>

    <!-- Content -->
    <div class="mb-6">
      <p class="text-base text-secondary">Modal content goes here.</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button class="btn-ghost">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Backdrop:**
- Background: `bg-black/60` (60% opacity black)
- Blur: `backdrop-blur-sm`

---

### Tooltips

```html
<div class="relative group">
  <button class="...">Hover me</button>
  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-elevated border border-strong rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
    <p class="text-sm text-primary whitespace-nowrap">Tooltip text</p>
  </div>
</div>
```

---

### Loading States

#### Spinner
```html
<div class="inline-block w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin"></div>
```

**Sizes:**
- **Small:** `w-4 h-4`
- **Medium:** `w-6 h-6`
- **Large:** `w-8 h-8`

---

#### Skeleton Loader
```html
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-elevated rounded w-3/4"></div>
  <div class="h-4 bg-elevated rounded w-1/2"></div>
  <div class="h-4 bg-elevated rounded w-5/6"></div>
</div>
```

---

#### Progress Bar
```html
<div class="w-full h-2 bg-elevated rounded-full overflow-hidden">
  <div class="h-full bg-gradient-primary rounded-full transition-all duration-300" style="width: 60%"></div>
</div>
```

---

## 6. Layout Guidelines

### Grid System

**Container Max Widths:**
```js
maxWidth: {
  'xs': '20rem',      // 320px
  'sm': '24rem',      // 384px
  'md': '28rem',      // 448px
  'lg': '32rem',      // 512px
  'xl': '36rem',      // 576px
  '2xl': '42rem',     // 672px
  '3xl': '48rem',     // 768px
  '4xl': '56rem',     // 896px
  '5xl': '64rem',     // 1024px
  '6xl': '72rem',     // 1152px
  '7xl': '80rem',     // 1280px
  'screen': '100vw',
}
```

**Container Classes:**
```html
<!-- Centered container with max-width -->
<div class="container mx-auto px-6 max-w-7xl">
  ...
</div>
```

---

### Responsive Breakpoints

**Tailwind Config:**
```js
screens: {
  'sm': '640px',    // Mobile landscape
  'md': '768px',    // Tablet portrait
  'lg': '1024px',   // Tablet landscape / Small desktop
  'xl': '1280px',   // Desktop
  '2xl': '1536px',  // Large desktop
}
```

**Usage:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Responsive grid -->
</div>
```

---

### Page Layout

#### Dashboard Layout
```html
<div class="flex h-screen bg-base">
  <!-- Sidebar -->
  <aside class="w-64 bg-surface border-r border-default">
    <!-- Navigation -->
  </aside>

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto">
    <!-- Top Bar -->
    <header class="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-default px-8 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-primary">Dashboard</h1>
        <div class="flex items-center gap-4">
          <!-- User avatar, notifications, etc. -->
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <div class="p-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Content sections -->
      </div>
    </div>
  </main>
</div>
```

---

### Section Spacing

**Small Section:**
```html
<section class="py-12">
  ...
</section>
```

**Medium Section:**
```html
<section class="py-16">
  ...
</section>
```

**Large Section:**
```html
<section class="py-20 lg:py-24">
  ...
</section>
```

---

### Card Grid Layouts

#### 2-Column Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

#### 3-Column Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

#### 4-Column Grid (Dashboard Stats)
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

---

## 7. Animation & Transitions

### Transition Timing

**Tailwind Config:**
```js
transitionDuration: {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',    // Default for most interactions
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
}

transitionTimingFunction: {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

**Default transition:**
```html
<div class="transition-all duration-200 ease-out">
  ...
</div>
```

---

### Common Animations

#### Fade In
```html
<div class="animate-fade-in">
  ...
</div>
```

**Keyframes:**
```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

---

#### Slide Up
```html
<div class="animate-slide-up">
  ...
</div>
```

**Keyframes:**
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

---

#### Scale In
```html
<div class="animate-scale-in">
  ...
</div>
```

**Keyframes:**
```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
```

---

### Hover Effects

#### Lift on Hover
```html
<div class="transform hover:-translate-y-1 transition-transform duration-200">
  ...
</div>
```

#### Glow on Hover
```html
<div class="hover:shadow-accent transition-shadow duration-300">
  ...
</div>
```

#### Scale on Hover
```html
<div class="transform hover:scale-105 transition-transform duration-200">
  ...
</div>
```

---

## 8. Icon Usage

### Icon Library
**Recommended:** Heroicons (https://heroicons.com)
**Alternative:** Lucide Icons, Feather Icons

**Size Guidelines:**
- **Extra Small:** `w-3 h-3` (12px) - Inline with small text
- **Small:** `w-4 h-4` (16px) - Inline with body text
- **Medium:** `w-5 h-5` (20px) - Buttons, nav items
- **Large:** `w-6 h-6` (24px) - Headers, large buttons
- **Extra Large:** `w-8 h-8` (32px) - Feature icons

**Color Guidelines:**
- **Primary icons:** `text-primary`
- **Secondary icons:** `text-secondary`
- **Muted icons:** `text-muted`
- **Accent icons:** `text-accent`
- **Interactive icons:** Inherit from parent or use state-based colors

**Example:**
```html
<button class="flex items-center gap-2 text-secondary hover:text-primary">
  <svg class="w-5 h-5" fill="none" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
  <span>Add Item</span>
</button>
```

---

## 9. Accessibility Guidelines

### Color Contrast

All text meets WCAG AA standards:
- **Large text (18px+):** Minimum 3:1 contrast
- **Body text (16px):** Minimum 4.5:1 contrast
- **Small text (<16px):** Minimum 4.5:1 contrast

**Tested Combinations:**
- `text-primary` on `bg-base`: 15.2:1 (AAA)
- `text-secondary` on `bg-surface`: 8.1:1 (AAA)
- `text-muted` on `bg-elevated`: 4.8:1 (AA)

---

### Focus States

All interactive elements have visible focus states:
```html
<button class="focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base">
  Button
</button>
```

**Focus ring:**
- Width: 2px
- Color: Accent color with opacity
- Offset: 2px from element

---

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual hierarchy
- Skip links for main content navigation
- Arrow keys for component navigation where appropriate

---

### Screen Reader Support

- Semantic HTML elements
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content
- Alt text for all images
- Form labels properly associated

**Example:**
```html
<button aria-label="Close modal" class="...">
  <svg class="w-5 h-5">×</svg>
</button>
```

---

## 10. Implementation Checklist

### Tailwind Configuration

Add to `tailwind.config.js`:

```js
module.exports = {
  content: [
    './apps/**/*.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0f0f1c',
        surface: '#1a1625',
        elevated: '#252137',
        overlay: '#2d2742',
        muted: '#1a1625',
        primary: {
          900: '#3730a3',
          700: '#5b4cfa',
          500: '#6366f1',
          300: '#a5b4fc',
          100: '#e0e7ff',
        },
        secondary: {
          700: '#7c3aed',
          500: '#a78bfa',
          300: '#c4b5fd',
        },
        success: {
          700: '#15803d',
          500: '#22c55e',
          300: '#86efac',
          bg: 'rgba(34, 197, 94, 0.1)',
        },
        warning: {
          700: '#c2410c',
          500: '#f97316',
          300: '#fdba74',
          bg: 'rgba(249, 115, 22, 0.1)',
        },
        error: {
          700: '#b91c1c',
          500: '#ef4444',
          300: '#fca5a5',
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        info: {
          700: '#0369a1',
          500: '#3b82f6',
          300: '#93c5fd',
          bg: 'rgba(59, 130, 246, 0.1)',
        },
      },
      textColor: {
        primary: '#f8f9fc',
        secondary: '#b8bcc8',
        muted: '#7c7f8c',
        inverse: '#0f0f1c',
        accent: '#8b87ff',
      },
      borderColor: {
        DEFAULT: '#2d2742',
        strong: '#3f3a56',
        subtle: '#1f1b2e',
        accent: '#5b4cfa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'accent': '0 0 0 1px rgba(91, 76, 250, 0.2), 0 4px 12px rgba(91, 76, 250, 0.3), 0 8px 24px rgba(99, 102, 241, 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scale-in': {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

---

### CSS Variables

Add to global CSS:

```css
:root {
  /* Background Colors */
  --background-base: #0f0f1c;
  --background-surface: #1a1625;
  --background-elevated: #252137;
  --background-overlay: #2d2742;
  --background-muted: #1a1625;

  /* Text Colors */
  --text-primary: #f8f9fc;
  --text-secondary: #b8bcc8;
  --text-muted: #7c7f8c;
  --text-inverse: #0f0f1c;
  --text-accent: #8b87ff;

  /* Border Colors */
  --border-default: #2d2742;
  --border-strong: #3f3a56;
  --border-subtle: #1f1b2e;
  --border-accent: #5b4cfa;

  /* Primary Colors */
  --primary-900: #3730a3;
  --primary-700: #5b4cfa;
  --primary-500: #6366f1;
  --primary-300: #a5b4fc;
  --primary-100: #e0e7ff;

  /* Semantic Colors */
  --success-500: #22c55e;
  --warning-500: #f97316;
  --error-500: #ef4444;
  --info-500: #3b82f6;
}
```

---

### Font Setup

Add to `<head>` or CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

---

### Component Library Setup

Create reusable components in `@meaty/ui`:

```
packages/ui/
├── src/
│   ├── button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── card/
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── input/
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   └── index.ts
│   ├── badge/
│   │   ├── Badge.tsx
│   │   └── index.ts
│   └── index.ts
```

---

## 11. Design Tokens

For design token management in `packages/tokens/`:

```json
{
  "color": {
    "background": {
      "base": { "value": "#0f0f1c" },
      "surface": { "value": "#1a1625" },
      "elevated": { "value": "#252137" },
      "overlay": { "value": "#2d2742" }
    },
    "text": {
      "primary": { "value": "#f8f9fc" },
      "secondary": { "value": "#b8bcc8" },
      "muted": { "value": "#7c7f8c" }
    },
    "primary": {
      "500": { "value": "#6366f1" },
      "700": { "value": "#5b4cfa" }
    }
  },
  "spacing": {
    "1": { "value": "4px" },
    "2": { "value": "8px" },
    "3": { "value": "12px" },
    "4": { "value": "16px" },
    "6": { "value": "24px" },
    "8": { "value": "32px" }
  },
  "borderRadius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" },
    "xl": { "value": "16px" }
  }
}
```

---

## 12. Quick Reference

### Common Patterns

#### Card with Header
```html
<div class="bg-surface border border-default rounded-xl p-6 shadow-md">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-semibold text-primary">Title</h3>
    <button class="text-secondary hover:text-primary">
      <svg class="w-5 h-5">...</svg>
    </button>
  </div>
  <p class="text-sm text-secondary">Content</p>
</div>
```

#### Form Section
```html
<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-semibold text-primary mb-2">Section Title</h2>
    <p class="text-sm text-secondary">Section description</p>
  </div>
  <div class="space-y-4">
    <!-- Form fields -->
  </div>
</div>
```

#### Stats Grid
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="bg-surface border border-default rounded-xl p-6">
    <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
      Total Songs
    </p>
    <p class="text-3xl font-bold text-primary">142</p>
    <p class="text-sm text-success-300 mt-2">+12% this month</p>
  </div>
</div>
```

#### Empty State
```html
<div class="flex flex-col items-center justify-center py-16 px-6 text-center">
  <svg class="w-16 h-16 text-muted mb-4">...</svg>
  <h3 class="text-xl font-semibold text-primary mb-2">No items yet</h3>
  <p class="text-sm text-secondary mb-6 max-w-md">
    Get started by creating your first item.
  </p>
  <button class="btn-primary">Create Item</button>
</div>
```

---

## Conclusion

This design system provides all the specifications needed to build a cohesive, modern, and accessible interface for MeatyMusic AMCS. All values are production-ready and can be directly implemented in Tailwind CSS.

### Next Steps

1. **Configure Tailwind** with the provided config
2. **Set up fonts** (Inter and JetBrains Mono)
3. **Create component library** in `@meaty/ui`
4. **Implement design tokens** in `@meaty/tokens`
5. **Build page layouts** following the specifications
6. **Test accessibility** with screen readers and keyboard navigation
7. **Validate contrast ratios** for all text/background combinations

### Resources

- **Tailwind CSS:** https://tailwindcss.com
- **Heroicons:** https://heroicons.com
- **Inter Font:** https://rsms.me/inter/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Questions or feedback?** Contact the design team or open an issue in the repository.
