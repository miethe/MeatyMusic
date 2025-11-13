import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorLayout } from '../error-layout';

describe('ErrorLayout', () => {
  const defaultProps = {
    title: 'Page Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist.',
  };

  it('renders with basic props', () => {
    render(<ErrorLayout {...defaultProps} />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('hides status code when showStatusCode is false', () => {
    render(<ErrorLayout {...defaultProps} showStatusCode={false} />);

    expect(screen.queryByText('404')).not.toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders action buttons and handles clicks', () => {
    const mockAction1 = jest.fn();
    const mockAction2 = jest.fn();

    const actions = [
      { label: 'Go Home', onClick: mockAction1, variant: 'primary' as const },
      { label: 'Go Back', onClick: mockAction2, variant: 'secondary' as const },
    ];

    render(<ErrorLayout {...defaultProps} actions={actions} />);

    const homeButton = screen.getByText('Go Home');
    const backButton = screen.getByText('Go Back');

    expect(homeButton).toBeInTheDocument();
    expect(backButton).toBeInTheDocument();

    fireEvent.click(homeButton);
    fireEvent.click(backButton);

    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });

  it('renders illustration when provided', () => {
    const illustration = <div data-testid="error-illustration">📄</div>;

    render(<ErrorLayout {...defaultProps} illustration={illustration} />);

    expect(screen.getByTestId('error-illustration')).toBeInTheDocument();
  });

  it('renders additional content when provided', () => {
    const additionalContent = (
      <div data-testid="additional-content">
        <p>Need help? Contact support</p>
      </div>
    );

    render(<ErrorLayout {...defaultProps} additionalContent={additionalContent} />);

    expect(screen.getByTestId('additional-content')).toBeInTheDocument();
    expect(screen.getByText('Need help? Contact support')).toBeInTheDocument();
  });

  it('applies correct status code color classes', () => {
    const { rerender } = render(<ErrorLayout {...defaultProps} statusCode={404} />);
    let statusElement = screen.getByText('404');
    expect(statusElement).toHaveClass('text-orange-500');

    rerender(<ErrorLayout {...defaultProps} statusCode={500} />);
    statusElement = screen.getByText('500');
    expect(statusElement).toHaveClass('text-red-500');

    rerender(<ErrorLayout {...defaultProps} statusCode={200} />);
    statusElement = screen.getByText('200');
    expect(statusElement).toHaveClass('text-blue-500');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ErrorLayout {...defaultProps} className="custom-error-class" />
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('custom-error-class');
  });

  it('renders current timestamp', () => {
    render(<ErrorLayout {...defaultProps} />);

    expect(screen.getByText(/Error occurred at/)).toBeInTheDocument();
  });
});
