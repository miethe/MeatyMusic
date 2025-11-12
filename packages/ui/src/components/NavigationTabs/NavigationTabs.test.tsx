import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Home, Search, Settings } from 'lucide-react';
import { NavigationTabs } from './NavigationTabs';
import type { NavigationItem } from './NavigationTabs';

const mockItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

describe('NavigationTabs', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('renders all navigation items', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('sets the correct active tab based on currentPath', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/search"
        onNavigate={mockOnNavigate}
      />
    );

    const searchTab = screen.getByRole('tab', { name: /search/i });
    expect(searchTab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles nested paths correctly', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/settings/profile"
        onNavigate={mockOnNavigate}
      />
    );

    const settingsTab = screen.getByRole('tab', { name: /settings/i });
    expect(settingsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onNavigate when a tab is clicked', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const searchTab = screen.getByRole('tab', { name: /search/i });
    fireEvent.click(searchTab);

    expect(mockOnNavigate).toHaveBeenCalledWith({
      label: 'Search',
      href: '/search',
      icon: Search,
    });
  });

  it('handles keyboard navigation with Enter key', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const searchTab = screen.getByRole('tab', { name: /search/i });
    fireEvent.keyDown(searchTab, { key: 'Enter' });

    expect(mockOnNavigate).toHaveBeenCalledWith({
      label: 'Search',
      href: '/search',
      icon: Search,
    });
  });

  it('handles keyboard navigation with Space key', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const settingsTab = screen.getByRole('tab', { name: /settings/i });
    fireEvent.keyDown(settingsTab, { key: ' ' });

    expect(mockOnNavigate).toHaveBeenCalledWith({
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    });
  });

  it('does not call onNavigate for disabled tabs', () => {
    const itemsWithDisabled: NavigationItem[] = [
      ...mockItems,
      {
        label: 'Disabled',
        href: '/disabled',
        disabled: true,
      },
    ];

    render(
      <NavigationTabs
        items={itemsWithDisabled}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const disabledTab = screen.getByRole('tab', { name: /disabled/i });
    fireEvent.click(disabledTab);
    fireEvent.keyDown(disabledTab, { key: 'Enter' });

    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  it('renders without icons when not provided', () => {
    const itemsWithoutIcons: NavigationItem[] = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ];

    render(
      <NavigationTabs
        items={itemsWithoutIcons}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        size="sm"
        onNavigate={mockOnNavigate}
      />
    );

    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveClass('h-8'); // Small size variant
  });

  it('applies custom className', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        className="custom-class"
        onNavigate={mockOnNavigate}
      />
    );

    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveClass('custom-class');
  });

  it('has proper ARIA attributes', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', 'Navigation tabs');

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-controls', `panel-${mockItems[index].href}`);
      expect(tab).toHaveAttribute('id', `tab-${mockItems[index].href}`);
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <NavigationTabs
        items={mockItems}
        currentPath="/"
        onNavigate={mockOnNavigate}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('defaults to first item when currentPath does not match any item', () => {
    render(
      <NavigationTabs
        items={mockItems}
        currentPath="/nonexistent"
        onNavigate={mockOnNavigate}
      />
    );

    const homeTab = screen.getByRole('tab', { name: /home/i });
    expect(homeTab).toHaveAttribute('aria-selected', 'true');
  });
});
