# ModelFilter Component

A comprehensive multi-select filter component for AI models grouped by provider, designed specifically for the MeatyPrompts filter sidebar.

## Features

- **Multi-select functionality** with visual selection indicators
- **Provider grouping** with collapsible sections
- **Model count badges** showing prompt counts per model
- **Group operations** - select/deselect all models for a provider
- **Loading, error, and empty states** with proper UX
- **Full accessibility support** - WCAG AA compliant
- **Keyboard navigation** and screen reader support
- **Responsive design** with mobile-first approach

## Basic Usage

```tsx
import { ModelFilter, useModelFilter } from '@meaty/ui';

function MyFilterSidebar() {
  const modelFilter = useModelFilter({
    initialSelected: ['gpt-4', 'claude-3-opus'],
    onSelectionChange: (selected) => {
      console.log('Selected models:', selected);
    }
  });

  return (
    <ModelFilter
      modelGroups={modelGroups}
      selectedModels={modelFilter.selectedModels}
      onSelectionChange={modelFilter.setSelectedModels}
      onClearAll={modelFilter.clearAll}
    />
  );
}
```

## Data Structure

```tsx
interface ModelData {
  id: string;           // Unique identifier
  name: string;         // Model name (e.g., "gpt-4")
  provider: string;     // Provider name (e.g., "OpenAI")
  promptCount: number;  // Number of prompts using this model
  displayName?: string; // Human-friendly display name (e.g., "GPT-4")
}

interface ModelGroup {
  provider: string;     // Provider name
  models: ModelData[];  // Array of models for this provider
  totalCount: number;   // Total number of models in group
}
```

## Component States

### Loading State
```tsx
<ModelFilter
  modelGroups={[]}
  selectedModels={[]}
  onSelectionChange={() => {}}
  loading={true}
/>
```

### Error State
```tsx
<ModelFilter
  modelGroups={[]}
  selectedModels={[]}
  onSelectionChange={() => {}}
  error="Failed to load models"
  onRetry={() => refetch()}
/>
```

### Empty State
```tsx
<ModelFilter
  modelGroups={[]} // Empty array shows empty state
  selectedModels={[]}
  onSelectionChange={() => {}}
/>
```

## Advanced Usage with Hook

```tsx
import { ModelFilter, useModelFilter, type ModelGroup } from '@meaty/ui';

function AdvancedModelFilter() {
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const modelFilter = useModelFilter({
    maxSelections: 10, // Limit to 10 models
    onSelectionChange: (selected) => {
      // Update URL params, trigger API calls, etc.
      updateFilters({ models: selected });
    }
  });

  // Load data
  useEffect(() => {
    loadModelGroups()
      .then(setModelGroups)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle provider toggle
  const handleProviderToggle = (provider: string, models: ModelData[]) => {
    modelFilter.toggleProvider(provider, models);
  };

  return (
    <ModelFilter
      modelGroups={modelGroups}
      selectedModels={modelFilter.selectedModels}
      onSelectionChange={modelFilter.setSelectedModels}
      onProviderToggle={handleProviderToggle}
      onClearAll={modelFilter.clearAll}
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      maxHeight="500px"
      showClearAll={true}
    />
  );
}
```

## Accessibility Features

### Keyboard Navigation
- **Tab** - Navigate between provider groups and models
- **Space/Enter** - Toggle selection
- **Arrow Keys** - Navigate within groups (future enhancement)

### Screen Reader Support
- Proper ARIA roles and labels
- Selection state announcements
- Group structure communicated
- Count information included in labels

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus remains on toggled items

## Customization

### Styling
The component uses CSS variables and Tailwind classes for theming:

```css
/* Custom styling example */
.model-filter {
  --model-filter-max-height: 400px;
  --model-filter-border-radius: 8px;
}
```

### Provider Icons
Add provider icons by extending the ModelFilterGroup component:

```tsx
const providerIcons = {
  'OpenAI': <OpenAIIcon />,
  'Anthropic': <AnthropicIcon />,
  'Google': <GoogleIcon />,
};

// Custom group with icons
<ModelFilterGroup
  icon={providerIcons[provider]}
  // ... other props
/>
```

## Integration with FilterSidebar

```tsx
// In FilterSidebar.tsx
import { ModelFilter, useModelFilter } from '@meaty/ui';

function FilterSidebar() {
  const modelFilter = useModelFilter({
    onSelectionChange: (models) => {
      // Update global filter state
      updateFilters({ selectedModels: models });
    }
  });

  return (
    <FilterSection
      title="Models"
      collapsible
      defaultExpanded
    >
      <ModelFilter
        modelGroups={modelGroups}
        selectedModels={modelFilter.selectedModels}
        onSelectionChange={modelFilter.setSelectedModels}
        onClearAll={modelFilter.clearAll}
        loading={modelsLoading}
        error={modelsError}
      />
    </FilterSection>
  );
}
```

## Performance Considerations

- **Virtualization**: For 100+ models, consider using `react-window`
- **Memoization**: Model groups and handlers are memoized internally
- **Debounced search**: Add search functionality with debounced filtering
- **Lazy loading**: Load model counts on demand

## Testing

The component includes comprehensive test coverage:

```tsx
// Test selection behavior
it('toggles model selection', () => {
  const onSelectionChange = jest.fn();
  render(<ModelFilter {...props} onSelectionChange={onSelectionChange} />);

  fireEvent.click(screen.getByLabelText('Select GPT-4'));
  expect(onSelectionChange).toHaveBeenCalledWith(['gpt-4']);
});

// Test accessibility
it('has proper ARIA labels', () => {
  render(<ModelFilter {...props} />);
  expect(screen.getByRole('group', { name: 'Model filters' })).toBeInTheDocument();
});
```

## Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **Screen readers**: NVDA, JAWS, VoiceOver
- **Keyboard navigation**: All modern browsers
