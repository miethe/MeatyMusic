/**
 * Lyrics Filters Component
 * Advanced filtering UI for the lyrics list page
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
import { POV, Tense } from '@/types/api';
import type { LyricsFilters } from '@/lib/api/lyrics';

export interface LyricsFiltersProps {
  filters: LyricsFilters;
  onFiltersChange: (filters: LyricsFilters) => void;
  onClear?: () => void;
}

/**
 * Lyrics Filters Component
 *
 * Provides filter controls for:
 * - Language (English, Spanish, etc.)
 * - POV (first-person, second-person, third-person)
 * - Tense (past, present, future, mixed)
 * - Explicit content toggle
 *
 * @accessibility
 * - Keyboard navigation supported
 * - Clear ARIA labels
 * - Screen reader friendly
 */
export function LyricsFilters({ filters, onFiltersChange, onClear }: LyricsFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.language) count++;
    if (filters.pov) count++;
    if (filters.tense) count++;
    if (filters.explicit_allowed !== undefined) count++;
    return count;
  }, [filters]);

  const handleLanguageChange = (language: string) => {
    onFiltersChange({
      ...filters,
      language: language === 'all' ? undefined : language,
    });
  };

  const handlePOVChange = (pov: string) => {
    onFiltersChange({
      ...filters,
      pov: pov === 'all' ? undefined : pov,
    });
  };

  const handleTenseChange = (tense: string) => {
    onFiltersChange({
      ...filters,
      tense: tense === 'all' ? undefined : tense,
    });
  };

  const handleExplicitChange = (explicit: string) => {
    onFiltersChange({
      ...filters,
      explicit_allowed: explicit === 'all' ? undefined : explicit === 'true',
    });
  };

  const handleClearFilters = () => {
    onClear?.();
    setIsOpen(false);
  };

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
  ];

  const povOptions = [
    { value: 'all', label: 'All Perspectives' },
    { value: POV.FIRST_PERSON, label: 'First Person' },
    { value: POV.SECOND_PERSON, label: 'Second Person' },
    { value: POV.THIRD_PERSON, label: 'Third Person' },
  ];

  const tenseOptions = [
    { value: 'all', label: 'All Tenses' },
    { value: Tense.PAST, label: 'Past' },
    { value: Tense.PRESENT, label: 'Present' },
    { value: Tense.FUTURE, label: 'Future' },
    { value: Tense.MIXED, label: 'Mixed' },
  ];

  const explicitOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'true', label: 'Explicit Allowed' },
    { value: 'false', label: 'Clean Only' },
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

          {/* Language Filter */}
          <div className="space-y-2">
            <Label htmlFor="language-filter" className="text-text-primary">
              Language
            </Label>
            <Select
              value={filters.language || 'all'}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language-filter" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* POV Filter */}
          <div className="space-y-2">
            <Label htmlFor="pov-filter" className="text-text-primary">
              Point of View
            </Label>
            <Select
              value={filters.pov || 'all'}
              onValueChange={handlePOVChange}
            >
              <SelectTrigger id="pov-filter" className="w-full">
                <SelectValue placeholder="Select POV" />
              </SelectTrigger>
              <SelectContent>
                {povOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tense Filter */}
          <div className="space-y-2">
            <Label htmlFor="tense-filter" className="text-text-primary">
              Tense
            </Label>
            <Select
              value={filters.tense || 'all'}
              onValueChange={handleTenseChange}
            >
              <SelectTrigger id="tense-filter" className="w-full">
                <SelectValue placeholder="Select tense" />
              </SelectTrigger>
              <SelectContent>
                {tenseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Explicit Content Filter */}
          <div className="space-y-2">
            <Label htmlFor="explicit-filter" className="text-text-primary">
              Content Rating
            </Label>
            <Select
              value={
                filters.explicit_allowed === undefined
                  ? 'all'
                  : filters.explicit_allowed
                  ? 'true'
                  : 'false'
              }
              onValueChange={handleExplicitChange}
            >
              <SelectTrigger id="explicit-filter" className="w-full">
                <SelectValue placeholder="Select content rating" />
              </SelectTrigger>
              <SelectContent>
                {explicitOptions.map((option) => (
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
