# ModelPicker Component

The `ModelPicker` is an enhanced model selection component designed for MeatyPrompts' Models Consolidation project. It provides sophisticated model selection with advanced filtering, search, tagging, and accessibility features.

## Features

### Core Functionality
- **Dropdown/Popover Interface**: Built with @meaty/ui Popover components
- **Model Selection**: Support for both single and multiple model selection
- **Keyboard Navigation**: Complete keyboard accessibility (Arrow keys, Enter, Escape, Tab)
- **Loading & Error States**: Comprehensive state management with retry mechanisms
- **Empty States**: Helpful guidance when no models are available

### Advanced Filtering System
- **Provider Filtering**: Multi-select provider filter (OpenAI, Anthropic, Google, etc.)
- **Model Type Filtering**: Chat/completion, embedding, vision/multimodal, code generation
- **Capability Filtering**: Function calling, streaming, vision, JSON mode, custom tags
- **Performance Filtering**: Context length range slider, price range, speed preferences

### Search Functionality
- **Real-time Search**: <300ms response time with fuzzy matching
- **Typo Tolerance**: Handles variations and typos using Fuse.js
- **Multi-field Search**: Searches across names, providers, descriptions, capabilities
- **Search Highlighting**: Visual feedback for matched terms

### Performance Features
- **Virtualization**: Handle 1000+ models efficiently with @tanstack/react-virtual
- **Debounced Search**: 300ms debouncing for optimal performance
- **Memoized Components**: React.memo for expensive re-renders
- **Lazy Loading**: Non-critical features loaded on demand

### Accessibility (WCAG 2.1 AA)
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: ARIA labels, roles, and descriptions
- **Focus Management**: Roving tabindex and proper focus trapping
- **Color Contrast**: Compliant color schemes

## Usage

### Basic Usage

```tsx
import { ModelPicker } from '@meaty/ui';
import { useModels } from '@/hooks/useModels';

function MyComponent() {
  const { data: models = [], isLoading, error } = useModels();
  const [selectedModel, setSelectedModel] = useState('');

  return (
    <ModelPicker
      models={models}
      value={selectedModel}
      onValueChange={setSelectedModel}
      loading={isLoading}
      error={error?.message}
      placeholder="Select a model..."
    />
  );
}
```

### Multiple Selection

```tsx
function MultiSelectExample() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  return (
    <ModelPicker
      models={models}
      multiple
      value={selectedModels}
      onValueChange={setSelectedModels}
      placeholder="Select models..."
    />
  );
}
```

### With Provider Filtering

```tsx
function ProviderFilteredExample() {
  return (
    <ModelPicker
      models={models}
      providers={['OpenAI', 'Anthropic']}
      value={selectedModel}
      onValueChange={setSelectedModel}
      placeholder="Select OpenAI or Anthropic model..."
    />
  );
}
```

### With Capabilities Filtering

```tsx
function CapabilityFilteredExample() {
  return (
    <ModelPicker
      models={models}
      capabilities={['vision', 'tools']}
      value={selectedModel}
      onValueChange={setSelectedModel}
      placeholder="Select vision-capable model..."
    />
  );
}
```

### Large Dataset (Virtualized)

```tsx
function VirtualizedExample() {
  return (
    <ModelPicker
      models={largeModelList} // 1000+ models
      virtualized
      value={selectedModel}
      onValueChange={setSelectedModel}
      maxHeight="500px"
    />
  );
}
```

### Compound Components (Advanced)

```tsx
function CustomModelPicker() {
  return (
    <ModelPickerRoot>
      <ModelPickerTrigger>
        <CustomTriggerContent />
      </ModelPickerTrigger>

      <ModelPickerContent
        searchable
        filterable
        showDetails
        maxHeight="400px"
      />
    </ModelPickerRoot>
  );
}
```

## Props

### ModelPickerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `models` | `EnhancedModel[]` | `[]` | Array of available models |
| `value` | `string \| string[]` | `undefined` | Selected model ID(s) |
| `onValueChange` | `(value: string \| string[]) => void` | - | Callback when selection changes |
| `multiple` | `boolean` | `false` | Allow multiple model selection |
| `placeholder` | `string` | `"Select a model..."` | Placeholder text for trigger |
| `disabled` | `boolean` | `false` | Whether picker is disabled |
| `error` | `string` | `undefined` | Error message to display |
| `providers` | `string[]` | `undefined` | Filter by specific providers |
| `capabilities` | `string[]` | `undefined` | Filter by specific capabilities |
| `searchable` | `boolean` | `true` | Show search functionality |
| `filterable` | `boolean` | `true` | Show filter functionality |
| `taggable` | `boolean` | `true` | Show tagging functionality |
| `virtualized` | `boolean` | `false` | Use virtualization for large lists |
| `maxHeight` | `string` | `"400px"` | Maximum height of dropdown |
| `loading` | `boolean` | `false` | Loading state |
| `onRetry` | `() => void` | `undefined` | Retry callback for errors |

### EnhancedModel Interface

```tsx
interface EnhancedModel {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  short_label?: string;
  family?: string;
  modalities?: string[];
  context_window?: number;
  max_output_tokens?: number;
  supports_tools: boolean;
  supports_json_mode: boolean;
  status: 'active' | 'deprecated' | 'beta';
  pricing?: {
    input_cost_per_token?: number;
    output_cost_per_token?: number;
    currency?: string;
  };
  capabilities: ModelCapability[];
  performance: ModelPerformance;
  deprecation?: DeprecationInfo;
  tags: UserTag[];
  logoUrl?: string;
  description?: string;
}
```

## Styling

The component uses Tailwind CSS classes and follows the @meaty/ui design system. All styling can be customized through the `className` prop or by overriding the CSS variables.

## Accessibility

- **Keyboard Navigation**: Arrow keys, Enter, Escape, Tab
- **Screen Reader**: Complete ARIA support with descriptive labels
- **Focus Management**: Proper focus trapping and restoration
- **Color Contrast**: WCAG 2.1 AA compliant

## Performance

- **Virtualization**: Automatic for 1000+ items
- **Debouncing**: Search inputs debounced to 300ms
- **Memoization**: Expensive computations are memoized
- **Bundle Size**: Tree-shakeable with minimal dependencies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- `@radix-ui/react-popover`: Dropdown functionality
- `cmdk`: Command palette and keyboard navigation
- `@tanstack/react-virtual`: Virtualization for large lists
- `fuse.js`: Fuzzy search functionality
