import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCardSkeleton, PromptCardGridSkeleton } from '../PromptCardSkeleton';

expect.extend(toHaveNoViolations);

describe('PromptCardSkeleton', () => {
  it('renders with proper ARIA attributes', () => {
    render(<PromptCardSkeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading prompt card...');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });

  it('supports size variants and shimmer control', () => {
    const { container: compact } = render(
      <PromptCardSkeleton size="compact" shimmer={false} />
    );
    const { container: xl } = render(<PromptCardSkeleton size="xl" />);

    expect(compact.firstChild).toHaveClass('compact');
    expect(compact.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(xl.querySelector('.animate-shimmer')).toBeInTheDocument();
  });
});

describe('PromptCardGridSkeleton', () => {
  it('renders the specified number of skeletons', () => {
    const { container } = render(<PromptCardGridSkeleton count={3} />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons).toHaveLength(3);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PromptCardGridSkeleton count={2} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
