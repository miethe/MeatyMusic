/**
 * @fileoverview Tests for base API client
 */

import { ApiClient, createApiClient } from '../client/base-client';
import { ApiError, TimeoutError, NetworkError } from '../types/errors';
import { mockFetchResponse, mockFetchError, mockTimeoutError, mockErrorResponses } from '../__mocks__/responses';

describe('ApiClient', () => {
  let client: ApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    client = createApiClient({
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      enableRetry: false // Disable retry for simpler testing
    });
  });

  describe('constructor and factory', () => {
    it('should create client with default config', () => {
      const defaultClient = createApiClient();
      expect(defaultClient).toBeInstanceOf(ApiClient);
    });

    it('should create client with custom config', () => {
      const customClient = createApiClient({
        baseUrl: 'https://custom.api.com',
        timeout: 10000,
        enableRetry: false
      });
      expect(customClient).toBeInstanceOf(ApiClient);
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockImplementation(() => mockFetchResponse(mockData));

      const result = await client.get('/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should include query parameters', async () => {
      const mockData = { results: [] };
      mockFetch.mockImplementation(() => mockFetchResponse(mockData));

      await client.get('/search', {
        query: { q: 'test', limit: 10, active: true }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/search?q=test&limit=10&active=true',
        expect.any(Object)
      );
    });

    it('should include custom headers', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockImplementation(() => mockFetchResponse(mockData));

      await client.get('/test', {
        headers: { 'Custom-Header': 'value' }
      });

      const [, fetchOptions] = mockFetch.mock.calls[0];
      expect(fetchOptions?.headers).toEqual(
        expect.objectContaining({
          'Custom-Header': 'value'
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with JSON body', async () => {
      const requestData = { name: 'Test Item' };
      const responseData = { id: 1, ...requestData };
      mockFetch.mockImplementation(() => mockFetchResponse(responseData));

      const result = await client.post('/items', requestData);

      expect(result).toEqual(responseData);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.test.com/items');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify(requestData));
    });

    it('should handle string body', async () => {
      const stringData = 'raw text data';
      const responseData = { success: true };
      mockFetch.mockImplementation(() => mockFetchResponse(responseData));

      await client.post('/text', stringData);

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.body).toBe(stringData);
    });
  });

  describe('File uploads', () => {
    it('should handle file upload with FormData', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const responseData = { uploaded: true };
      mockFetch.mockImplementation(() => mockFetchResponse(responseData));

      const result = await client.upload('/upload', [mockFile], {
        description: 'Test upload'
      });

      expect(result).toEqual(responseData);
      const [, options] = mockFetch.mock.calls[0];
      expect(options?.body).toBeInstanceOf(FormData);
      // Content-Type should not be set for FormData (browser sets it)
      expect(options?.headers).not.toHaveProperty('Content-Type');
    });
  });

  describe('Error handling', () => {
    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockImplementation(() =>
        mockFetchResponse(mockErrorResponses.unauthorized, 401)
      );

      await expect(client.get('/protected')).rejects.toThrow(ApiError);

      try {
        await client.get('/protected');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).correlationId).toBeTruthy();
      }
    });

    it('should handle 404 Not Found', async () => {
      mockFetch.mockImplementation(() =>
        mockFetchResponse(mockErrorResponses.notFound, 404)
      );

      await expect(client.get('/missing')).rejects.toThrow(ApiError);

      try {
        await client.get('/missing');
      } catch (error) {
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should handle validation errors', async () => {
      mockFetch.mockImplementation(() =>
        mockFetchResponse(mockErrorResponses.validation, 400)
      );

      await expect(client.post('/items', {})).rejects.toThrow(ApiError);

      try {
        await client.post('/items', {});
      } catch (error) {
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).details).toEqual(mockErrorResponses.validation.error.details);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockImplementation(() => mockFetchError('Failed to fetch'));

      await expect(client.get('/test')).rejects.toThrow(ApiError);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => mockTimeoutError());

      await expect(client.get('/slow')).rejects.toThrow(ApiError);
    });
  });

  describe('Request interceptors', () => {
    it('should add correlation ID to requests', async () => {
      const mockData = { success: true };
      mockFetch.mockImplementation(() => mockFetchResponse(mockData));

      await client.get('/test');

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.headers).toEqual(
        expect.objectContaining({
          'X-Request-ID': expect.stringMatching(/^req_[a-f0-9]{16}$/),
          'X-Correlation-ID': expect.stringMatching(/^req_[a-f0-9]{16}$/)
        })
      );
    });

    it('should use custom correlation ID when provided', async () => {
      const mockData = { success: true };
      const customCorrelationId = 'custom-correlation-123';
      mockFetch.mockImplementation(() => mockFetchResponse(mockData));

      await client.get('/test', {
        correlationId: customCorrelationId
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.headers).toEqual(
        expect.objectContaining({
          'X-Request-ID': customCorrelationId,
          'X-Correlation-ID': customCorrelationId
        })
      );
    });
  });

  describe('Response handling', () => {
    it('should handle 204 No Content', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          headers: new Map(),
          json: async () => { throw new Error('No content'); },
          text: async () => ''
        } as Response)
      );

      const result = await client.delete('/item/1');
      expect(result).toBeUndefined();
    });

    it('should handle non-JSON responses', async () => {
      const textContent = 'Plain text response';
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'text/plain']]),
          json: async () => { throw new Error('Not JSON'); },
          text: async () => textContent
        } as Response)
      );

      const result = await client.get('/text');
      expect(result).toBe(textContent);
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockFetch.mockImplementation(() => mockFetchResponse({ success: true }));
    });

    it('should support PUT requests', async () => {
      const data = { name: 'Updated' };
      await client.put('/items/1', data);

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.method).toBe('PUT');
      expect(options?.body).toBe(JSON.stringify(data));
    });

    it('should support PATCH requests', async () => {
      const data = { name: 'Patched' };
      await client.patch('/items/1', data);

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.method).toBe('PATCH');
      expect(options?.body).toBe(JSON.stringify(data));
    });

    it('should support DELETE requests', async () => {
      await client.delete('/items/1');

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.method).toBe('DELETE');
      expect(options?.body).toBeUndefined();
    });
  });

  describe('AbortController integration', () => {
    it('should support request cancellation', async () => {
      const controller = new AbortController();
      mockFetch.mockImplementation(() => mockFetchResponse({ data: 'test' }));

      await client.get('/test', { signal: controller.signal });

      // Signal should be passed to fetch
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(Object)
        })
      );
    });
  });
});
