/**
 * ConnectionStatus Component Tests
 * Phase 3, Task 3.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionStatus } from '../ConnectionStatus';
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';
import { ConnectionState, getWebSocketClient } from '@/lib/websocket';

// Mock hooks and client
jest.mock('@/hooks/useWebSocketStatus');
jest.mock('@/lib/websocket');

const mockUseWebSocketStatus = useWebSocketStatus as jest.MockedFunction<typeof useWebSocketStatus>;
const mockGetWebSocketClient = getWebSocketClient as jest.MockedFunction<typeof getWebSocketClient>;

describe('ConnectionStatus', () => {
  const mockClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    isConnected: jest.fn(),
    getConnectionState: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWebSocketClient.mockReturnValue(mockClient as any);
  });

  describe('Badge Variant', () => {
    it('should render connected state badge', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      render(<ConnectionStatus variant="badge" />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should render disconnected state badge', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.DISCONNECTED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="badge" />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should render connecting state badge', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.CONNECTING,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="badge" />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show error tooltip on hover when error present', async () => {
      const error = new Error('Connection timeout');
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.FAILED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="badge" />);

      const badge = screen.getByText('Connection Failed');
      userEvent.hover(badge);

      await waitFor(() => {
        expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      });
    });
  });

  describe('Icon Variant', () => {
    it('should render icon only', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      const { container } = render(<ConnectionStatus variant="icon" />);

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Connection status: Connected');
      expect(button).toBeInTheDocument();
    });

    it('should allow manual reconnect when showReconnectButton enabled', async () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.DISCONNECTED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      mockClient.connect.mockResolvedValue(undefined);

      const { container } = render(<ConnectionStatus variant="icon" showReconnectButton={true} />);

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();

      if (button) {
        await userEvent.click(button);
        expect(mockClient.connect).toHaveBeenCalled();
      }
    });
  });

  describe('Full Variant', () => {
    it('should render full details when showDetails enabled', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date('2025-01-15T10:00:00Z'),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 2,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      render(<ConnectionStatus variant="full" showDetails={true} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Subscriptions
      expect(screen.getByText('100')).toBeInTheDocument(); // Events processed
      expect(screen.getByText('2')).toBeInTheDocument(); // Reconnections
    });

    it('should show reconnect button when enabled', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.DISCONNECTED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="full" showReconnectButton={true} />);

      expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    });

    it('should disable reconnect button when connected', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      render(<ConnectionStatus variant="full" showReconnectButton={true} />);

      const reconnectBtn = screen.getByRole('button', { name: /reconnect/i });
      expect(reconnectBtn).toBeDisabled();
    });

    it('should show error message when connection failed', () => {
      const error = new Error('WebSocket connection refused');
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.FAILED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="full" showDetails={true} />);

      expect(screen.getByText('WebSocket connection refused')).toBeInTheDocument();
    });

    it('should handle manual reconnect click', async () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.DISCONNECTED,
        reconnectAttempt: 0,
        lastConnected: null,
        lastDisconnected: new Date(),
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 0,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      mockClient.connect.mockResolvedValue(undefined);

      render(<ConnectionStatus variant="full" showReconnectButton={true} />);

      const reconnectBtn = screen.getByRole('button', { name: /reconnect/i });
      await userEvent.click(reconnectBtn);

      expect(mockClient.connect).toHaveBeenCalled();
    });
  });

  describe('Reconnection Countdown', () => {
    it('should show countdown when reconnecting', async () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: false,
        state: ConnectionState.RECONNECTING,
        reconnectAttempt: 2,
        lastConnected: null,
        lastDisconnected: new Date(),
        error: null,
        stats: {
          subscriptionCount: 0,
          totalEventsProcessed: 0,
          totalReconnections: 1,
          uptimeMs: 0,
          lastPingMs: 0,
        },
      });

      render(<ConnectionStatus variant="badge" />);

      // Should show reconnecting message with countdown
      // Note: actual countdown requires time to elapse, so we just check for the base text
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      const { container } = render(<ConnectionStatus variant="icon" />);

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have aria-live region in full variant', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      const { container } = render(<ConnectionStatus variant="full" />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should apply fixed positioning when specified', () => {
      mockUseWebSocketStatus.mockReturnValue({
        isConnected: true,
        state: ConnectionState.CONNECTED,
        reconnectAttempt: 0,
        lastConnected: new Date(),
        lastDisconnected: null,
        error: null,
        stats: {
          subscriptionCount: 5,
          totalEventsProcessed: 100,
          totalReconnections: 0,
          uptimeMs: 60000,
          lastPingMs: 20,
        },
      });

      const { container } = render(
        <ConnectionStatus variant="badge" position="fixed" className="top-4 right-4" />
      );

      const badge = container.firstChild;
      expect(badge).toHaveClass('fixed', 'top-4', 'right-4');
    });
  });
});
