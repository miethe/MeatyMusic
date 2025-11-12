import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form, FormField, FormItem, FormMessage, FormDescription } from '../Form';

describe('Form Components', () => {
  describe('Form', () => {
    test('renders form element with proper attributes', () => {
      render(
        <Form data-testid="form">
          <div>Form content</div>
        </Form>
      );

      const form = screen.getByTestId('form');
      expect(form.tagName).toBe('FORM');
      expect(form).toHaveClass('space-y-6');
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLFormElement>();
      render(<Form ref={ref}>Content</Form>);

      expect(ref.current).toBeInstanceOf(HTMLFormElement);
    });

    test('handles form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <Form onSubmit={handleSubmit} data-testid="form">
          <button type="submit">Submit</button>
        </Form>
      );

      const form = screen.getByTestId('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('FormField', () => {
    test('renders field wrapper without error', () => {
      render(
        <FormField data-testid="field">
          <input />
        </FormField>
      );

      const field = screen.getByTestId('field');
      expect(field).toHaveClass('space-y-2');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('displays error message when error prop provided', () => {
      render(
        <FormField error="This field is required" data-testid="field">
          <input />
        </FormField>
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('This field is required');
      expect(errorMessage).toHaveClass('text-sm', 'text-destructive');
    });
  });

  describe('FormItem', () => {
    test('renders form item container', () => {
      render(
        <FormItem data-testid="item">
          <label>Label</label>
          <input />
        </FormItem>
      );

      const item = screen.getByTestId('item');
      expect(item).toHaveClass('space-y-2');
    });
  });

  describe('FormMessage', () => {
    test('renders error message when children provided', () => {
      render(<FormMessage>Error message</FormMessage>);

      const message = screen.getByRole('alert');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Error message');
      expect(message).toHaveClass('text-sm', 'font-medium', 'text-destructive');
    });

    test('renders nothing when no children provided', () => {
      const { container } = render(<FormMessage />);
      expect(container.firstChild).toBe(null);
    });

    test('renders nothing for empty string children', () => {
      const { container } = render(<FormMessage>{''}</FormMessage>);
      expect(container.firstChild).toBe(null);
    });
  });

  describe('FormDescription', () => {
    test('renders description text', () => {
      render(<FormDescription>This is a helpful description</FormDescription>);

      const description = screen.getByText('This is a helpful description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<FormDescription ref={ref}>Description</FormDescription>);

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('Integration', () => {
    test('complete form structure renders correctly', () => {
      render(
        <Form>
          <FormField error="Email is required">
            <FormItem>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" />
              <FormDescription>Enter your email address</FormDescription>
            </FormItem>
          </FormField>
        </Form>
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });
  });
});
