import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TagSelect, type Tag } from './TagSelect';

const meta = {
  title: 'Components/TagSelect',
  component: TagSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A multi-select tag component with search, creation, and keyboard navigation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no tags are selected',
    },
    allowCreate: {
      control: 'boolean',
      description: 'Whether new tags can be created',
    },
    maxTags: {
      control: 'number',
      description: 'Maximum number of tags that can be selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the component is in a loading state',
    },
    error: {
      control: 'boolean',
      description: 'Whether the component has an error state',
    },
  },
} satisfies Meta<typeof TagSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTags: Tag[] = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
];

export const Default: Story = {
  args: {
    options: sampleTags,
    placeholder: 'Select tags...',
  },
};

export const WithSelectedTags: Story = {
  args: {
    options: sampleTags,
    value: [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
    ],
    placeholder: 'Select tags...',
  },
};

export const AllowCreate: Story = {
  args: {
    options: sampleTags,
    allowCreate: true,
    placeholder: 'Select or create tags...',
  },
};

export const MaxTags: Story = {
  args: {
    options: sampleTags,
    maxTags: 3,
    value: [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
    ],
    placeholder: 'Maximum 3 tags...',
  },
};

export const Disabled: Story = {
  args: {
    options: sampleTags,
    value: [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
    ],
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    options: sampleTags,
    isLoading: true,
    placeholder: 'Loading tags...',
  },
};

export const ErrorState: Story = {
  args: {
    options: sampleTags,
    error: true,
    placeholder: 'Select tags...',
  },
};

export const NoOptions: Story = {
  args: {
    options: [],
    allowCreate: true,
    placeholder: 'Create new tags...',
  },
};

export const Controlled: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

    return (
      <div className="space-y-4 w-96">
        <TagSelect
          options={sampleTags}
          value={selectedTags}
          onChange={setSelectedTags}
          allowCreate={true}
          placeholder="Select or create tags..."
        />

        {selectedTags.length > 0 && (
          <div className="p-3 border rounded-md">
            <p className="text-sm font-semibold mb-2">Selected Tags:</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span key={tag.value} className="text-sm">
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const FilterSidebarExample: Story = {
  render: () => {
    const [tags, setTags] = useState<Tag[]>([]);

    return (
      <div className="w-72 p-4 border rounded-md space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Filter by Tags</h3>
          <TagSelect
            options={sampleTags}
            value={tags}
            onChange={setTags}
            placeholder="Select tags..."
          />
        </div>
        {tags.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Filtering by {tags.length} tag{tags.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    );
  },
};
