/**
 * @fileoverview Test setup and configuration
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch globally
global.fetch = jest.fn();

// Mock Response constructor
global.Response = jest.fn().mockImplementation((body?: any, init?: ResponseInit) => ({
  ok: init?.status ? init.status >= 200 && init.status < 300 : true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: {
    get: jest.fn((key: string) => init?.headers?.[key as keyof typeof init.headers] || null),
    ...init?.headers
  },
  json: jest.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
  text: jest.fn().mockResolvedValue(body || ''),
  url: 'http://localhost/test',
  type: 'basic'
})) as any;

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: { aborted: false, addEventListener: jest.fn(), removeEventListener: jest.fn() },
  abort: jest.fn()
})) as any;

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    origin: 'http://localhost',
    hostname: 'localhost'
  },
  writable: true
});

// Console setup for cleaner test output
beforeEach(() => {
  jest.clearAllMocks();
  // Silence console.log/warn/error in tests unless needed
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Add a dummy test to avoid "no tests" error
describe('Test setup', () => {
  it('should set up test environment correctly', () => {
    expect(global.fetch).toBeDefined();
    expect(global.AbortController).toBeDefined();
    expect(window.location).toBeDefined();
  });
});
