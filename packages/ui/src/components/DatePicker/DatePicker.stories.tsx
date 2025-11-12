/**
 * DatePicker Component Stories
 *
 * Demonstrates all states and variants of the DatePicker component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DatePicker } from './DatePicker';
import { subDays, addDays } from 'date-fns';

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A date picker component with calendar popover. Built on Radix Popover and react-day-picker for accessible date selection with keyboard navigation and date constraints.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'date',
      description: 'Currently selected date',
    },
    onChange: {
      action: 'date changed',
      description: 'Callback when date changes',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no date is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the picker is disabled',
    },
    minDate: {
      control: 'date',
      description: 'Minimum selectable date',
    },
    maxDate: {
      control: 'date',
      description: 'Maximum selectable date',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/**
 * Default state with placeholder
 */
export const Default: Story = {
  args: {
    placeholder: 'Pick a date',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With a pre-selected value
 */
export const WithValue: Story = {
  args: {
    placeholder: 'Pick a date',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>(new Date());
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With custom placeholder text
 */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Select creation date...',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With date constraints (minDate and maxDate)
 */
export const WithConstraints: Story = {
  args: {
    placeholder: 'Pick a date',
    minDate: subDays(new Date(), 30),
    maxDate: new Date(),
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return (
      <div className="space-y-4">
        <DatePicker {...args} value={value} onChange={setValue} />
        <div className="text-sm text-text-muted max-w-xs">
          Only dates from the last 30 days can be selected
        </div>
      </div>
    );
  },
};

/**
 * With only minimum date constraint
 */
export const WithMinDate: Story = {
  args: {
    placeholder: 'Pick a date',
    minDate: new Date(),
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return (
      <div className="space-y-4">
        <DatePicker {...args} value={value} onChange={setValue} />
        <div className="text-sm text-text-muted max-w-xs">
          Only today and future dates can be selected
        </div>
      </div>
    );
  },
};

/**
 * With only maximum date constraint
 */
export const WithMaxDate: Story = {
  args: {
    placeholder: 'Pick a date',
    maxDate: new Date(),
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return (
      <div className="space-y-4">
        <DatePicker {...args} value={value} onChange={setValue} />
        <div className="text-sm text-text-muted max-w-xs">
          Only past and present dates can be selected
        </div>
      </div>
    );
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Pick a date',
    disabled: true,
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Disabled with value
 */
export const DisabledWithValue: Story = {
  args: {
    placeholder: 'Pick a date',
    disabled: true,
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>(new Date());
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
  args: {
    placeholder: 'Pick a date',
    size: 'sm',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Medium size variant (default)
 */
export const MediumSize: Story = {
  args: {
    placeholder: 'Pick a date',
    size: 'md',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Large size variant
 */
export const LargeSize: Story = {
  args: {
    placeholder: 'Pick a date',
    size: 'lg',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/**
 * All size variants side by side
 */
export const AllSizes: Story = {
  render: () => {
    const [smValue, setSmValue] = React.useState<Date | undefined>();
    const [mdValue, setMdValue] = React.useState<Date | undefined>();
    const [lgValue, setLgValue] = React.useState<Date | undefined>();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted w-16">Small:</span>
          <DatePicker
            value={smValue}
            onChange={setSmValue}
            size="sm"
            placeholder="Pick a date"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted w-16">Medium:</span>
          <DatePicker
            value={mdValue}
            onChange={setMdValue}
            size="md"
            placeholder="Pick a date"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted w-16">Large:</span>
          <DatePicker
            value={lgValue}
            onChange={setLgValue}
            size="lg"
            placeholder="Pick a date"
          />
        </div>
      </div>
    );
  },
};

/**
 * Interactive playground
 */
export const Interactive: Story = {
  args: {
    placeholder: 'Pick a date',
  },
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>();

    return (
      <div className="space-y-6">
        <DatePicker {...args} value={value} onChange={setValue} />
        <div className="space-y-2">
          <div className="text-sm font-medium text-text-strong">
            Selected Date:
          </div>
          <div className="text-sm text-text-muted">
            {value ? value.toLocaleDateString() : 'No date selected'}
          </div>
          {value && (
            <button
              onClick={() => setValue(undefined)}
              className="text-sm text-mp-primary hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>
    );
  },
};

/**
 * Form integration example
 */
export const InForm: Story = {
  render: () => {
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();

    return (
      <div className="w-96 space-y-6 p-6 border border-mp-border rounded-lg bg-mp-surface">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-strong">
            Filter by Date Range
          </h3>
          <p className="text-sm text-text-muted">
            Select a date range to filter your prompts
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="start-date"
              className="text-sm font-medium text-text-base"
            >
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
              maxDate={endDate || new Date()}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="end-date"
              className="text-sm font-medium text-text-base"
            >
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
              minDate={startDate}
              maxDate={new Date()}
            />
          </div>
        </div>

        {startDate && endDate && (
          <div className="pt-4 border-t border-mp-border">
            <div className="text-sm text-text-muted">
              Selected range: {startDate.toLocaleDateString()} -{' '}
              {endDate.toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  },
};

/**
 * Accessibility demonstration
 */
export const AccessibilityDemo: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | undefined>();

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-strong">
            Accessibility Features
          </h3>
          <p className="text-sm text-text-muted">
            This component is fully accessible and keyboard navigable
          </p>
        </div>

        <DatePicker
          value={value}
          onChange={setValue}
          placeholder="Pick a date"
        />

        <div className="space-y-4 text-sm text-text-muted">
          <div>
            <strong className="text-text-base">Keyboard Navigation:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tab: Focus on trigger button</li>
              <li>Enter/Space: Open calendar popover</li>
              <li>Arrow keys: Navigate between dates in calendar</li>
              <li>Escape: Close popover</li>
              <li>Home/End: Jump to first/last day of week</li>
              <li>Page Up/Down: Navigate months</li>
            </ul>
          </div>
          <div>
            <strong className="text-text-base">Screen Reader Support:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proper ARIA labels and roles</li>
              <li>Date announcements on selection</li>
              <li>State announcements (expanded/collapsed)</li>
              <li>Disabled date indicators</li>
            </ul>
          </div>
          <div>
            <strong className="text-text-base">Visual Indicators:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Focus rings meet WCAG 2.1 contrast requirements</li>
              <li>Today's date is highlighted</li>
              <li>Selected date has distinct styling</li>
              <li>Disabled dates are visually muted</li>
            </ul>
          </div>
        </div>
      </div>
    );
  },
};
