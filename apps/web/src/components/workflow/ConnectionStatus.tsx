/**
 * ConnectionStatus Component
 * Visual WebSocket connection state indicator
 *
 * Features:
 * - Badge showing connection state (connected/connecting/disconnected/reconnecting/failed)
 * - Animated dot for active states (pulse animation)
 * - Reconnection countdown (e.g., "Reconnecting in 3s...")
 * - Error message display (tooltip)
 * - Click to force reconnect (manual retry)
 * - Color-coded states
 * - Accessible (ARIA labels, keyboard navigation)
 *
 * Phase 3, Task 3.3
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge, Button, Tooltip, TooltipProvider } from '@meatymusic/ui';
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';
import { ConnectionState, getWebSocketClient } from '@/lib/websocket';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export interface ConnectionStatusProps {
  /** Display variant */
  variant?: 'badge' | 'full' | 'icon';
  /** Show detailed stats */
  showDetails?: boolean;
  /** Show manual reconnect button */
  showReconnectButton?: boolean;
  /** Positioning */
  position?: 'fixed' | 'relative';
  /** Additional class name */
  className?: string;
}

/**
 * ConnectionStatus Component
 *
 * Displays the current WebSocket connection state with visual feedback.
 *
 * @example
 * ```tsx
 * // Simple badge in header
 * <ConnectionStatus variant="badge" position="relative" />
 *
 * // Full details with reconnect button
 * <ConnectionStatus
 *   variant="full"
 *   showDetails={true}
 *   showReconnectButton={true}
 * />
 *
 * // Icon only for compact display
 * <ConnectionStatus variant="icon" position="fixed" className="top-4 right-4" />
 * ```
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  variant = 'badge',
  showDetails = false,
  showReconnectButton = false,
  position = 'relative',
  className,
}) => {
  const status = useWebSocketStatus();
  const [reconnectCountdown, setReconnectCountdown] = React.useState<number>(0);
  const client = getWebSocketClient();

  /**
   * Calculate reconnection countdown
   * Uses exponential backoff from client config
   */
  React.useEffect(() => {
    if (status.state === ConnectionState.RECONNECTING && status.reconnectAttempt > 0) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
      const baseDelay = 1000;
      const maxDelay = 16000;
      const delay = Math.min(baseDelay * Math.pow(2, status.reconnectAttempt - 1), maxDelay);
      const countdownSeconds = Math.ceil(delay / 1000);

      setReconnectCountdown(countdownSeconds);

      const interval = setInterval(() => {
        setReconnectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    setReconnectCountdown(0);
    return undefined;
  }, [status.state, status.reconnectAttempt]);

  /**
   * Handle manual reconnect
   */
  const handleReconnect = React.useCallback(() => {
    client.connect().catch((err) => {
      console.error('Manual reconnection failed:', err);
    });
  }, [client]);

  /**
   * Get state display config
   */
  const getStateConfig = React.useCallback((): {
    label: string;
    icon: typeof Wifi;
    color: string;
    bgColor: string;
    borderColor: string;
    pulse: boolean;
    spin?: boolean;
    showError: boolean;
  } => {
    switch (status.state) {
      case ConnectionState.CONNECTED:
        return {
          label: 'Connected',
          icon: Wifi,
          color: 'text-status-complete',
          bgColor: 'bg-status-complete/20',
          borderColor: 'border-status-complete/30',
          pulse: true,
          showError: false,
        };
      case ConnectionState.CONNECTING:
        return {
          label: 'Connecting...',
          icon: RefreshCw,
          color: 'text-status-running',
          bgColor: 'bg-status-running/20',
          borderColor: 'border-status-running/30',
          pulse: false,
          spin: true,
          showError: false,
        };
      case ConnectionState.RECONNECTING:
        return {
          label: reconnectCountdown > 0 ? `Reconnecting in ${reconnectCountdown}s...` : 'Reconnecting...',
          icon: RefreshCw,
          color: 'text-status-running',
          bgColor: 'bg-status-running/20',
          borderColor: 'border-status-running/30',
          pulse: false,
          spin: true,
          showError: true,
        };
      case ConnectionState.DISCONNECTED:
        return {
          label: 'Disconnected',
          icon: WifiOff,
          color: 'text-status-failed',
          bgColor: 'bg-status-failed/20',
          borderColor: 'border-status-failed/30',
          pulse: false,
          showError: true,
        };
      case ConnectionState.FAILED:
        return {
          label: 'Connection Failed',
          icon: AlertCircle,
          color: 'text-status-failed',
          bgColor: 'bg-status-failed/20',
          borderColor: 'border-status-failed/30',
          pulse: false,
          showError: true,
        };
      default:
        return {
          label: 'Unknown',
          icon: WifiOff,
          color: 'text-text-tertiary',
          bgColor: 'bg-background-tertiary',
          borderColor: 'border-border/30',
          pulse: false,
          showError: false,
        };
    }
  }, [status.state, reconnectCountdown]);

  const config = getStateConfig();
  const Icon = config.icon;

  /**
   * Icon-only variant
   */
  if (variant === 'icon') {
    const content = (
      <button
        type="button"
        onClick={showReconnectButton ? handleReconnect : undefined}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          config.bgColor,
          config.color,
          showReconnectButton && 'hover:scale-110 cursor-pointer',
          !showReconnectButton && 'cursor-default',
          position === 'fixed' && 'fixed z-50',
          className
        )}
        aria-label={`Connection status: ${config.label}`}
        aria-live="polite"
        disabled={!showReconnectButton}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            config.pulse && 'animate-pulse',
            config.spin && 'animate-spin'
          )}
        />
      </button>
    );

    if (config.showError && status.error) {
      return (
        <TooltipProvider>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold text-sm mb-1">{config.label}</p>
                <p className="text-xs text-text-secondary">{status.error.message}</p>
              </div>
            }
          >
            {content}
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  /**
   * Badge variant
   */
  if (variant === 'badge') {
    const content = (
      <Badge
        className={cn(
          'font-medium',
          config.bgColor,
          config.color,
          config.borderColor,
          position === 'fixed' && 'fixed z-50',
          className
        )}
      >
        <Icon
          className={cn(
            'mr-1 h-3 w-3',
            config.pulse && 'animate-pulse',
            config.spin && 'animate-spin'
          )}
        />
        {config.label}
      </Badge>
    );

    if (config.showError && status.error) {
      return (
        <TooltipProvider>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p className="font-semibold text-sm mb-1">Connection Error</p>
                <p className="text-xs text-text-secondary">{status.error.message}</p>
              </div>
            }
          >
            {content}
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  /**
   * Full variant with details
   */
  return (
    <div
      className={cn(
        'p-4 bg-background-secondary rounded-lg border border-border/10',
        position === 'fixed' && 'fixed z-50',
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'h-5 w-5',
              config.color,
              config.pulse && 'animate-pulse',
              config.spin && 'animate-spin'
            )}
          />
          <span className="text-sm font-semibold text-text-primary">{config.label}</span>
        </div>

        {showReconnectButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconnect}
            disabled={status.state === ConnectionState.CONNECTED || status.state === ConnectionState.CONNECTING}
            aria-label="Reconnect to server"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        )}
      </div>

      {/* Error message */}
      {config.showError && status.error && (
        <div className="mb-3 p-2 bg-status-failed/10 border border-status-failed/20 rounded text-xs text-status-failed">
          {status.error.message}
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-text-tertiary">State</div>
            <div className="text-text-primary font-medium capitalize">{status.state}</div>
          </div>
          <div>
            <div className="text-text-tertiary">Subscriptions</div>
            <div className="text-text-primary font-medium">{status.stats.subscriptionCount}</div>
          </div>
          <div>
            <div className="text-text-tertiary">Events Processed</div>
            <div className="text-text-primary font-medium">{status.stats.totalEventsProcessed}</div>
          </div>
          <div>
            <div className="text-text-tertiary">Reconnections</div>
            <div className="text-text-primary font-medium">{status.stats.totalReconnections}</div>
          </div>
        </div>
      )}

      {/* Last connected/disconnected */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border/10 text-xs text-text-tertiary">
          {status.lastConnected && (
            <div>Last connected: {status.lastConnected.toLocaleTimeString()}</div>
          )}
          {status.lastDisconnected && (
            <div>Last disconnected: {status.lastDisconnected.toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </div>
  );
};

ConnectionStatus.displayName = 'ConnectionStatus';
