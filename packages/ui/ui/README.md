# @meaty/ui

A comprehensive design system and component library built with accessibility, consistency, and developer experience in mind. This package provides shared UI primitives and components that can be consumed by both web and mobile applications.

## Features

- 🎨 **Multi-theme support** - Light, Dark, Ocean, and Sand themes with dynamic switching
- ♿ **Accessibility first** - Built on Radix UI primitives with WCAG 2.1 AA compliance
- 📱 **Cross-platform** - Components work in React (web) and React Native (mobile)
- 🎭 **Storybook integration** - Interactive documentation with live theme switching
- 🔧 **TypeScript native** - Full type safety and IntelliSense support
- 🧪 **Thoroughly tested** - Unit tests with accessibility validation using jest-axe

## Architecture & Complications API

The UI package follows a layered architecture. Core components expose stable
surfaces while optional functionality is delivered through a **complications**
API. Complications are small, contextual widgets—such as badges, status dots,
or mini charts—that attach to host components via named slots.

Complications are implemented as adapter plugins. An adapter receives card
context (identifier, state, size, and title) and returns a React component to
render. Adapters can be registered and swapped without modifying the host
component, enabling downstream applications to extend UI features safely.

```tsx
import { PromptCard } from '@meaty/ui';
import { StatusComplication } from '@meaty/ui/complications/examples';

<PromptCard
  title="Example"
  complications={{
    topRight: { component: StatusComplication, props: { status: 'online' } },
  }}
/>;
```

For custom behavior, create an adapter by implementing the `ComplicationProps`
interface and passing your component through the slot system. See the
[Complications developer guide](../../docs/docs-v2/guides/dev/frontend/complications-api.md)
for full details.

## Installation

```bash
# Install the UI package
pnpm add @meaty/ui

# Install peer dependencies (if not already installed)
pnpm add react react-dom @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

## Quick Start

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@meaty/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Import and use components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, FormField, Input } from '@meaty/ui';

function MyComponent() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <Badge variant="secondary">New</Badge>
      </CardHeader>
      <CardContent>
        <FormField
          label="Email Address"
          required
          description="We'll never share your email"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            icon={<MailIcon />}
          />
        </FormField>
        <Button variant="premium" size="lg">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Core Components
- **Button** - Primary action component with 7 variants (default, premium, destructive, outline, secondary, ghost, link)
- **Card** - Container component with CVA variants (elevated, bordered, ghost) and semantic slots (header, content, footer)
- **Input** - Form input field with error states, icon support, and multiple types (text, email, password, number)
- **Dialog/Modal** - Accessible modal component with focus management and keyboard navigation
- **Form/FormField** - Comprehensive form components with enhanced accessibility and ARIA attributes
- **Skeleton** - Loading state components with shimmer animation and multiple variants
- **Badge** - Status indicators and labels with 4 variants
- **Label** - Accessible form labels with proper association
- **Textarea** - Multi-line text input component

### Specialized Components
 - **PromptCard** - Domain-specific card for displaying prompt information with modular subcomponents (`Header`, `Body`, `Stats`, `Actions`, `ErrorBanner`) and hooks (`usePromptCardState`, `usePromptCardShortcuts`, `useAriaAnnouncements`). Metrics are grouped under a single `metrics` prop for clarity.
- **TagList** - Interactive tag management component
- **Toast** - Notification system with multiple severity levels

### Layout Components
- **Separator** - Visual dividers and spacers
- **Container** - Responsive layout wrapper

## Skeleton Approach

Loading states use the `LoadingSkeleton` primitive to mirror the exact dimensions of their live counterparts. Compose skeletons with the same layout structure to avoid cumulative layout shift. For example, `PromptCardSkeleton` arranges multiple `LoadingSkeleton` elements sized to match each section of the `PromptCard`.

## Component Usage

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@meaty/ui';

// Elevated card (default)
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Enhanced Features</CardTitle>
    <CardDescription>Discover new capabilities</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content with shadow elevation.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Bordered card
<Card variant="bordered">
  <CardContent>Subtle border styling</CardContent>
</Card>

// Ghost card (transparent)
<Card variant="ghost">
  <CardContent>Blends with background</CardContent>
</Card>
```

