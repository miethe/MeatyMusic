# Phase 4: Frontend Application (React Web UI)

**Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for implementation
**Duration**: 3-4 weeks
**Critical Path**: NO - Can parallelize with Phase 1-3 using mocked data

---

## Phase Overview

### Goals

Phase 4 implements a responsive React web application for entity management, SDS composition, and real-time workflow monitoring. The UI transforms complex musical constraints into intuitive forms with multi-select chips, range sliders, and live validation feedback.

**Deliverables**:
1. Component Library - Reusable UI primitives following MeatyMusic design system
2. Entity Editors - Forms for Persona, Style, Lyrics, Producer Notes, Sources, Blueprints
3. Composition Wizard - SDS compilation + workflow initiation
4. Dashboard - Recent songs, pending runs, quick actions
5. Real-Time Monitoring - WebSocket-driven status updates and event feeds
6. API Integration - React Query + Zustand state management

**Key Principles**:
- **Progressive Disclosure**: Complex forms broken into steps with optional sections collapsed
- **Real-Time Validation**: Inline feedback on tag conflicts, profanity, blueprint compliance
- **Deterministic UX**: Show seed propagation, artifact hashes, reproducibility indicators
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support

### Dependencies

**Phase 0 Prerequisites**:
- API gateway with CORS configured
- WebSocket endpoint `/ws/events` ready
- Auth middleware (JWT validation)

**Phase 1 Integration** (for real data):
- Entity CRUD endpoints: `/personas`, `/styles`, `/lyrics`, `/producer_notes`, `/sources`, `/blueprints`
- Entity JSON schemas for validation

**Phase 2 Integration**:
- SDS compilation endpoint: `POST /sds/compile`
- Validation endpoint: `POST /validate`

**Phase 3 Integration**:
- Workflow execution: `POST /workflow/runs`
- Run status: `GET /workflow/runs/{id}`
- WebSocket events for live updates

**Can Develop Independently**:
- UI can begin immediately with mocked API responses
- Integration happens incrementally as backend phases complete

### Parallel Work Opportunities

All work packages can develop **concurrently** with Phase 1-2-3 using mocked data:

```
Phase 0 Complete (API Gateway + Auth)
    ├─> WP1: Design System & Component Library (frontend-ui-engineer) [1 week]
    ├─> WP2: Entity Editors (frontend-form-engineer) [1.5 weeks]
    ├─> WP3: Dashboard & Navigation (frontend-ui-engineer) [1 week]
    ├─> WP4: Workflow Monitoring (frontend-workflow-engineer) [1 week]
    ├─> WP5: API Integration (frontend-data-engineer) [1 week]
    └─> WP6: Testing & Accessibility (qa-frontend-engineer) [1 week]
```

**Optimal staffing**: 4 frontend engineers (UI, Forms, Workflow, Data) + 1 QA engineer
**Total wall-clock time**: 3-4 weeks with progressive integration

---

## Technology Stack

### Core Framework
- **Next.js 14** (App Router) - SSR + React Server Components
- **TypeScript 5+** - Type safety across components and API layer
- **React 18** - Concurrent features, Suspense boundaries

### UI & Styling
- **Tailwind CSS 3** - Utility-first styling with custom MeatyMusic theme
- **Radix UI** - Accessible component primitives (Dialog, DropdownMenu, Slider)
- **Lucide React** - Icon library (consistent outline icons)
- **Framer Motion** - Smooth animations and transitions

### State Management
- **React Query (TanStack Query v5)** - Server state, caching, optimistic updates
- **Zustand** - Client state (UI toggles, form drafts)
- **React Hook Form** - Form state with Zod schema validation

### Testing
- **Vitest** - Unit tests for components and hooks
- **React Testing Library** - Component integration tests
- **Playwright** - E2E tests for critical flows
- **axe-core** - Accessibility audits

---

## Common Patterns

### API Client Setup

