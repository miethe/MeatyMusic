import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Chip } from './Chip';

expect.extend(toHaveNoViolations);

describe('Chip', () => {
  it('renders correctly', () => {
    render(<Chip>javascript</Chip>);
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('displays count when provided', () => {
    render(<Chip count={42}>react</Chip>);
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('shows checkmark when selected', () => {
    render(<Chip selected>typescript</Chip>);
    const checkIcon = screen.getByRole('button').querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows star icon when popular', () => {
    render(<Chip isPopular>nextjs</Chip>);
    const starIcon = screen.getByRole('button').querySelector('svg');
    expect(starIcon).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Chip onClick={handleClick}>vue</Chip>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    const handleClick = jest.fn();
    render(<Chip onClick={handleClick}>angular</Chip>);

    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    const handleClick = jest.fn();
    render(<Chip onClick={handleClick}>svelte</Chip>);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Chip disabled onClick={handleClick}>disabled</Chip>);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    render(<Chip selected>test</Chip>);
    const chip = screen.getByRole('button');

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('tabIndex', '0');
  });

  it('has correct ARIA attributes when disabled', () => {
    render(<Chip disabled>test</Chip>);
    const chip = screen.getByRole('button');

    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('tabIndex', '-1');
  });

  it('truncates long text', () => {
    render(<Chip>very-long-tag-name-that-should-be-truncated</Chip>);
    const textSpan = screen.getByText('very-long-tag-name-that-should-be-truncated');
    expect(textSpan).toHaveClass('truncate');
  });

  it('applies custom className', () => {
    render(<Chip className="custom-class">test</Chip>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Chip ref={ref}>test</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <Chip>javascript</Chip>
          <Chip selected count={42}>react</Chip>
          <Chip disabled>vue</Chip>
          <Chip isPopular count={156}>nextjs</Chip>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper count announcement', () => {
      render(<Chip count={42}>test</Chip>);
      const countElement = screen.getByLabelText('42 items');
      expect(countElement).toBeInTheDocument();
    });

    it('supports custom aria-label', () => {
      render(<Chip aria-label="Custom label">test</Chip>);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });
  });

  describe('Variants and Sizes', () => {
    it('applies default variant correctly', () => {
      render(<Chip>test</Chip>);
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('bg-surface');
    });

    it('applies outline variant correctly', () => {
      render(<Chip variant="outline">test</Chip>);
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('bg-transparent');
    });

    it('applies small size correctly', () => {
      render(<Chip size="sm">test</Chip>);
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('applies large size correctly', () => {
      render(<Chip size="lg">test</Chip>);
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });
});
