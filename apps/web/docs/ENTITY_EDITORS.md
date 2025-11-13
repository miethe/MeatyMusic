# Entity Editors Developer Guide

Comprehensive guide to building and extending entity editors in MeatyMusic AMCS.

## Table of Contents

1. [Entity Editor Architecture](#entity-editor-architecture)
2. [Common Component Patterns](#common-component-patterns)
3. [Form Validation Patterns](#form-validation-patterns)
4. [Preview Panel Integration](#preview-panel-integration)
5. [Creating New Entity Editors](#creating-new-entity-editors)
6. [Extending Existing Editors](#extending-existing-editors)
7. [Best Practices](#best-practices)
8. [Editor Reference](#editor-reference)

## Entity Editor Architecture

All entity editors follow a consistent architecture:

```
┌─────────────────────────────────────────────────┐
│                Entity Editor                     │
├─────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────────────┐ │
│  │   Editor Form  │  │   Preview Panel        │ │
│  │                │  │                        │ │
│  │ - Input fields │  │ - Live JSON preview    │ │
│  │ - Common       │  │ - Validation errors    │ │
│  │   components   │  │ - Field highlighting   │ │
│  │ - Validation   │  │                        │ │
│  └────────────────┘  └────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │           Action Bar                        │ │
│  │   [Cancel]            [Preview]   [Save]   │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Core Principles

1. **Consistent Interface**: All editors share the same props structure
2. **Live Validation**: Validate as user types
3. **Preview Panel**: Show JSON and errors in real-time
4. **Reusable Components**: ChipSelector, RangeSlider, etc.
5. **TypeScript Types**: Full type safety throughout

### Editor Props Pattern

```typescript
interface EntityEditorProps<T> {
  initialValue?: Partial<T>;   // For edit mode
  onSave: (entity: T) => void;  // Save callback
  onCancel: () => void;         // Cancel callback
  className?: string;           // Optional styling
}
```

## Common Component Patterns

### ChipSelector

Multi-select input with suggestions and validation.

**Usage:**

```tsx
import { ChipSelector } from '@/components/entities/common/ChipSelector';

function MyEditor() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <ChipSelector
      label="Tags"
      value={tags}
      onChange={setTags}
      suggestions={['pop', 'rock', 'jazz']}
      maxChips={5}
      placeholder="Add tags..."
      helpText="Maximum 5 tags recommended"
      required
    />
  );
}
```

**With Validation:**

```tsx
const [moods, setMoods] = useState<string[]>([]);
const error = moods.length === 0 ? 'At least one mood required' : undefined;
const warning = moods.length > 5 ? 'Too many moods may conflict' : undefined;

<ChipSelector
  label="Mood"
  value={moods}
  onChange={setMoods}
  error={error}
  warning={warning}
  required
/>
```

### RangeSlider

Single value or range input with presets.

**Single Value:**

```tsx
import { RangeSlider } from '@/components/entities/common/RangeSlider';

function EnergyLevel() {
  const [energy, setEnergy] = useState(5);

  return (
    <RangeSlider
      label="Energy Level"
      min={1}
      max={10}
      value={energy}
      onChange={setEnergy}
      helpText="1 = Low energy, 10 = Anthemic"
    />
  );
}
```

**Range with Presets:**

```tsx
function TempoRange() {
  const [bpm, setBpm] = useState<[number, number]>([120, 140]);

  return (
    <RangeSlider
      label="Tempo (BPM)"
      min={40}
      max={220}
      value={bpm}
      onChange={setBpm}
      unit=" BPM"
      presets={[
        { label: 'Slow (60-80)', value: [60, 80] },
        { label: 'Moderate (80-120)', value: [80, 120] },
        { label: 'Fast (120-160)', value: [120, 160] },
      ]}
      required
    />
  );
}
```

### SectionEditor

Editor for song sections (verses, chorus, bridge).

**Usage:**

```tsx
import { SectionEditor } from '@/components/entities/common/SectionEditor';
import type { LyricsSection } from '@/types/api';

function LyricsSections() {
  const [sections, setSections] = useState<LyricsSection[]>([
    { type: 'verse', lines: ['First line', 'Second line'], order: 0 },
    { type: 'chorus', lines: ['Hook line'], order: 1 },
  ]);

  return (
    <SectionEditor
      sections={sections}
      onChange={setSections}
      maxSections={10}
    />
  );
}
```

### RhymeSchemeInput

Input for rhyme scheme patterns.

**Usage:**

```tsx
import { RhymeSchemeInput } from '@/components/entities/common/RhymeSchemeInput';

function RhymeScheme() {
  const [scheme, setScheme] = useState('AABB');

  return (
    <RhymeSchemeInput
      value={scheme}
      onChange={setScheme}
      suggestions={['AABB', 'ABAB', 'ABCB', 'AAAA']}
      placeholder="Enter rhyme scheme..."
    />
  );
}
```

### EntityPreviewPanel

Live preview panel showing entity JSON and validation errors.

**Usage:**

```tsx
import { EntityPreviewPanel, ValidationError } from '@/components/entities/common/EntityPreviewPanel';

function MyEditor() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<ValidationError[]>([]);

  return (
    <div className="flex">
      <div className="flex-1">
        {/* Form fields */}
      </div>

      <EntityPreviewPanel
        entity={formData}
        validationErrors={errors}
      />
    </div>
  );
}
```

## Form Validation Patterns

### Real-Time Validation

Validate as user types using `useEffect`:

```tsx
function StyleEditor() {
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    instrumentation: [],
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Style name is required',
        severity: 'error',
      });
    }

    if (!formData.genre?.trim()) {
      errors.push({
        field: 'genre',
        message: 'Genre is required',
        severity: 'error',
      });
    }

    if (formData.instrumentation.length > 3) {
      errors.push({
        field: 'instrumentation',
        message: 'More than 3 instruments may dilute the mix',
        severity: 'warning',
      });
    }

    setValidationErrors(errors);
  };

  // ...
}
```

### Validation Error Structure

```typescript
interface ValidationError {
  field: string;                     // Field identifier
  message: string;                   // Error message
  severity: 'error' | 'warning';     // Error level
}
```

### Error Severity

**Error**: Blocks save, must be fixed
**Warning**: Allows save, but warns user

```tsx
const handleSave = () => {
  const hasErrors = validationErrors.some(e => e.severity === 'error');

  if (hasErrors) {
    // Don't save - show error message
    return;
  }

  // Has warnings but no errors - allow save
  onSave(formData);
};
```

### Field-Level Validation

```tsx
function validateName(name: string): ValidationError | null {
  if (!name.trim()) {
    return {
      field: 'name',
      message: 'Name is required',
      severity: 'error',
    };
  }

  if (name.length < 3) {
    return {
      field: 'name',
      message: 'Name must be at least 3 characters',
      severity: 'error',
    };
  }

  if (name.length > 100) {
    return {
      field: 'name',
      message: 'Name is too long (max 100 characters)',
      severity: 'error',
    };
  }

  return null;
}

// Use in validation
const nameError = validateName(formData.name);
if (nameError) errors.push(nameError);
```

### Cross-Field Validation

```tsx
function validateTempoRange(min: number, max: number): ValidationError | null {
  if (min > max) {
    return {
      field: 'bpm',
      message: 'Minimum BPM cannot exceed maximum',
      severity: 'error',
    };
  }

  if (max - min > 50) {
    return {
      field: 'bpm',
      message: 'BPM range too wide, may cause inconsistency',
      severity: 'warning',
    };
  }

  return null;
}
```

## Preview Panel Integration

### Basic Integration

```tsx
function MyEditor() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header with toggle */}
      <div className="flex-shrink-0 flex items-center justify-between p-6">
        <h2>Entity Editor</h2>
        <button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form fields */}
        </div>

        {showPreview && (
          <div className="w-96 border-l">
            <EntityPreviewPanel
              entity={formData}
              validationErrors={errors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Responsive Preview

```tsx
// Hide preview on mobile, show on desktop
{showPreview && (
  <div className="hidden md:block w-96 border-l">
    <EntityPreviewPanel
      entity={formData}
      validationErrors={errors}
    />
  </div>
)}

// Mobile toggle button
<button
  onClick={() => setShowPreview(!showPreview)}
  className="md:hidden"
>
  {showPreview ? 'Hide' : 'Show'} Preview
</button>
```

## Creating New Entity Editors

### Step 1: Define Types

```typescript
// types/api/entities/myEntity.ts

export interface MyEntityBase {
  name: string;
  description: string;
  tags: string[];
  // ... other fields
}

export interface MyEntity extends MyEntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface MyEntityCreate extends MyEntityBase {}
export interface MyEntityUpdate extends Partial<MyEntityBase> {}
```

### Step 2: Create Editor Component

```tsx
// components/entities/MyEntityEditor.tsx

'use client';

import { useState, useEffect } from 'react';
import { MyEntityBase, MyEntityCreate } from '@/types/api';
import { ChipSelector } from './common/ChipSelector';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { Save, X } from 'lucide-react';

export interface MyEntityEditorProps {
  initialValue?: Partial<MyEntityBase>;
  onSave: (entity: MyEntityCreate) => void;
  onCancel: () => void;
  className?: string;
}

export function MyEntityEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
}: MyEntityEditorProps) {
  const [formData, setFormData] = useState<Partial<MyEntityBase>>({
    name: '',
    description: '',
    tags: [],
    ...initialValue,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error',
      });
    }

    if (formData.tags && formData.tags.length > 10) {
      errors.push({
        field: 'tags',
        message: 'Too many tags (max 10)',
        severity: 'warning',
      });
    }

    setValidationErrors(errors);
  };

  const handleSave = () => {
    const hasErrors = validationErrors.some(e => e.severity === 'error');
    if (hasErrors) return;

    onSave(formData as MyEntityCreate);
  };

  const updateField = <K extends keyof MyEntityBase>(
    field: K,
    value: MyEntityBase[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">My Entity Editor</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={onCancel}>
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={validationErrors.some(e => e.severity === 'error')}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter name..."
              className="w-full px-4 py-2 rounded-lg border"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter description..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border"
            />
          </div>

          {/* Tags */}
          <ChipSelector
            label="Tags"
            value={formData.tags || []}
            onChange={(value) => updateField('tags', value)}
            maxChips={10}
            placeholder="Add tags..."
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-96 border-l">
            <EntityPreviewPanel
              entity={formData}
              validationErrors={validationErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Create API Hooks

```tsx
// hooks/api/useMyEntity.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myEntityApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { MyEntity, MyEntityCreate, MyEntityUpdate } from '@/types/api';

export function useMyEntities(filters?: any) {
  return useQuery({
    queryKey: queryKeys.myEntities.list(filters),
    queryFn: () => myEntityApi.list(filters),
  });
}

export function useMyEntity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.myEntities.detail(id!),
    queryFn: () => myEntityApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateMyEntity() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (entity: MyEntityCreate) => myEntityApi.create(entity),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myEntities.lists() });
      addToast(`${data.name} created successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create entity', 'error');
    },
  });
}

export function useUpdateMyEntity(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (entity: MyEntityUpdate) => myEntityApi.update(id, entity),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.myEntities.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.myEntities.lists() });
      addToast(`${data.name} updated successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update entity', 'error');
    },
  });
}
```

### Step 4: Create Pages

```tsx
// app/(dashboard)/entities/my-entity/new/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { MyEntityEditor } from '@/components/entities/MyEntityEditor';
import { useCreateMyEntity } from '@/hooks/api/useMyEntity';

