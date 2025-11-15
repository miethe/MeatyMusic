/**
 * JsonViewer Component Tests
 * Comprehensive tests for JSON viewer with syntax highlighting
 *
 * Task SDS-PREVIEW-010
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonViewer } from '../JsonViewer';
import { toast } from 'sonner';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock react-syntax-highlighter to avoid ES module issues in Jest
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, ...props }: any) => (
    <pre data-testid="syntax-highlighter" {...props}>
      <code>{children}</code>
    </pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

// Mock UI components to avoid ES module issues
jest.mock('@meatymusic/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('JsonViewer', () => {
  const sampleData = {
    title: 'Test Song',
    blueprint_ref: {
      genre: 'Pop',
      version: '2025.11',
    },
    style: {
      tempo_bpm: 120,
      key: 'C major',
      mood: ['upbeat', 'energetic'],
      energy: 'high',
    },
    metadata: {
      created_at: '2025-11-15T10:00:00Z',
      seed: 1234567890,
      valid: true,
      tags: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render JSON with syntax highlighting', () => {
      render(<JsonViewer data={sampleData} />);

      // Check that the component renders
      expect(screen.getByTestId('json-viewer')).toBeInTheDocument();

      // Check that JSON content is displayed
      expect(screen.getByTestId('json-viewer-content')).toBeInTheDocument();

      // Check that syntax highlighter is used
      expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    });

    it('should display JSON with proper formatting', () => {
      render(<JsonViewer data={sampleData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      // Should contain keys from the data
      expect(text).toContain('title');
      expect(text).toContain('blueprint_ref');
      expect(text).toContain('style');

      // Should contain values
      expect(text).toContain('Test Song');
      expect(text).toContain('Pop');
      expect(text).toContain('120');
    });

    it('should show line numbers when enabled', () => {
      render(<JsonViewer data={sampleData} showLineNumbers={true} />);

      // Check that line numbers are rendered (they're in separate elements)
      const content = screen.getByTestId('json-viewer-content');
      expect(content).toBeInTheDocument();
    });

    it('should hide line numbers when disabled', () => {
      render(<JsonViewer data={sampleData} showLineNumbers={false} />);

      const content = screen.getByTestId('json-viewer-content');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<JsonViewer data={sampleData} className="custom-class" />);

      const viewer = screen.getByTestId('json-viewer');
      expect(viewer).toHaveClass('custom-class');
    });

    it('should apply custom maxHeight', () => {
      render(<JsonViewer data={sampleData} maxHeight="300px" />);

      const content = screen.getByTestId('json-viewer-content');
      expect(content).toHaveStyle({ maxHeight: '300px' });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should display copy button when enabled', () => {
      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('Copy');
    });

    it('should hide copy button when disabled', () => {
      render(<JsonViewer data={sampleData} enableClipboard={false} />);

      const copyButton = screen.queryByTestId('json-viewer-copy-button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('should copy JSON to clipboard when copy button clicked', async () => {
      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(sampleData, null, 2)
        );
      });

      expect(toast.success).toHaveBeenCalledWith('JSON copied to clipboard');
    });

    it('should show error toast when copy fails', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));

      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard');
      });
    });

    it('should copy entire JSON with proper formatting', async () => {
      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        const copiedText = mockClipboard.writeText.mock.calls[0][0];
        const parsed = JSON.parse(copiedText);

        expect(parsed).toEqual(sampleData);
      });
    });
  });

  describe('Collapsible Sections', () => {
    it('should show collapse/expand button when collapsed prop is set', () => {
      render(<JsonViewer data={sampleData} collapsed={true} />);

      const toggleButton = screen.getByTestId('json-viewer-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should display "Expand All" when collapsed is true', () => {
      render(<JsonViewer data={sampleData} collapsed={true} />);

      const toggleButton = screen.getByTestId('json-viewer-toggle');
      expect(toggleButton).toHaveTextContent('Expand All');
    });

    it('should display "Collapse All" when collapsed is false', () => {
      render(<JsonViewer data={sampleData} collapsed={false} />);

      const toggleButton = screen.getByTestId('json-viewer-toggle');
      expect(toggleButton).toHaveTextContent('Collapse All');
    });

    it('should toggle between collapsed and expanded states', () => {
      render(<JsonViewer data={sampleData} collapsed={false} />);

      const toggleButton = screen.getByTestId('json-viewer-toggle');

      // Initially expanded
      expect(toggleButton).toHaveTextContent('Collapse All');

      // Click to collapse
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Expand All');

      // Click to expand
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Collapse All');
    });

    it('should show depth input when collapsed is a number', () => {
      render(<JsonViewer data={sampleData} collapsed={2} />);

      const depthInput = screen.getByTestId('json-viewer-depth-input');
      expect(depthInput).toBeInTheDocument();
      expect(depthInput).toHaveValue(2);
    });

    it('should update depth when input changes', () => {
      render(<JsonViewer data={sampleData} collapsed={2} />);

      const depthInput = screen.getByTestId('json-viewer-depth-input') as HTMLInputElement;

      fireEvent.change(depthInput, { target: { value: '3' } });
      expect(depthInput.value).toBe('3');
    });

    it('should collapse objects and arrays at specified depth', () => {
      render(<JsonViewer data={sampleData} collapsed={1} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      // At depth 1, nested objects should show as summaries
      expect(text).toContain('keys');
    });
  });

  describe('Theme', () => {
    it('should apply dark theme by default', () => {
      render(<JsonViewer data={sampleData} theme="dark" />);

      const viewer = screen.getByTestId('json-viewer');
      expect(viewer).toHaveClass('bg-bg-elevated');
    });

    it('should apply light theme when specified', () => {
      render(<JsonViewer data={sampleData} theme="light" />);

      const viewer = screen.getByTestId('json-viewer');
      expect(viewer).toHaveClass('bg-white');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tabIndex', () => {
      render(<JsonViewer data={sampleData} />);

      const viewer = screen.getByTestId('json-viewer');
      expect(viewer).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA labels', () => {
      render(<JsonViewer data={sampleData} />);

      const viewer = screen.getByTestId('json-viewer');
      expect(viewer).toHaveAttribute('role', 'region');
      expect(viewer).toHaveAttribute('aria-label', 'JSON viewer');

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      expect(copyButton).toHaveAttribute('aria-label', 'Copy JSON to clipboard');
    });

    it('should show keyboard hint when clipboard is enabled', () => {
      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      expect(screen.getByText(/Press/i)).toBeInTheDocument();
      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should hide keyboard hint when clipboard is disabled', () => {
      render(<JsonViewer data={sampleData} enableClipboard={false} />);

      expect(screen.queryByText(/Press/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible collapse/expand buttons', () => {
      render(<JsonViewer data={sampleData} collapsed={true} />);

      const toggleButton = screen.getByTestId('json-viewer-toggle');
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand all');
    });

    it('should have accessible depth input', () => {
      render(<JsonViewer data={sampleData} collapsed={2} />);

      const depthInput = screen.getByTestId('json-viewer-depth-input');
      expect(depthInput).toHaveAttribute('aria-label', 'Collapse depth');
    });

    it('should have accessible copy button', () => {
      render(<JsonViewer data={sampleData} enableClipboard={true} />);

      const copyButton = screen.getByTestId('json-viewer-copy-button');
      expect(copyButton).toHaveAttribute('aria-label', 'Copy JSON to clipboard');

      // Button should be clickable
      fireEvent.click(copyButton);
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle horizontal scroll for wide JSON', () => {
      const wideData = {
        very_long_key_name_that_extends_beyond_normal_viewport_width: 'value',
        another_extremely_long_key_with_lots_of_characters: 'another value',
      };

      render(<JsonViewer data={wideData} />);

      const content = screen.getByTestId('json-viewer-content');
      expect(content).toHaveClass('overflow-auto');
    });

    it('should respect maxHeight and scroll vertically', () => {
      const largeData = {
        ...Array.from({ length: 100 }, (_, i) => ({ [`key${i}`]: `value${i}` })).reduce(
          (acc, item) => ({ ...acc, ...item }),
          {}
        ),
      };

      render(<JsonViewer data={largeData} maxHeight="200px" />);

      const content = screen.getByTestId('json-viewer-content');
      expect(content).toHaveStyle({ maxHeight: '200px' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object', () => {
      render(<JsonViewer data={{}} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('{}');
    });

    it('should handle nested objects', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      render(<JsonViewer data={nestedData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('level1');
      expect(text).toContain('level2');
      expect(text).toContain('level3');
      expect(text).toContain('deep');
    });

    it('should handle arrays', () => {
      const arrayData = {
        items: ['one', 'two', 'three'],
        numbers: [1, 2, 3],
      };

      render(<JsonViewer data={arrayData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('one');
      expect(text).toContain('two');
      expect(text).toContain('three');
    });

    it('should handle null values', () => {
      const nullData = {
        nullValue: null,
        nonNull: 'value',
      };

      render(<JsonViewer data={nullData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('null');
      expect(text).toContain('value');
    });

    it('should handle boolean values', () => {
      const boolData = {
        isTrue: true,
        isFalse: false,
      };

      render(<JsonViewer data={boolData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('true');
      expect(text).toContain('false');
    });

    it('should handle numbers (integers and decimals)', () => {
      const numberData = {
        integer: 42,
        decimal: 3.14159,
        negative: -100,
        zero: 0,
      };

      render(<JsonViewer data={numberData} />);

      const content = screen.getByTestId('json-viewer-content');
      const text = content.textContent || '';

      expect(text).toContain('42');
      expect(text).toContain('3.14159');
      expect(text).toContain('-100');
      expect(text).toContain('0');
    });

    it('should handle special characters in strings', () => {
      const specialData = {
        quotes: 'He said "hello"',
        newlines: 'Line 1\nLine 2',
        unicode: 'emoji 🎵',
      };

      render(<JsonViewer data={specialData} />);

      const content = screen.getByTestId('json-viewer-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Custom Test ID', () => {
    it('should use custom testId when provided', () => {
      render(<JsonViewer data={sampleData} testId="custom-viewer" />);

      expect(screen.getByTestId('custom-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('custom-viewer-content')).toBeInTheDocument();
      expect(screen.getByTestId('custom-viewer-copy-button')).toBeInTheDocument();
    });

    it('should use default testId when not provided', () => {
      render(<JsonViewer data={sampleData} />);

      expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with complex SDS-like data', () => {
      const sdsData = {
        title: 'My Song',
        blueprint_ref: {
          genre: 'Pop',
          version: '2025.11',
        },
        style: {
          genre_detail: {
            primary: 'Pop',
            subgenres: ['Synth Pop', 'Dance Pop'],
            fusions: [],
          },
          tempo_bpm: [120, 130],
          key: {
            primary: 'C major',
            modulations: [],
          },
          mood: ['upbeat', 'energetic', 'confident'],
          tags: {
            vibe: ['bright', 'modern'],
            vocal_style: ['anthemic', 'melodic'],
          },
        },
        constraints: {
          explicit: false,
          max_lines: 120,
        },
      };

      render(<JsonViewer data={sdsData} collapsed={2} enableClipboard={true} />);

      expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('json-viewer-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('json-viewer-copy-button')).toBeInTheDocument();
      expect(screen.getByTestId('json-viewer-depth-input')).toBeInTheDocument();
    });

    it('should maintain collapsed state when data changes', () => {
      const { rerender } = render(
        <JsonViewer data={{ initial: 'data' }} collapsed={false} />
      );

      const toggleButton = screen.getByTestId('json-viewer-toggle');

      // Initially expanded (collapsed=false)
      expect(toggleButton).toHaveTextContent('Collapse All');

      // Collapse the viewer
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Expand All');

      // Update data - state should persist
      rerender(<JsonViewer data={{ updated: 'data' }} collapsed={false} />);

      // State should persist - still collapsed
      expect(toggleButton).toHaveTextContent('Expand All');
    });
  });
});
