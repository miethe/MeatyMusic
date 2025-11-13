import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Skeleton, LoadingSkeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders correctly with default props', () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('forwards HTML attributes', () => {
    render(
      <Skeleton
        data-testid="skeleton"
        id="custom-id"
        role="presentation"
      />
    );

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'custom-id');
    expect(skeleton).toHaveAttribute('role', 'presentation');
  });

  it('applies shimmer animation styles', () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
    });
    expect(skeleton).toHaveClass('bg-gradient-to-r');
  });

  it('uses gradient background for shimmer effect', () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass(
      'bg-gradient-to-r',
      'from-text-muted/10',
      'via-text-muted/20',
      'to-text-muted/10'
    );
  });
});

describe('LoadingSkeleton', () => {
  it('renders with default props', () => {
    render(<LoadingSkeleton data-testid="loading-skeleton" />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({
      height: '1rem',
      width: '100%',
    });
  });

  it('applies custom dimensions', () => {
    render(
      <LoadingSkeleton
        data-testid="loading-skeleton"
        height="2rem"
        width="50%"
      />
    );

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveStyle({
      height: '2rem',
      width: '50%',
    });
  });

  it('applies numeric width correctly', () => {
    render(
      <LoadingSkeleton
        data-testid="loading-skeleton"
        width={200}
      />
    );

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveStyle({
      width: '200px',
    });
  });

  it('renders multiple lines', () => {
    render(<LoadingSkeleton lines={3} />);

    // Should render a container with 3 skeleton elements
    const skeletons = screen.getAllByRole('presentation', { hidden: true });
    expect(skeletons).toHaveLength(3);
  });

  it('applies different width to last line when multiple lines', () => {
    const { container } = render(<LoadingSkeleton lines={3} width="100%" />);

    const skeletons = container.querySelectorAll('div > div');
    expect(skeletons).toHaveLength(3);

    // First two lines should have 100% width
    expect(skeletons[0]).toHaveStyle({ width: '100%' });
    expect(skeletons[1]).toHaveStyle({ width: '100%' });

    // Last line should have 75% width
    expect(skeletons[2]).toHaveStyle({ width: '75%' });
  });

  describe('Shape Variants', () => {
    it('renders circular skeleton', () => {
      render(
        <LoadingSkeleton
          data-testid="circular-skeleton"
          circular={true}
        />
      );

      const skeleton = screen.getByTestId('circular-skeleton');
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).not.toHaveClass('rounded-md');
    });

    it('renders rectangular skeleton by default', () => {
      render(
        <LoadingSkeleton
          data-testid="rectangular-skeleton"
          circular={false}
        />
      );

      const skeleton = screen.getByTestId('rectangular-skeleton');
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).not.toHaveClass('rounded-full');
    });
  });

  describe('Animation Variants', () => {
    it('applies shimmer animation when enabled', () => {
      render(
        <LoadingSkeleton
          data-testid="shimmer-skeleton"
          shimmer={true}
        />
      );

      const skeleton = screen.getByTestId('shimmer-skeleton');
      expect(skeleton).toHaveStyle({
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      });
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('applies pulse animation when shimmer is disabled', () => {
      render(
        <LoadingSkeleton
          data-testid="pulse-skeleton"
          shimmer={false}
        />
      );

      const skeleton = screen.getByTestId('pulse-skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).not.toHaveStyle({
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      });
    });

    it('uses shimmer animation by default', () => {
      render(<LoadingSkeleton data-testid="default-skeleton" />);

      const skeleton = screen.getByTestId('default-skeleton');
      expect(skeleton).toHaveStyle({
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      });
    });
  });

  describe('Multiple Lines with Animation', () => {
    it('applies shimmer animation to all lines', () => {
      const { container } = render(
        <LoadingSkeleton lines={3} shimmer={true} />
      );

      const skeletons = container.querySelectorAll('div > div');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveStyle({
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        });
      });
    });

    it('applies pulse animation to all lines when shimmer is disabled', () => {
      const { container } = render(
        <LoadingSkeleton lines={3} shimmer={false} />
      );

      const skeletons = container.querySelectorAll('div > div');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      render(
        <LoadingSkeleton
          className="custom-skeleton-class"
          data-testid="custom-skeleton"
        />
      );

      const skeleton = screen.getByTestId('custom-skeleton');
      expect(skeleton).toHaveClass('custom-skeleton-class');
    });

    it('combines custom className with default classes', () => {
      render(
        <LoadingSkeleton
          className="custom-class"
          circular={true}
          data-testid="combined-skeleton"
        />
      );

      const skeleton = screen.getByTestId('combined-skeleton');
      expect(skeleton).toHaveClass('custom-class', 'rounded-full');
    });
  });

  describe('Edge Cases', () => {
    it('handles single line correctly when lines=1', () => {
      render(<LoadingSkeleton lines={1} data-testid="single-line" />);

      const skeleton = screen.getByTestId('single-line');
      expect(skeleton).toBeInTheDocument();
      // Should not create a wrapper div for single line
      expect(skeleton.parentElement).not.toHaveClass('space-y-2');
    });

    it('handles zero lines gracefully', () => {
      const { container } = render(<LoadingSkeleton lines={0} />);

      // Should render empty container or single skeleton
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles very large number of lines', () => {
      const { container } = render(<LoadingSkeleton lines={100} />);

      const skeletons = container.querySelectorAll('div > div');
      expect(skeletons).toHaveLength(100);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with single skeleton', async () => {
      const { container } = render(
        <div>
          <h2>Loading Content</h2>
          <Skeleton />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with multiple skeletons', async () => {
      const { container } = render(
        <div>
          <h2>Loading Article</h2>
          <LoadingSkeleton lines={5} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('can be enhanced with ARIA attributes', () => {
      render(
        <Skeleton
          data-testid="aria-skeleton"
          role="status"
          aria-label="Content loading"
        />
      );

      const skeleton = screen.getByTestId('aria-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-label', 'Content loading');
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many skeletons', () => {
      const startTime = performance.now();

      render(
        <div>
          {Array.from({ length: 50 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={3} />
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 100ms for 50 skeletons)
      expect(renderTime).toBeLessThan(100);
    });
  });
});
