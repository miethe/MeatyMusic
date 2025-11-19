import type { Meta, StoryObj } from '@storybook/react';
import { ChipSelector } from './ChipSelector';
import { useState } from 'react';

const meta: Meta<typeof ChipSelector> = {
  title: 'Components/ChipSelector',
  component: ChipSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A multi-select component using chip/badge UI. Supports keyboard navigation, max selections, and custom option creation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      description: 'Available options to select from',
      control: 'object',
    },
    selected: {
      description: 'Currently selected values',
      control: 'object',
    },
    maxSelections: {
      description: 'Maximum number of selections allowed',
      control: 'number',
    },
    disabled: {
      description: 'Whether the component is disabled',
      control: 'boolean',
    },
    allowCreate: {
      description: 'Whether to allow creating new options',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChipSelector>;

// Interactive wrapper for Storybook
const ChipSelectorWrapper = (props: any) => {
  const [selected, setSelected] = useState<string[]>(props.selected || []);

  return (
    <div className="w-[500px]">
      <ChipSelector {...props} selected={selected} onChange={setSelected} />
      <div className="mt-4 p-3 bg-surface rounded-sm border border-border">
        <p className="text-xs text-text-muted mb-1">Selected values:</p>
        <pre className="text-xs text-text-base">
          {JSON.stringify(selected, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const genreOptions = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'country', label: 'Country' },
  { value: 'rnb', label: 'R&B' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'indie', label: 'Indie' },
  { value: 'alternative', label: 'Alternative' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
];

const moodOptions = [
  { value: 'upbeat', label: 'Upbeat' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'calm', label: 'Calm' },
  { value: 'dark', label: 'Dark' },
  { value: 'uplifting', label: 'Uplifting' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'aggressive', label: 'Aggressive' },
];

const instrumentOptions = [
  { value: 'guitar', label: 'Guitar' },
  { value: 'piano', label: 'Piano' },
  { value: 'drums', label: 'Drums' },
  { value: 'bass', label: 'Bass' },
  { value: 'synth', label: 'Synth' },
  { value: 'strings', label: 'Strings' },
  { value: 'brass', label: 'Brass' },
  { value: 'vocals', label: 'Vocals' },
];

export const Default: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: [],
    label: 'Genres',
    helperText: 'Select one or more genres',
    placeholder: 'Type to search...',
  },
};

export const WithPreselectedValues: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: moodOptions,
    selected: ['upbeat', 'energetic'],
    label: 'Mood',
    helperText: 'Select the mood of the song',
  },
};

export const WithMaxSelections: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: instrumentOptions,
    selected: [],
    maxSelections: 3,
    label: 'Instrumentation',
    helperText: 'Maximum 3 instruments recommended',
    warning: 'More than 3 instruments may dilute the mix',
  },
};

export const WithMaxSelectionsReached: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: instrumentOptions,
    selected: ['guitar', 'piano', 'drums'],
    maxSelections: 3,
    label: 'Instrumentation',
    helperText: 'Maximum 3 instruments recommended',
  },
};

export const WithError: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: [],
    label: 'Primary Genre',
    required: true,
    error: 'Please select at least one genre',
  },
};

export const WithWarning: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: moodOptions,
    selected: ['upbeat', 'melancholic', 'energetic', 'calm', 'dark'],
    label: 'Mood',
    warning: 'Too many moods may cause conflicting directions',
  },
};

export const Disabled: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: ['pop', 'rock'],
    disabled: true,
    label: 'Genres (Disabled)',
  },
};

export const AllowCreate: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: [],
    allowCreate: true,
    label: 'Custom Genres',
    helperText: 'Type to search or create new genres',
    placeholder: 'Type to add custom genre...',
  },
};

export const Required: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: [],
    required: true,
    label: 'Primary Genre',
    helperText: 'At least one genre is required',
  },
};

export const StyleEntityExample: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: moodOptions,
    selected: ['upbeat', 'energetic'],
    maxSelections: 5,
    label: 'Mood',
    helperText: 'Describe the emotional tone',
    placeholder: 'Add mood tags...',
  },
};

export const PersonaDeliveryStyleExample: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: [
      { value: 'smooth', label: 'Smooth' },
      { value: 'raspy', label: 'Raspy' },
      { value: 'powerful', label: 'Powerful' },
      { value: 'breathy', label: 'Breathy' },
      { value: 'whisper', label: 'Whisper' },
      { value: 'belting', label: 'Belting' },
    ],
    selected: ['smooth', 'powerful'],
    maxSelections: 3,
    label: 'Delivery Styles',
    helperText: 'Vocal delivery characteristics',
    placeholder: 'Select delivery styles...',
  },
};

export const KeyboardNavigationDemo: Story = {
  render: (args) => <ChipSelectorWrapper {...args} />,
  args: {
    options: genreOptions,
    selected: [],
    label: 'Keyboard Navigation Demo',
    helperText:
      'Try: ↓/↑ to navigate, Enter to select, Backspace to remove last, Esc to close',
  },
};
