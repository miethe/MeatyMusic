/**
 * WebSocket Mocking Utilities for E2E Tests
 *
 * Provides utilities for mocking WebSocket connections in Playwright tests.
 * Phase 5, Task 5.1
 */

import { Page } from '@playwright/test';
import type { WorkflowEvent } from '../fixtures/workflow-events';

/**
 * Mock WebSocket connection with custom event stream
 *
 * This function injects a WebSocket mock into the page that intercepts
 * WebSocket connections and sends predefined events.
 */
export async function mockWebSocket(
  page: Page,
  events: WorkflowEvent[],
  options: {
    /** Delay between events in milliseconds */
    eventDelay?: number;
    /** Simulate connection delay */
    connectionDelay?: number;
    /** Simulate connection failures */
    shouldFail?: boolean;
  } = {}
) {
  const { eventDelay = 100, connectionDelay = 100, shouldFail = false } = options;

  // Inject WebSocket mock into the page
  await page.addInitScript(
    ({ events, eventDelay, connectionDelay, shouldFail }) => {
      const OriginalWebSocket = window.WebSocket;
      let mockSocket: any = null;

      // Override WebSocket constructor
      (window as any).WebSocket = class MockWebSocket {
        url: string;
        readyState: number = 0; // CONNECTING
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          this.url = url;
          mockSocket = this;

          // Simulate connection
          setTimeout(() => {
            if (shouldFail) {
              this.readyState = 3; // CLOSED
              if (this.onerror) {
                this.onerror(new Event('error'));
              }
              if (this.onclose) {
                this.onclose(new CloseEvent('close', { code: 1006, reason: 'Connection failed' }));
              }
            } else {
              this.readyState = 1; // OPEN
              if (this.onopen) {
                this.onopen(new Event('open'));
              }

              // Start sending events
              this.sendEvents();
            }
          }, connectionDelay);
        }

        async sendEvents() {
          for (const event of events) {
            await new Promise((resolve) => setTimeout(resolve, eventDelay));

            if (this.readyState === 1 && this.onmessage) {
              const messageEvent = new MessageEvent('message', {
                data: JSON.stringify(event),
              });
              this.onmessage(messageEvent);
            }
          }
        }

        send(data: string) {
          // Mock send - no-op for now
          console.log('[Mock WebSocket] send:', data);
        }

        close(code?: number, reason?: string) {
          this.readyState = 3; // CLOSED
          if (this.onclose) {
            this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || 'Normal closure' }));
          }
        }

        // Static constants
        static readonly CONNECTING = 0;
        static readonly OPEN = 1;
        static readonly CLOSING = 2;
        static readonly CLOSED = 3;
      };

      // Expose mock socket for testing
      (window as any).__mockWebSocket = mockSocket;
    },
    { events, eventDelay, connectionDelay, shouldFail }
  );
}

/**
 * Send additional events to an existing mock WebSocket
 */
export async function sendMockEvent(page: Page, event: WorkflowEvent) {
  await page.evaluate((event) => {
    const mockSocket = (window as any).__mockWebSocket;
    if (mockSocket && mockSocket.readyState === 1 && mockSocket.onmessage) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(event),
      });
      mockSocket.onmessage(messageEvent);
    }
  }, event);
}

/**
 * Simulate WebSocket connection drop
 */
export async function dropWebSocketConnection(page: Page) {
  await page.evaluate(() => {
    const mockSocket = (window as any).__mockWebSocket;
    if (mockSocket) {
      mockSocket.readyState = 3; // CLOSED
      if (mockSocket.onclose) {
        mockSocket.onclose(new CloseEvent('close', { code: 1006, reason: 'Connection dropped' }));
      }
    }
  });
}

/**
 * Simulate WebSocket connection restore
 */
export async function restoreWebSocketConnection(page: Page, events: WorkflowEvent[] = []) {
  await page.evaluate((events) => {
    const mockSocket = (window as any).__mockWebSocket;
    if (mockSocket) {
      mockSocket.readyState = 1; // OPEN
      if (mockSocket.onopen) {
        mockSocket.onopen(new Event('open'));
      }

      // Send queued events
      if (events.length > 0 && mockSocket.onmessage) {
        for (const event of events) {
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify(event),
          });
          mockSocket.onmessage(messageEvent);
        }
      }
    }
  }, events);
}

/**
 * Get mock WebSocket state for debugging
 */
export async function getWebSocketState(page: Page) {
  return await page.evaluate(() => {
    const mockSocket = (window as any).__mockWebSocket;
    if (mockSocket) {
      return {
        readyState: mockSocket.readyState,
        url: mockSocket.url,
      };
    }
    return null;
  });
}
