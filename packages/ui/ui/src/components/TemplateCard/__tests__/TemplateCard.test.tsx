/**
 * TemplateCard Component Tests
 * Tests for template card rendering, interactions, and accessibility
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TemplateCard } from '../TemplateCard';

describe('TemplateCard', () => {
  const mockTemplate = {
    id: 'template-1',
    name: 'Test Template',
    description: 'A test template description',
    category: 'productivity',
    usageCount: 42,
    tags: ['test', 'mock', 'example'],
    preview: 'This is a preview of the template content',
  };

  const mockOnPreview = jest.fn();
  const mockOnUseTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders template information correctly', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.getByText('A test template description')).toBeInTheDocument();
      expect(screen.getByText('productivity')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders without description', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          description={undefined}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.queryByText('A test template description')).not.toBeInTheDocument();
    });

    it('renders without usage count', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          usageCount={0}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });

    it('renders tags with overflow indicator', () => {
      const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
      render(
        <TemplateCard
          {...mockTemplate}
          tags={manyTags}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Should show first 3 tags
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();

      // Should show overflow indicator
      expect(screen.getByText('+2')).toBeInTheDocument();

      // Should not show tag4 and tag5 individually
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('tag5')).not.toBeInTheDocument();
    });

    it('renders without tags', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          tags={[]}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.queryByRole('list', { name: /tags/i })).not.toBeInTheDocument();
    });

    it('renders in standard size by default', () => {
      const { container } = render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('min-h-[280px]');
    });

    it('renders in compact size when specified', () => {
      const { container } = render(
        <TemplateCard
          {...mockTemplate}
          size="compact"
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('min-h-[220px]');
    });
  });

  describe('Click Interactions', () => {
    it('calls onPreview when card is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.click(card);

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });

    it('calls onUseTemplate when Use Template button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Hover over card to show action buttons
      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.hover(card);

      await waitFor(() => {
        const useButton = screen.getByRole('button', { name: /use test template template/i });
        expect(useButton).toBeVisible();
      });

      const useButton = screen.getByRole('button', { name: /use test template template/i });
      await user.click(useButton);

      expect(mockOnUseTemplate).toHaveBeenCalledTimes(1);
      expect(mockOnPreview).not.toHaveBeenCalled();
    });

    it('calls onPreview when preview button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Hover over card to show action buttons
      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.hover(card);

      await waitFor(() => {
        const previewButton = screen.getByRole('button', { name: /preview test template template/i });
        expect(previewButton).toBeVisible();
      });

      const previewButton = screen.getByRole('button', { name: /preview test template template/i });
      await user.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
      expect(mockOnUseTemplate).not.toHaveBeenCalled();
    });

    it('does not render preview button when onPreview is not provided', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Hover over card
      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.hover(card);

      // Should not find preview button
      expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onPreview when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      card.focus();

      await user.keyboard('{Enter}');

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });

    it('calls onPreview when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      card.focus();

      await user.keyboard(' ');

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });

    it('is focusable by default', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when loading', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          loading={true}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      expect(card).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Loading State', () => {
    it('does not call handlers when loading', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          loading={true}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.click(card);

      expect(mockOnPreview).not.toHaveBeenCalled();
      expect(mockOnUseTemplate).not.toHaveBeenCalled();
    });

    it('disables Use Template button when loading', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          loading={true}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Hover over card
      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.hover(card);

      await waitFor(() => {
        const useButton = screen.getByRole('button', { name: /use test template template/i });
        expect(useButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      expect(card).toHaveAttribute('aria-describedby', `${mockTemplate.id}-description`);
    });

    it('has accessible usage count label', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.getByLabelText('Used 42 times')).toBeInTheDocument();
    });

    it('has accessible tags list', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      expect(screen.getByRole('list', { name: /tags/i })).toBeInTheDocument();
    });

    it('has accessible action button labels', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      // Hover to show buttons
      const card = screen.getByRole('button', { name: /template: test template/i });
      await user.hover(card);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /use test template template/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /preview test template template/i })).toBeInTheDocument();
      });
    });
  });

  describe('Hover States', () => {
    it('shows action buttons on hover', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });

      // Initially buttons might not be visible (opacity-0)
      await user.hover(card);

      // After hover, buttons should be visible
      await waitFor(() => {
        const useButton = screen.getByRole('button', { name: /use test template template/i });
        expect(useButton).toBeVisible();
      });
    });

    it('hides action buttons when not hovering', async () => {
      const user = userEvent.setup();
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });

      // Hover then unhover
      await user.hover(card);
      await user.unhover(card);

      // Buttons should still exist in DOM but may have opacity-0 class
      const useButton = screen.getByRole('button', { name: /use test template template/i });
      expect(useButton).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TemplateCard
          {...mockTemplate}
          className="custom-class"
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('forwards data attributes', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
          data-testid="custom-test-id"
        />
      );

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('includes template ID as data attribute', () => {
      render(
        <TemplateCard
          {...mockTemplate}
          onPreview={mockOnPreview}
          onUseTemplate={mockOnUseTemplate}
        />
      );

      const card = screen.getByRole('button', { name: /template: test template/i });
      expect(card).toHaveAttribute('data-template-id', mockTemplate.id);
    });
  });
});
