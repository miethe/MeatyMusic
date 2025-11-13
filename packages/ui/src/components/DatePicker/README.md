# DatePicker Component

A fully accessible date picker component with calendar popover, built on Radix Popover and react-day-picker.

## Features

- **Accessible**: Full keyboard navigation, proper ARIA attributes, screen reader friendly
- **Date Constraints**: Support for minimum and maximum date boundaries
- **Keyboard Navigation**: Arrow keys, Tab, Escape, Enter/Space all work as expected
- **Design System Integration**: Uses MeatyPrompts design tokens for consistent theming
- **Size Variants**: Small, medium, and large sizes
- **Focus Management**: Proper focus handling when opening/closing popover
- **Responsive**: Works on all screen sizes

## Installation

This component is part of `@meaty/ui`. It's already available if you have the package installed.

```bash
pnpm add @meaty/ui
```

## Usage

### Basic Example

```tsx
import { DatePicker } from '@meaty/ui';
import { useState } from 'react';

function MyComponent() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      placeholder="Pick a date"
    />
  );
}
```

### With Date Constraints

```tsx
import { DatePicker } from '@meaty/ui';
import { useState } from 'react';

function MyComponent() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      placeholder="Select a date"
      minDate={new Date('2024-01-01')}
      maxDate={new Date()}
    />
  );
}
```

### Date Range Selection

```tsx
import { DatePicker } from '@meaty/ui';
import { useState } from 'react';

function DateRangeFilter() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <div className="space-y-4">
      <DatePicker
        value={startDate}
        onChange={setStartDate}
        placeholder="Start date"
        maxDate={endDate || new Date()}
      />
      <DatePicker
        value={endDate}
        onChange={setEndDate}
        placeholder="End date"
        minDate={startDate}
        maxDate={new Date()}
      />
    </div>
  );
}
```

### Different Sizes

```tsx
<DatePicker size="sm" value={date} onChange={setDate} />
<DatePicker size="md" value={date} onChange={setDate} />
<DatePicker size="lg" value={date} onChange={setDate} />
```

### Disabled State

```tsx
<DatePicker
  value={date}
  onChange={setDate}
  disabled
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| undefined` | - | Currently selected date |
| `onChange` | `(date: Date \| undefined) => void` | - | Callback when date changes |
| `placeholder` | `string` | `'Pick a date'` | Placeholder text when no date is selected |
| `disabled` | `boolean` | `false` | Whether the picker is disabled |
| `minDate` | `Date` | - | Minimum selectable date (dates before are disabled) |
| `maxDate` | `Date` | - | Maximum selectable date (dates after are disabled) |
| `className` | `string` | - | Additional CSS classes |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

## Accessibility

### Keyboard Navigation

- **Tab**: Focus on trigger button
- **Enter/Space**: Open calendar popover
- **Arrow Keys**: Navigate between dates in calendar
- **Escape**: Close popover
- **Home/End**: Jump to first/last day of week
- **Page Up/Down**: Navigate between months

### Screen Reader Support

- Proper ARIA roles (`dialog`, `grid`, `gridcell`)
- ARIA labels announce selected dates
- State changes are announced (`expanded`/`collapsed`)
- Disabled dates are properly indicated

### Visual Indicators

- Focus rings meet WCAG 2.1 AA contrast requirements
- Today's date is highlighted with border
- Selected date has distinct background and shadow
- Disabled dates are visually muted
- Hover states provide visual feedback

### Focus Management

- Focus returns to trigger button when popover closes
- Initial focus moves to selected date (or today) when opening
- Focus trap within calendar while open

## Design Tokens

The DatePicker uses the following design tokens:

- `--mp-color-primary`: Selected date background
- `--mp-color-ring`: Focus ring color
- `--mp-color-border`: Calendar border
- `--mp-surface`: Calendar background
- `--mp-panel`: Hover state background
- `--mp-elevation-1`, `--mp-elevation-2`: Shadows
- `--mp-motion-duration-ui`: Transition timing

## Testing

### Unit Tests

The component includes comprehensive unit tests covering:

- Rendering with various props
- User interactions (click, keyboard)
- Date selection and onChange callback
- Date constraints (minDate, maxDate)
- Accessibility (zero axe violations)
- Keyboard navigation
- Focus management

Run tests with:

```bash
pnpm test DatePicker
```

### Accessibility Tests

All tests use `jest-axe` to ensure WCAG 2.1 AA compliance:

```tsx
import { axe } from 'jest-axe';

const { container } = render(<DatePicker onChange={onChange} />);
const results = await axe(container);
expect(results).toHaveNoViolations();
```

### Coverage

Test coverage is maintained at ≥90% for all metrics (statements, branches, functions, lines).

## Storybook

View live examples and documentation in Storybook:

```bash
pnpm --filter @meaty/ui storybook
```

Stories include:
- Default state
- With value
- With constraints
- Disabled state
- All size variants
- Form integration example
- Accessibility demonstration

## Implementation Notes

### Built On

- **Radix Popover**: Provides accessible popover overlay
- **react-day-picker**: Handles calendar rendering and date selection
- **date-fns**: Date formatting and manipulation

### Customization

The component wraps react-day-picker with custom styling using MeatyPrompts design tokens. All Radix primitives are wrapped and never exposed directly to consuming applications.

### CSS

The component imports `react-day-picker/style.css` for base calendar styles, then overrides with design tokens via className prop on DayPicker.

## Related Components

- **Button**: Used for the trigger
- **Popover**: Provides the overlay container
- **DateRangeFilter**: (Upcoming) Will use DatePicker for range selection

## Migration Guide

If you were using a different date picker library:

### From react-datepicker

```tsx
// Before
import DatePicker from 'react-datepicker';

<DatePicker
  selected={date}
  onChange={setDate}
  minDate={min}
  maxDate={max}
/>

// After
import { DatePicker } from '@meaty/ui';

<DatePicker
  value={date}
  onChange={setDate}
  minDate={min}
  maxDate={max}
/>
```

### From MUI DatePicker

```tsx
// Before
import { DatePicker } from '@mui/x-date-pickers';

<DatePicker
  value={date}
  onChange={setDate}
  disabled={disabled}
/>

// After
import { DatePicker } from '@meaty/ui';

<DatePicker
  value={date}
  onChange={setDate}
  disabled={disabled}
/>
```

## Troubleshooting

### Calendar doesn't open

Ensure you're not preventing default on click events that bubble up to the trigger button.

### Dates appear in wrong timezone

The component works with JavaScript `Date` objects. Ensure you're constructing dates correctly:

```tsx
// Correct
const date = new Date('2024-03-15'); // UTC midnight

// Incorrect (timezone dependent)
const date = new Date('03/15/2024'); // Local timezone
```

### Custom styling not applying

Use the `className` prop on the root DatePicker component, not on internal elements:

```tsx
<DatePicker
  className="w-full" // ✓ Correct
  value={date}
  onChange={setDate}
/>
```

## Contributing

When contributing to this component:

1. Maintain ≥90% test coverage
2. Ensure zero axe violations
3. Update Storybook stories for new variants
4. Follow MeatyPrompts design token usage
5. Test keyboard navigation thoroughly

## License

Part of MeatyPrompts monorepo. See root LICENSE file.
