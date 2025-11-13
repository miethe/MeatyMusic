import { applyThemeColors, clearThemeColors } from '../utils';
import { ThemeColors } from '../types';

// Mock DOM
const mockSetProperty = jest.fn();
const mockRemoveProperty = jest.fn();

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
      removeProperty: mockRemoveProperty,
    },
  },
  writable: true,
});

describe('Theme Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyThemeColors', () => {
    const mockColors: ThemeColors = {
      bg: '220 14% 96%',
      surface: '0 0% 100%',
      panel: '220 13% 91%',
      border: '220 13% 86%',
      ring: '261 83% 58%',
      textStrong: '222 84% 8%',
      textBase: '222 23% 23%',
      textMuted: '220 9% 46%',
      primary: '253 61% 58%',
      primaryForeground: '0 0% 100%',
      secondary: '174 80% 35%',
      accent: '43 96% 56%',
      success: '142 69% 40%',
      warning: '32 91% 50%',
      danger: '2 92% 57%',
      info: '208 100% 50%',
    };

    it('applies all color properties to CSS custom properties', () => {
      applyThemeColors(mockColors);

      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-bg', '220 14% 96%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-surface', '0 0% 100%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-panel', '220 13% 91%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-border', '220 13% 86%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-ring', '261 83% 58%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-text-strong', '222 84% 8%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-text-base', '222 23% 23%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-text-muted', '220 9% 46%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-primary', '253 61% 58%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-primary-foreground', '0 0% 100%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-secondary', '174 80% 35%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-accent', '43 96% 56%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-success', '142 69% 40%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-warning', '32 91% 50%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-danger', '2 92% 57%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-info', '208 100% 50%');
    });

    it('converts hex colors to HSL format', () => {
      const hexColors: ThemeColors = {
        ...mockColors,
        bg: '#FBFCFE',
        primary: '#6E56CF',
        danger: '#E5484D',
      };

      applyThemeColors(hexColors);

      // Check that hex colors were converted to HSL
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-bg', expect.stringMatching(/^\d+ \d+% \d+%$/));
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-primary', expect.stringMatching(/^\d+ \d+% \d+%$/));
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-danger', expect.stringMatching(/^\d+ \d+% \d+%$/));
    });

    it('handles colors that are already in HSL format', () => {
      applyThemeColors(mockColors);

      // HSL colors should be passed through unchanged
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-bg', '220 14% 96%');
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-primary', '253 61% 58%');
    });

    it('does nothing in server environment', () => {
      // Mock server environment
      const originalWindow = global.window;
      const originalDocument = global.document;
      delete (global as any).window;
      delete (global as any).document;

      applyThemeColors(mockColors);

      expect(mockSetProperty).not.toHaveBeenCalled();

      // Restore window and document
      global.window = originalWindow;
      global.document = originalDocument;
    });
  });

  describe('clearThemeColors', () => {
    it('removes all theme CSS custom properties', () => {
      clearThemeColors();

      const expectedProperties = [
        '--mp-color-bg',
        '--mp-color-surface',
        '--mp-color-panel',
        '--mp-color-border',
        '--mp-color-ring',
        '--mp-color-text-strong',
        '--mp-color-text-base',
        '--mp-color-text-muted',
        '--mp-color-primary',
        '--mp-color-primary-foreground',
        '--mp-color-secondary',
        '--mp-color-accent',
        '--mp-color-success',
        '--mp-color-warning',
        '--mp-color-danger',
        '--mp-color-info',
      ];

      expectedProperties.forEach(property => {
        expect(mockRemoveProperty).toHaveBeenCalledWith(property);
      });
    });

    it('does nothing in server environment', () => {
      // Mock server environment
      const originalWindow = global.window;
      const originalDocument = global.document;
      delete (global as any).window;
      delete (global as any).document;

      clearThemeColors();

      expect(mockRemoveProperty).not.toHaveBeenCalled();

      // Restore window and document
      global.window = originalWindow;
      global.document = originalDocument;
    });
  });

  describe('Hex to HSL conversion', () => {
    it('correctly converts common hex colors', () => {
      const testCases = [
        { hex: '#FFFFFF', expectedHsl: '0 0% 100%' },
        { hex: '#000000', expectedHsl: '0 0% 0%' },
        { hex: '#FF0000', expectedHsl: '0 100% 50%' },
        { hex: '#00FF00', expectedHsl: '120 100% 50%' },
        { hex: '#0000FF', expectedHsl: '240 100% 50%' },
      ];

      testCases.forEach(({ hex, expectedHsl }) => {
        const colors: ThemeColors = {
          bg: hex,
          surface: '0 0% 100%',
          panel: '220 13% 91%',
          border: '220 13% 86%',
          ring: '261 83% 58%',
          textStrong: '222 84% 8%',
          textBase: '222 23% 23%',
          textMuted: '220 9% 46%',
          primary: '253 61% 58%',
          primaryForeground: '0 0% 100%',
          secondary: '174 80% 35%',
          accent: '43 96% 56%',
          success: '142 69% 40%',
          warning: '32 91% 50%',
          danger: '2 92% 57%',
          info: '208 100% 50%',
        };

        mockSetProperty.mockClear();
        applyThemeColors(colors);

        expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-bg', expectedHsl);
      });
    });

    it('handles 3-digit hex colors', () => {
      const colors: ThemeColors = {
        bg: '#FFF',
        surface: '0 0% 100%',
        panel: '220 13% 91%',
        border: '220 13% 86%',
        ring: '261 83% 58%',
        textStrong: '222 84% 8%',
        textBase: '222 23% 23%',
        textMuted: '220 9% 46%',
        primary: '253 61% 58%',
        primaryForeground: '0 0% 100%',
        secondary: '174 80% 35%',
        accent: '43 96% 56%',
        success: '142 69% 40%',
        warning: '32 91% 50%',
        danger: '2 92% 57%',
        info: '208 100% 50%',
      };

      applyThemeColors(colors);

      // #FFF should be treated as #FFFFFF
      expect(mockSetProperty).toHaveBeenCalledWith('--mp-color-bg', expect.stringMatching(/^\d+ \d+% \d+%$/));
    });
  });
});
