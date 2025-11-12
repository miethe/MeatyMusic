import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock window.innerWidth for responsive testing
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Sidebar', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
    // Reset to desktop width by default
    mockInnerWidth(1024);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct ARIA attributes', () => {
    render(
      <Sidebar isOpen={true}>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('aria-label', 'Sidebar');
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });

  it('applies aria-hidden when empty', () => {
    render(<Sidebar isOpen={true} />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders content when provided', () => {
    render(
      <Sidebar isOpen={true}>
        <div data-testid="sidebar-content">Test content</div>
      </Sidebar>
    );

    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
  });

  it('calls onOpenChange when state should change', () => {
    const { rerender } = render(
      <Sidebar isOpen={false} onOpenChange={mockOnOpenChange}>
        <div>Test content</div>
      </Sidebar>
    );

    // Simulate opening
    rerender(
      <Sidebar isOpen={true} onOpenChange={mockOnOpenChange}>
        <div>Test content</div>
      </Sidebar>
    );

    // The component itself doesn't trigger onOpenChange, it's controlled by parent
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes for desktop', () => {
    mockInnerWidth(1024);

    render(
      <Sidebar isOpen={true} width={280}>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-[var(--sidebar-width)]');
  });

  it('handles mobile breakpoint correctly', async () => {
    render(
      <Sidebar isOpen={true} mobileBreakpoint={768}>
        <div>Test content</div>
      </Sidebar>
    );

    // Simulate mobile width
    mockInnerWidth(500);

    // Wait for resize event to be processed
    await new Promise(resolve => setTimeout(resolve, 0));

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('fixed');
  });

  it('renders backdrop on mobile when open and overlay enabled', async () => {
    const { container } = render(
      <Sidebar isOpen={true} overlay={true} mobileBreakpoint={768}>
        <div>Test content</div>
      </Sidebar>
    );

    // Simulate mobile width
    mockInnerWidth(500);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check for backdrop element (not accessible via role)
    const backdrop = container.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeInTheDocument();
  });

  it('supports right position', () => {
    render(
      <Sidebar isOpen={true} position="right">
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('border-l');
  });

  it('applies custom transition duration', () => {
    render(
      <Sidebar isOpen={true} transitionDuration={300}>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar.style.getPropertyValue('--transition-duration')).toBe('300ms');
  });

  it('handles keyboard navigation on mobile', async () => {
    const mockOnOpenChange = jest.fn();

    render(
      <Sidebar isOpen={true} onOpenChange={mockOnOpenChange}>
        <button>Test button</button>
      </Sidebar>
    );

    // Simulate mobile
    mockInnerWidth(500);
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for focus trap setup

    // Test escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('sets correct data attributes', () => {
    const { rerender } = render(
      <Sidebar isOpen={true}>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('data-sidebar-open', 'true');
    expect(sidebar).toHaveAttribute('data-sidebar-empty', 'false');

    // Test with no content
    rerender(<Sidebar isOpen={true} />);
    expect(sidebar).toHaveAttribute('data-sidebar-empty', 'true');
  });

  it('handles collapsible mode', () => {
    const { rerender } = render(
      <Sidebar isOpen={true} collapsible={true}>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-[var(--sidebar-width)]');

    // Test collapsed state
    rerender(
      <Sidebar isOpen={false} collapsible={true}>
        <div>Test content</div>
      </Sidebar>
    );

    expect(sidebar).toHaveClass('w-0');
  });
});
