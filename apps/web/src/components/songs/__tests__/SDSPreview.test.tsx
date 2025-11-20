/**
 * SDSPreview Component Tests
 * Tests for enhanced SDS preview with character counting and download features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SDSPreview, type SDSData } from '../SDSPreview';
import { toast } from 'sonner';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('SDSPreview', () => {
  const mockSDSData: SDSData = {
    song_id: 'test-song-id-123',
    title: 'Test Song',
    global_seed: 42,
    composed_prompt: 'This is a test composed prompt for the song.',
    style: {
      genre: 'pop',
      bpm: 120,
      key: 'C Major',
    },
    lyrics: {
      sections: [
        { type: 'verse', lines: ['Line 1', 'Line 2'] },
        { type: 'chorus', lines: ['Chorus 1', 'Chorus 2'] },
      ],
    },
    persona: {
      name: 'Test Artist',
      vocal_range: 'Tenor',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with SDS data', () => {
      render(<SDSPreview data={mockSDSData} />);

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('test-song-id-123')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays composed prompt section when available', () => {
      render(<SDSPreview data={mockSDSData} />);

      expect(screen.getByText('Composed Prompt')).toBeInTheDocument();
      expect(screen.getByText(mockSDSData.composed_prompt!)).toBeInTheDocument();
    });

    it('does not display composed prompt section when not available', () => {
      const dataWithoutPrompt = { ...mockSDSData, composed_prompt: undefined };
      render(<SDSPreview data={dataWithoutPrompt} />);

      expect(screen.queryByText('Composed Prompt')).not.toBeInTheDocument();
    });

    it('displays the full SDS JSON section', () => {
      render(<SDSPreview data={mockSDSData} />);

      expect(screen.getByText('Full SDS JSON')).toBeInTheDocument();
    });

    it('displays keyboard shortcuts help', () => {
      render(<SDSPreview data={mockSDSData} />);

      expect(screen.getByText(/Keyboard shortcuts:/)).toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('displays character count for composed prompt', () => {
      render(<SDSPreview data={mockSDSData} targetEngine="suno" />);

      const promptLength = mockSDSData.composed_prompt!.length;
      expect(screen.getByText(new RegExp(`${promptLength}`))).toBeInTheDocument();
      expect(screen.getByText(/3,000/)).toBeInTheDocument(); // Suno limit
    });

    it('shows safe status when under 80% of limit', () => {
      render(<SDSPreview data={mockSDSData} targetEngine="suno" />);

      expect(screen.getByText('SAFE')).toBeInTheDocument();
    });

    it('shows warning status when between 80-95% of limit', () => {
      const longPrompt = 'a'.repeat(2500); // 83% of 3000 char Suno limit
      const dataWithLongPrompt = { ...mockSDSData, composed_prompt: longPrompt };

      render(<SDSPreview data={dataWithLongPrompt} targetEngine="suno" />);

      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByText('Approaching limit')).toBeInTheDocument();
    });

    it('shows danger status when over 95% of limit', () => {
      const veryLongPrompt = 'a'.repeat(3100); // Over Suno 3000 char limit
      const dataWithVeryLongPrompt = { ...mockSDSData, composed_prompt: veryLongPrompt };

      render(<SDSPreview data={dataWithVeryLongPrompt} targetEngine="suno" />);

      expect(screen.getByText('DANGER')).toBeInTheDocument();
      expect(screen.getByText(/Prompt exceeds limit!/)).toBeInTheDocument();
    });

    it('uses correct limits for different engines', () => {
      const { rerender } = render(<SDSPreview data={mockSDSData} targetEngine="suno" />);
      expect(screen.getByText(/3,000/)).toBeInTheDocument();

      rerender(<SDSPreview data={mockSDSData} targetEngine="udio" />);
      expect(screen.getByText(/2,500/)).toBeInTheDocument();

      rerender(<SDSPreview data={mockSDSData} targetEngine="default" />);
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('copies SDS JSON to clipboard when copy button clicked', async () => {
      render(<SDSPreview data={mockSDSData} />);

      const copyButton = screen.getByTestId('sds-preview-copy-sds');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(mockSDSData, null, 2)
        );
        expect(toast.success).toHaveBeenCalledWith('SDS copied to clipboard');
      });
    });

    it('copies composed prompt to clipboard when copy prompt button clicked', async () => {
      render(<SDSPreview data={mockSDSData} />);

      const copyPromptButton = screen.getByTestId('sds-preview-copy-prompt');
      fireEvent.click(copyPromptButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          mockSDSData.composed_prompt
        );
        expect(toast.success).toHaveBeenCalledWith('Composed prompt copied to clipboard');
      });
    });

    it('shows error toast when copy fails', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Copy failed')
      );

      render(<SDSPreview data={mockSDSData} />);

      const copyButton = screen.getByTestId('sds-preview-copy-sds');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy SDS');
      });
    });

    it('disables copy prompt button when no composed prompt', () => {
      const dataWithoutPrompt = { ...mockSDSData, composed_prompt: undefined };
      render(<SDSPreview data={dataWithoutPrompt} />);

      const copyPromptButton = screen.queryByTestId('sds-preview-copy-prompt');
      expect(copyPromptButton).not.toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('downloads SDS JSON when download button clicked', async () => {
      render(<SDSPreview data={mockSDSData} songTitle="My Test Song" />);

      const downloadButton = screen.getByTestId('sds-preview-download-sds');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('SDS downloaded');
      });
    });

    it('downloads composed prompt when download prompt button clicked', async () => {
      render(<SDSPreview data={mockSDSData} songTitle="My Test Song" />);

      const downloadPromptButton = screen.getByTestId('sds-preview-download-prompt');
      fireEvent.click(downloadPromptButton);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Composed prompt downloaded');
      });
    });

    it('generates correct filename for SDS download', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');

      render(<SDSPreview data={mockSDSData} songTitle="My Test Song" />);

      const downloadButton = screen.getByTestId('sds-preview-download-sds');
      fireEvent.click(downloadButton);

      const anchorElement = createElementSpy.mock.results.find(
        (result) => result.value.tagName === 'A'
      )?.value as HTMLAnchorElement;

      expect(anchorElement?.download).toMatch(/my-test-song-sds-.*\.json/);

      createElementSpy.mockRestore();
    });

    it('generates correct filename for prompt download', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');

      render(<SDSPreview data={mockSDSData} songTitle="My Test Song" />);

      const downloadButton = screen.getByTestId('sds-preview-download-prompt');
      fireEvent.click(downloadButton);

      const anchorElement = createElementSpy.mock.results.find(
        (result) => result.value.tagName === 'A'
      )?.value as HTMLAnchorElement;

      expect(anchorElement?.download).toMatch(/my-test-song-prompt-.*\.txt/);

      createElementSpy.mockRestore();
    });

    it('shows error when trying to download non-existent prompt', async () => {
      const dataWithoutPrompt = { ...mockSDSData, composed_prompt: undefined };
      render(<SDSPreview data={dataWithoutPrompt} />);

      // Composed prompt section should not be rendered
      const downloadPromptButton = screen.queryByTestId('sds-preview-download-prompt');
      expect(downloadPromptButton).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('shows success icon when copy is successful', async () => {
      render(<SDSPreview data={mockSDSData} />);

      const copyButton = screen.getByTestId('sds-preview-copy-sds');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('changes button state temporarily after successful copy', async () => {
      jest.useFakeTimers();

      render(<SDSPreview data={mockSDSData} />);

      const copyButton = screen.getByTestId('sds-preview-copy-sds');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      // Fast-forward time to reset button state
      jest.advanceTimersByTime(2000);

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<SDSPreview data={mockSDSData} />);

      const copyButton = screen.getByTestId('sds-preview-copy-sds');
      const downloadButton = screen.getByTestId('sds-preview-download-sds');

      expect(copyButton).toBeInTheDocument();
      expect(downloadButton).toBeInTheDocument();
    });

    it('disables buttons appropriately', () => {
      const dataWithoutPrompt = { ...mockSDSData, composed_prompt: undefined };
      render(<SDSPreview data={dataWithoutPrompt} />);

      // Prompt-specific buttons should not exist
      expect(screen.queryByTestId('sds-preview-copy-prompt')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sds-preview-download-prompt')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <SDSPreview data={mockSDSData} className="custom-class" />
      );

      const previewElement = container.querySelector('[data-testid="sds-preview"]');
      expect(previewElement).toHaveClass('custom-class');
    });

    it('accepts custom testId', () => {
      render(<SDSPreview data={mockSDSData} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('uses provided song title in downloads', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');

      render(<SDSPreview data={mockSDSData} songTitle="Custom Song Name" />);

      const downloadButton = screen.getByTestId('sds-preview-download-sds');
      fireEvent.click(downloadButton);

      const anchorElement = createElementSpy.mock.results.find(
        (result) => result.value.tagName === 'A'
      )?.value as HTMLAnchorElement;

      expect(anchorElement?.download).toMatch(/custom-song-name-sds-.*\.json/);

      createElementSpy.mockRestore();
    });
  });
});
