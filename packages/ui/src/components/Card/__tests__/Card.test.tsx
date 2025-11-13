import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card';

describe('Card', () => {
  it('renders correctly with default variant', () => {
    render(
      <Card data-testid="card">
        <CardContent>Test content</CardContent>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Test content');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Card data-testid="card" variant="elevated" />);
    expect(screen.getByTestId('card')).toHaveClass('shadow-elev3');

    rerender(<Card data-testid="card" variant="bordered" />);
    expect(screen.getByTestId('card')).toHaveClass('shadow-elev1');

    rerender(<Card data-testid="card" variant="ghost" />);
    expect(screen.getByTestId('card')).toHaveClass('bg-transparent');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Card ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('accepts custom className', () => {
    render(<Card className="custom-class" data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });

  it('passes through HTML attributes', () => {
    render(<Card data-testid="card" id="custom-id" role="article" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'custom-id');
    expect(card).toHaveAttribute('role', 'article');
  });

  describe('CardHeader', () => {
    it('renders with correct default styles', () => {
      render(
        <CardHeader data-testid="card-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      );

      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
    });

    it('has correct styling classes', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'text-text-strong');
    });
  });

  describe('CardDescription', () => {
    it('renders as paragraph element', () => {
      render(<CardDescription>Card description</CardDescription>);
      const description = screen.getByText('Card description');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-text-muted');
    });
  });

  describe('CardContent', () => {
    it('renders with correct padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with flex layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });
  });

  describe('Complete Card', () => {
    it('renders all sections correctly', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with basic card', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with interactive card', async () => {
      const { container } = render(
        <Card role="article" tabIndex={0}>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>This card can receive focus</CardDescription>
          </CardHeader>
          <CardContent>Focusable content</CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Hover Effects', () => {
    it('applies hover effects for elevated variant', () => {
      render(<Card variant="elevated" data-testid="card" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-elev4');
    });

    it('has transition classes for smooth animations', () => {
      render(<Card variant="elevated" data-testid="card" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('transition-shadow', 'duration-200');
    });
  });
});
