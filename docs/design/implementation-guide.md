# MeatyMusic Design System - Implementation Guide

**Version:** 1.0
**Last Updated:** 2025-11-14

## Overview

This guide provides step-by-step instructions for implementing the MeatyMusic design system in the codebase. Follow these steps to migrate from the current basic interface to the target dark-mode creative application aesthetic.

---

## Phase 1: Foundation Setup

### Step 1: Install Dependencies

```bash
# Navigate to root
cd /home/user/MeatyMusic

# Install Tailwind plugins
pnpm add -D @tailwindcss/forms

# Install fonts (if using npm packages)
pnpm add @fontsource/inter @fontsource/jetbrains-mono
```

### Step 2: Update Tailwind Config

Replace or merge your `tailwind.config.js` with the configuration from the design system:

**Location:** `/home/user/MeatyMusic/tailwind.config.js` or per-package config

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background layers
        base: '#0f0f1c',
        surface: '#1a1625',
        elevated: '#252137',
        overlay: '#2d2742',
        muted: '#1a1625',

        // Primary purple-blue
        primary: {
          900: '#3730a3',
          700: '#5b4cfa',
          500: '#6366f1',
          300: '#a5b4fc',
          100: '#e0e7ff',
        },

        // Secondary purple
        secondary: {
          700: '#7c3aed',
          500: '#a78bfa',
          300: '#c4b5fd',
        },

        // Semantic colors
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
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },

      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },

      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 0 rgba(0, 0, 0, 0.15)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'accent': '0 0 0 1px rgba(91, 76, 250, 0.2), 0 4px 12px rgba(91, 76, 250, 0.3), 0 8px 24px rgba(99, 102, 241, 0.2)',
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%)',
        'gradient-card': 'linear-gradient(145deg, #1a1625 0%, #1f1b2e 100%)',
        'gradient-mesh': `
          radial-gradient(at 0% 0%, rgba(91, 76, 250, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)
        `,
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

### Step 3: Update Global Styles

**Location:** `apps/web/app/globals.css` or equivalent

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

/* CSS Variables */
:root {
  /* Background Colors */
  --background-base: #0f0f1c;
  --background-surface: #1a1625;
  --background-elevated: #252137;
  --background-overlay: #2d2742;

  /* Text Colors */
  --text-primary: #f8f9fc;
  --text-secondary: #b8bcc8;
  --text-muted: #7c7f8c;
  --text-accent: #8b87ff;

  /* Border Colors */
  --border-default: #2d2742;
  --border-strong: #3f3a56;
  --border-subtle: #1f1b2e;
  --border-accent: #5b4cfa;
}

/* Base styles */
@layer base {
  html {
    @apply antialiased;
  }

  body {
    @apply bg-base text-primary font-sans;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 12px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-surface;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-elevated rounded-lg border-2 border-surface;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-overlay;
  }
}

