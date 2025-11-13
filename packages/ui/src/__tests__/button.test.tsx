import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders children', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles clicks', () => {
    const onClick = jest.fn();
    const { getByText } = render(<Button onClick={onClick}>Hit</Button>);
    fireEvent.click(getByText('Hit'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByText } = render(<Button loading>Load</Button>);
    expect(getByText(/loading/i)).toBeInTheDocument();
  });
});