### Input Component

```tsx
import { Input } from '@meaty/ui';
import { Search, Mail, Lock } from 'lucide-react';

// Basic input
<Input placeholder="Enter text" />

// Input with icons
<Input
  placeholder="Search..."
  icon={<Search className="h-4 w-4" />}
/>

<Input
  type="email"
  placeholder="Email address"
  rightIcon={<Mail className="h-4 w-4" />}
/>

// Error state
<Input
  error
  placeholder="This field has an error"
  defaultValue="invalid-input"
/>

// With both icons
<Input
  placeholder="Search emails"
  icon={<Search className="h-4 w-4" />}
  rightIcon={<Mail className="h-4 w-4" />}
/>
```

### FormField Component

```tsx
import { FormField, Input } from '@meaty/ui';

<FormField
  label="Email Address"
  required
  description="We'll use this to contact you"
  error={errors.email?.message}
>
  <Input
    type="email"
    placeholder="Enter your email"
    {...register('email')}
  />
</FormField>
```

### Dialog/Modal Component

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@meaty/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmation</DialogTitle>
      <DialogDescription>
        Are you sure you want to continue?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Or use as Modal (same component, semantic alias)
import { Modal, ModalContent, ModalTrigger } from '@meaty/ui';
```

### Skeleton Component

```tsx
import { Skeleton, LoadingSkeleton } from '@meaty/ui';

// Basic skeleton
<Skeleton className="h-4 w-full" />

// Multiple lines with shimmer
<LoadingSkeleton
  lines={3}
  shimmer={true}
  height="1rem"
/>

// Circular skeleton (for avatars)
<LoadingSkeleton
  width="3rem"
  height="3rem"
  circular={true}
  shimmer={true}
/>

// Card skeleton
<div className="space-y-3">
  <div className="flex items-center space-x-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
  <Skeleton className="h-32 w-full" />
</div>
```

## Theme System

### Built-in Themes

The library includes four carefully crafted themes:

- **Light** - Clean, bright interface with high contrast
- **Dark** - Reduced eye strain with proper contrast ratios
- **Ocean** - Teal and blue palette inspired by deep waters
- **Sand** - Warm, earthy tones with orange and amber accents

### Theme Switching

```tsx
import { useTheme } from '@meaty/ui';

function ThemeToggle() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <select value={theme.name} onChange={(e) => setTheme(e.target.value)}>
      {availableThemes.map(theme => (
        <option key={theme.name} value={theme.name}>
          {theme.displayName}
        </option>
      ))}
    </select>
  );
}
```

### Custom Themes

You can create and register custom themes:

```tsx
import { ThemeProvider, createTheme } from '@meaty/ui';

const customTheme = createTheme({
  name: 'custom',
  displayName: 'Custom Theme',
  colors: {
    bg: 'hsl(0, 0%, 100%)',
    primary: 'hsl(210, 100%, 50%)',
    // ... other color tokens
  }
});

