// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock WebSocket for tests
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  send() {}
  close() {}
};

// Mock process.env for client-side tests
process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/events';

// jsdom does not implement ResizeObserver, but several Radix UI primitives (e.g. Tooltip, via
// @radix-ui/react-use-size) call it during layout effects. Without this, any test that mounts
// such a component throws "ReferenceError: ResizeObserver is not defined".
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement crypto.randomUUID — polyfill it so code that generates unique IDs
// (e.g. uiStore's addToast) works in tests without requiring a full Web Crypto API.
if (!global.crypto || !global.crypto.randomUUID) {
  let _counter = 0;
  Object.defineProperty(global, 'crypto', {
    value: {
      ...(global.crypto || {}),
      randomUUID: () => {
        const n = (_counter++).toString(16).padStart(12, '0');
        return `00000000-0000-4000-8000-${n}`;
      },
      getRandomValues(buf) {
        for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
        return buf;
      },
    },
    configurable: true,
    writable: true,
  });
}