/* Component layer utilities */
@layer components {
  /* Button variants */
  .btn-primary {
    @apply px-6 py-3 bg-gradient-primary text-inverse font-semibold rounded-lg shadow-accent hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-elevated text-primary font-semibold rounded-lg border border-default hover:border-accent hover:bg-overlay transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-ghost {
    @apply px-6 py-3 text-primary font-medium rounded-lg hover:bg-overlay transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-outline {
    @apply px-6 py-3 text-accent font-semibold rounded-lg border-2 border-accent hover:bg-primary-700 hover:text-inverse transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-icon {
    @apply p-3 text-secondary hover:text-primary hover:bg-overlay rounded-lg transition-all duration-200;
  }

  /* Card variants */
  .card {
    @apply bg-surface border border-default rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200;
  }

  .card-elevated {
    @apply bg-elevated border border-strong rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-accent transition-all duration-200;
  }

  .card-gradient {
    @apply bg-gradient-card border border-accent/20 rounded-xl p-6 shadow-accent;
  }

  /* Input styles */
  .input {
    @apply w-full px-4 py-2.5 bg-elevated border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200;
  }

  .input-error {
    @apply border-error-500 focus:ring-error-500 focus:border-error-500;
  }

  /* Badge variants */
  .badge {
    @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium;
  }

  .badge-success {
    @apply bg-success-bg border border-success-500/20 text-success-300;
  }

  .badge-warning {
    @apply bg-warning-bg border border-warning-500/20 text-warning-300;
  }

  .badge-error {
    @apply bg-error-bg border border-error-500/20 text-error-300;
  }

  .badge-info {
    @apply bg-info-bg border border-info-500/20 text-info-300;
  }
}

/* Utility classes */
@layer utilities {
  .text-gradient {
    @apply bg-gradient-primary bg-clip-text text-transparent;
  }

  .border-gradient {
    border-image: linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%) 1;
  }
}
```

### Step 4: Update Root Layout

**Location:** `apps/web/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MeatyMusic - Agentic Music Creation System',
  description: 'Deterministic, constraint-driven music composition',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-base text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## Phase 2: Component Library

### Create Base Components

Create components in `packages/ui/src/`:

#### Button Component

**File:** `packages/ui/src/button/Button.tsx`

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-primary text-inverse shadow-accent hover:shadow-xl hover:scale-105 active:scale-98',
        secondary: 'bg-elevated text-primary border border-default hover:border-accent hover:bg-overlay',
        ghost: 'text-primary hover:bg-overlay',
        outline: 'text-accent border-2 border-accent hover:bg-primary-700 hover:text-inverse',
        danger: 'bg-error-500 text-white hover:bg-error-700',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        icon: 'p-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

#### Card Component

**File:** `packages/ui/src/card/Card.tsx`

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const cardVariants = cva(
  'rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-default shadow-md hover:shadow-lg',
        elevated: 'bg-elevated border border-strong shadow-lg hover:shadow-xl hover:border-accent',
        gradient: 'bg-gradient-card border border-accent/20 shadow-accent',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between mb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-primary', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-secondary', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'
```

#### Input Component

**File:** `packages/ui/src/input/Input.tsx`

```typescript
import * as React from 'react'
import { cn } from '../lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            'input',
            error && 'input-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className={cn(
            'text-xs',
            error ? 'text-error-300' : 'text-muted'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

#### Badge Component

**File:** `packages/ui/src/badge/Badge.tsx`

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const badgeVariants = cva(
  'badge',
  {
    variants: {
      variant: {
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
        neutral: 'bg-elevated border border-default text-secondary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 bg-current rounded-full" />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
```

---

## Phase 3: Layout Components

### Main Dashboard Layout

**File:** `apps/web/components/layout/DashboardLayout.tsx`

```typescript
import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar />
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
```

### Sidebar Component

**File:** `apps/web/components/layout/Sidebar.tsx`

```typescript
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Styles', href: '/styles', icon: MusicalNoteIcon },
  { name: 'Lyrics', href: '/lyrics', icon: DocumentTextIcon },
  { name: 'Personas', href: '/personas', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-surface border-r border-default p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gradient">MeatyMusic</h1>
        <p className="text-xs text-muted mt-1">Agentic Music Creation</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-overlay border-l-4 border-accent text-primary font-medium'
                  : 'text-secondary hover:text-primary hover:bg-overlay'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* User Profile */}
      <div className="pt-4 border-t border-default">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-inverse font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">User Name</p>
            <p className="text-xs text-muted truncate">user@example.com</p>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### TopBar Component

**File:** `apps/web/components/layout/TopBar.tsx`

```typescript
'use client'

import React from 'react'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-default px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="search"
              placeholder="Search songs, styles, personas..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="btn-icon relative">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
```

---

## Phase 4: Page Examples

### Dashboard Page

**File:** `apps/web/app/page.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@meaty/ui/card'
import { Button } from '@meaty/ui/button'
import { Badge } from '@meaty/ui/badge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-primary mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-secondary">
            Manage your music creation workflow
          </p>
        </div>
        <Button variant="primary" size="lg">
          <PlusIcon className="w-5 h-5" />
          New Song
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Total Songs
          </p>
          <p className="text-3xl font-bold text-primary">142</p>
          <p className="text-sm text-success-300 mt-2">+12% this month</p>
        </Card>

        <Card variant="elevated" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Active Styles
          </p>
          <p className="text-3xl font-bold text-primary">28</p>
          <p className="text-sm text-secondary mt-2">Across 8 genres</p>
        </Card>

        <Card variant="elevated" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Personas
          </p>
          <p className="text-3xl font-bold text-primary">15</p>
          <p className="text-sm text-secondary mt-2">4 recently active</p>
        </Card>

        <Card variant="elevated" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Render Jobs
          </p>
          <p className="text-3xl font-bold text-primary">89</p>
          <p className="text-sm text-warning-300 mt-2">3 in progress</p>
        </Card>
      </div>

      {/* Recent Songs */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Recent Songs</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-elevated rounded-lg hover:bg-overlay transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg" />
                  <div>
                    <h4 className="font-semibold text-primary">Song Title {i}</h4>
                    <p className="text-sm text-secondary">Pop • 120 BPM</p>
                  </div>
                </div>
                <Badge variant="success" dot>
                  Completed
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
```

---

## Phase 5: Migration Checklist

### Before You Start

- [ ] Review the design system documentation
- [ ] Back up current styles
- [ ] Create a new git branch for design updates
- [ ] Install all required dependencies

### Foundation

- [ ] Update Tailwind configuration
- [ ] Add global styles and CSS variables
- [ ] Import and configure fonts
- [ ] Test color tokens in browser devtools

### Components

- [ ] Create base component library in `@meaty/ui`
- [ ] Implement Button variants
- [ ] Implement Card variants
- [ ] Implement Input components
- [ ] Implement Badge components
- [ ] Test components in isolation

### Layout

- [ ] Create DashboardLayout component
- [ ] Implement Sidebar navigation
- [ ] Implement TopBar
- [ ] Add responsive breakpoints
- [ ] Test on mobile, tablet, desktop

### Pages

- [ ] Update dashboard page
- [ ] Update styles list page
- [ ] Update lyrics list page
- [ ] Update persona pages
- [ ] Update settings page

### Polish

- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Implement animations
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Verify color contrast ratios

### Final Review

- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness check
- [ ] Dark mode verification
- [ ] Performance audit
- [ ] Code review with team

---

## Troubleshooting

### Colors Not Showing

**Issue:** Background colors appear white/default
**Solution:** Ensure `bg-base` is applied to `<body>` in root layout

### Fonts Not Loading

**Issue:** Default system fonts instead of Inter
**Solution:** Check font import in `globals.css` and verify Google Fonts CDN access

### Shadows Too Dark/Light

**Issue:** Shadows don't match design
**Solution:** Tailwind shadow values are optimized for dark mode; use exact values from config

### Components Look Flat

**Issue:** Missing depth and elevation
**Solution:** Apply proper `shadow-*` classes and use `border` colors

### Hover States Not Working

**Issue:** Interactive states not responding
**Solution:** Verify `transition-all duration-200` is applied and check for CSS specificity conflicts

---

## Best Practices

1. **Always use design tokens** - Never hardcode colors, use the token system
2. **Component composition** - Build complex UIs from simple, reusable components
3. **Consistent spacing** - Use the 4px grid system (multiples of 4)
4. **Accessibility first** - Test with keyboard and screen readers
5. **Mobile responsive** - Design mobile-first, enhance for larger screens
6. **Performance** - Use `transition-all` sparingly; prefer specific properties
7. **Type safety** - Leverage TypeScript for component props

---

## Resources

- Design System: `/home/user/MeatyMusic/docs/design/design-system.md`
- Tailwind Docs: https://tailwindcss.com
- Heroicons: https://heroicons.com
- CVA (Class Variance Authority): https://cva.style

---

## Support

For questions or issues:
1. Check the design system documentation
2. Review example implementations in this guide
3. Open an issue in the repository
4. Contact the design team

---

**Last Updated:** 2025-11-14
**Maintained By:** MeatyMusic Design Team
