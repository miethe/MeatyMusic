# MarkdownEditor Component

A rich markdown editor with split-view layout, live preview, formatting toolbar, autosave, and keyboard shortcuts. Built on CodeMirror 6 with full WCAG 2.1 AA accessibility compliance.

## Features

### Core Functionality
- **Split-view layout**: Editor and preview side-by-side (50/50)
- **CodeMirror 6 integration**: Syntax highlighting for markdown
- **Live preview**: Real-time rendering with GitHub Flavored Markdown (GFM)
- **Formatting toolbar**: Bold, Italic, Heading, Link, Code, Lists
- **Autosave**: Configurable debounce (default: 1.5s)
- **Dirty state tracking**: Visual indicator for unsaved changes
- **Responsive design**: Stacks vertically on mobile (<640px)

### Keyboard Shortcuts
- **Cmd+B / Ctrl+B**: Bold
- **Cmd+I / Ctrl+I**: Italic
- **Cmd+K / Ctrl+K**: Link
- **Cmd+S / Ctrl+S**: Save
- **Cmd+/ / Ctrl+/**: Toggle layout (split → editor → preview → split)
- **Esc**: Blur editor

### Layout Modes
- **split**: Editor and preview side-by-side (default)
- **editor**: Editor only
- **preview**: Preview only

### Accessibility
- Full keyboard navigation (Tab, Shift+Tab, shortcuts)
- ARIA labels for screen readers
- Focus visible indicators
- Live regions for preview updates
- WCAG 2.1 AA compliant (verified with jest-axe)

## Installation

```bash
pnpm add @meaty/ui
```

### Dependencies
The MarkdownEditor uses these libraries (included in `@meaty/ui`):
- `@uiw/react-codemirror` - CodeMirror 6 React wrapper
- `@codemirror/lang-markdown` - Markdown language support
- `react-markdown` - Markdown renderer
- `remark-gfm` - GitHub Flavored Markdown plugin
- `rehype-sanitize` - HTML sanitization for security

## Basic Usage

```typescript
import { MarkdownEditor } from '@meaty/ui';
import { useState } from 'react';

function MyComponent() {
  const [content, setContent] = useState('# Hello World\n\nStart typing...');

  const handleSave = (value: string) => {
    console.log('Saving:', value);
    // Save to backend, local storage, etc.
  };

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      onSave={handleSave}
    />
  );
}
```

## API Reference

### MarkdownEditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Current markdown value |
| `onChange` | `(value: string) => void` | required | Change handler called on every edit |
| `onSave` | `(value: string) => void` | - | Save callback triggered by Cmd+S or autosave |
| `placeholder` | `string` | `'Enter your markdown here...'` | Placeholder text for empty editor |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `className` | `string` | - | Additional CSS classes |
| `autoFocus` | `boolean` | `false` | Auto-focus the editor on mount |
| `minHeight` | `string` | `'400px'` | Minimum height of the editor |
| `autosave` | `boolean` | `true` | Enable autosave |
| `autosaveDelay` | `number` | `1500` | Autosave delay in milliseconds |
| `layout` | `'split' \| 'editor' \| 'preview'` | `'split'` | Layout mode |
| `showToolbar` | `boolean` | `true` | Show formatting toolbar |
| `ariaLabel` | `string` | `'Markdown editor'` | ARIA label for accessibility |
| `isDirty` | `boolean` | - | External dirty state (controlled) |
| `onDirtyChange` | `(isDirty: boolean) => void` | - | Callback when dirty state changes |

## Examples

### Basic Editor with Autosave

```typescript
import { MarkdownEditor } from '@meaty/ui';
import { useState } from 'react';

function BasicEditor() {
  const [content, setContent] = useState('');

  const handleSave = (value: string) => {
    fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify({ content: value }),
    });
  };

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      onSave={handleSave}
      placeholder="Start writing your prompt..."
    />
  );
}
```

### Editor Only (No Preview)

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  layout="editor"
  minHeight="500px"
/>
```

### Read-Only Preview

```typescript
<MarkdownEditor
  value={savedContent}
  onChange={() => {}} // No-op
  layout="preview"
  readOnly
  showToolbar={false}
/>
```

### Controlled Dirty State

```typescript
function ControlledEditor() {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = (value: string) => {
    // Save to backend
    setIsDirty(false);
  };

  return (
    <div>
      {isDirty && (
        <div className="text-warning mb-2">
          You have unsaved changes!
        </div>
      )}
      <MarkdownEditor
        value={content}
        onChange={setContent}
        onSave={handleSave}
        isDirty={isDirty}
        onDirtyChange={setIsDirty}
      />
    </div>
  );
}
```

### Fast Autosave (500ms)

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  onSave={handleSave}
  autosave
  autosaveDelay={500}
/>
```

### No Autosave (Manual Save Only)

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  onSave={handleSave}
  autosave={false}
/>
// User must press Cmd+S to save
```

### Custom Height

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  minHeight="600px"
/>
```

### Auto-Focus on Mount

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  autoFocus
/>
```

### Form Integration

```typescript
import { MarkdownEditor } from '@meaty/ui';
import { Label } from '@meaty/ui';
import { useState } from 'react';

function PromptForm() {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('Body is required');
      return;
    }
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="body">Prompt Body *</Label>
        <MarkdownEditor
          value={body}
          onChange={(val) => {
            setBody(val);
            setError('');
          }}
          placeholder="Enter your prompt text..."
          ariaLabel="Prompt body editor"
        />
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
      </div>
      <button type="submit">Create Prompt</button>
    </form>
  );
}
```

## GitHub Flavored Markdown (GFM) Support

The MarkdownEditor supports all GFM features:

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Task Lists
```markdown
- [x] Completed task
- [ ] Incomplete task
```

### Strikethrough
```markdown
~~crossed out~~
```

### Autolinks
```markdown
https://example.com
```

## Styling

The MarkdownEditor uses design tokens from `@meaty/tokens` for consistent styling:

```typescript
// Preview prose styles are customizable via Tailwind
<MarkdownEditor
  value={content}
  onChange={setContent}
  className="custom-editor-class"
/>
```

## Accessibility

### WCAG 2.1 AA Compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus visible indicators
- ✅ Color contrast ≥4.5:1
- ✅ ARIA labels and live regions
- ✅ Semantic HTML structure

### Testing
The component is tested with `jest-axe` to ensure zero accessibility violations:

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MarkdownEditor } from '@meaty/ui';

test('has no a11y violations', async () => {
  const { container } = render(
    <MarkdownEditor value="" onChange={() => {}} />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Performance

### Bundle Size
- CodeMirror 6: ~35KB gzipped
- react-markdown: ~15KB gzipped
- **Total**: ~50KB gzipped

### Optimizations
- Debounced onChange (300ms for validation, 1500ms for autosave)
- Lazy-loaded in forms (code splitting)
- Memoized preview rendering
- Efficient CodeMirror state updates

## Best Practices

### 1. Always Provide onChange
```typescript
// ✅ Good
<MarkdownEditor value={content} onChange={setContent} />

// ❌ Bad - onChange is required
<MarkdownEditor value={content} />
```

### 2. Use Autosave for Better UX
```typescript
// ✅ Good - Auto-saves work in progress
<MarkdownEditor
  value={content}
  onChange={setContent}
  onSave={handleSave}
  autosave
/>
```

### 3. Handle Dirty State for Important Forms
```typescript
// ✅ Good - Prevents data loss
<MarkdownEditor
  value={content}
  onChange={setContent}
  isDirty={isDirty}
  onDirtyChange={setIsDirty}
/>
// Add beforeunload warning if isDirty
```

### 4. Provide Meaningful ARIA Labels
```typescript
// ✅ Good - Clear context for screen readers
<MarkdownEditor
  value={body}
  onChange={setBody}
  ariaLabel="Prompt body editor"
/>
```

### 5. Use Appropriate Layout for Context
```typescript
// ✅ Good - Preview for display, split for editing
{isEditing ? (
  <MarkdownEditor value={content} onChange={setContent} layout="split" />
) : (
  <MarkdownEditor value={content} onChange={() => {}} layout="preview" readOnly />
)}
```

## Troubleshooting

### Issue: Autosave not triggering
**Solution**: Ensure `onSave` callback is provided and `autosave` is `true`:
```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  onSave={handleSave} // Must be provided
  autosave={true}
/>
```

### Issue: Preview not updating
**Solution**: Ensure `value` prop is updated via `onChange`:
```typescript
const [content, setContent] = useState('');
<MarkdownEditor value={content} onChange={setContent} />
```

### Issue: Keyboard shortcuts not working
**Solution**: Shortcuts are registered globally. Ensure no other handlers are preventing default:
```typescript
// Shortcuts work automatically, no setup needed
<MarkdownEditor value={content} onChange={setContent} />
```

### Issue: Toolbar buttons not applying formatting
**Solution**: Ensure editor is not in read-only mode:
```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  readOnly={false} // Default
/>
```

## Related Components

- **Textarea**: Simple text input without markdown features
- **Input**: Single-line text input
- **Form**: Form wrapper with validation
- **Label**: Accessible form labels

## Migration from web-old

If migrating from `apps/web-old/src/components/editor/MarkdownEditor.tsx`:

**Old:**
```typescript
import MarkdownEditor from '@/components/editor/MarkdownEditor';

<MarkdownEditor
  value={value}
  onChange={onChange}
  onSave={(val) => handleSave(val)}
/>
```

**New:**
```typescript
import { MarkdownEditor } from '@meaty/ui';

<MarkdownEditor
  value={value}
  onChange={onChange}
  onSave={handleSave}
/>
```

**Breaking Changes:**
- Component is now a named export (not default)
- Props are more comprehensive (see API reference)
- Uses @meaty/ui design tokens
- Improved accessibility and responsive behavior

## Contributing

When contributing to the MarkdownEditor:

1. **Test thoroughly**: Run unit tests and a11y tests
   ```bash
   pnpm --filter "@meaty/ui" test MarkdownEditor
   ```

2. **Update stories**: Add new variants to Storybook
   ```bash
   pnpm --filter "@meaty/ui" storybook
   ```

3. **Maintain accessibility**: Run `jest-axe` tests
   ```bash
   pnpm --filter "@meaty/ui" test MarkdownEditor.a11y
   ```

4. **Follow MP patterns**: Use design tokens, TypeScript strict mode, JSDoc comments

## License

Part of the MeatyPrompts design system (@meaty/ui).
