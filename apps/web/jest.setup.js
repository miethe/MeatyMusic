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