**File**: `frontend/src/lib/api/client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { getAuthToken, refreshAuthToken } from '@/lib/auth';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAuthToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

### React Query Hook Template

**File**: `frontend/src/lib/api/hooks/useStyles.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Style, StyleCreate, StyleUpdate } from '@/types/entities';

// Query: List all styles
export function useStyles(params?: { skip?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['styles', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Style[]; total: number }>('/styles', {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Query: Get single style
export function useStyle(id: string | undefined) {
  return useQuery({
    queryKey: ['styles', id],
    queryFn: async () => {
      if (!id) throw new Error('Style ID required');
      const { data } = await apiClient.get<Style>(`/styles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Mutation: Create style
export function useCreateStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StyleCreate) => {
      const { data } = await apiClient.post<Style>('/styles', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
    },
  });
}

// Mutation: Update style
export function useUpdateStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: StyleUpdate }) => {
      const { data } = await apiClient.put<Style>(`/styles/${id}`, payload);
      return data;
    },
    onSuccess: (updatedStyle) => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      queryClient.invalidateQueries({ queryKey: ['styles', updatedStyle.id] });
    },
  });
}

// Mutation: Delete style
export function useDeleteStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/styles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
    },
  });
}
```

### WebSocket Hook

**File**: `frontend/src/lib/hooks/useWebSocket.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/lib/auth';

export interface WorkflowEvent {
  ts: string;
  run_id: string;
  event?: string;
  node?: string;
  phase?: 'start' | 'end' | 'fail';
  duration_ms?: number;
  metrics?: Record<string, number>;
  error?: string;
}

export function useWebSocket(url: string) {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const token = await getAuthToken();
      const wsUrl = `${url}?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WorkflowEvent;
          setEvents((prev) => [...prev, data]);
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected');
        // Reconnect after 3 seconds
        setTimeout(() => connect(), 3000);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [url]);

  const clearEvents = () => setEvents([]);

  return { events, isConnected, clearEvents };
}
```

### Validation with Zod

**File**: `frontend/src/lib/validation/schemas.ts`

```typescript
import { z } from 'zod';

export const styleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  genre: z.string().min(1, 'Genre is required'),
  sub_genre: z.array(z.string()).optional(),
  tempo_bpm: z.tuple([
    z.number().min(40).max(220),
    z.number().min(40).max(220),
  ]).refine(([min, max]) => min <= max, {
    message: 'Minimum BPM must be <= maximum BPM',
  }),
  key: z.string().min(1, 'Key is required'),
  modulations: z.array(z.string()).optional(),
  mood: z.array(z.string()).min(1, 'At least one mood required').max(5, 'Max 5 moods'),
  energy: z.enum(['low', 'medium', 'high']),
  instrumentation: z.array(z.string()).max(12, 'Max 12 instruments'),
  tags: z.array(z.string()).max(12, 'Max 12 tags'),
});

export const lyricsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sections: z.array(
    z.object({
      type: z.enum(['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre_chorus']),
      lines: z.array(z.string()).min(1, 'Section must have at least one line'),
      duration_sec: z.number().min(5).max(120).optional(),
    })
  ).min(1, 'At least one section required'),
  rhyme_scheme: z.string().optional(),
  meter: z.string().optional(),
  syllables_per_line: z.tuple([z.number(), z.number()]).optional(),
  pov: z.enum(['first', 'second', 'third']).optional(),
  tense: z.enum(['past', 'present', 'future']).optional(),
  imagery_tags: z.array(z.string()).max(10),
  sources: z.array(
    z.object({
      source_id: z.string().uuid(),
      weight: z.number().min(0).max(1),
    })
  ).optional(),
});

export const personaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(1000).optional(),
  vocal_range: z.object({
    low: z.string(),
    high: z.string(),
  }).optional(),
  delivery_style: z.array(z.string()).max(5),
  influences: z.array(z.string()).max(10),
  public_release: z.boolean().default(true),
});
```

---

## WP1: Design System & Component Library

**Agents**: `frontend-ui-engineer`
**Duration**: 1 week
**Priority**: CRITICAL - All other WPs depend on this

### Overview

Establish the component library following MeatyMusic design guidelines (dark theme, purple/blue accents). Build reusable primitives for forms, navigation, and data display.

### Design Tokens

**File**: `frontend/src/styles/theme.ts`

```typescript
export const theme = {
  colors: {
    background: '#0F0F1C',
    surface: '#1A1A2A',
    surfaceHover: '#22223A',
    primary: '#6D42F5',
    primaryHover: '#5A32E0',
    secondary: '#0070F3',
    secondaryHover: '#005BBF',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3C6',
    textTertiary: '#7A7A8C',
    error: '#E05361',
    success: '#2EB67D',
    warning: '#E3A652',
    border: '#2A2A3C',
    borderFocus: '#6D42F5',
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.25rem',   // 20px
      xl: '1.5rem',    // 24px
      '2xl': '2rem',   // 32px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
};
```

**Tailwind Config**: `frontend/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import { theme } from './src/styles/theme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: theme.colors,
      spacing: theme.spacing,
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,
    },
  },
  plugins: [],
};

