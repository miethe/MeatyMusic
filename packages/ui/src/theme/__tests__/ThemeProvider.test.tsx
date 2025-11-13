import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { themeStorage } from '../storage';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component that uses the theme
function ThemeConsumer() {
  const { currentTheme, availableThemes, setTheme, resetTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{currentTheme.name}</div>
      <div data-testid="theme-count">{availableThemes.length}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('ocean')} data-testid="set-ocean">
        Set Ocean
      </button>
      <button onClick={resetTheme} data-testid="reset">
        Reset
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Mock CSS custom property setting
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: jest.fn(),
      writable: true,
    });

    Object.defineProperty(document.documentElement.style, 'removeProperty', {
      value: jest.fn(),
      writable: true,
    });
  });

  it('provides default theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('theme-count')).toHaveTextContent('4'); // light, dark, ocean, sand
  });

  it('loads saved theme from storage', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'meaty-theme') return 'dark';
      if (key === 'meaty-custom-themes') return '[]';
      return null;
    });

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('can switch themes', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    await act(async () => {
      fireEvent.click(screen.getByTestId('set-dark'));
    });

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('meaty-theme', 'dark');
  });

  it('applies CSS custom properties when theme changes', async () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('set-dark'));
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--mp-color-bg', '222 47% 8%');
    expect(setPropertySpy).toHaveBeenCalledWith('--mp-color-surface', '222 47% 11%');
    expect(setPropertySpy).toHaveBeenCalledWith('--mp-color-primary', '253 91% 77%');
  });

  it('can switch to ocean theme', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('set-ocean'));
    });

    expect(screen.getByTestId('current-theme')).toHaveTextContent('ocean');
  });

  it('resets theme correctly', async () => {
    const removePropertySpy = jest.spyOn(document.documentElement.style, 'removeProperty');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // First set a theme
    await act(async () => {
      fireEvent.click(screen.getByTestId('set-dark'));
    });

    // Then reset
    await act(async () => {
      fireEvent.click(screen.getByTestId('reset'));
    });

    expect(removePropertySpy).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('meaty-theme');
  });

  it('handles invalid theme names gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    function TestComponent() {
      const { setTheme } = useTheme();
      return (
        <button onClick={() => setTheme('invalid-theme')} data-testid="invalid">
          Set Invalid
        </button>
      );
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('invalid'));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Theme "invalid-theme" not found');
    consoleSpy.mockRestore();
  });

  it('respects system preference when enabled', () => {
    // Mock dark mode preference
    (window.matchMedia as jest.Mock).mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider enableSystem>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('uses default theme when system is disabled', () => {
    // Mock dark mode preference
    (window.matchMedia as jest.Mock).mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider enableSystem={false}>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<ThemeConsumer />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('supports custom default theme', () => {
    render(
      <ThemeProvider defaultTheme="sand">
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('sand');
  });

  describe('Analytics integration', () => {
    it('tracks theme switches when analytics available', async () => {
      const mockAnalytics = {
        track: jest.fn(),
      };

      (window as any).analytics = mockAnalytics;

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-dark'));
      });

      expect(mockAnalytics.track).toHaveBeenCalledWith('theme_switched', {
        previous_theme: 'light',
        new_theme: 'dark',
        source: 'manual',
      });

      delete (window as any).analytics;
    });
  });
});
