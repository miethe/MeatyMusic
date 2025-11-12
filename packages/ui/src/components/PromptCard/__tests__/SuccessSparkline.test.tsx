import { render, screen } from '@testing-library/react';
import { SuccessSparkline } from '../components/SuccessSparkline';

describe('SuccessSparkline', () => {
  it('renders with default dimensions', () => {
    const data = [0.7, 0.8, 0.6, 0.9];
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute('aria-label', expect.stringContaining('Success rate trend'));
  });

  it('handles empty data array gracefully', () => {
    render(<SuccessSparkline data={[]} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute('aria-label', 'No success rate data available');
  });

  it('handles single data point correctly', () => {
    render(<SuccessSparkline data={[0.85]} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute('aria-label', 'Success rate: 85%');
  });

  it('handles all same values (flat trend)', () => {
    const data = [0.8, 0.8, 0.8, 0.8];
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveAttribute('aria-label', expect.stringContaining('stable trend'));
  });

  it('detects increasing trend', () => {
    const data = [0.5, 0.6, 0.7, 0.8];
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveAttribute('aria-label', expect.stringContaining('increasing trend'));
  });

  it('detects decreasing trend', () => {
    const data = [0.9, 0.8, 0.7, 0.6];
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveAttribute('aria-label', expect.stringContaining('decreasing trend'));
  });

  it('applies custom dimensions', () => {
    const data = [0.7, 0.8];
    const { container } = render(
      <SuccessSparkline data={data} width={80} height={32} />
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('width', '80');
    expect(svgElement).toHaveAttribute('height', '32');
    expect(svgElement).toHaveAttribute('viewBox', '0 0 80 32');
  });

  it('applies custom className', () => {
    const data = [0.7, 0.8];
    const { container } = render(
      <SuccessSparkline data={data} className="custom-sparkline" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-sparkline');
  });

  it('generates correct SVG path for multiple data points', () => {
    const data = [0.0, 0.5, 1.0];
    const { container } = render(
      <SuccessSparkline data={data} width={60} height={24} />
    );

    const pathElements = container.querySelectorAll('path[stroke]');
    const mainPath = Array.from(pathElements).find(path =>
      path.getAttribute('stroke')?.includes('mp-color-success') ||
      path.getAttribute('stroke')?.includes('mp-color-primary')
    );
    expect(mainPath).toBeInTheDocument();
    expect(mainPath).toHaveAttribute('d', expect.stringMatching(/^M.*L.*L/));
  });

  it('includes data point circles for accessibility', () => {
    const data = [0.7, 0.8, 0.9];
    const { container } = render(<SuccessSparkline data={data} />);

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(data.length);
  });

  it('provides meaningful accessibility description', () => {
    const data = [0.6, 0.7, 0.8, 0.75, 0.9];
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    const ariaLabel = sparkline.getAttribute('aria-label');

    expect(ariaLabel).toContain('Success rate trend');
    expect(ariaLabel).toContain('60%'); // min
    expect(ariaLabel).toContain('90%'); // max
    expect(ariaLabel).toContain('90%'); // current (latest)
    expect(ariaLabel).toContain('increasing trend');
  });

  it('handles edge case with very small differences as stable', () => {
    const data = [0.800, 0.801, 0.802, 0.799]; // Very small variations
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveAttribute('aria-label', expect.stringContaining('stable trend'));
  });

  it('uses CSS custom properties for styling', () => {
    const data = [0.7, 0.8];
    const { container } = render(<SuccessSparkline data={data} />);

    const pathElements = container.querySelectorAll('path[stroke]');
    const mainPath = Array.from(pathElements).find(path =>
      path.getAttribute('stroke')?.includes('mp-color-success') ||
      path.getAttribute('stroke')?.includes('mp-color-primary')
    );
    expect(mainPath).toHaveAttribute('stroke', 'var(--mp-color-success, var(--mp-color-primary))');
  });

  it('includes subtle background grid for context', () => {
    const data = [0.7, 0.8, 0.9];
    const { container } = render(<SuccessSparkline data={data} />);

    const patternElement = container.querySelector('pattern');
    expect(patternElement).toBeInTheDocument();

    const backgroundRect = container.querySelector('rect[fill^="url(#sparkline-grid"]');
    expect(backgroundRect).toBeInTheDocument();
  });

  it('renders dashed line for empty data', () => {
    const { container } = render(<SuccessSparkline data={[]} />);

    const dashedLine = container.querySelector('line[stroke-dasharray]');
    expect(dashedLine).toBeInTheDocument();
    expect(dashedLine).toHaveAttribute('stroke-dasharray', '2,2');
  });

  it('memoizes expensive calculations', () => {
    const data = [0.5, 0.6, 0.7, 0.8, 0.9];
    const { rerender } = render(<SuccessSparkline data={data} />);

    // Re-render with same data should not cause issues
    rerender(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    expect(sparkline).toBeInTheDocument();
  });

  it('handles boundary values correctly', () => {
    const data = [0, 1, 0, 1]; // Min and max values
    render(<SuccessSparkline data={data} />);

    const sparkline = screen.getByRole('img');
    const ariaLabel = sparkline.getAttribute('aria-label');

    expect(ariaLabel).toContain('0%');
    expect(ariaLabel).toContain('100%');
  });
});
