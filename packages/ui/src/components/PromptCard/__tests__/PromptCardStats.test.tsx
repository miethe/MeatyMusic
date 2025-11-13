import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Stats } from '../sections';

describe('PromptCard Stats', () => {
  it('renders metrics', () => {
    render(<Stats metrics={{ runs: 5, successRate: 0.5, avgCost: 0.01 }} isCompact={false} />);
    expect(screen.getByText('5 runs')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('$0.010')).toBeInTheDocument();
  });
});
