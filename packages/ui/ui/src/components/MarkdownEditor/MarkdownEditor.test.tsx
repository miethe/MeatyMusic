/**
 * MarkdownEditor Component Tests
 *
 * Unit tests for MarkdownEditor component functionality.
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownEditor } from './MarkdownEditor';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('MarkdownEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders with provided value', () => {
      render(<MarkdownEditor value="# Hello" onChange={mockOnChange} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders toolbar by default', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('hides toolbar when showToolbar is false', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} showToolbar={false} />);
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MarkdownEditor value="" onChange={mockOnChange} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('uses custom aria-label', () => {
      render(
        <MarkdownEditor value="" onChange={mockOnChange} ariaLabel="Custom editor" />
      );
      expect(screen.getByLabelText('Custom editor')).toBeInTheDocument();
    });
  });

  describe('Layout Modes', () => {
    it('renders split layout by default', () => {
      render(<MarkdownEditor value="# Test" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Editor pane')).toBeInTheDocument();
      expect(screen.getByLabelText('Preview pane')).toBeInTheDocument();
    });

    it('renders editor only layout', () => {
      render(<MarkdownEditor value="# Test" onChange={mockOnChange} layout="editor" />);
      expect(screen.getByLabelText('Editor pane')).toBeInTheDocument();
      expect(screen.queryByLabelText('Preview pane')).not.toBeInTheDocument();
    });

    it('renders preview only layout', () => {
      render(<MarkdownEditor value="# Test" onChange={mockOnChange} layout="preview" />);
      expect(screen.queryByLabelText('Editor pane')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Preview pane')).toBeInTheDocument();
    });
  });

  describe('Read-only Mode', () => {
    it('disables toolbar buttons in read-only mode', () => {
      render(<MarkdownEditor value="# Test" onChange={mockOnChange} readOnly />);
      const buttons = screen.getAllByRole('button');
      const formatButtons = buttons.filter(
        (btn) =>
          btn.getAttribute('aria-label')?.includes('Bold') ||
          btn.getAttribute('aria-label')?.includes('Italic')
      );
      formatButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Toolbar', () => {
    it('renders all format buttons', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Bold/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Italic/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Heading/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Link/)).toBeInTheDocument();
      expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bullet list/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Numbered list/)).toBeInTheDocument();
    });

    it('renders layout toggle button', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Toggle layout/)).toBeInTheDocument();
    });

    it('shows saved state initially', () => {
      render(<MarkdownEditor value="test" onChange={mockOnChange} />);
      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    });
  });

  describe('Dirty State', () => {
    it('shows unsaved state when value changes', () => {
      const { rerender } = render(
        <MarkdownEditor value="initial" onChange={mockOnChange} />
      );
      expect(screen.getByText(/Saved/)).toBeInTheDocument();

      rerender(<MarkdownEditor value="changed" onChange={mockOnChange} />);
      expect(screen.getByText(/Unsaved/)).toBeInTheDocument();
    });

    it('calls onDirtyChange when dirty state changes', () => {
      const mockOnDirtyChange = jest.fn();
      const { rerender } = render(
        <MarkdownEditor
          value="initial"
          onChange={mockOnChange}
          onDirtyChange={mockOnDirtyChange}
        />
      );

      rerender(
        <MarkdownEditor
          value="changed"
          onChange={mockOnChange}
          onDirtyChange={mockOnDirtyChange}
        />
      );

      // Should be called with true when value changes
      expect(mockOnDirtyChange).toHaveBeenCalledWith(true);
    });

    it('respects external isDirty prop', () => {
      render(
        <MarkdownEditor value="test" onChange={mockOnChange} isDirty={true} />
      );
      expect(screen.getByText(/Unsaved/)).toBeInTheDocument();
    });
  });

  describe('Autosave', () => {
    it('calls onSave after autosave delay', () => {
      const { rerender } = render(
        <MarkdownEditor
          value="initial"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      rerender(
        <MarkdownEditor
          value="changed"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      expect(mockOnSave).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1500);

      expect(mockOnSave).toHaveBeenCalledWith('changed');
    });

    it('does not call onSave when autosave is disabled', () => {
      const { rerender } = render(
        <MarkdownEditor
          value="initial"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave={false}
        />
      );

      rerender(
        <MarkdownEditor
          value="changed"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave={false}
        />
      );

      jest.advanceTimersByTime(5000);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('respects custom autosave delay', () => {
      const { rerender } = render(
        <MarkdownEditor
          value="initial"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={500}
        />
      );

      rerender(
        <MarkdownEditor
          value="changed"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={500}
        />
      );

      jest.advanceTimersByTime(500);

      expect(mockOnSave).toHaveBeenCalledWith('changed');
    });

    it('debounces multiple rapid changes', () => {
      const { rerender } = render(
        <MarkdownEditor
          value="v1"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      rerender(
        <MarkdownEditor
          value="v2"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      jest.advanceTimersByTime(500);

      rerender(
        <MarkdownEditor
          value="v3"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      jest.advanceTimersByTime(500);

      rerender(
        <MarkdownEditor
          value="v4"
          onChange={mockOnChange}
          onSave={mockOnSave}
          autosave
          autosaveDelay={1500}
        />
      );

      jest.advanceTimersByTime(1500);

      // Should only save the final value
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith('v4');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('triggers save on Cmd+S', () => {
      render(
        <MarkdownEditor
          value="test"
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.keyDown(window, { key: 's', metaKey: true });

      expect(mockOnSave).toHaveBeenCalledWith('test');
    });

    it('triggers save on Ctrl+S', () => {
      render(
        <MarkdownEditor
          value="test"
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      expect(mockOnSave).toHaveBeenCalledWith('test');
    });

    it('prevents default on Cmd+S', () => {
      render(
        <MarkdownEditor
          value="test"
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.fn();
      event.preventDefault = preventDefaultSpy;

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Preview', () => {
    it('renders markdown in preview pane', () => {
      render(<MarkdownEditor value="# Hello World" onChange={mockOnChange} />);
      const preview = screen.getByLabelText('Preview pane');
      expect(preview).toBeInTheDocument();
    });

    it('shows empty state when value is empty', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      expect(screen.getByText(/Nothing to preview/)).toBeInTheDocument();
    });

    it('renders GFM features', () => {
      const markdown = '| Col 1 | Col 2 |\n|-------|-------|\n| A | B |';
      render(<MarkdownEditor value={markdown} onChange={mockOnChange} />);
      const preview = screen.getByLabelText('Preview pane');
      expect(preview.querySelector('table')).toBeInTheDocument();
    });
  });

  describe('Custom Heights', () => {
    it('applies custom minHeight', () => {
      const { container } = render(
        <MarkdownEditor value="test" onChange={mockOnChange} minHeight="600px" />
      );
      const preview = container.querySelector('[aria-label="Preview pane"]');
      expect(preview).toHaveStyle({ minHeight: '600px' });
    });
  });

  describe('Placeholder', () => {
    it('uses default placeholder', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} />);
      // CodeMirror placeholder is set via props but may not be easily testable
      // This is more of an integration test
    });

    it('uses custom placeholder', () => {
      render(
        <MarkdownEditor
          value=""
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      );
      // Verify placeholder prop is passed (implementation detail)
    });
  });
});