export default function CreateMyEntityPage() {
  const router = useRouter();
  const createEntity = useCreateMyEntity();

  return (
    <MyEntityEditor
      onSave={(entity) => {
        createEntity.mutate(entity, {
          onSuccess: () => {
            router.push('/entities/my-entity');
          },
        });
      }}
      onCancel={() => router.back()}
    />
  );
}
```

```tsx
// app/(dashboard)/entities/my-entity/[id]/edit/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { MyEntityEditor } from '@/components/entities/MyEntityEditor';
import { useMyEntity, useUpdateMyEntity } from '@/hooks/api/useMyEntity';

export default function EditMyEntityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: entity, isLoading } = useMyEntity(params.id);
  const updateEntity = useUpdateMyEntity(params.id);

  if (isLoading) return <div>Loading...</div>;
  if (!entity) return <div>Not found</div>;

  return (
    <MyEntityEditor
      initialValue={entity}
      onSave={(updates) => {
        updateEntity.mutate(updates, {
          onSuccess: () => {
            router.push('/entities/my-entity');
          },
        });
      }}
      onCancel={() => router.back()}
    />
  );
}
```

## Extending Existing Editors

### Adding New Fields

```tsx
// Extend StyleEditor with new field

function StyleEditor() {
  const [formData, setFormData] = useState({
    // ... existing fields
    dynamics: 'moderate', // NEW FIELD
  });

  // Add to validation
  const validateForm = () => {
    // ... existing validation

    if (!formData.dynamics) {
      errors.push({
        field: 'dynamics',
        message: 'Dynamics level required',
        severity: 'error',
      });
    }
  };

  // Add field to form
  return (
    <div>
      {/* ... existing fields */}

      {/* NEW FIELD */}
      <div>
        <label>Dynamics</label>
        <select
          value={formData.dynamics}
          onChange={(e) => updateField('dynamics', e.target.value)}
        >
          <option value="soft">Soft</option>
          <option value="moderate">Moderate</option>
          <option value="loud">Loud</option>
        </select>
      </div>
    </div>
  );
}
```

### Custom Validation Rules

```tsx
// Add custom validation to LyricsEditor

