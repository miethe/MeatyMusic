import { createApiClient } from '../client/base-client';

/**
 * Ensures that response interceptors receive a Response object with bound methods.
 * This prevents "Illegal invocation" errors when calling native methods like json().
 */
describe('Response interceptor proxy', () => {
  it('preserves Response method binding', async () => {
    const client = createApiClient({ baseUrl: 'http://localhost', enableRetry: false });

    const originalResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const originalJson = originalResponse.json.bind(originalResponse);
    (originalResponse as any).json = function (...args: any[]) {
      if (this !== originalResponse) {
        throw new TypeError('Illegal invocation');
      }
      return originalJson(...args);
    };

    global.fetch = jest.fn().mockResolvedValue(originalResponse as any);

    const result = await client.get('/test');
    expect(result).toEqual({ ok: true });
  });
});