export default config;
```

### Core Components

#### Button Component

**File**: `frontend/src/components/ui/Button.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-textPrimary hover:bg-primaryHover',
    secondary: 'bg-secondary text-textPrimary hover:bg-secondaryHover',
    ghost: 'bg-transparent text-textPrimary hover:bg-surfaceHover border border-border',
    danger: 'bg-error text-textPrimary hover:bg-error/90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

#### Multi-Select Chip Picker

**File**: `frontend/src/components/ui/ChipPicker.tsx`

```typescript
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipPickerProps {
  options: string[];
  value: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  placeholder?: string;
}

export function ChipPicker({ options, value, onChange, max, placeholder }: ChipPickerProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(
    (opt) => !value.includes(opt) && opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (option: string) => {
    if (max && value.length >= max) return;
    onChange([...value, option]);
    setSearch('');
  };

  const handleRemove = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleRemove(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-textPrimary rounded-full text-sm hover:bg-secondaryHover transition-colors"
          >
            {item}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>

      {/* Search input */}
      {(!max || value.length < max) && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder || 'Type to search...'}
          className="w-full px-4 py-2 bg-surface text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      {/* Dropdown options */}
      {search && filteredOptions.length > 0 && (
        <div className="max-h-48 overflow-y-auto bg-surface border border-border rounded-md">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAdd(option)}
              className="w-full px-4 py-2 text-left text-textPrimary hover:bg-surfaceHover transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {max && (
        <p className="text-xs text-textTertiary">
          {value.length} / {max} selected
        </p>
      )}
    </div>
  );
}
```

#### Range Slider (BPM)

**File**: `frontend/src/components/ui/RangeSlider.tsx`

```typescript
import React from 'react';
import * as RadixSlider from '@radix-ui/react-slider';

interface RangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
}

export function RangeSlider({ value, onChange, min, max, step = 1, label }: RangeSliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-textPrimary">{label}</label>
          <span className="text-sm text-textSecondary">
            {value[0]} - {value[1]}
          </span>
        </div>
      )}
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        onValueChange={(val) => onChange(val as [number, number])}
        min={min}
        max={max}
        step={step}
      >
        <RadixSlider.Track className="bg-surface relative grow rounded-full h-1">
          <RadixSlider.Range className="absolute bg-primary rounded-full h-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block w-4 h-4 bg-primary rounded-full hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary" />
        <RadixSlider.Thumb className="block w-4 h-4 bg-primary rounded-full hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary" />
      </RadixSlider.Root>
    </div>
  );
}
```

#### JSON Preview Panel

**File**: `frontend/src/components/ui/JsonPreview.tsx`

