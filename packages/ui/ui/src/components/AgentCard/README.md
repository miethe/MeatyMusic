# AgentCard Component

A card component for displaying agent metadata, runtime configuration, entry prompts, tools, and variables with interactive states and multiple size variants.

## Features

- **Multiple Size Variants**: Compact (288x220px), Standard (420x280px), and XL (560x320px)
- **Runtime Types**: Cloud Code, CLI, MCP, and Custom with color-coded badges
- **Interactive States**: Default, Running, Error, Disabled, and Selected
- **Selection Mode**: Optional checkbox selection with hover/active states
- **Keyboard Shortcuts**: r (run), e (edit), x (export), Enter (primary action)
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Responsive**: Mobile-optimized with touch targets
- **Motion Preferences**: Respects `prefers-reduced-motion`

## Basic Usage

```tsx
import { AgentCard } from '@meaty/ui';

function AgentVault() {
  return (
    <AgentCard
      name="Code Review Agent"
      version="1.0"
      runtime="cloud_code"
      entryPrompt={{
        id: 'prompt-123',
        name: 'Code Review Prompt',
        preview: 'Analyze pull request for code quality...'
      }}
      tools={[
        { id: 't1', name: 'GitHub API' },
        { id: 't2', name: 'Code Parser' }
      ]}
      variables={{
        repo: 'string',
        pr_number: 'number'
      }}
      tags={['automation', 'code-review']}
      onRun={() => console.log('Run clicked')}
      onEdit={() => console.log('Edit clicked')}
      onExport={() => console.log('Export clicked')}
    />
  );
}
```

## Size Variants

### Compact (288x220px)
Use for dense grids, mobile views, or quick scanning. Shows minimal information:
- Name + version
- Runtime badge (icon only)
- Entry prompt (1 line)
- Tools (icons only, max 2)
- Run + Menu buttons only

```tsx
<AgentCard
  size="compact"
  {...props}
/>
```

### Standard (420x280px - Default)
Balanced information density for gallery views:
- Full header with metadata
- Runtime badge with label
- Entry prompt (2 lines)
- Tools (badges with labels, max 3)
- Variables (compact JSON)
- Tags (max 4)
- Full action bar

```tsx
<AgentCard
  size="standard"
  {...props}
/>
```

### XL (560x320px)
Detailed view for featured agents or dashboards:
- Extended metadata
- Full entry prompt preview (3-4 lines)
- All tools displayed
- Variables (formatted JSON)
- All tags visible
- Extended actions

```tsx
<AgentCard
  size="xl"
  {...props}
/>
```

## Runtime Types

AgentCard supports four runtime environments with color-coded badges:

```tsx
// Cloud Code - Blue
<AgentCard runtime="cloud_code" {...props} />

// CLI - Purple
<AgentCard runtime="cli" {...props} />

// MCP (Model Context Protocol) - Green
<AgentCard runtime="mcp" {...props} />

// Custom - Orange
<AgentCard runtime="custom" {...props} />
```

### Custom Runtime Configuration

```tsx
<AgentCard
  runtime="custom"
  runtimeConfig={{
    icon: <CustomIcon />,
    label: 'My Runtime',
    color: 'bg-pink-500/10 text-pink-600'
  }}
  {...props}
/>
```

## Interactive States

### Running State
Shows animated progress bar and disables actions:

```tsx
<AgentCard
  isRunning={true}
  {...props}
/>
```

### Error State
Displays error banner with optional retry:

```tsx
<AgentCard
  error={{
    message: 'Failed to connect to API',
    retry: () => console.log('Retry')
  }}
  {...props}
/>
```

### Disabled State
Grays out and prevents interaction:

```tsx
<AgentCard
  disabled={true}
  {...props}
/>
```

### Selected State
Shows selection styling and checkbox:

```tsx
<AgentCard
  selectable={true}
  selected={true}
  onSelectionChange={(selected) => console.log(selected)}
  {...props}
/>
```

## Actions and Callbacks

### Primary Actions

```tsx
<AgentCard
  onRun={() => runAgent()}
  onEdit={() => editAgent()}
  onExport={() => exportAgent()}
  onMenuAction={(action) => handleMenuAction(action)}
  {...props}
/>
```

### Click Handlers

```tsx
<AgentCard
  onCardClick={() => viewDetails()}
  onTagClick={(tag) => filterByTag(tag)}
  onToolClick={(toolId) => viewTool(toolId)}
  onEntryPromptClick={(promptId) => editPrompt(promptId)}
  {...props}
/>
```

### State Changes

```tsx
<AgentCard
  onStateChange={(state) => {
    console.log(`State changed from ${state.from} to ${state.to}`);
    console.log(`Reason: ${state.reason}`);
  }}
  {...props}
/>
```

## Keyboard Shortcuts

When the card is focused:

- **Enter**: Activate primary action (Run or custom)
- **r**: Run agent
- **e**: Edit agent
- **x**: Export manifest
- **Space**: Toggle selection (if selectable)
- **Escape**: Cancel running action

## Accessibility

### ARIA Attributes

```tsx
<AgentCard
  aria-label="Custom accessible label"
  aria-describedby="additional-description-id"
  {...props}
/>
```

