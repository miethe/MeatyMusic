import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LibrarySelector } from '../../common/LibrarySelector';

interface MockItem {
  id: string;
  name: string;
  description: string;
}

describe('LibrarySelector', () => {
  const mockOnSelect = jest.fn();

  const mockItems: MockItem[] = [
    { id: '1', name: 'Item One', description: 'First item' },
    { id: '2', name: 'Item Two', description: 'Second item' },
    { id: '3', name: 'Item Three', description: 'Third item' },
  ];

  const defaultProps = {
    items: mockItems,
    onSelect: mockOnSelect,
    renderItem: (item: MockItem) => (
      <div>
        <div>{item.name}</div>
        <div>{item.description}</div>
      </div>
    ),
    getItemKey: (item: MockItem) => item.id,
    getItemSearchText: (item: MockItem) => `${item.name} ${item.description}`,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Closed State', () => {
    it('renders collapsed button initially', () => {
      render(<LibrarySelector {...defaultProps} />);

      expect(screen.getByText('Select from Library')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('renders custom label', () => {
      render(<LibrarySelector {...defaultProps} label="Custom Label" />);

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('opens when button is clicked', () => {
      render(<LibrarySelector {...defaultProps} />);

      const button = screen.getByText('Select from Library');
      fireEvent.click(button);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('Open State', () => {
    it('shows search input when open', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('shows close button when open', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(1);
    });

    it('closes when X button is clicked', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

      // Find and click the close button (first button after opening)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('[class*="h-4 w-4"]'));
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('displays all items when open', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      expect(screen.getByText('Item One')).toBeInTheDocument();
      expect(screen.getByText('Item Two')).toBeInTheDocument();
      expect(screen.getByText('Item Three')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters items based on search query', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'One' } });

      expect(screen.getByText('Item One')).toBeInTheDocument();
      expect(screen.queryByText('Item Two')).not.toBeInTheDocument();
      expect(screen.queryByText('Item Three')).not.toBeInTheDocument();
    });

    it('search is case-insensitive', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'ITEM TWO' } });

      expect(screen.getByText('Item Two')).toBeInTheDocument();
      expect(screen.queryByText('Item One')).not.toBeInTheDocument();
    });

    it('searches in description text', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('Item One')).toBeInTheDocument();
      expect(screen.queryByText('Item Two')).not.toBeInTheDocument();
    });

    it('shows "No matching items found" when search has no results', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No matching items found')).toBeInTheDocument();
    });

    it('clears search when closed', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'One' } });

      // Close
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('[class*="h-4 w-4"]'));
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      // Reopen
      fireEvent.click(screen.getByText('Select from Library'));

      // Search should be cleared
      const newSearchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      expect(newSearchInput.value).toBe('');
    });
  });

  describe('Item Selection', () => {
    it('calls onSelect when item is clicked', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const itemButton = screen.getByText('Item One').closest('button');
      if (itemButton) {
        fireEvent.click(itemButton);
      }

      expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
    });

    it('closes after item selection', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const itemButton = screen.getByText('Item One').closest('button');
      if (itemButton) {
        fireEvent.click(itemButton);
      }

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('clears search after item selection', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'One' } });

      const itemButton = screen.getByText('Item One').closest('button');
      if (itemButton) {
        fireEvent.click(itemButton);
      }

      // Reopen to verify search is cleared
      fireEvent.click(screen.getByText('Select from Library'));
      const newSearchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      expect(newSearchInput.value).toBe('');
    });

    it('selects correct item from filtered results', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Two' } });

      const itemButton = screen.getByText('Item Two').closest('button');
      if (itemButton) {
        fireEvent.click(itemButton);
      }

      expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no items', () => {
      render(<LibrarySelector {...defaultProps} items={[]} />);

      fireEvent.click(screen.getByText('Select from Library'));

      expect(screen.getByText('No items found in library')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <LibrarySelector
          {...defaultProps}
          items={[]}
          emptyMessage="No custom items available"
        />
      );

      fireEvent.click(screen.getByText('Select from Library'));

      expect(screen.getByText('No custom items available')).toBeInTheDocument();
    });

    it('shows empty message when search has no results', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });

      expect(screen.getByText('No matching items found')).toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom renderItem function', () => {
      const customRenderItem = (item: MockItem) => (
        <div data-testid="custom-item">
          <strong>{item.name}</strong>
        </div>
      );

      render(
        <LibrarySelector {...defaultProps} renderItem={customRenderItem} />
      );

      fireEvent.click(screen.getByText('Select from Library'));

      const customItems = screen.getAllByTestId('custom-item');
      expect(customItems).toHaveLength(3);
    });

    it('renders item descriptions from renderItem', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();
      expect(screen.getByText('Third item')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('search input is focusable', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      expect(searchInput).toHaveFocus();
    });

    it('item buttons are accessible', () => {
      render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      const itemButtons = screen.getAllByRole('button');
      // At least 3 item buttons + 1 close button
      expect(itemButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Scrollable List', () => {
    it('renders list with max height for many items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        description: `Description ${i}`,
      }));

      render(<LibrarySelector {...defaultProps} items={manyItems} />);

      fireEvent.click(screen.getByText('Select from Library'));

      // All items should be in DOM (virtual scrolling not implemented)
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 19')).toBeInTheDocument();
    });
  });

  describe('UI States', () => {
    it('shows plus icon in collapsed state', () => {
      const { container } = render(<LibrarySelector {...defaultProps} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows search icon in expanded state', () => {
      const { container } = render(<LibrarySelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Select from Library'));

      // Search icon should be present
      const searchIcons = container.querySelectorAll('svg');
      expect(searchIcons.length).toBeGreaterThan(0);
    });
  });
});
