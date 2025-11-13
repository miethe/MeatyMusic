/**
 * SongCard Component Tests
 * Basic rendering tests for SongCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SongCard } from '../SongCard';
import type { Song } from '@/types/api';
import { SongStatus } from '@/types/api';

describe('SongCard', () => {
  const mockSong: Song = {
    id: 'song-1',
    tenant_id: 'tenant-1',
    owner_id: 'user-1',
    title: 'Test Song',
    sds_version: '1.0',
    global_seed: 42,
    status: SongStatus.DRAFT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders song title', () => {
    render(<SongCard song={mockSong} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(<SongCard song={mockSong} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('shows entity summary cards', () => {
    const entities = {
      style: { id: 'style-1', name: 'Pop Summer' },
      lyrics: { id: 'lyrics-1', name: 'Summer Vibes' },
    };

    render(<SongCard song={mockSong} entities={entities} />);
    expect(screen.getByText('Pop Summer')).toBeInTheDocument();
    expect(screen.getByText('Summer Vibes')).toBeInTheDocument();
  });

  it('displays workflow progress when provided', () => {
    const workflowState = {
      currentNode: 'LYRICS',
      completedNodes: ['PLAN', 'STYLE'],
      failedNodes: [],
      progress: 30,
    };

    render(<SongCard song={mockSong} workflowState={workflowState} size="xl" />);
    expect(screen.getByText('Running: LYRICS')).toBeInTheDocument();
  });

  it('shows metrics when provided', () => {
    const metrics = {
      runs: 5,
      successRate: 80,
      avgDuration: 45.5,
    };

    render(<SongCard song={mockSong} metrics={metrics} />);
    expect(screen.getByText(/5 runs/)).toBeInTheDocument();
    expect(screen.getByText(/80% success/)).toBeInTheDocument();
  });
});
