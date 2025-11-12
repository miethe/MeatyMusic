import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProvenanceRow } from '../components/ProvenanceRow';

describe('ProvenanceRow', () => {
  describe('rendering', () => {
    it('renders nothing when no props are provided', () => {
      const { container } = render(<ProvenanceRow />);
      expect(container.firstChild).toBeNull();
    });

    it('renders original author when provided', () => {
      render(<ProvenanceRow originalAuthor="John Doe" />);
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByLabelText('Original author: John Doe')).toBeInTheDocument();
    });

    it('renders fork source when provided', () => {
      render(<ProvenanceRow forkSource="Marketing Template" />);
      expect(screen.getByText('Forked from:')).toBeInTheDocument();
      expect(screen.getByText('Marketing Template')).toBeInTheDocument();
      expect(screen.getByLabelText('Forked from: Marketing Template')).toBeInTheDocument();
    });

    it('renders last editor when provided and different from original author', () => {
      render(
        <ProvenanceRow
          originalAuthor="John Doe"
          lastEditor="Jane Smith"
        />
      );
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Edited by:')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('does not render last editor when same as original author', () => {
      render(
        <ProvenanceRow
          originalAuthor="John Doe"
          lastEditor="John Doe"
        />
      );
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Edited by:')).not.toBeInTheDocument();
    });

    it('renders creation date when provided', () => {
      const createdAt = new Date('2024-01-15T10:30:00Z');
      render(<ProvenanceRow createdAt={createdAt} />);
      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
    });

    it('renders all provenance items with separators', () => {
      const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      render(
        <ProvenanceRow
          originalAuthor="John Doe"
          forkSource="Template"
          lastEditor="Jane Smith"
          createdAt={createdAt}
        />
      );

      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('Forked from:')).toBeInTheDocument();
      expect(screen.getByText('Edited by:')).toBeInTheDocument();
      expect(screen.getByText('Created:')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('formats recent times correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Just now (less than 1 minute)
      render(<ProvenanceRow createdAt={new Date(now.getTime() - 30 * 1000)} />);
      expect(screen.getByText('Just now')).toBeInTheDocument();

      // Minutes ago
      render(<ProvenanceRow createdAt={fiveMinutesAgo} />);
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();

      // Hours ago
      render(<ProvenanceRow createdAt={twoHoursAgo} />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();

      // Days ago
      render(<ProvenanceRow createdAt={threeDaysAgo} />);
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });

    it('handles singular vs plural correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      render(<ProvenanceRow createdAt={oneMinuteAgo} />);
      expect(screen.getByText('1 minute ago')).toBeInTheDocument();

      render(<ProvenanceRow createdAt={oneHourAgo} />);
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();

      render(<ProvenanceRow createdAt={oneDayAgo} />);
      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      const createdAt = new Date();
      render(
        <ProvenanceRow
          originalAuthor="John Doe"
          forkSource="Template"
          lastEditor="Jane Smith"
          createdAt={createdAt}
        />
      );

      expect(screen.getByRole('group', { name: 'Prompt provenance information' })).toBeInTheDocument();
      expect(screen.getByLabelText('Original author: John Doe')).toBeInTheDocument();
      expect(screen.getByLabelText('Forked from: Template')).toBeInTheDocument();
      expect(screen.getByLabelText('Last edited by: Jane Smith')).toBeInTheDocument();
      expect(screen.getByLabelText(/Created: /)).toBeInTheDocument();
    });

    it('marks icons as decorative', () => {
      render(<ProvenanceRow originalAuthor="John Doe" />);
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('marks separators as decorative', () => {
      render(
        <ProvenanceRow
          originalAuthor="John Doe"
          forkSource="Template"
        />
      );
      const separators = screen.getAllByText('•');
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ProvenanceRow
          originalAuthor="John Doe"
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