function App() {
  return (
    <ThemeProvider customThemes={[customTheme]}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Accessibility

All components are built with accessibility as a first-class concern:

- **Keyboard Navigation** - Full keyboard support for all interactive elements
- **Screen Reader Support** - Proper ARIA labels, roles, and descriptions
- **Focus Management** - Visible focus indicators and logical tab order
- **High Contrast** - All themes meet WCAG 2.1 AA contrast requirements
- **Reduced Motion** - Respects user's motion preferences

### Testing Accessibility

Components include accessibility tests using jest-axe:

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@meaty/ui';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Storybook

Interactive documentation is available via Storybook:

```bash
# Start Storybook
pnpm --filter "./packages/ui" storybook

# Build Storybook for deployment
pnpm --filter "./packages/ui" build-storybook
```

Features in Storybook:
- Live theme switching
- Interactive component playground
- Accessibility checks
- Documentation for all props and variants

## Development

### Project Structure

```
packages/ui/
├── src/
│   ├── components/          # All React components
│   │   ├── Button/         # Component with tests and stories
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── __tests__/
│   │   └── ...
│   ├── theme/              # Theme system
│   │   ├── ThemeProvider.tsx
│   │   ├── themes.ts
│   │   └── useTheme.ts
│   ├── lib/                # Utilities
│   │   └── utils.ts
│   └── index.ts            # Main exports
├── .storybook/             # Storybook configuration
└── package.json
```

### Adding New Components

1. Create component directory: `src/components/MyComponent/`
2. Add component file: `MyComponent.tsx`
3. Add Storybook stories: `MyComponent.stories.tsx`
4. Add tests: `__tests__/MyComponent.test.tsx`
5. Export from main `index.ts`

Example component template:

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const myComponentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        sm: "small-classes",
        lg: "large-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  asChild?: boolean;
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(myComponentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

MyComponent.displayName = "MyComponent";

export { MyComponent, myComponentVariants };
```

### Running Tests

```bash
# Run all tests
pnpm --filter "./packages/ui" test

# Run tests in watch mode
pnpm --filter "./packages/ui" test:watch

# Run tests with coverage
pnpm --filter "./packages/ui" test:coverage
```

### Type Checking

```bash
# Check TypeScript types
pnpm --filter "./packages/ui" typecheck

# Check types in watch mode
pnpm --filter "./packages/ui" typecheck:watch
```

## Migration Guide

### From Direct Radix Usage

If you were previously importing Radix components directly:

```tsx
// Before
import { Button } from '@radix-ui/react-button';

// After
import { Button } from '@meaty/ui';
```

### From Custom Components

Replace custom implementations with the shared components:

```tsx
// Before - custom button
const CustomButton = ({ children, ...props }) => (
  <button className="custom-button-styles" {...props}>
    {children}
  </button>
);

// After - use shared Button
import { Button } from '@meaty/ui';
<Button variant="default">{children}</Button>
```

### Theme Migration

Replace custom CSS variables with the theme system:

```css
/* Before - custom CSS */
.my-component {
  background-color: #ffffff;
  color: #000000;
}

/* After - use theme tokens */
.my-component {
  background-color: hsl(var(--mp-color-bg));
  color: hsl(var(--mp-color-text-strong));
}
```

## Troubleshooting

- **Missing styles** – ensure `@meaty/tokens/css/tokens.css` is imported and Tailwind preset added.
- **Theme not persisting** – verify `storageKey` is unique and that `localStorage` is available.
- **Type errors** – run `pnpm typecheck` to confirm component props.
- **Accessibility warnings** – check that form fields include required labels and descriptions.
- **Storybook themes unavailable** – confirm `ThemeProvider` wraps your stories.

See the [web refactor guide](../../docs/migration/web-refactor.md) for migration examples.

## API Reference

### ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `string` | `"light"` | Default theme name |
| `enableSystem` | `boolean` | `true` | Enable system theme detection |
| `customThemes` | `ThemeConfig[]` | `[]` | Additional custom themes |
| `storageKey` | `string` | `"ui-theme"` | localStorage key for theme persistence |

### useTheme Hook

```tsx
const {
  theme,           // Current theme config
  setTheme,        // Function to change theme
  availableThemes, // Array of all available themes
  systemTheme      // Detected system theme preference
} = useTheme();
```

## Contributing

1. Follow the established patterns for component structure
2. Include comprehensive tests with accessibility checks
3. Add Storybook stories for all variants and states
4. Update this README if adding new features
5. Ensure all themes are properly supported

## License

This package is part of the MeatyPrompts monorepo and follows the same licensing terms.
