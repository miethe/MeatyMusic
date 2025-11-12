import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';

expect.extend(toHaveNoViolations);

describe('DropdownMenu', () => {
  const renderDropdownMenu = () =>
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  it('renders the trigger button', () => {
    renderDropdownMenu();
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
  });

  it('opens menu when trigger is clicked', () => {
    renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.click(trigger);

    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('closes menu when escape key is pressed', () => {
    renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.click(trigger);
    expect(screen.getByText('Profile')).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('applies destructive styling to destructive items', () => {
    renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.click(trigger);
    const destructiveItem = screen.getByText('Sign Out');

    expect(destructiveItem).toHaveClass('text-danger');
  });

  it('handles keyboard navigation', () => {
    renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByText('Profile')).toBeInTheDocument();

    // Test arrow key navigation
    fireEvent.keyDown(screen.getByText('Profile'), { key: 'ArrowDown' });
    expect(screen.getByText('Settings')).toHaveFocus();
  });

  it('should not have accessibility violations', async () => {
    const { container } = renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.click(trigger);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports custom className on menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-class">
            Custom Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    const customItem = screen.getByText('Custom Item');
    expect(customItem).toHaveClass('custom-class');
  });

  it('renders menu separators correctly', () => {
    renderDropdownMenu();
    const trigger = screen.getByText('Open Menu');

    fireEvent.click(trigger);

    // Check that separators are rendered (they have the separator role)
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
  });

  it('applies inset styling when specified', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    const insetItem = screen.getByText('Inset Item');
    expect(insetItem).toHaveClass('pl-8');
  });
});
