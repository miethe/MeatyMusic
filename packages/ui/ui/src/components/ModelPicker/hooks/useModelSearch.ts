import * as React from 'react';
import { EnhancedModel } from '../types';
import { createModelSearchEngine, debounce } from '../utils';

export interface UseModelSearchProps {
  models: EnhancedModel[];
  query: string;
  onQueryChange: (query: string) => void;
  debounceMs?: number;
}

export interface UseModelSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: EnhancedModel[];
  isSearching: boolean;
  hasSearchQuery: boolean;
  clearSearch: () => void;
}

export function useModelSearch({
  models,
  query,
  onQueryChange,
  debounceMs = 300,
}: UseModelSearchProps): UseModelSearchReturn {
  const [searchQuery, setSearchQuery] = React.useState(query);
  const [isSearching, setIsSearching] = React.useState(false);

  // Create search engine
  const searchEngine = React.useMemo(() => {
    return createModelSearchEngine(models);
  }, [models]);

  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () => debounce((searchTerm: string) => {
      onQueryChange(searchTerm);
      setIsSearching(false);
    }, debounceMs),
    [onQueryChange, debounceMs]
  );

  // Handle search query change
  const handleSearchChange = React.useCallback(
    (newQuery: string) => {
      setSearchQuery(newQuery);
      setIsSearching(true);
      debouncedSearch(newQuery);
    },
    [debouncedSearch]
  );

  // Search results
  const searchResults = React.useMemo(() => {
    if (!query.trim()) return models;

    const results = searchEngine.search(query);
    return results.map((result: any) => result.item);
  }, [models, query, searchEngine]);

  // Clear search
  const clearSearch = React.useCallback(() => {
    setSearchQuery('');
    onQueryChange('');
    setIsSearching(false);
  }, [onQueryChange]);

  // Sync with external query changes
  React.useEffect(() => {
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [query, searchQuery]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchResults,
    isSearching,
    hasSearchQuery: query.trim().length > 0,
    clearSearch,
  };
}