function LyricsEditor() {
  // ... existing code

  const validateForm = () => {
    const errors: ValidationError[] = [];

    // ... existing validation

    // CUSTOM VALIDATION: Check syllable count
    const totalSyllables = countSyllables(formData.sections);
    if (totalSyllables > 500) {
      errors.push({
        field: 'sections',
        message: 'Too many syllables, may exceed render limits',
        severity: 'warning',
      });
    }

    // CUSTOM VALIDATION: Check rhyme consistency
    if (formData.rhyme_scheme && !validateRhymeScheme(formData.sections, formData.rhyme_scheme)) {
      errors.push({
        field: 'rhyme_scheme',
        message: 'Rhyme scheme does not match section count',
        severity: 'error',
      });
    }

    setValidationErrors(errors);
  };
}
```

### Adding Custom Components

```tsx
// Add custom component to ProducerNotesEditor

import { CustomEffectSelector } from './custom/CustomEffectSelector';

function ProducerNotesEditor() {
  const [effects, setEffects] = useState<Effect[]>([]);

  return (
    <div>
      {/* ... existing fields */}

      {/* CUSTOM COMPONENT */}
      <CustomEffectSelector
        value={effects}
        onChange={setEffects}
        availableEffects={['reverb', 'delay', 'chorus']}
      />
    </div>
  );
}
```

## Best Practices

### TypeScript Types

Always use strong typing:

```tsx
// Good
interface FormData extends StyleBase {}
const [formData, setFormData] = useState<Partial<FormData>>({});
const updateField = <K extends keyof FormData>(
  field: K,
  value: FormData[K]
) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

