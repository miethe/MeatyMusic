/**
 * Songs Filters Component
 * Advanced filtering UI for the songs list page
 */

'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  DatePicker,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from '@meatymusic/ui';
import { Filter, X } from 'lucide-react';
import { SongStatus } from '@/types/api';
import type { SongFilters } from '@/lib/api/songs';

export interface SongsFiltersProps {
  filters: SongFilters;
  onFiltersChange: (filters: SongFilters) => void;
  onClear?: () => void;
}

/**
 * Songs Filters Component
 *
 * Provides filter controls for:
 * - Status (draft, validated, rendered, etc.)
 * - Date range (created_after, created_before)
 * - Entity filters (hasStyle, hasLyrics, hasPersona)
 *
 * @accessibility
 * - Keyboard navigation supported
 * - Clear ARIA labels
 * - Screen reader friendly
 */
export function SongsFilters({ filters, onFiltersChange, onClear }: SongsFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.created_after) count++;
    if (filters.created_before) count++;
    if (filters.hasStyle) count++;
    if (filters.hasLyrics) count++;
    if (filters.hasPersona) count++;
    return count;
  }, [filters]);

  const handleStatusChange = (status: string[]) => {
    onFiltersChange({
      ...filters,
      status,
    });
  };

  const handleDateAfterChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      created_after: date?.toISOString(),
    });
  };

  const handleDateBeforeChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      created_before: date?.toISOString(),
    });
  };

  const handleToggleEntityFilter = (key: 'hasStyle' | 'hasLyrics' | 'hasPersona') => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const handleClearFilters = () => {
    onClear?.();
    setIsOpen(false);
  };

  const statusOptions = [
    { value: SongStatus.DRAFT, label: 'Draft' },
    { value: SongStatus.VALIDATED, label: 'Validated' },
    { value: SongStatus.RENDERING, label: 'Rendering' },
    { value: SongStatus.RENDERED, label: 'Rendered' },
    { value: SongStatus.FAILED, label: 'Failed' },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative"
          aria-label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 px-1.5 py-0 h-5 min-w-[1.25rem] flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 bg-bg-surface border-border-default shadow-elevation-2"
        align="end"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-auto p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-text-primary">
              Status
            </Label>
            <div className="space-y-2">
              {statusOptions.map((option) => {
                const isSelected = filters.status?.includes(option.value) ?? false;
                return (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const current = filters.status || [];
                        const newStatus = isSelected
                          ? current.filter((s) => s !== option.value)
                          : [...current, option.value];
                        handleStatusChange(newStatus);
                      }}
                      className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
                    />
                    <span className="text-sm text-text-primary">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-text-primary">Date Range</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="date-after" className="text-xs text-text-muted">
                  From
                </Label>
                <DatePicker
                  value={filters.created_after ? new Date(filters.created_after) : undefined}
                  onChange={handleDateAfterChange}
                  placeholder="Start date"
                  maxDate={filters.created_before ? new Date(filters.created_before) : undefined}
                  size="sm"
                />
              </div>
              <div>
                <Label htmlFor="date-before" className="text-xs text-text-muted">
                  To
                </Label>
                <DatePicker
                  value={filters.created_before ? new Date(filters.created_before) : undefined}
                  onChange={handleDateBeforeChange}
                  placeholder="End date"
                  minDate={filters.created_after ? new Date(filters.created_after) : undefined}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Entity Filters */}
          <div className="space-y-2">
            <Label className="text-text-primary">Has Entities</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasStyle ?? false}
                  onChange={() => handleToggleEntityFilter('hasStyle')}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
                />
                <span className="text-sm text-text-primary">Style</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasLyrics ?? false}
                  onChange={() => handleToggleEntityFilter('hasLyrics')}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
                />
                <span className="text-sm text-text-primary">Lyrics</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPersona ?? false}
                  onChange={() => handleToggleEntityFilter('hasPersona')}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
                />
                <span className="text-sm text-text-primary">Persona</span>
              </label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
