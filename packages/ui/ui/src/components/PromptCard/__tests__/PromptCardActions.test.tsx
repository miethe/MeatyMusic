import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Actions } from '../sections';

describe('PromptCard Actions', () => {
  it('calls onRun when run button clicked', () => {
    const onRun = jest.fn();
    render(
      <Actions
        isCompact={false}
        isXL={false}
        onRun={onRun}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /run/i }));
    expect(onRun).toHaveBeenCalled();
  });

  describe('Edit Button', () => {
    it('calls onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(
        <Actions
          isCompact={false}
          isXL={false}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('renders Edit button with icon and text in standard size', () => {
      const onEdit = jest.fn();
      render(
        <Actions
          isCompact={false}
          isXL={false}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent('Edit');
    });

    it('renders Edit button with icon only in compact mode', () => {
      const onEdit = jest.fn();
      render(
        <Actions
          isCompact={true}
          isXL={false}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit prompt/i });
      expect(editButton).toBeInTheDocument();
      // In compact mode, text is not rendered, only aria-label
      expect(editButton).not.toHaveTextContent('Edit');
    });

    it('does not render Edit button when onEdit is not provided', () => {
      render(
        <Actions
          isCompact={false}
          isXL={false}
        />
      );

      const editButton = screen.queryByRole('button', { name: /edit/i });
      expect(editButton).not.toBeInTheDocument();
    });

    it('Edit button is keyboard accessible', () => {
      const onEdit = jest.fn();
      render(
        <Actions
          isCompact={false}
          isXL={false}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });

      // Verify button can be focused
      editButton.focus();
      expect(editButton).toHaveFocus();

      // Verify button can be clicked (keyboard activation is handled by browser)
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalled();
    });
  });
});
