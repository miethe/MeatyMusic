import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlockChipsRow } from '../components/BlockChipsRow';

describe('BlockChipsRow', () => {
  it('renders all chip types when content is provided', () => {
    const chips = {
      persona: 'Senior developer',
      context: 'Code review process',
      output: 'Review checklist',
      instructions: 'Be thorough and constructive'
    };

    render(<BlockChipsRow chips={chips} />);

    expect(screen.getByText('Senior developer')).toBeInTheDocument();
    expect(screen.getByText('Code review process')).toBeInTheDocument();
    expect(screen.getByText('Review checklist')).toBeInTheDocument();
    expect(screen.getByText('Be thorough and constructive')).toBeInTheDocument();
  });

  it('renders only chips with content', () => {
    const chips = {
      persona: 'Senior developer',
      context: '',
      output: 'Review checklist',
      instructions: undefined
    };

    render(<BlockChipsRow chips={chips} />);

    expect(screen.getByText('Senior developer')).toBeInTheDocument();
    expect(screen.queryByText('Code review process')).not.toBeInTheDocument();
    expect(screen.getByText('Review checklist')).toBeInTheDocument();
    expect(screen.queryByText('Be thorough and constructive')).not.toBeInTheDocument();
  });

  it('renders nothing when no chips have content', () => {
    const chips = {
      persona: '',
      context: '',
      output: '',
      instructions: ''
    };

    const { container } = render(<BlockChipsRow chips={chips} />);
    expect(container.firstChild).toBeNull();
  });

  it('has proper accessibility attributes', () => {
    const chips = {
      persona: 'Senior developer',
      output: 'Review checklist'
    };

    render(<BlockChipsRow chips={chips} />);

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Prompt block types');

    expect(screen.getByLabelText('Persona block')).toBeInTheDocument();
    expect(screen.getByLabelText('Output block')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const chips = {
      persona: 'Test persona'
    };

    render(<BlockChipsRow chips={chips} className="custom-class" />);

    const group = screen.getByRole('group');
    expect(group).toHaveClass('custom-class');
  });

  it('renders with correct icons', () => {
    const chips = {
      persona: 'Developer',
      context: 'Code review',
      output: 'Checklist',
      instructions: 'Be thorough'
    };

    const { container } = render(<BlockChipsRow chips={chips} />);

    // Check that svg icons are present
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons).toHaveLength(4); // One icon per chip
  });
});
