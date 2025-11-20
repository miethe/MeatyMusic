/**
 * Personas Filters Component
 * Advanced filtering UI for the personas list page
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
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from '@meatymusic/ui';
import { Filter, X } from 'lucide-react';
import { PersonaKind } from '@/types/api';
import type { PersonaFilters } from '@/lib/api/personas';

export interface PersonasFiltersProps {
  filters: PersonaFilters;
  onFiltersChange: (filters: PersonaFilters) => void;
  onClear?: () => void;
}

/**
 * Personas Filters Component
 *
 * Provides filter controls for:
 * - Kind (artist, band)
 * - Vocal range
 *
 * @accessibility
 * - Keyboard navigation supported
 * - Clear ARIA labels
 * - Screen reader friendly
 */
export function PersonasFilters({ filters, onFiltersChange, onClear }: PersonasFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.kind) count++;
    if (filters.vocal_range) count++;
    return count;
  }, [filters]);

  const handleKindChange = (kind: string) => {
    onFiltersChange({
      ...filters,
      kind: kind === 'all' ? undefined : kind,
    });
  };

  const handleVocalRangeChange = (vocal_range: string) => {
    onFiltersChange({
      ...filters,
      vocal_range: vocal_range === 'all' ? undefined : vocal_range,
    });
  };

  const handleClearFilters = () => {
    onClear?.();
    setIsOpen(false);
  };

  const kindOptions = [
    { value: 'all', label: 'All Types' },
    { value: PersonaKind.ARTIST, label: 'Artist' },
    { value: PersonaKind.BAND, label: 'Band' },
  ];

  const vocalRangeOptions = [
    { value: 'all', label: 'All Ranges' },
    { value: 'soprano', label: 'Soprano' },
    { value: 'mezzo-soprano', label: 'Mezzo-Soprano' },
    { value: 'alto', label: 'Alto' },
    { value: 'countertenor', label: 'Countertenor' },
    { value: 'tenor', label: 'Tenor' },
    { value: 'baritone', label: 'Baritone' },
    { value: 'bass', label: 'Bass' },
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

          {/* Kind Filter */}
          <div className="space-y-2">
            <Label htmlFor="kind-filter" className="text-text-primary">
              Type
            </Label>
            <Select
              value={filters.kind || 'all'}
              onValueChange={handleKindChange}
            >
              <SelectTrigger id="kind-filter" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {kindOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vocal Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="vocal-range-filter" className="text-text-primary">
              Vocal Range
            </Label>
            <Select
              value={filters.vocal_range || 'all'}
              onValueChange={handleVocalRangeChange}
            >
              <SelectTrigger id="vocal-range-filter" className="w-full">
                <SelectValue placeholder="Select vocal range" />
              </SelectTrigger>
              <SelectContent>
                {vocalRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
