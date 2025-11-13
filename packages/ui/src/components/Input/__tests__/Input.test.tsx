import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from '../Input';
import { Search, Mail } from 'lucide-react';

describe('Input', () => {
  it('renders correctly with default props', () => {
    render(<Input data-testid="input" placeholder="Enter text" />);

    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Input data-testid="input" variant="default" />);
    expect(screen.getByTestId('input')).toHaveClass('border-border', 'focus-visible:ring-ring');

    rerender(<Input data-testid="input" variant="error" />);
    expect(screen.getByTestId('input')).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
  });

  it('applies error variant when error prop is true', () => {
    render(<Input data-testid="input" error={true} />);
    expect(screen.getByTestId('input')).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input data-testid="input" type="email" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input data-testid="input" type="password" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input data-testid="input" type="number" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('handles disabled state', () => {
    render(<Input data-testid="input" disabled />);
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('accepts custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  describe('Icon Support', () => {
    it('renders with left icon', () => {
      render(
        <Input
          data-testid="input"
          placeholder="Search"
          icon={<Search data-testid="left-icon" />}
        />
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pl-9');
    });

    it('renders with right icon', () => {
      render(
        <Input
          data-testid="input"
          placeholder="Email"
          rightIcon={<Mail data-testid="right-icon" />}
        />
      );

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pr-9');
    });

    it('renders with both icons', () => {
      render(
        <Input
          data-testid="input"
          placeholder="Search emails"
          icon={<Search data-testid="left-icon" />}
          rightIcon={<Mail data-testid="right-icon" />}
        />
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('pl-9', 'pr-9');
    });

    it('positions icons correctly', () => {
      render(
        <div data-testid="wrapper">
          <Input
            placeholder="Test"
            icon={<Search data-testid="left-icon" />}
            rightIcon={<Mail data-testid="right-icon" />}
          />
        </div>
      );

      const leftIcon = screen.getByTestId('left-icon').parentElement;
      const rightIcon = screen.getByTestId('right-icon').parentElement;

      expect(leftIcon).toHaveClass('absolute', 'left-3', 'top-1/2');
      expect(rightIcon).toHaveClass('absolute', 'right-3', 'top-1/2');
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input data-testid="input" onChange={handleChange} />);

      const input = screen.getByTestId('input');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test');
    });

    it('handles focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();

      render(
        <Input
          data-testid="input"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      );

      const input = screen.getByTestId('input');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();

      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it('supports controlled input', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Input
          data-testid="input"
          value="controlled"
          onChange={handleChange}
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('controlled');

      await user.clear(input);
      await user.type(input, 'new value');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        expect(formData.get('testInput')).toBe('test value');
      });

      render(
        <form onSubmit={handleSubmit}>
          <Input
            name="testInput"
            defaultValue="test value"
            data-testid="input"
          />
          <button type="submit">Submit</button>
        </form>
      );

      fireEvent.submit(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('supports required attribute', () => {
      render(<Input data-testid="input" required />);
      expect(screen.getByTestId('input')).toHaveAttribute('required');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor="accessible-input">Label</label>
          <Input id="accessible-input" placeholder="Enter text" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with error state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="error-input">Label</label>
          <Input
            id="error-input"
            error={true}
            aria-describedby="error-message"
            placeholder="Enter text"
          />
          <div id="error-message" role="alert">Error message</div>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with icons', async () => {
      const { container } = render(
        <div>
          <label htmlFor="icon-input">Search</label>
          <Input
            id="icon-input"
            placeholder="Search..."
            icon={<Search aria-hidden="true" />}
          />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria attributes', () => {
      render(
        <Input
          data-testid="input"
          aria-label="Search input"
          aria-describedby="help-text"
          aria-invalid={true}
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Search input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty icon props gracefully', () => {
      render(
        <Input
          data-testid="input"
          icon={null}
          rightIcon={undefined}
          placeholder="Test"
        />
      );

      const input = screen.getByTestId('input');
      expect(input).not.toHaveClass('pl-9', 'pr-9');
    });

    it('handles long text values', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);

      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.type(input, longText);

      expect(input).toHaveValue(longText);
    });
  });
});