// Bad
const [formData, setFormData] = useState<any>({});
const updateField = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Validation Rules

Separate validation logic:

```tsx
// validation/styleValidation.ts

export function validateStyleName(name: string): ValidationError | null {
  if (!name.trim()) {
    return { field: 'name', message: 'Required', severity: 'error' };
  }
  if (name.length < 3) {
    return { field: 'name', message: 'Too short', severity: 'error' };
  }
  return null;
}

export function validateGenre(genre: string): ValidationError | null {
  const validGenres = ['pop', 'rock', 'jazz'];
  if (!validGenres.includes(genre)) {
    return { field: 'genre', message: 'Invalid genre', severity: 'error' };
  }
  return null;
}

// Use in editor
import { validateStyleName, validateGenre } from './validation/styleValidation';

const errors = [
  validateStyleName(formData.name),
  validateGenre(formData.genre),
].filter(Boolean);
```

### Error Messaging

Provide clear, actionable error messages:

```tsx
// Good
'Song title must be between 3 and 100 characters'
'At least one mood tag is required'
'Maximum BPM cannot exceed minimum BPM'

// Bad
'Invalid input'
'Error'
'Check this field'
```

### Accessibility

Ensure editors are accessible:

```tsx
<label htmlFor="name" className="block text-sm font-medium">
  Name <span className="text-red-500">*</span>
</label>
<input
  id="name"
  type="text"
  value={formData.name}
  onChange={(e) => updateField('name', e.target.value)}
  aria-required="true"
  aria-invalid={hasError('name')}
  aria-describedby={hasError('name') ? 'name-error' : undefined}
/>
{hasError('name') && (
  <p id="name-error" className="text-red-500 text-sm" role="alert">
    {getError('name')}
  </p>
)}
```

### Performance

Optimize re-renders:

```tsx
// Use memo for expensive computations
const syllableCount = useMemo(() => {
  return countSyllables(formData.sections);
}, [formData.sections]);

// Debounce auto-save
const debouncedSave = useDebounce(formData, 1000);
useEffect(() => {
  if (debouncedSave) {
    autoSave(debouncedSave);
  }
}, [debouncedSave]);
```

## Editor Reference

### Available Editors

- **StyleEditor**: Genre, tempo, mood, instrumentation
- **LyricsEditor**: Sections, rhyme scheme, meter, POV
- **PersonaEditor**: Vocal range, influences, style preferences
- **ProducerNotesEditor**: Arrangement, mix targets, effects
- **BlueprintEditor**: Genre rules, constraints, scoring
- **SongEditor**: Combines all entities

### Common Components

- **ChipSelector**: Multi-select tags
- **RangeSlider**: Single value or range
- **SectionEditor**: Song section editor
- **RhymeSchemeInput**: Rhyme pattern input
- **EntityPreviewPanel**: JSON preview with errors

### Validation Helpers

```typescript
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

function hasErrors(errors: ValidationError[]): boolean;
function getError(errors: ValidationError[], field: string): string | undefined;
function getErrorsForField(errors: ValidationError[], field: string): ValidationError[];
```

## See Also

- [Component Usage Guide](./COMPONENTS.md) - Component patterns
- [State Management Guide](./STATE_MANAGEMENT.md) - Form state management
- [Development Guide](./DEVELOPMENT.md) - Development workflow

## References

- Phase 5 Design: `.claude/context/phase5-design-specs.md`
- Component Mapping: `.claude/context/phase5-component-mapping.md`
- Wave 1 Summary: `.claude/context/phase5-wave1a-summary.md`