```typescript
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonPreviewProps {
  data: unknown;
  title?: string;
  collapsible?: boolean;
}

export function JsonPreview({ data, title, collapsible = true }: JsonPreviewProps) {
  const [collapsed, setCollapsed] = useState(collapsible);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-surfaceHover border-b border-border">
        {title && <h3 className="text-sm font-medium text-textPrimary">{title}</h3>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-textSecondary hover:text-textPrimary transition-colors"
            aria-label="Copy JSON"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-textSecondary hover:text-textPrimary transition-colors"
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <pre className="p-4 overflow-x-auto text-xs text-textSecondary font-mono">
          {jsonString}
        </pre>
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] Component library covers all PRD screen requirements
- [ ] Dark theme applied consistently across all components
- [ ] All interactive components keyboard-accessible
- [ ] Storybook stories document component API and variants
- [ ] Components pass axe accessibility audits

---

## WP2: Entity Editors

**Agents**: `frontend-form-engineer`, `frontend-ui-engineer`
**Duration**: 1.5 weeks
**Priority**: HIGH - Core user-facing functionality

### Overview

Build multi-step forms for creating and editing Persona, Style, Lyrics, Producer Notes, and Source entities. Forms enforce schema validation, show real-time feedback, and auto-save drafts.

### Style Editor

**File**: `frontend/src/app/styles/[id]/edit/page.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useStyle, useUpdateStyle } from '@/lib/api/hooks/useStyles';
import { styleSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { ChipPicker } from '@/components/ui/ChipPicker';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { JsonPreview } from '@/components/ui/JsonPreview';
import { z } from 'zod';

type StyleFormData = z.infer<typeof styleSchema>;

const MOOD_OPTIONS = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Dark', 'Uplifting',
  'Melancholic', 'Aggressive', 'Dreamy', 'Intense', 'Playful',
];

const INSTRUMENT_OPTIONS = [
  'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Drums', 'Piano', 'Synth',
  'Strings', 'Brass', 'Vocals', '808 Bass', 'Hi-Hat', 'Snare',
];

export default function EditStylePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: style, isLoading } = useStyle(params.id);
  const updateStyle = useUpdateStyle();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<StyleFormData>({
    resolver: zodResolver(styleSchema),
    defaultValues: style,
  });

  const formData = watch();

  const onSubmit = async (data: StyleFormData) => {
    await updateStyle.mutateAsync({ id: params.id, payload: data });
    router.push('/styles');
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold text-textPrimary mb-6">Edit Style</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Style Name
            </label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 bg-surface text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Upbeat Pop Anthem"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error">{errors.name.message}</p>
            )}
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Genre
            </label>
            <select
              {...register('genre')}
              className="w-full px-4 py-2 bg-surface text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select genre...</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hip-hop">Hip-Hop</option>
              <option value="country">Country</option>
              <option value="electronic">Electronic</option>
            </select>
            {errors.genre && (
              <p className="mt-1 text-xs text-error">{errors.genre.message}</p>
            )}
          </div>

          {/* Tempo BPM Range */}
          <RangeSlider
            label="Tempo (BPM)"
            value={formData.tempo_bpm || [80, 120]}
            onChange={(val) => setValue('tempo_bpm', val, { shouldValidate: true })}
            min={40}
            max={220}
            step={1}
          />
          {errors.tempo_bpm && (
            <p className="text-xs text-error">{errors.tempo_bpm.message}</p>
          )}

          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Key
            </label>
            <select
              {...register('key')}
              className="w-full px-4 py-2 bg-surface text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select key...</option>
              <option value="C Major">C Major</option>
              <option value="G Major">G Major</option>
              <option value="D Major">D Major</option>
              <option value="A Minor">A Minor</option>
              <option value="E Minor">E Minor</option>
            </select>
          </div>

          {/* Mood (Multi-Select Chips) */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Mood (1-5)
            </label>
            <ChipPicker
              options={MOOD_OPTIONS}
              value={formData.mood || []}
              onChange={(val) => setValue('mood', val, { shouldValidate: true })}
              max={5}
              placeholder="Search moods..."
            />
            {errors.mood && (
              <p className="mt-1 text-xs text-error">{errors.mood.message}</p>
            )}
          </div>

          {/* Energy */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Energy Level
            </label>
            <div className="flex gap-4">
              {['low', 'medium', 'high'].map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register('energy')}
                    value={level}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-textPrimary capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Instrumentation */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Instrumentation (Max 12)
            </label>
            <ChipPicker
              options={INSTRUMENT_OPTIONS}
              value={formData.instrumentation || []}
              onChange={(val) => setValue('instrumentation', val, { shouldValidate: true })}
              max={12}
              placeholder="Search instruments..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Tags (Max 12)
            </label>
            <ChipPicker
              options={[]}
              value={formData.tags || []}
              onChange={(val) => setValue('tags', val, { shouldValidate: true })}
              max={12}
              placeholder="Type custom tags..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={!isDirty} loading={updateStyle.isPending}>
              Save Changes
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>

        {/* Preview Column */}
        <div className="sticky top-8">
          <JsonPreview data={formData} title="Style Preview" />
        </div>
      </div>
    </div>
  );
}
```

### Lyrics Editor with Section Management

**File**: `frontend/src/components/lyrics/SectionEditor.tsx`

```typescript
import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre_chorus';
  lines: string[];
  duration_sec?: number;
}

