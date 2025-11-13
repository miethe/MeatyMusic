import React from 'react';
import { render, screen } from '@testing-library/react';
import { PromptCard } from '../PromptCard';

describe('PromptCard ProvenanceRow Integration', () => {
  const baseProps = {
    title: 'Test Prompt Card',
    version: 1,
    access: 'private' as const,
    tags: ['test'],
    onRun: jest.fn(),
  };

  describe('XL variant with provenance', () => {
    it('renders provenance row when provided in XL size', () => {
      const provenance = {
        originalAuthor: 'John Doe',
        forkSource: 'Template Library',
        lastEditor: 'Jane Smith',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      render(
        <PromptCard
          {...baseProps}
          size="xl"
          provenance={provenance}
        />
      );

      // Check that all provenance data is displayed
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Forked from:')).toBeInTheDocument();
      expect(screen.getByText('Template Library')).toBeInTheDocument();
      expect(screen.getByText('Edited by:')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Created:')).toBeInTheDocument();

      // Check accessibility
      expect(screen.getByRole('group', { name: 'Prompt provenance information' })).toBeInTheDocument();
    });

    it('does not render provenance row when no provenance data provided in XL size', () => {
      render(
        <PromptCard
          {...baseProps}
          size="xl"
        />
      );

      expect(screen.queryByRole('group', { name: 'Prompt provenance information' })).not.toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
    });

    it('renders partial provenance data correctly in XL size', () => {
      const partialProvenance = {
        originalAuthor: 'John Doe',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      render(
        <PromptCard
          {...baseProps}
          size="xl"
          provenance={partialProvenance}
        />
      );

      // Should show author and created date
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Created:')).toBeInTheDocument();

      // Should not show fork or editor info
      expect(screen.queryByText('Forked from:')).not.toBeInTheDocument();
      expect(screen.queryByText('Edited by:')).not.toBeInTheDocument();
    });
  });

  describe('Standard and Compact variants', () => {
    it('does not render provenance row in standard size even when provided', () => {
      const provenance = {
        originalAuthor: 'John Doe',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      render(
        <PromptCard
          {...baseProps}
          size="standard"
          provenance={provenance}
        />
      );

      expect(screen.queryByRole('group', { name: 'Prompt provenance information' })).not.toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
    });

    it('does not render provenance row in compact size even when provided', () => {
      const provenance = {
        originalAuthor: 'John Doe',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      render(
        <PromptCard
          {...baseProps}
          size="compact"
          provenance={provenance}
        />
      );

      expect(screen.queryByRole('group', { name: 'Prompt provenance information' })).not.toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
    });
  });

  describe('provenance row positioning', () => {
    it('renders provenance row after block chips when both are provided', () => {
      const provenance = {
        originalAuthor: 'John Doe',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const blockChips = {
        persona: 'Test persona',
        context: 'Test context',
      };

      const { container } = render(
        <PromptCard
          {...baseProps}
          size="xl"
          provenance={provenance}
          blockChips={blockChips}
        />
      );

      // Both should be present
      expect(screen.getByText('Test persona')).toBeInTheDocument();
      expect(screen.getByText('Test context')).toBeInTheDocument();
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Provenance should come after block chips in DOM order
      const blockChipsElement = screen.getByRole('group', { name: 'Prompt block types' });
      const provenanceElement = screen.getByRole('group', { name: 'Prompt provenance information' });

      expect(blockChipsElement.compareDocumentPosition(provenanceElement))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});