### Screen Reader Announcements

The component automatically announces state changes:
- "Agent name is now running"
- "Error in Agent name: error message"
- "Agent name finished running"
- "Agent name is selected"

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus states are clearly visible
- Tab order follows logical content flow

### High Contrast Mode

Automatically adjusts colors and borders for high contrast mode.

## Props API

```typescript
interface AgentCardProps {
  // Core Identity
  name: string;
  version?: string;
  description?: string;

  // Runtime Configuration
  runtime: 'cloud_code' | 'cli' | 'mcp' | 'custom';
  runtimeConfig?: {
    icon?: React.ReactNode;
    label?: string;
    color?: string;
  };

  // Entry & Context
  entryPrompt: {
    id: string;
    name: string;
    preview: string;
  };

  // Tools & Variables
  tools?: Array<{
    id: string;
    name: string;
    icon?: React.ReactNode;
  }>;
  variables?: Record<string, any>;

  // Metadata
  tags?: string[];
  access?: 'private' | 'public' | 'shared';
  createdAt?: Date;
  updatedAt?: Date;
  lastRun?: Date;

  // Metrics
  metrics?: {
    runs?: number;
    successRate?: number;
    avgDuration?: number;
  };

  // Actions
  onRun?: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onMenuAction?: (action: string) => void;
  onPrimaryAction?: () => void;

  // States
  isRunning?: boolean;
  error?: string | { message: string; retry?: () => void };
  disabled?: boolean;

  // Selection
  selectable?: boolean;
  selected?: boolean;
  hasActiveSelection?: boolean;
  onSelectionChange?: (selected: boolean, event: Event) => void;

  // Callbacks
  onCardClick?: () => void;
  onTagClick?: (tag: string, event: MouseEvent) => void;
  onToolClick?: (toolId: string, event: MouseEvent) => void;
  onEntryPromptClick?: (promptId: string, event: MouseEvent) => void;

  // Display Options
  size?: 'compact' | 'standard' | 'xl';
  showVariables?: boolean;
  showMetrics?: boolean;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

## Examples

### Basic Agent

```tsx
<AgentCard
  name="Simple Agent"
  runtime="cloud_code"
  entryPrompt={{
    id: 'p1',
    name: 'Main Prompt',
    preview: 'Basic agent functionality'
  }}
  onRun={() => console.log('Run')}
/>
```

### Data Processing Agent

```tsx
<AgentCard
  name="Data Processor"
  version="2.3"
  runtime="mcp"
  description="Process large datasets with filtering and transformation"
  entryPrompt={{
    id: 'p2',
    name: 'Data Pipeline',
    preview: 'Transform and aggregate data...'
  }}
  tools={[
    { id: 't1', name: 'Pandas' },
    { id: 't2', name: 'NumPy' },
    { id: 't3', name: 'SQL Engine' }
  ]}
  variables={{
    input_path: 'string',
    output_format: 'enum',
    chunk_size: 'number'
  }}
  tags={['data', 'etl', 'analytics']}
  access="shared"
  lastRun={new Date()}
  onRun={handleRun}
  onEdit={handleEdit}
  onExport={handleExport}
/>
```

### Selectable Grid

```tsx
function AgentGrid() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="grid grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          {...agent}
          size="compact"
          selectable
          selected={selected.has(agent.id)}
          hasActiveSelection={selected.size > 0}
          onSelectionChange={(isSelected) => {
            const newSelected = new Set(selected);
            if (isSelected) {
              newSelected.add(agent.id);
            } else {
              newSelected.delete(agent.id);
            }
            setSelected(newSelected);
          }}
        />
      ))}
    </div>
  );
}
```

## Design Patterns

### Following PromptCard Pattern
AgentCard follows the same architectural patterns as PromptCard:
- Zone-based layout system
- CVA for variant management
- Separated section components
- Shared hooks for state and shortcuts
- Complication slots (future enhancement)

### Component Architecture
```
AgentCard (wrapper with error boundary)
  ├─ Header (name, version, access)
  ├─ RuntimeBadge (colored runtime indicator)
  ├─ EntryPromptPreview (clickable preview)
  ├─ ToolsRow (badge list with overflow)
  ├─ VariablesRow (JSON display)
  ├─ TagsRow (filterable tags)
  └─ Actions (button bar)
```

## Testing

The component includes comprehensive Storybook stories covering:
- All size variants
- All runtime types
- All interactive states
- Long content scenarios
- Grid layouts
- Accessibility features

Run Storybook to view all variants:
```bash
pnpm --filter "./packages/ui" storybook
```

## Related Components

- **PromptCard**: Template for card architecture
- **ContextCard**: Similar card pattern for contexts
- **Badge**: Used for tags and metadata
- **Button**: Used for actions
- **Checkbox**: Used for selection
- **Tooltip**: Used for overflow and metadata

## Future Enhancements

- [ ] Complication slots for badges and indicators
- [ ] Drag and drop support
- [ ] Card animations and transitions
- [ ] Metrics visualizations (sparklines)
- [ ] Recent run history
- [ ] Provenance information
