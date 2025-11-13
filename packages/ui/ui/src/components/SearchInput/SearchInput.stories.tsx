import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchInput } from './SearchInput';

const meta = {
  title: 'Components/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A search input component with debounced search, clear functionality, and search icon.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    debounceMs: {
      control: 'number',
      description: 'Debounce delay in milliseconds',
    },
    showClear: {
      control: 'boolean',
      description: 'Whether to show the clear button when input has value',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input has an error state',
    },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
};

export const WithValue: Story = {
  args: {
    placeholder: 'Search prompts...',
    defaultValue: 'code generation',
  },
};

export const WithCustomDebounce: Story = {
  args: {
    placeholder: 'Search with 1s debounce...',
    debounceMs: 1000,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Search disabled...',
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: 'Search...',
    error: true,
    defaultValue: 'invalid search',
  },
};

export const NoClearButton: Story = {
  args: {
    placeholder: 'Search without clear...',
    showClear: false,
    defaultValue: 'cannot clear this',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);

    return (
      <div className="space-y-4 w-80">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onSearch={(searchValue) => {
            // Simulate search
            if (searchValue) {
              setSearchResults([
                `Result for "${searchValue}" 1`,
                `Result for "${searchValue}" 2`,
                `Result for "${searchValue}" 3`,
              ]);
            } else {
              setSearchResults([]);
            }
          }}
          onClear={() => {
            setValue('');
            setSearchResults([]);
          }}
          placeholder="Type to search..."
        />

        {searchResults.length > 0 && (
          <div className="border rounded-md p-2">
            <p className="text-sm font-semibold mb-2">Search Results:</p>
            <ul className="text-sm space-y-1">
              {searchResults.map((result, i) => (
                <li key={i}>{result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

export const FilterSidebarExample: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('');

    return (
      <div className="w-72 p-4 border rounded-md space-y-4">
        <h3 className="text-sm font-semibold">Filters</h3>
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={(value) => console.log('Searching for:', value)}
          placeholder="Search prompts..."
        />
        <div className="text-xs text-muted-foreground">
          {searchValue && `Searching for: "${searchValue}"`}
        </div>
      </div>
    );
  },
};
