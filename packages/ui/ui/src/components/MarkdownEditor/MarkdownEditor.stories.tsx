/**
 * MarkdownEditor Storybook Stories
 *
 * Demonstrates all features and variants of the MarkdownEditor component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import type { MarkdownEditorProps } from './types';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Components/MarkdownEditor',
  component: MarkdownEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A rich markdown editor with split-view layout, live preview, formatting toolbar, autosave, and keyboard shortcuts.

## Features
- **Split-view layout**: Editor and preview side-by-side (50/50)
- **CodeMirror 6**: Syntax highlighting for markdown
- **Live preview**: Real-time rendering with GitHub Flavored Markdown
- **Formatting toolbar**: Bold, Italic, Heading, Link, Code, Lists
- **Autosave**: 1.5s debounce (configurable)
- **Keyboard shortcuts**: Cmd+S (save), Cmd+/ (toggle layout), Esc (blur)
- **Dirty state tracking**: Visual indicator for unsaved changes
- **Responsive**: Stacks vertically on mobile (<640px)
- **Accessible**: WCAG 2.1 AA compliant

## Keyboard Shortcuts
- **Cmd+B / Ctrl+B**: Bold
- **Cmd+I / Ctrl+I**: Italic
- **Cmd+K / Ctrl+K**: Link
- **Cmd+S / Ctrl+S**: Save
- **Cmd+/ / Ctrl+/**: Toggle layout (split → editor → preview → split)
- **Esc**: Blur editor
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    readOnly: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    minHeight: { control: 'text' },
    autosave: { control: 'boolean' },
    autosaveDelay: { control: 'number' },
    layout: {
      control: 'select',
      options: ['split', 'editor', 'preview'],
    },
    showToolbar: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const sampleMarkdown = `# Sample Markdown

This is a **bold** statement and this is *italic*.

## Features

Here's what you can do:

- Create bullet lists
- Use **formatting**
- Add \`inline code\`

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Links and Images

Check out [MeatyPrompts](https://meatyprompts.com) for more!

### Tables (GFM)

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Preview | ✅ |
| Autosave | ✅ |

> Blockquotes work too!

---

That's all folks!
`;

/**
 * Interactive wrapper for stateful stories
 */
const InteractiveEditor = (props: Partial<MarkdownEditorProps>) => {
  const [value, setValue] = useState(props.value || '');
  const [savedValue, setSavedValue] = useState('');

  const handleSave = (val: string) => {
    setSavedValue(val);
    console.log('Saved:', val);
  };

  return (
    <div className="space-y-4">
      <MarkdownEditor
        {...props}
        value={value}
        onChange={setValue}
        onSave={handleSave}
      />
      <div className="text-sm text-[var(--mp-color-text-muted)]">
        <p>Last saved: {savedValue ? `${savedValue.length} characters` : 'Never'}</p>
      </div>
    </div>
  );
};

/**
 * Default: Split-view with all features enabled
 */
export const Default: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    placeholder: 'Enter your markdown here...',
    minHeight: '400px',
    autosave: true,
    autosaveDelay: 1500,
    layout: 'split',
    showToolbar: true,
    readOnly: false,
    autoFocus: false,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: '',
    placeholder: 'Start writing your markdown...',
    minHeight: '400px',
  },
};

/**
 * Editor only (no preview)
 */
export const EditorOnly: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    layout: 'editor',
    minHeight: '400px',
  },
};

/**
 * Preview only (read-only)
 */
export const PreviewOnly: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    layout: 'preview',
    minHeight: '400px',
    readOnly: true,
  },
};

/**
 * Read-only mode
 */
export const ReadOnly: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    readOnly: true,
    minHeight: '400px',
  },
};

/**
 * Without toolbar
 */
export const NoToolbar: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    showToolbar: false,
    minHeight: '400px',
  },
};

/**
 * With autosave disabled
 */
export const NoAutosave: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    autosave: false,
    minHeight: '400px',
  },
};

/**
 * Fast autosave (500ms)
 */
export const FastAutosave: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    autosave: true,
    autosaveDelay: 500,
    minHeight: '400px',
  },
};

/**
 * Tall editor
 */
export const TallEditor: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: sampleMarkdown,
    minHeight: '600px',
  },
};

/**
 * Short editor
 */
export const ShortEditor: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: '# Quick note\n\nJust a short snippet.',
    minHeight: '200px',
  },
};

/**
 * Auto-focus enabled
 */
export const AutoFocus: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: '',
    autoFocus: true,
    placeholder: 'Start typing immediately...',
    minHeight: '400px',
  },
};

/**
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: '',
    placeholder: '✍️ Compose your prompt here...\n\nUse markdown for formatting!',
    minHeight: '400px',
  },
};

/**
 * With long content (test scrolling)
 */
export const LongContent: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: Array(50)
      .fill(0)
      .map((_, i) => `## Section ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n`)
      .join(''),
    minHeight: '400px',
  },
};

/**
 * GFM features (tables, strikethrough, task lists)
 */
export const GFMFeatures: Story = {
  render: (args) => <InteractiveEditor {...args} />,
  args: {
    value: `# GitHub Flavored Markdown

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Task Lists

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

## Strikethrough

This is ~~crossed out~~ text.

## Autolinks

https://meatyprompts.com becomes a link automatically!
`,
    minHeight: '400px',
  },
};

/**
 * Responsive demo (resize browser to see mobile layout)
 */
export const Responsive: Story = {
  render: (args) => (
    <div>
      <p className="mb-4 text-sm text-[var(--mp-color-text-muted)]">
        Resize your browser to see the responsive behavior. On mobile (&lt;640px), the editor
        and preview stack vertically.
      </p>
      <InteractiveEditor {...args} />
    </div>
  ),
  args: {
    value: sampleMarkdown,
    minHeight: '400px',
  },
};

/**
 * Dirty state indicator demo
 */
export const DirtyStateDemo: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || '');
    const [isDirty, setIsDirty] = useState(false);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-[var(--mp-color-panel)] rounded-md text-sm">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-[var(--mp-color-text-muted)]">
            <li>Edit the text below</li>
            <li>Watch the dirty state indicator in the toolbar</li>
            <li>Wait 1.5s or press Cmd+S to save</li>
            <li>Indicator changes to "Saved"</li>
          </ol>
        </div>
        <MarkdownEditor
          {...args}
          value={value}
          onChange={setValue}
          onSave={(val) => console.log('Saved:', val)}
          isDirty={isDirty}
          onDirtyChange={setIsDirty}
        />
        <div className="text-sm text-[var(--mp-color-text-muted)]">
          <p>External dirty state: {isDirty ? '⚠️ Unsaved' : '✅ Saved'}</p>
        </div>
      </div>
    );
  },
  args: {
    value: '# Edit me!\n\nStart typing to see the dirty state indicator...',
    minHeight: '300px',
  },
};

/**
 * Accessibility demo
 */
export const Accessibility: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-[var(--mp-color-panel)] rounded-md text-sm">
        <p className="font-medium mb-2">Accessibility Features:</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--mp-color-text-muted)]">
          <li>Full keyboard navigation (Tab, Shift+Tab)</li>
          <li>Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+S, etc.)</li>
          <li>ARIA labels for screen readers</li>
          <li>Focus visible indicators</li>
          <li>Live region for preview updates</li>
          <li>Toolbar buttons with accessible labels</li>
        </ul>
      </div>
      <InteractiveEditor {...args} />
    </div>
  ),
  args: {
    value: sampleMarkdown,
    minHeight: '400px',
    ariaLabel: 'Main content editor',
  },
};