interface SectionEditorProps {
  control: Control<any>;
}

export function SectionEditor({ control }: SectionEditorProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'sections',
  });

  const addSection = () => {
    append({ type: 'verse', lines: [''], duration_sec: undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-textPrimary">Sections</h3>
        <Button type="button" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              className="cursor-grab text-textSecondary hover:text-textPrimary"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <select
              {...control.register(`sections.${index}.type`)}
              className="px-3 py-2 bg-surfaceHover text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="intro">Intro</option>
              <option value="verse">Verse</option>
              <option value="pre_chorus">Pre-Chorus</option>
              <option value="chorus">Chorus</option>
              <option value="bridge">Bridge</option>
              <option value="outro">Outro</option>
            </select>

            <button
              type="button"
              onClick={() => remove(index)}
              className="ml-auto text-error hover:text-error/80 transition-colors"
              aria-label="Delete section"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <textarea
            {...control.register(`sections.${index}.lines.0`)}
            rows={4}
            className="w-full px-4 py-2 bg-surfaceHover text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            placeholder="Enter lyrics (one line per row)..."
          />

          <div className="mt-2">
            <label className="text-xs text-textSecondary">Duration (seconds)</label>
            <input
              type="number"
              {...control.register(`sections.${index}.duration_sec`, { valueAsNumber: true })}
              className="w-24 px-3 py-1 bg-surfaceHover text-textPrimary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Success Criteria

- [ ] All 6 entity forms (Persona, Style, Lyrics, Producer, Source, Blueprint) implemented
- [ ] Forms validate against Zod schemas with inline error display
- [ ] Auto-save drafts to localStorage every 30 seconds
- [ ] JSON preview updates in real-time as user types
- [ ] Tag conflict detection highlights conflicting selections (e.g., "whisper" + "anthemic")

---

## WP3: Dashboard & Navigation

**Agents**: `frontend-ui-engineer`
**Duration**: 1 week
**Priority**: MEDIUM - Improves UX but not blocking

### Overview

Build dashboard with recent songs, pending workflows, quick actions, and library pages for browsing entities.

### Dashboard Layout

**File**: `frontend/src/app/page.tsx`

```typescript
'use client';

import { useStyles } from '@/lib/api/hooks/useStyles';
import { useLyrics } from '@/lib/api/hooks/useLyrics';
import { usePersonas } from '@/lib/api/hooks/usePersonas';
import { Button } from '@/components/ui/Button';
import { Plus, Music, FileText, User } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: styles } = useStyles({ limit: 5 });
  const { data: lyrics } = useLyrics({ limit: 5 });
  const { data: personas } = usePersonas({ limit: 5 });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-textPrimary">Dashboard</h1>
        <Link href="/compose">
          <Button>
            <Plus className="h-4 w-4" /> New Song
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats */}
        <StatCard title="Styles" count={styles?.total || 0} icon={<Music />} href="/styles" />
        <StatCard title="Lyrics" count={lyrics?.total || 0} icon={<FileText />} href="/lyrics" />
        <StatCard title="Personas" count={personas?.total || 0} icon={<User />} href="/personas" />
      </div>

      {/* Recent Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentList title="Recent Styles" items={styles?.items || []} type="styles" />
        <RecentList title="Recent Lyrics" items={lyrics?.items || []} type="lyrics" />
      </div>
    </div>
  );
}

function StatCard({ title, count, icon, href }: any) {
  return (
    <Link href={href}>
      <div className="bg-surface border border-border rounded-lg p-6 hover:bg-surfaceHover transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="text-primary">{icon}</div>
          <span className="text-3xl font-bold text-textPrimary">{count}</span>
        </div>
        <h3 className="text-sm font-medium text-textSecondary">{title}</h3>
      </div>
    </Link>
  );
}

function RecentList({ title, items, type }: any) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-textPrimary mb-4">{title}</h2>
      <ul className="space-y-3">
        {items.map((item: any) => (
          <li key={item.id}>
            <Link
              href={`/${type}/${item.id}`}
              className="block p-3 bg-surfaceHover rounded-md hover:bg-surface transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="text-textPrimary font-medium">{item.name}</span>
                <span className="text-xs text-textTertiary">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Navigation Sidebar

**File**: `frontend/src/components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Music, FileText, User, Wrench, Database, Settings, Workflow } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Styles', href: '/styles', icon: Music },
  { name: 'Lyrics', href: '/lyrics', icon: FileText },
  { name: 'Personas', href: '/personas', icon: User },
  { name: 'Producer Notes', href: '/producer', icon: Wrench },
  { name: 'Sources', href: '/sources', icon: Database },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">MeatyMusic</h1>
      </div>

      <nav className="px-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-textPrimary'
                      : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

### Success Criteria

- [ ] Dashboard displays recent entities and quick actions
- [ ] Sidebar navigation highlights active route
- [ ] Library pages support pagination and search
- [ ] Mobile-responsive with hamburger menu below 768px

---

## WP4: Workflow Monitoring & Real-Time Updates

**Agents**: `frontend-workflow-engineer`
**Duration**: 1 week
**Priority**: HIGH - Critical for observability

### Overview

Build real-time workflow status page with WebSocket-driven progress updates, event log, and artifact viewer.

### Workflow Status Page

**File**: `frontend/src/app/workflows/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useWorkflowRun } from '@/lib/api/hooks/useWorkflows';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { JsonPreview } from '@/components/ui/JsonPreview';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const WORKFLOW_NODES = [
  'PLAN', 'STYLE', 'LYRICS', 'PRODUCER', 'COMPOSE', 'VALIDATE', 'FIX', 'REVIEW'
];

export default function WorkflowStatusPage({ params }: { params: { id: string } }) {
  const { data: run, refetch } = useWorkflowRun(params.id);
  const { events, isConnected } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL}/ws/events`
  );

  // Filter events for this run
  const runEvents = events.filter((e) => e.run_id === params.id);

  // Update run data when events arrive
  useEffect(() => {
    if (runEvents.length > 0) {
      refetch();
    }
  }, [runEvents.length]);

  if (!run) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Workflow Run</h1>
        <StatusBadge status={run.status} />
      </div>

      {/* Progress Timeline */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Progress</h2>
        <div className="space-y-4">
          {WORKFLOW_NODES.map((node) => {
            const nodeArtifact = run.artifacts?.[node];
            const nodeEvent = runEvents.find((e) => e.node === node && e.phase === 'end');
            const isActive = run.current_node === node;
            const isComplete = !!nodeArtifact;
            const isFailed = runEvents.some((e) => e.node === node && e.phase === 'fail');

            return (
              <NodeProgress
                key={node}
                name={node}
                isActive={isActive}
                isComplete={isComplete}
                isFailed={isFailed}
                durationMs={nodeEvent?.duration_ms}
                metrics={nodeEvent?.metrics}
              />
            );
          })}
        </div>
      </div>

      {/* Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {run.artifacts && Object.entries(run.artifacts).map(([node, artifact]) => (
          <JsonPreview key={node} data={artifact} title={`${node} Output`} />
        ))}
      </div>

      {/* Event Log */}
      <div className="mt-8">
        <EventLog events={runEvents} />
      </div>
    </div>
  );
}

