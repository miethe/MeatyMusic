/**
 * Styles List Page
 * Display all style entities with filters, multi-select, and bulk operations
 * Updated to use MeatyMusic Design System
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Input } from '@meatymusic/ui';
import { BulkActions } from '@meatymusic/ui';
import { Checkbox } from '@meatymusic/ui';
import type { BulkAction } from '@meatymusic/ui';
import { Plus, Filter, Palette, Loader2, Upload, Music, Clock, Key, Trash2, Download } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useStyles, useBulkDeleteStyles, useBulkExportStyles, useExportStyle } from '@/hooks/api/useStyles';
import type { Style } from '@/types/api/entities';
import { ImportModal } from '@/components/import/ImportModal';

export default function StylesPage() {
  const [search, setSearch] = React.useState('');
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Fetch styles from API
  const { data, isLoading, error, refetch } = useStyles({
    q: search || undefined,
    limit: 50,
  });

  // Bulk operations mutations
  const bulkDelete = useBulkDeleteStyles();
  const bulkExport = useBulkExportStyles();

  const styles = data?.items || [];

  // Select/deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(styles.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle individual selection
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle bulk delete with confirmation
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} style(s)? This action cannot be undone.`
    );

    if (confirmed) {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      refetch();
    }
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return;
    await bulkExport.mutateAsync(Array.from(selectedIds));
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      label: 'Export',
      icon: Download,
      onClick: handleBulkExport,
      variant: 'outline',
      disabled: bulkExport.isPending,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: 'destructive',
      disabled: bulkDelete.isPending,
    },
  ];

  // Check if all visible items are selected
  const allSelected = styles.length > 0 && styles.every((s) => selectedIds.has(s.id));
  const someSelected = styles.some((s) => selectedIds.has(s.id)) && !allSelected;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Styles"
        description="Manage style specifications for your songs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Link href={ROUTES.ENTITIES.STYLE_NEW}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Create Style
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search styles by name, genre, or mood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Palette className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card variant="default" padding="lg" className="text-center animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-[var(--mm-color-text-tertiary)] mb-4 animate-spin" />
            <p className="text-[var(--mm-color-text-secondary)] text-sm">Loading styles...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card variant="default" padding="lg" className="text-center animate-fade-in border-[var(--mm-color-error-500)]">
            <div className="text-[var(--mm-color-error-500)] mb-4">
              <p className="font-medium">Failed to load styles</p>
              <p className="text-sm text-[var(--mm-color-text-secondary)] mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && styles.length === 0 && (
          <Card variant="gradient" padding="lg" className="text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--mm-color-panel)] mb-4">
                <Palette className="w-8 h-8 text-[var(--mm-color-primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] mb-2">
                {search ? 'No styles found' : 'No styles yet'}
              </h3>
              <p className="text-[var(--mm-color-text-secondary)] mb-6 text-sm">
                {search
                  ? 'Try adjusting your search terms or clearing filters'
                  : 'Create your first style specification to define the musical characteristics of your songs'
                }
              </p>
              {!search && (
                <Link href={ROUTES.ENTITIES.STYLE_NEW}>
                  <Button variant="primary" size="lg">
                    <Plus className="w-4 h-4" />
                    Create First Style
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Styles Table/Grid */}
        {!isLoading && !error && styles.length > 0 && (
          <div className="animate-fade-in">
            {/* Select All */}
            <div className="mb-4 flex items-center gap-2 px-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all styles"
                className={someSelected ? 'data-[state=checked]:bg-[var(--mm-color-primary)]' : ''}
              />
              <span className="text-sm text-[var(--mm-color-text-secondary)]">
                Select all ({styles.length})
              </span>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {styles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  selected={selectedIds.has(style.id)}
                  onToggleSelect={() => handleToggleSelect(style.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        actions={bulkActions}
      />

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        entityType="style"
        onImportSuccess={() => {
          setImportModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

interface StyleCardProps {
  style: Style;
  selected: boolean;
  onToggleSelect: () => void;
}

function StyleCard({ style, selected, onToggleSelect }: StyleCardProps) {
  const exportStyle = useExportStyle();

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await exportStyle.mutateAsync(style.id);
  };

  return (
    <div className="relative">
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${style.name}`}
          className="bg-white/90 backdrop-blur-sm"
        />
      </div>

      <Link href={ROUTES.ENTITIES.STYLE_DETAIL(style.id)}>
        <Card
          variant="elevated"
          padding="md"
          interactive
          className={selected ? 'ring-2 ring-[var(--mm-color-primary)]' : ''}
        >
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] group-hover:text-[var(--mm-color-primary)] transition-colors">
                {style.name}
              </h3>
              {style.genre && (
                <Badge variant="secondary" size="sm">
                  <Music className="w-3 h-3" />
                  {style.genre}
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* BPM and Key */}
            <div className="flex flex-wrap gap-2">
              {style.bpm_min && style.bpm_max && (
                <Badge variant="outline" size="sm">
                  <Clock className="w-3 h-3" />
                  {style.bpm_min}-{style.bpm_max} BPM
                </Badge>
              )}
              {style.key && (
                <Badge variant="outline" size="sm">
                  <Key className="w-3 h-3" />
                  {style.key}
                </Badge>
              )}
            </div>

            {/* Mood Tags */}
            {style.mood && style.mood.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {style.mood.slice(0, 4).map((moodItem) => (
                  <Badge
                    key={moodItem}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {moodItem}
                  </Badge>
                ))}
                {style.mood.length > 4 && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    +{style.mood.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Energy Level */}
            {style.energy_level && (
              <div className="pt-2 border-t border-[var(--mm-color-border-subtle)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--mm-color-text-tertiary)]">Energy</span>
                  <span className="text-[var(--mm-color-text-secondary)] font-medium">
                    {style.energy_level}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-[var(--mm-color-border-subtle)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={exportStyle.isPending}
                className="w-full"
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
