import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBanner } from '../sections';

describe('PromptCard ErrorBanner', () => {
  it('renders message and retry', () => {
    const retry = jest.fn();
    render(<ErrorBanner error={{ message: 'oops', retry }} />);
    expect(screen.getByText('oops')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retry).toHaveBeenCalled();
  });
});