function NodeProgress({ name, isActive, isComplete, isFailed, durationMs, metrics }: any) {
  return (
    <div className="flex items-center gap-4">
      {isComplete && <CheckCircle className="h-6 w-6 text-success" />}
      {isFailed && <XCircle className="h-6 w-6 text-error" />}
      {isActive && <Loader className="h-6 w-6 text-primary animate-spin" />}
      {!isActive && !isComplete && !isFailed && (
        <div className="h-6 w-6 rounded-full border-2 border-border" />
      )}

      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="font-medium text-textPrimary">{name}</span>
          {durationMs && (
            <span className="text-xs text-textTertiary">{durationMs}ms</span>
          )}
        </div>
        {metrics && (
          <div className="flex gap-4 mt-1">
            {Object.entries(metrics).map(([key, value]) => (
              <span key={key} className="text-xs text-textSecondary">
                {key}: {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    running: 'bg-secondary text-textPrimary',
    completed: 'bg-success text-textPrimary',
    failed: 'bg-error text-textPrimary',
    cancelled: 'bg-warning text-textPrimary',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

function EventLog({ events }: { events: any[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-textPrimary mb-4">Event Log</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-4 text-sm font-mono">
            <span className="text-textTertiary">{new Date(event.ts).toLocaleTimeString()}</span>
            <span className="text-textSecondary">{event.node || event.event}</span>
            <span className="text-textPrimary">{event.phase}</span>
            {event.error && <span className="text-error">{event.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Success Criteria

- [ ] Workflow status page displays real-time node progress
- [ ] WebSocket events update UI within 1 second
- [ ] Event log shows all workflow events chronologically
- [ ] Artifact viewer displays outputs for each completed node
- [ ] Status badges reflect current run state (running, completed, failed)

---

## WP5: API Integration & State Management

**Agents**: `frontend-data-engineer`
**Duration**: 1 week
**Priority**: CRITICAL - Connects UI to backend

### Overview

Integrate React Query for server state management, implement optimistic updates, and handle authentication flow.

### React Query Provider Setup

**File**: `frontend/src/app/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Optimistic Update Example

**File**: `frontend/src/lib/api/hooks/useStyles.ts` (extended)

```typescript
// Optimistic update for style creation
export function useCreateStyleOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StyleCreate) => {
      const { data } = await apiClient.post<Style>('/styles', payload);
      return data;
    },
    onMutate: async (newStyle) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['styles'] });

      // Snapshot previous value
      const previousStyles = queryClient.getQueryData(['styles']);

      // Optimistically update cache
      queryClient.setQueryData(['styles'], (old: any) => ({
        ...old,
        items: [{ id: 'temp-id', ...newStyle, created_at: new Date().toISOString() }, ...old.items],
        total: old.total + 1,
      }));

      return { previousStyles };
    },
    onError: (err, newStyle, context) => {
      // Rollback on error
      queryClient.setQueryData(['styles'], context?.previousStyles);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['styles'] });
    },
  });
}
```

### Success Criteria

- [ ] All entity CRUD hooks implemented with React Query
- [ ] Optimistic updates for create/update/delete operations
- [ ] Auth token refresh logic handles 401 responses
- [ ] Error boundaries catch and display API errors
- [ ] Query devtools available in development

---

## WP6: Testing & Accessibility

**Agents**: `qa-frontend-engineer`
**Duration**: 1 week
**Priority**: HIGH - Ensures quality and compliance

### Component Tests

**File**: `frontend/src/components/ui/ChipPicker.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChipPicker } from './ChipPicker';
import { expect, test, vi } from 'vitest';

test('ChipPicker allows selecting options', () => {
  const onChange = vi.fn();
  const options = ['Happy', 'Sad', 'Energetic'];

  render(<ChipPicker options={options} value={[]} onChange={onChange} />);

  // Type to search
  const input = screen.getByPlaceholderText(/search/i);
  fireEvent.change(input, { target: { value: 'Happy' } });

  // Click option
  const option = screen.getByText('Happy');
  fireEvent.click(option);

  expect(onChange).toHaveBeenCalledWith(['Happy']);
});

test('ChipPicker respects max limit', () => {
  const onChange = vi.fn();
  const options = ['A', 'B', 'C'];

  render(<ChipPicker options={options} value={['A', 'B']} onChange={onChange} max={2} />);

  // Search input should be hidden when at max
  expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
});

test('ChipPicker removes selected items', () => {
  const onChange = vi.fn();

  render(<ChipPicker options={[]} value={['Happy']} onChange={onChange} />);

  const removeButton = screen.getByRole('button', { name: /happy/i });
  fireEvent.click(removeButton);

  expect(onChange).toHaveBeenCalledWith([]);
});
```

### Accessibility Tests

**File**: `frontend/src/app/styles/edit/page.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import EditStylePage from './page';
import { expect, test } from 'vitest';

expect.extend(toHaveNoViolations);

test('Style edit page has no accessibility violations', async () => {
  const { container } = render(<EditStylePage params={{ id: 'test-id' }} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Test

**File**: `frontend/tests/e2e/compose-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Complete composition workflow', async ({ page }) => {
  await page.goto('/compose');

  // Select entities
  await page.click('text=Select Style');
  await page.click('text=Upbeat Pop');

  await page.click('text=Select Lyrics');
  await page.click('text=Summer Vibes');

  // Preview SDS
  await page.click('text=Preview');
  await expect(page.locator('pre')).toContainText('"genre": "pop"');

  // Submit workflow
  await page.click('text=Start Workflow');

  // Wait for workflow to complete
  await expect(page.locator('text=completed')).toBeVisible({ timeout: 60000 });

  // Verify artifacts
  await expect(page.locator('text=STYLE Output')).toBeVisible();
  await expect(page.locator('text=LYRICS Output')).toBeVisible();
});
```

### Success Criteria

- [ ] All components have unit tests with ≥80% coverage
- [ ] Critical flows have E2E tests (compose, edit entity)
- [ ] All pages pass axe accessibility audits (0 violations)
- [ ] Lighthouse scores: Performance ≥90, Accessibility 100

---

## Integration Timeline

### Week 1: Foundation
- WP1: Design system complete
- Mock API responses for development

### Week 2-3: Core Features
- WP2: Entity editors
- WP3: Dashboard
- WP4: Workflow monitoring
- Progressive integration with Phase 1 APIs as they become available

### Week 3-4: Polish & Testing
- WP5: Full API integration
- WP6: Testing and accessibility
- Bug fixes and performance optimization

---

## Success Criteria (Overall)

- [ ] Complete user-facing application for entity management
- [ ] Forms enforce validation (client + server)
- [ ] UI updates in real-time via WebSocket (<1s latency)
- [ ] Mobile-responsive (dashboard + all editors work on 375px width)
- [ ] WCAG 2.1 AA compliance (0 axe violations)
- [ ] Lighthouse scores: Performance ≥90, Accessibility 100, Best Practices ≥90
- [ ] E2E tests cover critical user flows
- [ ] Ready for Phase 5 integration (rendering UI)

---

## Exit Criteria

**Phase 4 complete when**:
1. All 6 entity editors deployed and functional
2. Dashboard displays recent entities and pending workflows
3. Real-time workflow monitoring via WebSocket working
4. API integration with Phase 1 services verified
5. Accessibility audit passes (WCAG 2.1 AA)
6. E2E tests for composition workflow passing
7. Production build deployable to Vercel/Netlify

**Handoff to Phase 5**:
- Frontend ready to integrate audio player for rendered assets
- Workflow UI ready to display render job status and download links
