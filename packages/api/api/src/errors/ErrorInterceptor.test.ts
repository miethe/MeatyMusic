import { createApiErrorFromResponse } from './ErrorInterceptor';

describe('createApiErrorFromResponse', () => {
  it('stringifies object error messages', () => {
    const errorResponse = {
      message: { foo: 'bar', baz: 42 },
      status: 400,
      code: 'TEST_CODE',
      details: { detail: 'info' },
      traceId: 'trace-123'
    };
    const error = createApiErrorFromResponse(errorResponse);
    expect(error.message).toBe(JSON.stringify(errorResponse.message));
    expect(error.status).toBe(400);
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'info' });
    expect(error.correlationId || error.traceId).toBe('trace-123');
  });

  it('uses string error messages as-is', () => {
    const errorResponse = {
      message: 'Simple error',
      status: 404,
      code: 'NOT_FOUND',
      details: null,
      traceId: 'trace-456'
    };
    const error = createApiErrorFromResponse(errorResponse);
    expect(error.message).toBe('Simple error');
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toBeNull();
    expect(error.correlationId || error.traceId).toBe('trace-456');
  });
});
