'use client';

import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

export interface LibrarySelectorProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  getItemSearchText: (item: T) => string;
  emptyMessage?: string;
  label?: string;
}

export function LibrarySelector<T>({
  items,
  onSelect,
  renderItem,
  getItemKey,
  getItemSearchText,
  emptyMessage = 'No items found in library',
  label = 'Select from Library',
}: LibrarySelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    getItemSearchText(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-border-secondary hover:border-border-primary bg-background-tertiary hover:bg-background-secondary text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-2 group"
      >
        <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">{label}</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-border-focus bg-background-secondary shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
          className="p-1 rounded hover:bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-sm">
            {searchQuery ? 'No matching items found' : emptyMessage}
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={getItemKey(item)}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full p-3 rounded-lg bg-background-tertiary hover:bg-background-primary border border-border-secondary hover:border-border-primary text-left transition-all group"
            >
              {renderItem(item)}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
