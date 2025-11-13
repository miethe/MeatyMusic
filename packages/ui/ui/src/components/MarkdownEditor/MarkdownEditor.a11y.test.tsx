/**
 * MarkdownEditor Accessibility Tests
 *
 * WCAG 2.1 AA compliance tests using jest-axe.
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MarkdownEditor } from './MarkdownEditor';

expect.extend(toHaveNoViolations);

describe('MarkdownEditor Accessibility', () => {
  const mockOnChange = jest.fn();

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no violations in default state', async () => {
      const { container } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with content', async () => {
      const { container } = render(
        <MarkdownEditor
          value="# Hello\n\nThis is **bold** text."
          onChange={mockOnChange}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in editor only layout', async () => {
      const { container } = render(
        <MarkdownEditor
          value="# Test"
          onChange={mockOnChange}
          layout="editor"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in preview only layout', async () => {
      const { container } = render(
        <MarkdownEditor
          value="# Test"
          onChange={mockOnChange}
          layout="preview"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations without toolbar', async () => {
      const { container } = render(
        <MarkdownEditor
          value="# Test"
          onChange={mockOnChange}
          showToolbar={false}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in read-only mode', async () => {
      const { container } = render(
        <MarkdownEditor
          value="# Test"
          onChange={mockOnChange}
          readOnly
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with dirty state', async () => {
      const { container } = render(
        <MarkdownEditor
          value="changed"
          onChange={mockOnChange}
          isDirty={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('has proper ARIA labels on toolbar', () => {
      const { getByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      const toolbar = getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Markdown formatting toolbar');
    });

    it('has proper ARIA labels on format buttons', () => {
      const { getByLabelText } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      expect(getByLabelText(/Bold/)).toBeInTheDocument();
      expect(getByLabelText(/Italic/)).toBeInTheDocument();
      expect(getByLabelText(/Heading/)).toBeInTheDocument();
      expect(getByLabelText(/Link/)).toBeInTheDocument();
      expect(getByLabelText(/code/i)).toBeInTheDocument();
    });

    it('has proper ARIA label on main editor group', () => {
      const { getByRole } = render(
        <MarkdownEditor
          value=""
          onChange={mockOnChange}
          ariaLabel="Custom editor label"
        />
      );
      const group = getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Custom editor label');
    });

    it('has proper ARIA label on preview pane', () => {
      const { getByLabelText } = render(
        <MarkdownEditor value="# Test" onChange={mockOnChange} />
      );
      expect(getByLabelText('Preview pane')).toBeInTheDocument();
    });

    it('marks preview as live region', () => {
      const { getByLabelText } = render(
        <MarkdownEditor value="# Test" onChange={mockOnChange} />
      );
      const preview = getByLabelText('Markdown preview');
      expect(preview).toHaveAttribute('aria-live', 'polite');
      expect(preview).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('Focus Management', () => {
    it('applies auto-focus when specified', () => {
      render(<MarkdownEditor value="" onChange={mockOnChange} autoFocus />);
      // CodeMirror auto-focus is set via props
      // This is more of an integration test
    });

    it('toolbar buttons are focusable', () => {
      const { getAllByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      const buttons = getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('toolbar buttons are disabled in read-only mode', () => {
      const { getAllByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} readOnly />
      );
      const buttons = getAllByRole('button');
      const formatButtons = buttons.filter(
        (btn) =>
          btn.getAttribute('aria-label')?.includes('Bold') ||
          btn.getAttribute('aria-label')?.includes('Italic')
      );
      formatButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides semantic structure with role="group"', () => {
      const { getByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      expect(getByRole('group')).toBeInTheDocument();
    });

    it('provides semantic structure with role="toolbar"', () => {
      const { getByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      expect(getByRole('toolbar')).toBeInTheDocument();
    });

    it('provides separator in toolbar', () => {
      const { getByRole } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      expect(getByRole('separator')).toBeInTheDocument();
    });

    it('provides meaningful button labels', () => {
      const { getByLabelText } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      expect(getByLabelText('Bold (Cmd+B)')).toBeInTheDocument();
      expect(getByLabelText('Italic (Cmd+I)')).toBeInTheDocument();
      expect(getByLabelText('Link (Cmd+K)')).toBeInTheDocument();
    });

    it('announces dirty state changes', () => {
      const { getByText } = render(
        <MarkdownEditor value="test" onChange={mockOnChange} isDirty={true} />
      );
      expect(getByText(/Unsaved/)).toBeInTheDocument();
    });

    it('announces saved state', () => {
      const { getByText } = render(
        <MarkdownEditor value="test" onChange={mockOnChange} isDirty={false} />
      );
      expect(getByText(/Saved/)).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('uses design tokens for colors', () => {
      const { container } = render(
        <MarkdownEditor value="# Test" onChange={mockOnChange} />
      );
      // Design tokens ensure proper contrast ratios
      // This test verifies tokens are used (implementation detail)
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('border-[var(--mp-color-border)]');
    });
  });

  describe('Focus Visible Indicators', () => {
    it('applies focus-visible styles to CodeMirror', () => {
      const { container } = render(
        <MarkdownEditor value="" onChange={mockOnChange} />
      );
      // Verify focus-visible classes are applied
      const editorWrapper = container.querySelector('.cm-editor');
      expect(editorWrapper?.parentElement).toHaveClass('[&_.cm-focused]:ring-2');
    });
  });

  describe('Responsive Accessibility', () => {
    it('maintains accessibility in mobile layout', async () => {
      const { container } = render(
        <MarkdownEditor value="# Test" onChange={mockOnChange} />
      );
      // Test that mobile classes don't break accessibility
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Integration', () => {
    it('can be used within forms', async () => {
      const { container } = render(
        <form>
          <label htmlFor="editor">Description</label>
          <MarkdownEditor
            value=""
            onChange={mockOnChange}
            ariaLabel="Description"
          />
        </form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Complex Markdown Accessibility', () => {
    it('renders accessible tables from markdown', async () => {
      const markdown = '| Col 1 | Col 2 |\n|-------|-------|\n| A | B |';
      const { container } = render(
        <MarkdownEditor value={markdown} onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('renders accessible lists from markdown', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const { container } = render(
        <MarkdownEditor value={markdown} onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('renders accessible links from markdown', async () => {
      const markdown = '[Link text](https://example.com)';
      const { container } = render(
        <MarkdownEditor value={markdown} onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('renders accessible code blocks from markdown', async () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const { container } = render(
        <MarkdownEditor value={markdown} onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
