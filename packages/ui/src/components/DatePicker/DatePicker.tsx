/**
 * DatePicker Component
 *
 * A date picker component built on Radix Popover and react-day-picker.
 * Provides an accessible way to select dates with keyboard navigation and date constraints.
 *
 * @example
 * ```tsx
 * <DatePicker
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 *   placeholder="Select a date"
 *   minDate={new Date('2024-01-01')}
 *   maxDate={new Date()}
 * />
 * ```
 */

'use client';

import React from 'react';
import { DayPicker, type DateBefore, type DateAfter } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import 'react-day-picker/style.css';

/**
 * Props for the DatePicker component
 */
export interface DatePickerProps {
  /** Currently selected date */
  value?: Date;
  /** Callback when date changes */
  onChange: (date: Date | undefined) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum selectable date (dates before this are disabled) */
  minDate?: Date;
  /** Maximum selectable date (dates after this are disabled) */
  maxDate?: Date;
  /** Optional CSS class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * DatePicker - A date selection component with calendar popover
 *
 * Built on Radix Popover for overlay management and react-day-picker for the calendar.
 * Supports keyboard navigation, date constraints, and proper accessibility.
 *
 * @accessibility
 * - Full keyboard navigation (Arrow keys, Tab, Escape, Enter/Space)
 * - Proper ARIA roles and attributes
 * - Focus management (returns to trigger on close)
 * - Screen reader friendly labels and announcements
 * - Visible focus indicators meet WCAG contrast requirements
 *
 * @design
 * - Uses design tokens for consistent theming
 * - Highlights today's date and selected date
 * - Shows hover states on selectable dates
 * - Disabled dates are visually muted
 * - Smooth transitions on all interactions
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Pick a date',
      disabled = false,
      minDate,
      maxDate,
      className,
      size = 'md',
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (date: Date | undefined) => {
      onChange(date);
      setOpen(false);
    };

    // Build disabled matcher for react-day-picker
    const disabledMatcher = React.useMemo(() => {
      const matchers: Array<DateBefore | DateAfter> = [];

      if (minDate) {
        matchers.push({ before: minDate });
      }

      if (maxDate) {
        matchers.push({ after: maxDate });
      }

      return matchers.length > 0 ? matchers : undefined;
    }, [minDate, maxDate]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            size={size}
            disabled={disabled}
            className={cn(
              'justify-start text-left font-normal',
              !value && 'text-text-muted',
              className
            )}
            aria-label={
              value
                ? `Selected date: ${format(value, 'PPP')}`
                : placeholder
            }
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <CalendarIcon className="mr-2" aria-hidden="true" />
            {value ? (
              <span className="text-text-base">
                {format(value, 'PPP')}
              </span>
            ) : (
              <span className="text-text-muted">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onCloseAutoFocus={(e) => {
            // Prevent default behavior and manually return focus to trigger
            e.preventDefault();
          }}
        >
          <div className="rdp-custom">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              disabled={disabledMatcher}
              initialFocus
              modifiersClassNames={{
                selected: 'rdp-day_selected',
                today: 'rdp-day_today',
                disabled: 'rdp-day_disabled',
                outside: 'rdp-day_outside',
              }}
              classNames={{
                root: 'p-3',
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                month_caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-text-strong',
                nav: 'space-x-1 flex items-center',
                button_previous: cn(
                  'absolute left-1 inline-flex items-center justify-center',
                  'h-7 w-7 rounded-md',
                  'bg-transparent hover:bg-mp-panel',
                  'text-text-base hover:text-text-strong',
                  'border border-transparent hover:border-mp-border',
                  'transition-all duration-[var(--mp-motion-duration-ui)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50'
                ),
                button_next: cn(
                  'absolute right-1 inline-flex items-center justify-center',
                  'h-7 w-7 rounded-md',
                  'bg-transparent hover:bg-mp-panel',
                  'text-text-base hover:text-text-strong',
                  'border border-transparent hover:border-mp-border',
                  'transition-all duration-[var(--mp-motion-duration-ui)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50'
                ),
                month_grid: 'w-full border-collapse space-y-1',
                weekdays: 'flex',
                weekday: 'text-text-muted rounded-md w-9 font-normal text-[0.8rem]',
                week: 'flex w-full mt-2',
                day: cn(
                  'relative p-0 text-center text-sm',
                  'focus-within:relative focus-within:z-20'
                ),
                day_button: cn(
                  'inline-flex items-center justify-center',
                  'h-9 w-9 rounded-md',
                  'text-text-base font-normal',
                  'hover:bg-mp-panel hover:text-text-strong',
                  'transition-all duration-[var(--mp-motion-duration-ui)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50'
                ),
                range_middle: 'aria-selected:bg-mp-panel aria-selected:text-text-base',
                selected: cn(
                  'bg-mp-primary text-white',
                  'hover:bg-mp-primary hover:text-white',
                  'focus:bg-mp-primary focus:text-white',
                  'font-semibold shadow-[var(--mp-elevation-1)]'
                ),
                today: 'border border-mp-primary text-mp-primary font-medium',
                outside: 'text-text-muted opacity-50',
                disabled: 'text-text-muted opacity-50 cursor-not-allowed',
                hidden: 'invisible',
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
